const leftHandler = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    
    if (!isAdmin) return m.reply('❌ This command is only for admins')

    try {
        // Enable left message for group
        // Store in bot's group settings (implementation depends on bot's storage system)
        client.leftMessageEnabled = client.leftMessageEnabled || new Set()
        client.leftMessageEnabled.add(m.chat)
        
        return m.reply('✅ Left message notification has been enabled')
    } catch (error) {
        console.error('Error in left command:', error)
        return m.reply('❌ Failed to enable left message')
    }
}

module.exports = {
    command: 'left',
    handler: leftHandler
}