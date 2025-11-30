const axios = require('axios');

const screenshot = async (sock, msg, args, context) => {
    try {
        if (args.length === 0) {
            return await sock.sendMessage(context.from, {
                text: `╭━━━『 *SCREENSHOT* 』━━━╮
│
│ ⚠️ *Usage:*
│ .screenshot [url]
│
│ 📝 *Example:*
│ .screenshot https://yellow.com
│
╰━━━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: msg });
        }

        let url = args[0];
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const genMsg = await sock.sendMessage(context.from, {
            text: `📸 *Taking screenshot...*\n⏳ ${url}`
        }, { quoted: msg });

        // Using thum.io free API (1000 screenshots/month free)
        const screenshotUrl = `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(url)}`;

        const response = await axios.get(screenshotUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        const imageBuffer = Buffer.from(response.data);

        await sock.sendMessage(context.from, {
            image: imageBuffer,
            caption: `╭━━━『 *SCREENSHOT* 』━━━╮
│
│ 🌐 *URL:* ${url}
│ 📸 *Full Page Screenshot*
│
╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: msg });

        await sock.sendMessage(context.from, {
            delete: genMsg.key
        });

    } catch (error) {
        console.error('Error in screenshot command:', error);
        await sock.sendMessage(context.from, {
            text: `❌ *Failed to take screenshot*\n\n${error.message}`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'screenshot',
    handler: screenshot
};
