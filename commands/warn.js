// Store user warnings in memory
let userWarnings = new Map()

// Helper function to check if user is admin
const isAdmin = async (client, groupId, userId) => {
    try {
        const groupMetadata = await client.groupMetadata(groupId)
        const participant = groupMetadata.participants.find(p => p.id === userId)
        return participant?.admin ? true : false
    } catch {
        return false
    }
}

// Helper function to check if bot is admin
const isBotAdmin = async (client, groupId) => {
    try {
        const groupMetadata = await client.groupMetadata(groupId)
        const botParticipant = groupMetadata.participants.find(p => p.id === client.user.id)
        return botParticipant?.admin ? true : false
    } catch {
        return false
    }
}

const warn = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    if (!(await isAdmin(client, m.chat, m.sender))) {
        return m.reply('❌ This command is only for admins')
    }

    try {
        if (!m.quoted && !m.mentionedJid?.[0]) {
            return m.reply('❌ Reply to a message or mention a user to warn them')
        }

        const targetUser = m.quoted?.sender || m.mentionedJid[0]
        const reason = m.text.split(' ').slice(1).join(' ') || 'No reason provided'

        // Don't warn admins
        if (await isAdmin(client, m.chat, targetUser)) {
            return m.reply('❌ Cannot warn group admins')
        }

        // Get current warnings
        const groupWarnings = userWarnings.get(m.chat) || new Map()
        const currentWarnings = groupWarnings.get(targetUser) || 0
        const newWarnings = currentWarnings + 1

        // Update warnings
        groupWarnings.set(targetUser, newWarnings)
        userWarnings.set(m.chat, groupWarnings)

        const userMention = `@${targetUser.split('@')[0]}`
        
        if (newWarnings >= 3) {
            // Kick user after 3 warnings if bot is admin
            if (await isBotAdmin(client, m.chat)) {
                try {
                    await client.groupParticipantsUpdate(m.chat, [targetUser], 'remove')
                    groupWarnings.delete(targetUser) // Clear warnings after kick
                    return m.reply(`🚨 ${userMention} has been kicked for reaching 3 warnings!
                    
Last warning reason: ${reason}`, { mentions: [targetUser] })
                } catch {
                    return m.reply(`⚠️ ${userMention} received warning ${newWarnings}/3
                    
Reason: ${reason}
❌ Failed to kick user (bot needs admin privileges)`, { mentions: [targetUser] })
                }
            } else {
                return m.reply(`🚨 ${userMention} has reached 3 warnings!
                
Reason: ${reason}
❌ Cannot kick (bot needs admin privileges)`, { mentions: [targetUser] })
            }
        } else {
            return m.reply(`⚠️ ${userMention} received warning ${newWarnings}/3
            
Reason: ${reason}`, { mentions: [targetUser] })
        }
    } catch (error) {
        console.error('Error in warn command:', error)
        return m.reply('❌ Failed to warn user')
    }
}

module.exports = warn