const axios = require('axios');

const ttdownload = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a TikTok video URL\n\nExample: ${context.prefix}ttdownload https://vt.tiktok.com/xxxxx` 
        }, { quoted: msg });
    }

    const API_KEY = process.env.RAPIDAPI_KEY || '21713c9b31msh4812fb7a7b6ea42p17ebfajsn789ce0fb9cef';
    const API_HOST = 'tiktok-video-downloader-api.p.rapidapi.com';

    try {
        await sock.sendMessage(context.from, { 
            text: '⏳ Processing TikTok video...' 
        }, { quoted: msg });

        const options = {
            method: 'GET',
            url: `https://${API_HOST}/download`,
            params: { url: args[0] },
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': API_HOST
            },
            timeout: 30000
        };

        const response = await axios.request(options);

        if (!response.data || !response.data.video_url) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Could not retrieve video URL. The link may be invalid or private.' 
            }, { quoted: msg });
        }

        const videoUrl = response.data.video_url;

        await sock.sendMessage(context.from, {
            video: { url: videoUrl },
            caption: '✅ Downloaded from TikTok',
            mimetype: 'video/mp4'
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in ttdownload command:', error.message);

        let errorMessage = '❌ Failed to download TikTok video';

        if (error.response) {
            if (error.response.status === 429) {
                errorMessage = '❌ API rate limit reached. Please try again later.';
            } else if (error.response.status === 403) {
                errorMessage = '❌ API access denied. Invalid API key.';
            } else if (error.response.status === 404) {
                errorMessage = '❌ Video not found. The link may be invalid or private.';
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
