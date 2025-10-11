const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const vv = async (sock, msg, args, context) => {
    try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMsg) {
            return await sock.sendMessage(context.from, {
                text: '❌ Reply to a view once message or status'
            }, { quoted: msg });
        }

        let viewOnceMsg = null;
        let mediaType = null;

        if (quotedMsg.viewOnceMessage) {
            viewOnceMsg = quotedMsg.viewOnceMessage.message;
            if (viewOnceMsg.imageMessage) {
                mediaType = 'image';
                viewOnceMsg = viewOnceMsg.imageMessage;
            } else if (viewOnceMsg.videoMessage) {
                mediaType = 'video';
                viewOnceMsg = viewOnceMsg.videoMessage;
            }
        } else if (quotedMsg.viewOnceMessageV2) {
            viewOnceMsg = quotedMsg.viewOnceMessageV2.message;
            if (viewOnceMsg.imageMessage) {
                mediaType = 'image';
                viewOnceMsg = viewOnceMsg.imageMessage;
            } else if (viewOnceMsg.videoMessage) {
                mediaType = 'video';
                viewOnceMsg = viewOnceMsg.videoMessage;
            }
        } else if (quotedMsg.viewOnceMessageV2Extension) {
            viewOnceMsg = quotedMsg.viewOnceMessageV2Extension.message;
            if (viewOnceMsg.imageMessage) {
                mediaType = 'image';
                viewOnceMsg = viewOnceMsg.imageMessage;
            } else if (viewOnceMsg.videoMessage) {
                mediaType = 'video';
                viewOnceMsg = viewOnceMsg.videoMessage;
            }
        } else if (quotedMsg.imageMessage?.viewOnce) {
            viewOnceMsg = quotedMsg.imageMessage;
            mediaType = 'image';
        } else if (quotedMsg.videoMessage?.viewOnce) {
            viewOnceMsg = quotedMsg.videoMessage;
            mediaType = 'video';
        } else if (quotedMsg.imageMessage) {
            viewOnceMsg = quotedMsg.imageMessage;
            mediaType = 'image';
        } else if (quotedMsg.videoMessage) {
            viewOnceMsg = quotedMsg.videoMessage;
            mediaType = 'video';
        } else {
            return await sock.sendMessage(context.from, {
                text: '❌ This is not a view once message or status\n\nSupported types:\n• View once photos\n• View once videos\n• Status photos\n• Status videos'
            }, { quoted: msg });
        }

        if (!viewOnceMsg || !mediaType) {
            return await sock.sendMessage(context.from, {
                text: '❌ Could not extract content'
            }, { quoted: msg });
        }

        let buffer;
        try {
            const stream = await downloadContentFromMessage(viewOnceMsg, mediaType);
            buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
        } catch (downloadError) {
            console.error('Download error:', downloadError);
            
            if (downloadError.message?.includes('Bad MAC') || downloadError.message?.includes('decrypt')) {
                return await sock.sendMessage(context.from, {
                    text: '❌ Cannot download this message\n\n*Possible reasons:*\n• Message already viewed\n• Message expired\n• Session encryption error\n\n💡 Ask sender to send it again'
                }, { quoted: msg });
            }
            
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to download media. The message might be expired.'
            }, { quoted: msg });
        }

        if (!buffer || buffer.length === 0) {
            return await sock.sendMessage(context.from, {
                text: '❌ Downloaded empty file. Message might be corrupted or expired.'
            }, { quoted: msg });
        }

        if (mediaType === 'image') {
            const caption = viewOnceMsg.caption || '📸 Media revealed';
            
            await sock.sendMessage(context.from, { 
                image: buffer,
                caption: caption,
                fileName: 'media.jpg'
            }, { quoted: msg });
            
        } else if (mediaType === 'video') {
            const caption = viewOnceMsg.caption || '🎥 Media revealed';
            
            await sock.sendMessage(context.from, { 
                video: buffer,
                caption: caption,
                fileName: 'media.mp4',
                mimetype: viewOnceMsg.mimetype || 'video/mp4'
            }, { quoted: msg });
        }
        
        return await sock.sendMessage(context.from, {
            text: '✅ Media revealed successfully!'
        }, { quoted: msg });
        
    } catch (error) {
        console.error('VV Command Error:', error);
        
        return await sock.sendMessage(context.from, {
            text: `❌ Error: ${error.message || 'Failed to process message'}`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'vv',
    handler: vv
};
