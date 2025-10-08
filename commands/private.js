const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'private_mode.json');

const ensureDataDir = () => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    } catch (error) {
        console.error('Error creating data directory:', error.message);
    }
};

const loadPrivateMode = () => {
    try {
        ensureDataDir();
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { enabled: false };
    } catch (error) {
        console.error('Error loading private mode:', error.message);
        return { enabled: false };
    }
};

const savePrivateMode = (enabled) => {
    try {
        ensureDataDir();
        const data = {
            enabled,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving private mode:', error.message);
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

const privateCmd = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, {
            text: '❌ This command is only available to the bot owner'
        }, { quoted: msg });
    }
    
    const action = args[0]?.toLowerCase();
    
    if (!action || !['on', 'off', 'status'].includes(action)) {
        const config = loadPrivateMode();
        const status = config.enabled ? '🟢 ON' : '🔴 OFF';
        return await sock.sendMessage(context.from, {
            text: `╭━━━『 *PRIVATE MODE* 』━━━╮
│
│ 📊 *Current Status:* ${status}
│
│ *Usage:*
│ • ${context.prefix}private on
│ • ${context.prefix}private off
│ • ${context.prefix}private status
│
│ *When enabled:*
│ Only the owner can use bot commands
│ in groups. Other users will be ignored.
│
╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: msg });
    }
    
    if (action === 'status') {
        const config = loadPrivateMode();
        const status = config.enabled ? 'ENABLED ✅' : 'DISABLED ❌';
        const description = config.enabled 
            ? '✅ Bot only responds to owner in groups' 
            : '❌ Bot responds to everyone in groups';
        
        return await sock.sendMessage(context.from, {
            text: `🔒 *Private Mode Status:* ${status}\n\n${description}`
        }, { quoted: msg });
    }
    
    if (action === 'on') {
        const config = loadPrivateMode();
        if (config.enabled) {
            return await sock.sendMessage(context.from, {
                text: '⚠️ Private mode is already enabled'
            }, { quoted: msg });
        }
        
        if (savePrivateMode(true)) {
            return await sock.sendMessage(context.from, {
                text: '✅ Private mode ENABLED\n\n🔒 Bot will now only respond to you in groups'
            }, { quoted: msg });
        } else {
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to enable private mode'
            }, { quoted: msg });
        }
    }
    
    if (action === 'off') {
        const config = loadPrivateMode();
        if (!config.enabled) {
            return await sock.sendMessage(context.from, {
                text: '⚠️ Private mode is already disabled'
            }, { quoted: msg });
        }
        
        if (savePrivateMode(false)) {
            return await sock.sendMessage(context.from, {
                text: '✅ Private mode DISABLED\n\n🔓 Bot will now respond to everyone in groups'
            }, { quoted: msg });
        } else {
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to disable private mode'
            }, { quoted: msg });
        }
    }
};

module.exports = {
    command: 'private',
    handler: privateCmd,
    isPrivateModeEnabled: () => {
        const config = loadPrivateMode();
        return config.enabled;
    },
    isOwner
};
