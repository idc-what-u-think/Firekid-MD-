const toimg = async (m, client) => {
    if (!m.quoted) return m.reply('❌ Reply to a sticker')
    if (!m.quoted.mimetype?.includes('sticker')) {
        return m.reply('❌ Reply to a sticker to convert it to image')
    }

    try {
        m.reply('⏳ Converting sticker to image...')

        // Download the sticker
        const media = await client.downloadAndSaveMediaMessage(m.quoted)

        // Convert webp to png/jpg and send
        const buffer = await require('sharp')(media)
            .toFormat('png')
            .toBuffer()

        await client.sendMessage(m.chat, { 
            image: buffer,
            caption: '✅ Sticker converted to image'
        }, { quoted: m })

    } catch (error) {
        console.error('Error in toimg command:', error)
        return m.reply('❌ Failed to convert sticker to image')
    }
}

module.exports = {
    command: 'toimg',
    handler: toimg
}