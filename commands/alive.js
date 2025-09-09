const alive = async (m) => {
    const uptime = process.uptime()
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`
    
    return await m.reply(`I am alive ${m.pushName || 'user'}\nI have been running for ${uptimeStr}`)
}

module.exports = {
    command: 'alive',
    handler: alive
}