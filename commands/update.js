const normalizeNumber = (jidOrNum) => {
    if (!jidOrNum) return '';
    const digits = jidOrNum.replace(/[^0-9]/g, '');
    return digits.replace(/^0+/, '');
};

const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;
    
    const senderNum = normalizeNumber(sender);
    const ownerNum = normalizeNumber(ownerNumber);
    
    return senderNum === ownerNum;
};

const update = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, {
            text: '❌ Only the bot owner can use this command'
        }, { quoted: msg });
    }

    try {
        await sock.sendMessage(context.from, {
            text: '⏳ Updating commands from GitHub...'
        }, { quoted: msg });

        if (!global.reloadCommands) {
            return await sock.sendMessage(context.from, {
                text: '❌ Reload function not available'
            }, { quoted: msg });
        }

        const newCommands = await global.reloadCommands();

        if (!newCommands || Object.keys(newCommands).length === 0) {
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to load commands from GitHub'
            }, { quoted: msg });
        }

        Object.keys(require.cache).forEach(key => {
            if (key.includes('temp_commands')) {
                delete require.cache[key];
            }
        });

        if (global.commands) {
            Object.assign(global.commands, newCommands);
        } else {
            global.commands = newCommands;
        }
        
        const commandCount = Object.keys(newCommands).length;
        
        return await sock.sendMessage(context.from, {
            text: `✅ Commands updated successfully!\n\n📦 Loaded ${commandCount} commands\n\n💾 Changes take effect immediately`
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in update command:', error.message);
        return await sock.sendMessage(context.from, {
            text: `❌ Failed to update commands: ${error.message}`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'update',
    handler: update
};
