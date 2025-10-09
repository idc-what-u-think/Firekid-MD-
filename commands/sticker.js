const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');

const makeSticker = async (sock, msg, args, context) => {
    let targetMessage = msg;
    const messageToQuote = msg;

    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedInfo = msg.message.extendedTextMessage.contextInfo;
        targetMessage = {
            key: {
                remoteJid: context.from,
                id: quotedInfo.stanzaId,
                participant: quotedInfo.participant
            },
            message: quotedInfo.quotedMessage
        };
    }

    const mediaMessage = targetMessage.message?.imageMessage || 
                        targetMessage.message?.videoMessage || 
                        targetMessage.message?.documentMessage;

    if (!mediaMessage) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Reply to an image/video with .sticker, or send an image/video with .sticker as caption'
        }, { quoted: msg });
    }

    try {
        await sock.sendMessage(context.from, { 
            text: '⏳ Creating sticker...'
        }, { quoted: msg });

        const mediaType = targetMessage.message.imageMessage ? 'image' : 'video';
        const stream = await downloadContentFromMessage(mediaMessage, mediaType);
        
        let mediaBuffer = Buffer.from([]);
        for await (const chunk of stream) {
            mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Failed to download media. Please try again.'
            }, { quoted: msg });
        }

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const tempInput = path.join(tmpDir, `temp_${Date.now()}`);
        const tempOutput = path.join(tmpDir, `sticker_${Date.now()}.webp`);

        fs.writeFileSync(tempInput, mediaBuffer);

        const isAnimated = mediaMessage.mimetype?.includes('gif') || 
                          mediaMessage.mimetype?.includes('video') || 
                          mediaMessage.seconds > 0;

        const ffmpegCommand = isAnimated
            ? `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`
            : `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => {
                if (error) {
                    console.error('FFmpeg error:', error);
                    reject(error);
                } else resolve();
            });
        });

        let webpBuffer = fs.readFileSync(tempOutput);

        if (isAnimated && webpBuffer.length > 1000 * 1024) {
            try {
                const tempOutput2 = path.join(tmpDir, `sticker_fallback_${Date.now()}.webp`);
                const fileSizeKB = mediaBuffer.length / 1024;
                const isLargeFile = fileSizeKB > 5000;
                
                const fallbackCmd = isLargeFile
                    ? `ffmpeg -y -i "${tempInput}" -t 2 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=8,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 100k -max_muxing_queue_size 1024 "${tempOutput2}"`
                    : `ffmpeg -y -i "${tempInput}" -t 3 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=12,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 45 -compression_level 6 -b:v 150k -max_muxing_queue_size 1024 "${tempOutput2}"`;
                
                await new Promise((resolve, reject) => {
                    exec(fallbackCmd, (error) => error ? reject(error) : resolve());
                });
                
                if (fs.existsSync(tempOutput2)) {
                    webpBuffer = fs.readFileSync(tempOutput2);
                    try { fs.unlinkSync(tempOutput2); } catch {}
                }
            } catch {}
        }

        const img = new webp.Image();
        await img.load(webpBuffer);

        const packName = process.env.STICKER_PACK_NAME || 'Bot Stickers';
        const authorName = process.env.STICKER_AUTHOR_NAME || 'WhatsApp Bot';

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': packName,
            'sticker-pack-publisher': authorName,
            'emojis': ['🤖']
        };

        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        img.exif = exif;

        let finalBuffer = await img.save(null);

        if (isAnimated && finalBuffer.length > 900 * 1024) {
            try {
                const tempOutput3 = path.join(tmpDir, `sticker_small_${Date.now()}.webp`);
                const smallCmd = `ffmpeg -y -i "${tempInput}" -t 2 -vf "scale=320:320:force_original_aspect_ratio=decrease,fps=8,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 80k -max_muxing_queue_size 1024 "${tempOutput3}"`;
                
                await new Promise((resolve, reject) => {
                    exec(smallCmd, (error) => error ? reject(error) : resolve());
                });
                
                if (fs.existsSync(tempOutput3)) {
                    const smallWebp = fs.readFileSync(tempOutput3);
                    const img2 = new webp.Image();
                    await img2.load(smallWebp);
                    
                    const json2 = {
                        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                        'sticker-pack-name': packName,
                        'sticker-pack-publisher': authorName,
                        'emojis': ['🤖']
                    };
                    
                    const exifAttr2 = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                    const jsonBuffer2 = Buffer.from(JSON.stringify(json2), 'utf8');
                    const exif2 = Buffer.concat([exifAttr2, jsonBuffer2]);
                    exif2.writeUIntLE(jsonBuffer2.length, 14, 4);
                    
                    img2.exif = exif2;
                    finalBuffer = await img2.save(null);
                    
                    try { fs.unlinkSync(tempOutput3); } catch {}
                }
            } catch {}
        }

        await sock.sendMessage(context.from, { 
            sticker: finalBuffer
        }, { quoted: messageToQuote });

        try {
            fs.unlinkSync(tempInput);
            fs.unlinkSync(tempOutput);
        } catch (err) {
            console.error('Error cleaning up temp files:', err);
        }

    } catch (error) {
        console.error('Error in sticker command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to create sticker! Try again later.'
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'sticker',
    handler: makeSticker
};
