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
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ enabled }, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving private mode:', error.message);
        return false;
    }
};

const private = async (sock, msg, args, context) => {
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
    
    const action = args[0]?.toLowerCase();
    
    if (!action || !['on', 'off', 'status'].includes(action)) {
        const config = loadPrivateMode();
        const status = config.enabled ? 'ON' : 'OFF';
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
        });
    }
    
    if (action === 'status') {
        const config = loadPrivateMode();
        const status = config.enabled ? 'ENABLED ✅' : 'DISABLED ❌';
        return await sock.sendMessage(context.from, {
            text: `🔒 *Private Mode Status:* ${status}\n\n${config.enabled ? '✅ Bot only responds to owner in groups' : '❌ Bot responds to everyone in groups'}`
        });
    }
    
    if (action === 'on') {
        if (savePrivateMode(true)) {
            return await sock.sendMessage(context.from, {
                text: '✅ Private mode ENABLED\n\n🔒 Bot will now only respond to you in groups'
            });
        } else {
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to enable private mode'
            });
        }
    }
    
    if (action === 'off') {
        if (savePrivateMode(false)) {
            return await sock.sendMessage(context.from, {
                text: '✅ Private mode DISABLED\n\n🔓 Bot will now respond to everyone in groups'
            });
        } else {
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to disable private mode'
            });
        }
    }
};

module.exports = {
    command: 'private',
    handler: private,
    isPrivateModeEnabled: () => {
        const config = loadPrivateMode();
        return config.enabled;
    }
};
