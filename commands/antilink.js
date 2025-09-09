// Store antilink settings in memory
let antilinkSettings = new Map()

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

const antilink = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    if (!(await isAdmin(client, m.chat, m.sender))) {
        return m.reply('❌ This command is only for admins')
    }

    try {
        const args = m.text.split(' ').slice(1)
        const action = args[0]?.toLowerCase()
        const mode = args[1]?.toLowerCase()

        if (!action || !['on', 'off'].includes(action)) {
            return m.reply(`❌ Usage: 
*antilnk on* (kick/delete) - Enable antilink
*antilnk off* - Disable antilink

Current modes:
• *kick* - Kick user after 3 warnings
• *delete* - Delete message and warn user`)
        }

        if (action === 'on' && !['kick', 'delete'].includes(mode)) {
            return m.reply('❌ Please specify action: *kick* or *delete*')
        }

        if (action === 'on') {
            // Check if bot has admin privileges for kick mode
            if (mode === 'kick' && !(await isBotAdmin(client, m.chat))) {
                return m.reply('❌ Bot needs admin privileges to kick members')
            }
            
            antilinkSettings.set(m.chat, mode)
            return m.reply(`✅ Antilink enabled with *${mode}* action
            
💡 Tip: Use *allowdomain* command to whitelist trusted domains`)
        } else {
            antilinkSettings.delete(m.chat)
            return m.reply('✅ Antilink disabled')
        }
    } catch (error) {
        console.error('Error in antilink command:', error)
        return m.reply('❌ Failed to update antilink settings')
    }
}

module.exports = antilink