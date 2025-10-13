const axios = require('axios');

const ttdownload = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a TikTok video URL\n\nExample: ${context.prefix}ttdownload https://vt.tiktok.com/xxxxx` 
        }, { quoted: msg });
    }

    try {
        await sock.sendMessage(context.from, { 
            text: '⏳ Processing TikTok video...' 
        }, { quoted: msg });

        const url = args[0];
        
        const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, {
            timeout: 30000
        });

        if (!response.data || !response.data.video || !response.data.video.noWatermark) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Could not retrieve video. The link may be invalid or private.' 
            }, { quoted: msg });
        }

        const videoUrl = response.data.video.noWatermark;
        const title = response.data.title || 'TikTok Video';
        const author = response.data.author?.nickname || 'Unknown';

        await sock.sendMessage(context.from, {
            video: { url: videoUrl },
            caption: `✅ *Downloaded from TikTok*\n\n📝 *Title:* ${title}\n👤 *Author:* @${author}`,
            mimetype: 'video/mp4'
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in ttdownload command:', error.message);
        
        let errorMessage = '❌ Failed to download TikTok video';
        
        if (error.response) {
            if (error.response.status === 404) {
                errorMessage = '❌ Video not found. The link may be invalid or private.';
            } else if (error.response.status === 500) {
                errorMessage = '❌ Server error. Please try again later.';
            }
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage = '❌ Request timed out. Please try again.';
        }
        
        return await sock.sendMessage(context.from, { 
            text: errorMessage 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'ttdownload',
    handler: ttdownload
};
