const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const screenshotPath = path.join(tmpDir, `screenshot_${Date.now()}.png`);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.screenshot({ path: screenshotPath, fullPage: true });
        await browser.close();

        await sock.sendMessage(context.from, {
            image: { url: screenshotPath },
            caption: `╭━━━『 *SCREENSHOT* 』━━━╮
│
│ 🌐 *URL:* ${url}
│ 📸 *Full Page Screenshot*
│
╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: msg });

        fs.unlinkSync(screenshotPath);

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
