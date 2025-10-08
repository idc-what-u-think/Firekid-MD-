const vv = async (sock, msg, args, context) => {
    try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMsg) {
            return await sock.sendMessage(context.from, {
                text: '❌ Reply to a view once message or status'
            });
        }
        
        if (quotedMsg.viewOnceMessage || quotedMsg.viewOnceMessageV2) {
            const viewOnceMsg = quotedMsg.viewOnceMessage?.message || quotedMsg.viewOnceMessageV2?.message;
            
            if (!viewOnceMsg) {
                return await sock.sendMessage(context.from, {
                    text: '❌ Could not extract view once content'
                });
            }
            
            if (viewOnceMsg.imageMessage) {
                const caption = viewOnceMsg.imageMessage.caption || '📸 View once image revealed';
                const buffer = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo);
                
                await sock.sendMessage(context.from, { 
                    image: buffer,
                    caption: caption 
                }, { quoted: msg });
                
            } else if (viewOnceMsg.videoMessage) {
                const caption = viewOnceMsg.videoMessage.caption || '🎥 View once video revealed';
                const buffer = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo);
                
                await sock.sendMessage(context.from, { 
                    video: buffer,
                    caption: caption,
                    mimetype: viewOnceMsg.videoMessage.mimetype || 'video/mp4'
                }, { quoted: msg });
                
            } else if (viewOnceMsg.audioMessage) {
                const buffer = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo);
                
                await sock.sendMessage(context.from, { 
                    audio: buffer,
                    mimetype: viewOnceMsg.audioMessage.mimetype || 'audio/mp4',
                    ptt: viewOnceMsg.audioMessage.ptt || false
                }, { quoted: msg });
                
            } else if (viewOnceMsg.documentMessage) {
                const fileName = viewOnceMsg.documentMessage.fileName || 'view_once_document';
                const buffer = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo);
                
                await sock.sendMessage(context.from, { 
                    document: buffer,
                    mimetype: viewOnceMsg.documentMessage.mimetype || 'application/octet-stream',
                    fileName: fileName,
                    caption: '📄 View once document revealed'
                }, { quoted: msg });
                
            } else if (viewOnceMsg.stickerMessage) {
                const buffer = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo);
                
                await sock.sendMessage(context.from, { 
                    sticker: buffer
                }, { quoted: msg });
                
            } else {
                try {
                    const buffer = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo);
                    
                    await sock.sendMessage(context.from, { 
                        image: buffer,
                        caption: '📱 View once media revealed (unknown type)'
                    }, { quoted: msg });
                } catch {
                    const buffer = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo);
                    
                    await sock.sendMessage(context.from, { 
                        document: buffer,
                        fileName: 'view_once_media',
                        caption: '📱 View once media revealed'
                    }, { quoted: msg });
                }
            }
            
            await sock.sendMessage(context.from, {
                text: '✅ View once media revealed successfully!'
            });
            
        } else {
            return await sock.sendMessage(context.from, {
                text: '❌ This is not a view once message or status\n\nSupported types:\n• View once photos\n• View once videos\n• View once documents\n• WhatsApp status'
            });
        }
        
    } catch (error) {
        console.error('Error in vv command:', error);
        
        if (error.message?.includes('download')) {
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to download media. The message might be expired or corrupted.'
            });
        } else if (error.message?.includes('send')) {
            return await sock.sendMessage(context.from, {
                text: '❌ Downloaded successfully but failed to send. Media might be too large.'
            });
        } else {
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to process view once message. Please try again.'
            });
        }
    }
};

module.exports = {
    command: 'vv',
    handler: vv
};
