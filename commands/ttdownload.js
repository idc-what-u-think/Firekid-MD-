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
        let videoUrl = null;
        let title = 'TikTok Video';
        let author = 'Unknown';

        try {
            const response = await axios.post('https://www.tikwm.com/api/', 
                `url=${encodeURIComponent(url)}&hd=1`,
                {
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Mozilla/5.0'
                    },
                    timeout: 30000
                }
            );

            if (response.data && response.data.code === 0 && response.data.data) {
                videoUrl = response.data.data.hdplay || response.data.data.play;
                title = response.data.data.title || title;
                author = response.data.data.author?.unique_id || response.data.data.author?.nickname || author;
            }
        } catch (error1) {
            console.log('TikWM API failed, trying alternative...');
            
            try {
                const response2 = await axios.get(`https://api.tiklydown.eu.org/api/download/v3?url=${encodeURIComponent(url)}`, {
                    timeout: 30000
                });

                if (response2.data && response2.data.result && response2.data.result.video) {
                    videoUrl = response2.data.result.video;
                    title = response2.data.result.desc || title;
                    author = response2.data.result.author?.nickname || author;
                }
            } catch (error2) {
                console.log('Tiklydown API failed, trying alternative...');
                
                try {
                    const response3 = await axios.get(`https://api.ssstik.io/api/tiktok?url=${encodeURIComponent(url)}`, {
                        timeout: 30000
                    });

                    if (response3.data && response3.data.video_url) {
                        videoUrl = response3.data.video_url;
                        title = response3.data.title || title;
                        author = response3.data.author || author;
                    }
                } catch (error3) {
                    throw new Error('All APIs failed');
                }
            }
        }

        if (!videoUrl) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Could not retrieve video. The link may be invalid or private.' 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, {
            video: { url: videoUrl },
            caption: `✅ *Downloaded from TikTok*\n\n📝 *Title:* ${title}\n👤 *Author:* @${author}`,
            mimetype: 'video/mp4'
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in ttdownload command:', error.message);
        
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to download TikTok video. Please try again later or check if the link is valid.' 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'ttdownload',
    handler: ttdownload
};
