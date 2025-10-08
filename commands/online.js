const fs = require('fs');
const path = require('path');

const AUTO_READ_FILE = path.join(__dirname, 'auto_read.json');

const loadAutoReadSetting = () => {
    try {
        if (fs.existsSync(AUTO_READ_FILE)) {
            const data = fs.readFileSync(AUTO_READ_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { enabled: false };
    } catch (error) {
        console.error('Error loading auto-read settings:', error);
        return { enabled: false };
    }
};

const saveAutoReadSetting = (enabled) => {
    try {
        fs.writeFileSync(AUTO_READ_FILE, JSON.stringify({ enabled }, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving auto-read settings:', error);
        return false;
    }
};

const online = async (sock, msg, args, context) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    
    if (!ownerNumber) {
        return await sock.sendMessage(context.from, {
            text: '❌ OWNER_NUMBER not configured in environment variables'
        });
    }
    
    const normalizedOwner = ownerNumber.includes('@') 
        ? ownerNumber 
        : `${ownerNumber}@s.whatsapp.net`;
    
    if (context.sender !== normalizedOwner) {
        return await sock.sendMessage(context.from, {
            text: '❌ This command is only available to the bot owner'
        });
    }
    
    if (!args[0]) {
        const config = loadAutoReadSetting();
        const status = config.enabled ? 'ON ✅' : 'OFF ❌';
        return await sock.sendMessage(context.from, {
            text: `╭━━━『 *AUTO-READ STATUS* 』━━━╮
│
│ 📊 *Current Status:* ${status}
│
│ *Usage:*
│ • ${context.prefix}online on
│ • ${context.prefix}online off
│ • ${context.prefix}online status
│
│ *When enabled:*
│ Bot automatically reads all messages
│ and sends blue ticks
│
╰━━━━━━━━━━━━━━━━━━━━╯`
        });
    }
    
    const setting = args[0].toLowerCase();
    
    if (setting === 'status') {
        const config = loadAutoReadSetting();
        const status = config.enabled ? 'ENABLED ✅' : 'DISABLED ❌';
        return await sock.sendMessage(context.from, {
            text: `📖 *Auto-Read Status:* ${status}\n\n${config.enabled ? '✅ All messages are being read automatically' : '❌ Messages are not being read automatically'}`
        });
    }
    
    if (!['on', 'off'].includes(setting)) {
        return await sock.sendMessage(context.from, {
            text: '❌ Invalid option. Use *on*, *off*, or *status*'
        });
    }
    
    try {
        const enabled = setting === 'on';
        
        if (saveAutoReadSetting(enabled)) {
            return await sock.sendMessage(context.from, {
                text: `✅ Auto-read has been turned *${setting.toUpperCase()}*\n\n${enabled ? '📖 Bot will now automatically read all messages' : '📕 Bot will no longer auto-read messages'}`
            });
        } else {
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to save auto-read settings'
            });
        }
    } catch (error) {
        console.error('Error in online command:', error);
        return await sock.sendMessage(context.from, {
            text: '❌ Failed to update auto-read settings'
        });
    }
};

const isAutoReadEnabled = () => {
    const config = loadAutoReadSetting();
    return config.enabled;
};

module.exports = {
    command: 'online',
    handler: online,
    isAutoReadEnabled
};
