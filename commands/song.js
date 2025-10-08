const axios = require('axios');

const song = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a song name\n\nExample: ${context.prefix}song Shape of You` 
        });
    }
    
    try {
        await sock.sendMessage(context.from, { 
            text: '⏳ Searching for song...' 
        });
        
        const searchUrl = 'https://musicapi.x007.workers.dev/search';
        const searchResponse = await axios.get(searchUrl, {
            params: {
                q: args.join(' '),
                searchEngine: 'gaama'
            },
            timeout: 15000
        });
        
        if (!searchResponse.data || !searchResponse.data.response || !Array.isArray(searchResponse.data.response) || searchResponse.data.response.length === 0) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Song not found. Please try a different search term.' 
            });
        }
        
        const songData = searchResponse.data.response[0];
        
        if (!songData.id) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Invalid song data received. Please try again.' 
            });
        }
        
        const fetchUrl = 'https://musicapi.x007.workers.dev/fetch';
        const fetchResponse = await axios.get(fetchUrl, {
            params: { id: songData.id },
            timeout: 15000
        });
        
        if (!fetchResponse.data || !fetchResponse.data.response) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Failed to get song download link. Please try again.' 
            });
        }
        
        const audioMessage = {
            audio: { url: fetchResponse.data.response },
            mimetype: 'audio/mpeg',
            fileName: `${songData.title || 'song'}.mp3`
        };
        
        if (songData.img) {
            try {
                const thumbnailBuffer = await axios.get(songData.img, { 
                    responseType: 'arraybuffer',
                    timeout: 10000
                });
                audioMessage.contextInfo = {
                    externalAdReply: {
                        title: songData.title || 'Unknown Title',
                        body: songData.artist || 'Unknown Artist',
                        thumbnailUrl: songData.img,
                        sourceUrl: fetchResponse.data.response,
                        mediaType: 1,
                        showAdAttribution: false
                    }
                };
            } catch (thumbError) {
                console.error('Thumbnail fetch error:', thumbError.message);
            }
        }
        
        await sock.sendMessage(context.from, audioMessage);
        
    } catch (error) {
        console.error('Error in song command:', error.message);
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Request timed out. Please try again.' 
            });
        }
        
        if (error.response) {
            return await sock.sendMessage(context.from, { 
                text: `❌ API error: ${error.response.status}. Please try again later.` 
            });
        }
        
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to download song. Please try again later.' 
        });
    }
};

module.exports = {
    command: 'song',
    handler: song
};
