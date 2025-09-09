const setGroupPP = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This command is only for groups')
    
    const groupMetadata = await client.groupMetadata(m.chat)
    const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    const botAdmin = groupMetadata.participants.find(p => p.id === client.user.id)?.admin
    
    if (!isAdmin) return m.reply('❌ This command is only for admins')
    if (!botAdmin) return m.reply('❌ Bot must be admin to change group picture')
    if (!m.quoted || !m.quoted.mimetype?.startsWith('image/')) {
        return m.reply('❌ Reply to an image to set as group picture')
    }

    try {
        const media = await client.downloadAndSaveMediaMessage(m.quoted)
        await client.updateProfilePicture(m.chat, { url: media })
        await m.reply('✅ Group picture has been updated')
    } catch (error) {
        console.error('Error in setgrppp command:', error)
        return m.reply('❌ Failed to update group picture')
    }
}

module.exports = {
    command: 'setgrppp',
    handler: setGroupPP
}