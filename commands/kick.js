const kick = async (m, client) => {
    // Check if in group and user is admin
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    const botAdmin = groupMetadata.participants.find(p => p.id === client.user.id)?.admin
    
    if (!isAdmin) return m.reply('❌ This command is only for admins')
    if (!botAdmin) return m.reply('❌ Bot must be admin to kick members')

    try {
        let users = []
        
        // If message is quoted, get that user
        if (m.quoted) {
            users.push(m.quoted.sender)
        }
        // If phone number is provided
        else if (m.args[0]) {
            // Format number to international format
            let number = m.args[0].replace(/[^0-9]/g, '')
            if (number.startsWith('0')) number = '62' + number.slice(1)
            if (!number.startsWith('62')) number = '62' + number
            users.push(number + '@s.whatsapp.net')
        } else {
            return m.reply('❌ Reply to user\'s message or provide their number')
        }

        // Check if users are admins
        for (const user of users) {
            const userAdmin = groupMetadata.participants.find(p => p.id === user)?.admin
            if (userAdmin) {
                return m.reply('❌ Cannot kick admin users')
            }
        }

        // Kick users
        await client.groupParticipantsUpdate(m.chat, users, 'remove')
        return m.reply('✅ User has been kicked from the group')
    } catch (error) {
        console.error('Error in kick command:', error)
        return m.reply('❌ Failed to kick user')
    }
}

module.exports = {
    command: 'kick',
    handler: kick
}