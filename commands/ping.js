const ping = async (m) => {
    const start = Date.now()
    await m.reply('Testing ping...')
    const end = Date.now()
    const responseTime = end - start
    
    return await m.reply(`Pong! Response time: ${responseTime}ms`)
}

module.exports = {
    command: 'ping',
    handler: ping
}