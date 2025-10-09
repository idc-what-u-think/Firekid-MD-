const axios = require('axios');

const lyrics = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a song name\n\nExample: ${context.prefix}lyrics Shape of You` 
        }, { quoted: msg });
    }
    
    try {
        await sock.sendMessage(context.from, { 
            text: '⏳ Searching for lyrics...' 
        }, { quoted: msg });
        
        const songTitle = args.join(' ');
        const apiUrl = `https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(songTitle)}`;
        
        const response = await axios.get(apiUrl);
        
        if (!response.data || !response.data.result || !response.data.result.lyrics) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Sorry, I couldn't find any lyrics for "${songTitle}".` 
            }, { quoted: msg });
        }
        
        const lyricsText = response.data.result.lyrics;
        const maxChars = 4096;
        const output = lyricsText.length > maxChars ? lyricsText.slice(0, maxChars - 3) + '...' : lyricsText;
        
        const songInfo = response.data.result.title || songTitle;
        const artist = response.data.result.artist || 'Unknown Artist';
        
        await sock.sendMessage(context.from, { 
            text: `🎵 *${songInfo}*\n👤 *Artist:* ${artist}\n\n${output}` 
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in lyrics command:', error.message);
        
        if (error.response?.status === 404) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Sorry, I couldn't find any lyrics for "${args.join(' ')}".` 
            }, { quoted: msg });
        }
        
        return await sock.sendMessage(context.from, { 
            text: `❌ An error occurred while fetching the lyrics. Please try again later.` 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'lyrics',
    handler: lyrics
};
