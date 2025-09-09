const vv = async (m, client) => {
    try {
        if (!m.quoted) return m.reply('❌ Reply to a view once message or status')
        
        // Check if it's a view once message or status
        if (m.quoted.mtype === 'viewOnceMessage' || m.quoted.mtype === 'status') {
            
            // Download the media
            const mediaBuffer = await client.downloadAndSaveMediaMessage(m.quoted)
            
            // Get the actual message content from view once wrapper
            let actualMessage = m.quoted
            if (m.quoted.mtype === 'viewOnceMessage') {
                actualMessage = m.quoted.message?.viewOnceMessage?.message || m.quoted
            }
            
            // Determine media type and send accordingly
            if (actualMessage.imageMessage) {
                // Handle images
                const caption = actualMessage.imageMessage.caption || '📸 View once image revealed'
                await client.sendMessage(m.chat, { 
                    image: { url: mediaBuffer },
                    caption: caption 
                }, { quoted: m })
                
            } else if (actualMessage.videoMessage) {
                // Handle videos
                const caption = actualMessage.videoMessage.caption || '🎥 View once video revealed'
                await client.sendMessage(m.chat, { 
                    video: { url: mediaBuffer },
                    caption: caption,
                    mimetype: actualMessage.videoMessage.mimetype || 'video/mp4'
                }, { quoted: m })
                
            } else if (actualMessage.audioMessage) {
                // Handle audio messages
                await client.sendMessage(m.chat, { 
                    audio: { url: mediaBuffer },
                    mimetype: actualMessage.audioMessage.mimetype || 'audio/mp4',
                    ptt: actualMessage.audioMessage.ptt || false // Voice note or regular audio
                }, { quoted: m })
                
            } else if (actualMessage.documentMessage) {
                // Handle documents
                const fileName = actualMessage.documentMessage.fileName || 'view_once_document'
                await client.sendMessage(m.chat, { 
                    document: { url: mediaBuffer },
                    mimetype: actualMessage.documentMessage.mimetype || 'application/octet-stream',
                    fileName: fileName,
                    caption: '📄 View once document revealed'
                }, { quoted: m })
                
            } else if (actualMessage.stickerMessage) {
                // Handle stickers
                await client.sendMessage(m.chat, { 
                    sticker: { url: mediaBuffer }
                }, { quoted: m })
                
            } else if (actualMessage.gifMessage) {
                // Handle GIFs
                const caption = actualMessage.gifMessage.caption || '🎞️ View once GIF revealed'
                await client.sendMessage(m.chat, { 
                    video: { url: mediaBuffer },
                    gifPlayback: true,
                    caption: caption
                }, { quoted: m })
                
            } else {
                // Fallback - try to send as image first, then as document
                try {
                    await client.sendMessage(m.chat, { 
                        image: { url: mediaBuffer },
                        caption: '📱 View once media revealed (unknown type)'
                    }, { quoted: m })
                } catch {
                    await client.sendMessage(m.chat, { 
                        document: { url: mediaBuffer },
                        fileName: 'view_once_media',
                        caption: '📱 View once media revealed'
                    }, { quoted: m })
                }
            }
            
            // Success message
            await m.reply('✅ View once media revealed successfully!')
            
        } else {
            return m.reply('❌ This is not a view once message or status\n\nSupported types:\n• View once photos\n• View once videos\n• View once documents\n• WhatsApp status')
        }
        
    } catch (error) {
        console.error('Error in vv command:', error)
        
        // More specific error messages
        if (error.message?.includes('download')) {
            return m.reply('❌ Failed to download media. The message might be expired or corrupted.')
        } else if (error.message?.includes('send')) {
            return m.reply('❌ Downloaded successfully but failed to send. Media might be too large.')
        } else {
            return m.reply('❌ Failed to process view once message. Please try again.')
        }
    }
}

module.exports = {
    command: 'vv',
    handler: vv
}