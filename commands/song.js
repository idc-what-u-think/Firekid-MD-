const play = require('play-dl');

const song = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a song name\n\nExample:\n${context.prefix}song Shape of You` 
        }, { quoted: msg });
    }
    
    try {
        const songInput = args.join(' ');
        
        await sock.sendMessage(context.from, { 
            text: '🔍 Searching for song...' 
        }, { quoted: msg });

        const searchResults = await play.search(songInput, { limit: 1, type: 'video' });

        if (!searchResults || searchResults.length === 0) {
            return await sock.sendMessage(context.from, { 
                text: `❌ No songs found for "${songInput}"` 
            }, { quoted: msg });
        }

        const video = searchResults[0];
        const videoId = video.id;
        const title = video.title || 'Unknown';
        const channel = video.channel?.name || 'Unknown Artist';
        const duration = video.durationInSec || 0;
        const thumbnail = video.thumbnail?.url || '';

        await sock.sendMessage(context.from, { 
            text: `⏳ Downloading: ${title}\n👤 By: ${channel}\n⏱️ Duration: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` 
        }, { quoted: msg });

        const stream = await play.stream(videoId);

        if (!stream) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Could not stream: ${title}` 
            }, { quoted: msg });
        }

        const chunks = [];
        
        for await (const chunk of stream.stream) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        if (buffer.length === 0) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Downloaded file is empty` 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            contextInfo: thumbnail ? {
                externalAdReply: {
                    title: title,
                    body: channel,
                    thumbnailUrl: thumbnail,
                    mediaType: 2,
                    mediaUrl: `https://www.youtube.com/watch?v=${videoId}`
                }
            } : undefined
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in song command:', error.message);
        
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to download song: ${error.message}` 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'song',
    handler: song
};
