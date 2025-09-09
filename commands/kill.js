const kill = async (m, client) => {
    if (!m.quoted) return m.reply('❌ Reply to a message to add wasted effect')

    try {
        const wastedVideo = 'https://ik.imagekit.io/firekid/video_2025-09-08_19-55-03.mp4'
        
        await client.sendMessage(m.chat, {
            video: { url: wastedVideo },
            caption: 'WASTED',
            quoted: m.quoted
        })
    } catch (error) {
        console.error('Error in kill command:', error)
        return m.reply('❌ Failed to send wasted effect')
    }
}

module.exports = {
    command: 'kill',
    handler: kill
}