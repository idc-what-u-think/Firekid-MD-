const online = async (m, client) => {
    if (!m.args[0]) return m.reply('❌ Usage: .online on/off')
    
    const setting = m.args[0].toLowerCase()
    if (!['on', 'off'].includes(setting)) {
        return m.reply('❌ Invalid option. Use on or off')
    }

    try {
        client.autoRead = setting === 'on'
        return m.reply(`✅ Auto-read has been turned ${setting}`)
    } catch (error) {
        console.error('Error in online command:', error)
        return m.reply('❌ Failed to update auto-read settings')
    }
}

module.exports = {
    command: 'online',
    handler: online
}