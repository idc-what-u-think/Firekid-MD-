const { Sticker, StickerTypes } = require('wa-sticker-formatter')

const makeSticker = async (m, client) => {
    if (!m.quoted) return m.reply('❌ Reply to an image or sticker')
    
    if (!m.quoted.mimetype?.startsWith('image/') && 
        !m.quoted.mimetype?.startsWith('video/') && 
        !m.quoted.mimetype?.includes('sticker')) {
        return m.reply('❌ Reply to a valid image, video, or sticker')
    }

    try {
        m.reply('⏳ Creating sticker...')

        const media = await client.downloadAndSaveMediaMessage(m.quoted)
        
        const sticker = new Sticker(media, {
            pack: process.env.STICKER_PACK_NAME || 'Firekid XMD',
            author: process.env.STICKER_AUTHOR_NAME || 'Firekid',
            type: StickerTypes.FULL,
            categories: ['🎉'],
            quality: 70
        })

        const buffer = await sticker.toBuffer()
        await client.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
        
    } catch (error) {
        console.error('Error in sticker command:', error)
        return m.reply('❌ Failed to create sticker')
    }
}

module.exports = {
    command: 'sticker',
    handler: makeSticker
}