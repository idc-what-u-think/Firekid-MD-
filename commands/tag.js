 const tag = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    try {
        const message = m.args.join(' ')
        if (!message) return m.reply('❌ Please provide a message to tag')

        // Get all group participants
        const groupMetadata = await client.groupMetadata(m.chat)
        const participants = groupMetadata.participants.map(p => p.id)

        // Send message with all participants mentioned
        await client.sendMessage(m.chat, {
            text: message,
            mentions: participants
        })
    } catch (error) {
        console.error('Error in tag command:', error)
        return m.reply('❌ Failed to tag message')
    }
}

module.exports = {
    command: 'tag',
    handler: tag
}