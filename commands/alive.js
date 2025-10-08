const alive = async (sock, msg, args, context) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
    
    const user = msg.pushName || 'user';
    const aliveText = `I am alive ${user}\nI have been running for ${uptimeStr}`;
    
    return await sock.sendMessage(context.from, { text: aliveText });
};

module.exports = {
    command: 'alive',
    handler: alive
};
