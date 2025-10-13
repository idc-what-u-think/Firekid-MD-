const axios = require('axios');

const RAPIDAPI_KEYS = [
    '926738c8e1mshefb92a5bc1fe6a0p1a55a3jsn1830795de8b5',
    'cc55783228msh1f7f79520170cecp1273ecjsn871a52b845c7',
    '3a4532559dmsh2d32efab5354e28p16c43djsn2d47c231e588'
];

let currentKeyIndex = 0;

const getNextKey = () => {
    const key = RAPIDAPI_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % RAPIDAPI_KEYS.length;
    return key;
};

const song = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a song name or Spotify URL\n\nExamples:\n${context.prefix}song Shape of You\n${context.prefix}song https://open.spotify.com/track/...` 
        }, { quoted: msg });
    }
    
    try {
        const songInput = args.join(' ');
        
        await sock.sendMessage(context.from, { 
            text: '⏳ Searching for song...' 
        }, { quoted: msg });

        const apiKey = getNextKey();
        
        const searchResponse = await axios.get('https://yt-api.com/en/api/search/music', {
            params: {
                query: songInput
            },
            timeout: 15000
        });
        
        if (!searchResponse.data || !searchResponse.data.result || searchResponse.data.result.length === 0) {
            return await sock.sendMessage(context.from, { 
                text: `❌ No songs found for "${songInput}"` 
            }, { quoted: msg });
        }

        const track = searchResponse.data.result[0];
        const videoId = track.id;
        const songTitle = track.title || 'Unknown Song';
        const artist = track.artist || 'Unknown Artist';
        const thumbnail = track.image || '';

        await sock.sendMessage(context.from, { 
            text: `⏳ Downloading: ${songTitle}\n👤 By: ${artist}` 
        }, { quoted: msg });

        let downloadUrl = null;

        try {
            const downloadResponse = await axios.get('https://yt-api.com/en/api/getmusic', {
                params: {
                    videoId: videoId
                },
                timeout: 30000
            });

            if (downloadResponse.data && downloadResponse.data.link) {
                downloadUrl = downloadResponse.data.link;
            }
        } catch (downloadError) {
            console.log('Primary download API failed, trying alternative...');
        }

        if (!downloadUrl) {
            try {
                const altResponse = await axios.get('https://yt-search-and-download-mp3.p.rapidapi.com/mp3', {
                    params: { id: videoId },
                    headers: {
                        'x-rapidapi-key': apiKey,
                        'x-rapidapi-host': 'yt-search-and-download-mp3.p.rapidapi.com'
                    },
                    timeout: 30000
                });

                if (altResponse.data && altResponse.data.downloadUrl) {
                    downloadUrl = altResponse.data.downloadUrl;
                } else if (altResponse.data && altResponse.data.link) {
                    downloadUrl = altResponse.data.link;
                }
            } catch (altError) {
                console.log('Alternative download API also failed');
            }
        }

        if (!downloadUrl) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Failed to get download link for: ${songTitle}\n\nTry searching on YouTube directly` 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.mp3`,
            contextInfo: thumbnail ? {
                externalAdReply: {
                    title: songTitle,
                    body: artist,
                    thumbnailUrl: thumbnail,
                    mediaType: 2,
                    mediaUrl: `https://www.youtube.com/watch?v=${videoId}`
                }
            } : undefined
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in song command:', error.message);
        
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to download song. Please try again later.' 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'song',
    handler: song
};
