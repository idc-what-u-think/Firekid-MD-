const filter = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    
    if (!isAdmin) return m.reply('❌ This command is only for admins')

    try {
        const words = m.args
        if (!words.length) return m.reply('❌ Provide words to filter, separated by spaces')

        // Store filtered words
        client.filteredWords = client.filteredWords || new Map()
        let groupFilters = client.filteredWords.get(m.chat) || new Set()
        
        // Add new words to filter
        words.forEach(word => groupFilters.add(word.toLowerCase()))
        client.filteredWords.set(m.chat, groupFilters)

        return m.reply(`✅ Added ${words.length} word(s) to filter`)
    } catch (error) {
        console.error('Error in filter command:', error)
        return m.reply('❌ Failed to add filtered words')
    }
}

// Message handler for checking filtered words
const checkMessage = async (m, client) => {
    if (!m.isGroup) return
    
    const filters = client.filteredWords?.get(m.chat)
    if (!filters?.size) return

    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    
    if (isAdmin) return // Don't filter admin messages

    try {
        const words = m.text.toLowerCase().split(' ')
        const hasFilteredWord = words.some(word => filters.has(word))

        if (hasFilteredWord) {
            await client.sendMessage(m.chat, { delete: m.key })
            await m.reply('⚠️ Message deleted for containing filtered word')
        }
    } catch (error) {
        console.error('Error in filter check:', error)
    }
}

module.exports = {
    command: 'filter',
    handler: filter,
    checkMessage
}