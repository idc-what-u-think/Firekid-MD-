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

const resetWarn = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    if (!(await isAdmin(client, m.chat, m.sender))) {
        return m.reply('❌ This command is only for admins')
    }

    try {
        if (!m.quoted && !m.mentionedJid?.[0]) {
            return m.reply('❌ Reply to a message or mention a user to reset their warnings')
        }

        const targetUser = m.quoted?.sender || m.mentionedJid[0]
        const groupWarnings = userWarnings.get(m.chat) || new Map()

        if (!groupWarnings.has(targetUser)) {
            return m.reply('❌ User has no warnings to reset')
        }

        groupWarnings.delete(targetUser)
        userWarnings.set(m.chat, groupWarnings)

        const userMention = `@${targetUser.split('@')[0]}`
        return m.reply(`✅ Warnings reset for ${userMention}`, { mentions: [targetUser] })
        
    } catch (error) {
        console.error('Error in resetwarn command:', error)
        return m.reply('❌ Failed to reset warnings')
    }
}

module.exports = resetWarn