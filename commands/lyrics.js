const axios = require('axios');

const lyrics = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a song name\n\nExample: ${context.prefix}lyrics Shape of You` 
        });
    }
    
    try {
        await sock.sendMessage(context.from, { 
            text: '⏳ Searching for lyrics...' 
        });
        
        const searchUrl = 'https://musicapi.x007.workers.dev/search';
        const searchResponse = await axios.get(searchUrl, {
            params: {
                q: args.join(' '),
                searchEngine: 'gaama'
            }
        });
        
        if (!searchResponse.data.response?.length) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Song not found. Please check the spelling and try again.' 
            });
        }
        
        const song = searchResponse.data.response[0];
        
        const lyricsUrl = 'https://musicapi.x007.workers.dev/lyrics';
        const lyricsResponse = await axios.get(lyricsUrl, {
            params: { id: song.id }
        });
        
        if (!lyricsResponse.data.response) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Lyrics not found for this song' 
            });
        }
        
        const cleanLyrics = lyricsResponse.data.response
            .replace(/<\/?p>/g, '')
            .replace(/<br\/?>/g, '\n');
        
        await sock.sendMessage(context.from, { 
            text: `📝 Lyrics for ${song.title}:\n\n${cleanLyrics}` 
        });
        
    } catch (error) {
        console.error('Error in lyrics command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to fetch lyrics. Please try again later.' 
        });
    }
};

module.exports = {
    command: 'lyrics',
    handler: lyrics
};
