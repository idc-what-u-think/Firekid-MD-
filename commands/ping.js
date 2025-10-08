const ping = async (sock, msg, args, context) => {
    const start = Date.now();
    
    const testMsg = await sock.sendMessage(context.from, {
        text: '🏓 *Pinging...*'
    });
    
    const end = Date.now();
    const responseTime = end - start;
    
    const getSpeedEmoji = (ms) => {
        if (ms < 100) return '🚀';
        if (ms < 200) return '⚡';
        if (ms < 300) return '✅';
        if (ms < 500) return '⚠️';
        return '🐌';
    };
    
    const getSpeedText = (ms) => {
        if (ms < 100) return 'Lightning Fast';
        if (ms < 200) return 'Very Fast';
        if (ms < 300) return 'Fast';
        if (ms < 500) return 'Normal';
        return 'Slow';
    };
    
    const speedEmoji = getSpeedEmoji(responseTime);
    const speedText = getSpeedText(responseTime);
    
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    let uptimeStr = '';
    if (days > 0) uptimeStr += `${days}d `;
    if (hours > 0) uptimeStr += `${hours}h `;
    if (minutes > 0) uptimeStr += `${minutes}m `;
    uptimeStr += `${seconds}s`;
    
    const memUsage = process.memoryUsage();
    const memUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const memTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
    
    const pingMessage = `╭━━━『 *PING RESULT* 』━━━╮
│
│ ${speedEmoji} *Speed:* ${speedText}
│ ⚡ *Response:* ${responseTime}ms
│ ⏱️ *Uptime:* ${uptimeStr}
│ 💾 *Memory:* ${memUsedMB}MB / ${memTotalMB}MB
│ 📡 *Status:* Online
│
╰━━━━━━━━━━━━━━━━━━━━╯

*🏓 Pong!*`;
    
    await sock.sendMessage(context.from, {
        text: pingMessage,
        edit: testMsg.key
    });
};

module.exports = {
    command: 'ping',
    handler: ping
};
