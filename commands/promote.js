const promote = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    const botAdmin = groupMetadata.participants.find(p => p.id === client.user.id)?.admin
    
    if (!isAdmin) return m.reply('❌ This command is only for admins')
    if (!botAdmin) return m.reply('❌ Bot must be admin to promote members')

    try {
        let users = []
        
        if (m.quoted) {
            users.push(m.quoted.sender)
        } else if (m.args[0]) {
            let number = m.args[0].replace(/[^0-9]/g, '')
            if (number.startsWith('0')) number = '62' + number.slice(1)
            if (!number.startsWith('62')) number = '62' + number
            users.push(number + '@s.whatsapp.net')
        } else {
            return m.reply('❌ Reply to user\'s message or provide their number')
        }

        // Check if users are already admins
        for (const user of users) {
            const userAdmin = groupMetadata.participants.find(p => p.id === user)?.admin
            if (userAdmin) {
                return m.reply('❌ User is already an admin')
            }
        }

        await client.groupParticipantsUpdate(m.chat, users, 'promote')
        return m.reply('✅ User has been promoted to admin')
    } catch (error) {
        console.error('Error in promote command:', error)
        return m.reply('❌ Failed to promote user')
    }
}

module.exports = {
    command: 'promote',
    handler: promote
}