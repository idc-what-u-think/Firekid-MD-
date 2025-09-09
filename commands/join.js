const joinHandler = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    
    if (!isAdmin) return m.reply('❌ This command is only for admins')

    try {
        // Enable join message for group
        // Store in bot's group settings (implementation depends on bot's storage system)
        client.joinMessageEnabled = client.joinMessageEnabled || new Set()
        client.joinMessageEnabled.add(m.chat)
        
        return m.reply('✅ Join message notification has been enabled')
    } catch (error) {
        console.error('Error in join command:', error)
        return m.reply('❌ Failed to enable join message')
    }
}

// Event handler for when someone joins
const handleJoin = async (groupMetadata, num, client) => {
    if (!client.joinMessageEnabled?.has(groupMetadata.id)) return
    
    const welcomeMsg = `Hi @${num.split('@')[0]}, Welcome to ${groupMetadata.subject}, enjoy your stay`
    
    await client.sendMessage(groupMetadata.id, {
        text: welcomeMsg,
        mentions: [num]
    })
}

module.exports = {
    command: 'join',
    handler: joinHandler,
    handleJoin // Export event handler for join events
}