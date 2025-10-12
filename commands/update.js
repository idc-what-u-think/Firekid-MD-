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

        const path = require('path');
        const mainDir = path.join(__dirname, '..', '..', '..');
        const { reloadCommandsFromGitHub } = require(path.join(mainDir, 'utils', 'commandLoader'));
        
        const newCommands = await reloadCommandsFromGitHub(
            process.env.GITHUB_TOKEN,
            'https://github.com/idc-what-u-think/Firekid-MD-.git'
        );

        if (!newCommands || Object.keys(newCommands).length === 0) {
            return await sock.sendMessage(context.from, {
                text: '❌ Failed to load commands from GitHub'
            }, { quoted: msg });
        }

        global.commands = newCommands;
        
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
