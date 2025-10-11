const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'private_mode.json');

const normalizeNumber = (jidOrNum) => {
  if (!jidOrNum) return '';
  let str = jidOrNum.toString();

  const atIndex = str.indexOf('@');
  if (atIndex !== -1) {
    const local = str.slice(0, atIndex);
    const domain = str.slice(atIndex);
    const cleanedLocal = local.split(':')[0];
    str = cleanedLocal + domain;
  } else {
    str = str.split(':')[0];
  }

  const digits = str.replace(/[^0-9]/g, '');
  return digits.replace(/^0+/, '');
};

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
    if (!ownerNumber) {
        return false;
    }
    
    const senderNum = normalizeNumber(sender);
    const ownerNum = normalizeNumber(ownerNumber);
    
    return senderNum === ownerNum;
};

const privateCmd = async (sock, msg, args, context) => {
    let sender = context.sender;
    let isOwnerCheck = isOwner(sender);
    
    console.log(`[Private Command Debug]`);
    console.log(`  Sender: ${sender}`);
    console.log(`  Owner Number (env): ${process.env.OWNER_NUMBER}`);
    console.log(`  Is Owner: ${isOwnerCheck}`);
    console.log(`  Normalized Sender: ${normalizeNumber(sender)}`);
    console.log(`  Normalized Owner: ${normalizeNumber(process.env.OWNER_NUMBER)}`);
    
    if (!isOwnerCheck && context.isGroup && sender.includes('@lid')) {
        console.log(`[Private] Sender is in @lid format, checking group metadata...`);
        try {
            const groupMetadata = await sock.groupMetadata(context.from);
            const senderParticipant = groupMetadata.participants.find(p => p.id === sender);
            
            if (senderParticipant && senderParticipant.jid) {
                console.log(`[Private] Found jid for @lid sender: ${senderParticipant.jid}`);
                sender = senderParticipant.jid;
                isOwnerCheck = isOwner(sender);
                console.log(`[Private] Re-checking owner with jid - Is Owner: ${isOwnerCheck}`);
            }
        } catch (err) {
            console.error(`[Private] Error fetching group metadata:`, err.message);
        }
    }
    
    if (!isOwnerCheck) {
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
│ Only the owner can use commands
│ Sudo users can use commands in DM/groups
│ Others will be ignored
│
╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: msg });
    }
    
    if (action === 'status') {
        const config = loadPrivateMode();
        const status = config.enabled ? 'ENABLED ✅' : 'DISABLED ❌';
        const description = config.enabled 
            ? '✅ Bot only responds to owner and sudo users' 
            : '❌ Bot responds to everyone';
        
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
                text: '✅ Private mode ENABLED\n\n🔒 Bot will now only respond to owner and sudo users'
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
                text: '✅ Private mode DISABLED\n\n🔓 Bot will now respond to everyone'
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
    isOwner,
    normalizeNumber
};
