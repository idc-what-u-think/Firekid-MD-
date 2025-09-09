const mute = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    const botAdmin = groupMetadata.participants.find(p => p.id === client.user.id)?.admin
    
    if (!isAdmin) return m.reply('❌ This command is only for admins')
    if (!botAdmin) return m.reply('❌ Bot must be admin to mute group')

    try {
        // Change group settings to admins-only
        await client.groupSettingUpdate(m.chat, 'announcement')
        
        // Get current time for logging
        const time = new Date().toLocaleTimeString()
        
        // Send confirmation with who muted and when
        const muteMsg = `🔇 Group has been muted by @${m.sender.split('@')[0]}\nTime: ${time}`
        
        await client.sendMessage(m.chat, {
            text: muteMsg,
            mentions: [m.sender]
        })
    } catch (error) {
        console.error('Error in mute command:', error)
        return m.reply('❌ Failed to mute group')
    }
}

module.exports = {
    command: 'mute',
    handler: mute
}