const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const toimg = async (sock, msg, args, context) => {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMsg) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Reply to a sticker to convert it' 
        }, { quoted: msg });
    }

    const stickerMessage = quotedMsg.stickerMessage;
    
    if (!stickerMessage) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Reply to a sticker to convert it to image/video' 
        }, { quoted: msg });
    }

    try {
        await sock.sendMessage(context.from, { 
            text: '⏳ Converting sticker...' 
        }, { quoted: msg });

        const isAnimated = stickerMessage.isAnimated || stickerMessage.seconds > 0;

        const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (!buffer || buffer.length === 0) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Failed to download sticker' 
            }, { quoted: msg });
        }

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        if (isAnimated) {
            const tempInput = path.join(tmpDir, `sticker_${Date.now()}.webp`);
            const tempOutput = path.join(tmpDir, `video_${Date.now()}.mp4`);

            fs.writeFileSync(tempInput, buffer);

            const ffmpegCommand = `ffmpeg -i "${tempInput}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${tempOutput}"`;

            await new Promise((resolve, reject) => {
                exec(ffmpegCommand, (error) => {
                    if (error) {
                        console.error('FFmpeg error:', error);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });

            const videoBuffer = fs.readFileSync(tempOutput);

            await sock.sendMessage(context.from, { 
                video: videoBuffer,
                caption: '✅ Animated sticker converted to video',
                mimetype: 'video/mp4'
            }, { quoted: msg });

            try {
                fs.unlinkSync(tempInput);
                fs.unlinkSync(tempOutput);
            } catch (err) {
                console.error('Error cleaning up temp files:', err);
            }

        } else {
            const imageBuffer = await sharp(buffer)
                .toFormat('png')
                .toBuffer();

            await sock.sendMessage(context.from, { 
                image: imageBuffer,
                caption: '✅ Sticker converted to image'
            }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error in toimg command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to convert sticker. Make sure you replied to a valid sticker.'
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'toimg',
    handler: toimg
};
