const axios = require('axios');

const song = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a song name\n\nExample:\n${context.prefix}song Shape of You Ed Sheeran` 
        }, { quoted: msg });
    }
    
    try {
        const songInput = args.join(' ');
        
        await sock.sendMessage(context.from, { 
            text: '⏳ Searching for song...' 
        }, { quoted: msg });

        let searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songInput + ' audio')}`;
        
        const response = await axios.get('https://youtube-api.verlysen.workers.dev/search', {
            params: {
                query: songInput + ' audio'
            },
            timeout: 15000
        });

        if (!response.data || response.data.length === 0) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Song not found. Try searching:\n\n🔗 ${searchUrl}` 
            }, { quoted: msg });
        }

        const video = response.data[0];
        const videoId = video.id;
        const title = video.title || 'Unknown';
        const channel = video.channel?.name || 'Unknown Artist';

        await sock.sendMessage(context.from, { 
            text: `⏳ Downloading: ${title}\n👤 By: ${channel}` 
        }, { quoted: msg });

        let downloadUrl = null;

        try {
            const downloadResponse = await axios.get(`https://youtube-api.verlysen.workers.dev/download`, {
                params: {
                    id: videoId,
                    type: 'audio'
                },
                timeout: 30000
            });

            if (downloadResponse.data && downloadResponse.data.url) {
                downloadUrl = downloadResponse.data.url;
            }
        } catch (error) {
            console.log('Primary API failed, trying alternative...');
        }

        if (!downloadUrl) {
            try {
                const altResponse = await axios.get(`https://nightly.taichikato.workers.dev/api/download`, {
                    params: {
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        type: 'audio'
                    },
                    timeout: 30000
                });

                if (altResponse.data && altResponse.data.url) {
                    downloadUrl = altResponse.data.url;
                }
            } catch (altError) {
                console.log('Alternative API also failed');
            }
        }

        if (!downloadUrl) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Could not download: ${title}\n\nYou can try downloading manually from:\nhttps://www.youtube.com/watch?v=${videoId}` 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in song command:', error.message);
        
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to download song. Try again later.' 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'song',
    handler: song
};
