const tagall = async (m, client) => {
    // Check if in group and user is admin
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    
    if (!isAdmin) return m.reply('❌ This command is only for admins')

    try {
        let message = m.args.join(' ') || 'No message'
        let mentionText = `${message}\n\n`
        let mentions = []

        // Get all participants and format mentions
        for (let participant of groupMetadata.participants) {
            mentions.push(participant.id)
            mentionText += `- @${participant.id.split('@')[0]}\n`
        }

        await client.sendMessage(m.chat, {
            text: mentionText,
            mentions: mentions
        })
    } catch (error) {
        console.error('Error in tagall command:', error)
        return m.reply('❌ Failed to tag all members')
    }
}

module.exports = {
    command: 'tagall',
    handler: tagall
}