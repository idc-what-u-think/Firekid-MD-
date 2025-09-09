const unmute = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    const botAdmin = groupMetadata.participants.find(p => p.id === client.user.id)?.admin
    
    if (!isAdmin) return m.reply('❌ This command is only for admins')
    if (!botAdmin) return m.reply('❌ Bot must be admin to unmute group')

    try {
        // Change group settings back to all participants
        await client.groupSettingUpdate(m.chat, 'not_announcement')
        
        // Get current time for logging
        const time = new Date().toLocaleTimeString()
        
        // Send confirmation with who unmuted and when
        const unmuteMsg = `🔊 Group has been unmuted by @${m.sender.split('@')[0]}\nTime: ${time}`
        
        await client.sendMessage(m.chat, {
            text: unmuteMsg,
            mentions: [m.sender]
        })
    } catch (error) {
        console.error('Error in unmute command:', error)
        return m.reply('❌ Failed to unmute group')
    }
}

module.exports = {
    command: 'unmute',
    handler: unmute
}