const vv = async (sock, msg, args, context) => {
    try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMsg) {
            return await sock.sendMessage(context.from, {
                text: '❌ Reply to a view once message'
            });
        }

        let viewOnceMsg = null;
        let messageType = null;

        if (quotedMsg.viewOnceMessage) {
            viewOnceMsg = quotedMsg.viewOnceMessage.message;
            messageType = 'viewOnceMessage';
        } else if (quotedMsg.viewOnceMessageV2) {
            viewOnceMsg = quotedMsg.viewOnceMessageV2.message;
            messageType = 'viewOnceMessageV2';
        } else if (quotedMsg.viewOnceMessageV2Extension) {
            viewOnceMsg = quotedMsg.viewOnceMessageV2Extension.message;
            messageType = 'viewOnceMessageV2Extension';
        } else {
            return await sock.sendMessage(context.from, {
                text: '❌ This is not a view once message\n\nSupported types:\n• View once photos\n• View once videos\n• View once documents'
            });
        }

        if (!viewOnceMsg) {
            return await sock.sendMessage(context.from, {
                text: '❌ Could not extract view once content'
            });
        }

        let buffer;
        try {
            const quotedKey = msg.message.extendedTextMessage.contextInfo;
            
            const downloadMessage = {
                key: {
                    remoteJid: quotedKey.participant || context.from,
                    id: quotedKey.stanzaId,
                    fromMe: false
                },
                message: quotedMsg
            };

            buffer = await sock.downloadMediaMessage(downloadMessage);
        } catch (downloadError) {
            console.error('Download error:', downloadError);
            
            if (downloadError.message?.includes('Bad MAC')) {
                return await sock.sendMessage(context.from, {
                    text: '❌ Cannot download this view once message\n\n*Possible reasons:*\n• Message already viewed\n• Message expired\n• Session encryption error\n\n💡 Ask sender to send it again'
                });
            }
            
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to download media. The message might be expired.'
            });
        }

        if (!buffer || buffer.length === 0) {
            return await sock.sendMessage(context.from, {
                text: '❌ Downloaded empty file. Message might be corrupted or expired.'
            });
        }

        if (viewOnceMsg.imageMessage) {
            const caption = viewOnceMsg.imageMessage.caption || '📸 View once image revealed';
            
            await sock.sendMessage(context.from, { 
                image: buffer,
                caption: caption 
            }, { quoted: msg });
            
        } else if (viewOnceMsg.videoMessage) {
            const caption = viewOnceMsg.videoMessage.caption || '🎥 View once video revealed';
            
            await sock.sendMessage(context.from, { 
                video: buffer,
                caption: caption,
                mimetype: viewOnceMsg.videoMessage.mimetype || 'video/mp4'
            }, { quoted: msg });
            
        } else if (viewOnceMsg.audioMessage) {
            await sock.sendMessage(context.from, { 
                audio: buffer,
                mimetype: viewOnceMsg.audioMessage.mimetype || 'audio/mp4',
                ptt: viewOnceMsg.audioMessage.ptt || false
            }, { quoted: msg });
            
        } else if (viewOnceMsg.documentMessage) {
            const fileName = viewOnceMsg.documentMessage.fileName || 'view_once_document';
            
            await sock.sendMessage(context.from, { 
                document: buffer,
                mimetype: viewOnceMsg.documentMessage.mimetype || 'application/octet-stream',
                fileName: fileName,
                caption: '📄 View once document revealed'
            }, { quoted: msg });
            
        } else if (viewOnceMsg.stickerMessage) {
            await sock.sendMessage(context.from, { 
                sticker: buffer
            }, { quoted: msg });
            
        } else {
            try {
                await sock.sendMessage(context.from, { 
                    image: buffer,
                    caption: '📱 View once media revealed'
                }, { quoted: msg });
            } catch {
                await sock.sendMessage(context.from, { 
                    document: buffer,
                    fileName: 'view_once_media',
                    mimetype: 'application/octet-stream',
                    caption: '📱 View once media revealed'
                }, { quoted: msg });
            }
        }
        
        return await sock.sendMessage(context.from, {
            text: '✅ View once media revealed successfully!'
        });
        
    } catch (error) {
        console.error('VV Command Error:', error);
        
        return await sock.sendMessage(context.from, {
            text: `❌ Error: ${error.message || 'Failed to process view once message'}`
        });
    }
};

module.exports = {
    command: 'vv',
    handler: vv
};
