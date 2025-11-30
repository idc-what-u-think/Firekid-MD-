const gtts = require('gtts');
const fs = require('fs');
const path = require('path');

const tts = async (sock, msg, args, context) => {
    try {
        if (args.length === 0) {
            return await sock.sendMessage(context.from, {
                text: `╭━━━『 *TEXT TO SPEECH* 』━━━╮
│
│ ⚠️ *Usage:*
│ .tts [text]
│
│ 📝 *Example:*
│ .tts Yoo, how are you doing
│
╰━━━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: msg });
        }

        const text = args.join(' ');

        const genMsg = await sock.sendMessage(context.from, {
            text: '🎤 *Generating voice...*'
        }, { quoted: msg });

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const audioPath = path.join(tmpDir, `tts_${Date.now()}.mp3`);

        const speech = new gtts(text, 'en');
        
        speech.save(audioPath, async (err) => {
            if (err) {
                throw new Error(err.message);
            }

            await sock.sendMessage(context.from, {
                audio: { url: audioPath },
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: msg });

            fs.unlinkSync(audioPath);

            await sock.sendMessage(context.from, {
                delete: genMsg.key
            });
        });

    } catch (error) {
        console.error('Error in tts command:', error);
        await sock.sendMessage(context.from, {
            text: `❌ *Failed to generate voice*\n\n${error.message}`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'tts',
    handler: tts
};
