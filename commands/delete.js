const deleteMsg = async (m, client) => {
    // Check if user is admin
    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    
    if (!isAdmin) return m.reply('❌ This command is only for admins')
    if (!m.quoted) return m.reply('❌ Reply to the message you want to delete')

    try {
        // Get quoted message and delete
        const { quoted } = m
        const key = {
            remoteJid: m.chat,
            fromMe: false,
            id: quoted.id,
            participant: quoted.sender
        }
        
        await client.sendMessage(m.chat, { delete: key })
        return m.reply('✅ Message deleted successfully')
    } catch (error) {
        console.error('Error in delete command:', error)
        return m.reply('❌ Failed to delete message')
    }
}

module.exports = {
    command: 'delete',
    handler: deleteMsg
}