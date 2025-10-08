const online = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, {
            text: '❌ Usage: .online on/off'
        });
    }
    
    const setting = args[0].toLowerCase();
    if (!['on', 'off'].includes(setting)) {
        return await sock.sendMessage(context.from, {
            text: '❌ Invalid option. Use on or off'
        });
    }
    
    try {
        sock.autoRead = setting === 'on';
        return await sock.sendMessage(context.from, {
            text: `✅ Auto-read has been turned ${setting}`
        });
    } catch (error) {
        console.error('Error in online command:', error);
        return await sock.sendMessage(context.from, {
            text: '❌ Failed to update auto-read settings'
        });
    }
};

module.exports = {
    command: 'online',
    handler: online
};
