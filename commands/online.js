const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const AUTO_READ_FILE = path.join(DATA_DIR, 'autoread.json');

const ensureDataDir = () => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    } catch (error) {
        console.error('Error creating data directory:', error.message);
    }
};

const loadAutoReadSetting = () => {
    try {
        ensureDataDir();
        if (fs.existsSync(AUTO_READ_FILE)) {
            const data = fs.readFileSync(AUTO_READ_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { enabled: false };
    } catch (error) {
        console.error('Error loading auto-read settings:', error.message);
        return { enabled: false };
    }
};

const saveAutoReadSetting = (enabled) => {
    try {
        ensureDataDir();
        const data = {
            enabled,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(AUTO_READ_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving auto-read settings:', error.message);
        return false;
    }
};

const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;
    
    const senderNumber = sender.split('@')[0].split(':')[0];
    const ownerNum = ownerNumber.replace(/[^0-9]/g, '');
    
    return senderNumber === ownerNum;
};

const online = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, {
            text: '❌ This command is only available to the bot owner'
        }, { quoted: msg });
    }
    
    const action = args[0]?.toLowerCase();
    
    if (!action || !['on', 'off', 'enable', 'disable', 'status'].includes(action)) {
        const config = loadAutoReadSetting();
        const status = config.enabled ? '🟢 ON' : '🔴 OFF';
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
│ and sends blue ticks (except when
│ bot is mentioned)
│
╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: msg });
    }
    
    if (action === 'status') {
        const config = loadAutoReadSetting();
        const status = config.enabled ? 'ENABLED ✅' : 'DISABLED ❌';
        const description = config.enabled 
            ? '✅ All messages are being read automatically' 
            : '❌ Messages are not being read automatically';
        
        return await sock.sendMessage(context.from, {
            text: `📖 *Auto-Read Status:* ${status}\n\n${description}`
        }, { quoted: msg });
    }
    
    try {
        const config = loadAutoReadSetting();
        let enabled;
        
        if (action === 'on' || action === 'enable') {
            enabled = true;
            if (config.enabled) {
                return await sock.sendMessage(context.from, {
                    text: '⚠️ Auto-read is already enabled'
                }, { quoted: msg });
            }
        } else if (action === 'off' || action === 'disable') {
            enabled = false;
            if (!config.enabled) {
                return await sock.sendMessage(context.from, {
                    text: '⚠️ Auto-read is already disabled'
                }, { quoted: msg });
            }
        }
        
        if (saveAutoReadSetting(enabled)) {
            const statusText = enabled ? 'ENABLED' : 'DISABLED';
            const emoji = enabled ? '📖' : '📕';
            const description = enabled 
                ? 'Bot will now automatically read all messages' 
                : 'Bot will no longer auto-read messages';
            
            return await sock.sendMessage(context.from, {
                text: `✅ Auto-read has been *${statusText}*\n\n${emoji} ${description}`
            }, { quoted: msg });
        } else {
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to save auto-read settings'
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Error in online command:', error.message);
        return await sock.sendMessage(context.from, {
            text: '❌ Failed to update auto-read settings'
        }, { quoted: msg });
    }
};

const isAutoReadEnabled = () => {
    const config = loadAutoReadSetting();
    return config.enabled;
};

const isBotMentionedInMessage = (message, botNumber) => {
    if (!message.message) return false;
    
    const messageTypes = [
        'extendedTextMessage', 'imageMessage', 'videoMessage', 'stickerMessage',
        'documentMessage', 'audioMessage', 'contactMessage', 'locationMessage'
    ];
    
    for (const type of messageTypes) {
        if (message.message[type]?.contextInfo?.mentionedJid) {
            const mentionedJid = message.message[type].contextInfo.mentionedJid;
            if (mentionedJid.some(jid => jid === botNumber)) {
                return true;
            }
        }
    }
    
    const textContent = 
        message.message.conversation || 
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption || '';
    
    if (textContent) {
        const botUsername = botNumber.split('@')[0];
        if (textContent.includes(`@${botUsername}`)) {
            return true;
        }
    }
    
    return false;
};

const handleAutoread = async (sock, message) => {
    if (isAutoReadEnabled()) {
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        const isBotMentioned = isBotMentionedInMessage(message, botNumber);
        
        if (isBotMentioned) {
            return false;
        } else {
            const key = { 
                remoteJid: message.key.remoteJid, 
                id: message.key.id, 
                participant: message.key.participant 
            };
            await sock.readMessages([key]);
            return true;
        }
    }
    return false;
};

module.exports = {
    command: 'online',
    handler: online,
    isAutoReadEnabled,
    isBotMentionedInMessage,
    handleAutoread,
    isOwner
};
