const blockUser = async (m, client) => {
    if (!m.quoted && !m.args[0]) {
        return m.reply('❌ Reply to user\'s message or provide their number')
    }

    try {
        const user = m.quoted ? m.quoted.sender : m.args[0]
        await client.updateBlockStatus(user, "block")
        return m.reply('✅ User has been blocked')
    } catch (error) {
        console.error('Error in block command:', error)
        return m.reply('❌ Failed to block user')
    }
}

const unblockUser = async (m, client) => {
    if (!m.quoted && !m.args[0]) {
        return m.reply('❌ Reply to user\'s message or provide their number')
    }

    try {
        const user = m.quoted ? m.quoted.sender : m.args[0]
        await client.updateBlockStatus(user, "unblock")
        return m.reply('✅ User has been unblocked')
    } catch (error) {
        console.error('Error in unlock command:', error)
        return m.reply('❌ Failed to unblock user')
    }
}

module.exports = {
    commands: {
        block: blockUser,
        unlock: unblockUser
    }
}