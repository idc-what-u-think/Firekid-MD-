const normalizeNumber = (jidOrNum) => {
    if (!jidOrNum) return '';
    let str = jidOrNum.toString();
    str = str.split(':')[0];
    const digits = str.replace(/[^0-9]/g, '');
    return digits.replace(/^0+/, '');
};

const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;
    const senderNum = normalizeNumber(sender);
    const ownerNum = normalizeNumber(ownerNumber);
    return senderNum === ownerNum;
};

const getValidWhatsAppJid = async (sock, number) => {
    try {
        const normalized = normalizeNumber(number);
        const query = await sock.onWhatsApp(normalized);
        if (!query || !query[0]?.jid) return null;
        return query[0].jid;
    } catch (error) {
        return null;
    }
};

const blockUser = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can block users' 
        }, { quoted: msg });
    }

    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    
    let targetNumber = quotedSender || mentionedJid || args[0];
    
    if (!targetNumber) {
        return await sock.sendMessage(context.from, {
            text: `❌ *Usage:*\n\n` +
                  `Reply to a message, mention a user, or provide number:\n` +
                  `• ${context.prefix}block @user\n` +
                  `• ${context.prefix}block 2348012345678\n` +
                  `• Reply to message and use ${context.prefix}block`
        }, { quoted: msg });
    }

    const jid = await getValidWhatsAppJid(sock, targetNumber);
    
    if (!jid) {
        return await sock.sendMessage(context.from, {
            text: `❌ Number is not registered on WhatsApp`
        }, { quoted: msg });
    }

    if (isOwner(jid)) {
        return await sock.sendMessage(context.from, {
            text: '❌ You cannot block yourself'
        }, { quoted: msg });
    }

    try {
        await sock.updateBlockStatus(jid, 'block');
        
        const blockedNumber = normalizeNumber(jid);
        
        const blockMessage = `╭━━━『 *BLOCK SUCCESS* 』━━━╮
│
│ ✅ *Status:* Blocked
│ 📱 *Number:* +${blockedNumber}
│ 🚫 *Action:* User blocked successfully
│
╰━━━━━━━━━━━━━━━━━━━━╯`;

        return await sock.sendMessage(context.from, {
            text: blockMessage
        }, { quoted: msg });
        
    } catch (error) {
        return await sock.sendMessage(context.from, {
            text: `❌ Failed to block user\n\nError: ${error.message}`
        }, { quoted: msg });
    }
};

const unblockUser = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can unblock users' 
        }, { quoted: msg });
    }

    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    
    let targetNumber = quotedSender || mentionedJid || args[0];
    
    if (!targetNumber) {
        return await sock.sendMessage(context.from, {
            text: `❌ *Usage:*\n\n` +
                  `Reply to a message, mention a user, or provide number:\n` +
                  `• ${context.prefix}unblock @user\n` +
                  `• ${context.prefix}unblock 2348012345678\n` +
                  `• Reply to message and use ${context.prefix}unblock`
        }, { quoted: msg });
    }

    const jid = await getValidWhatsAppJid(sock, targetNumber);
    
    if (!jid) {
        return await sock.sendMessage(context.from, {
            text: `❌ Number is not registered on WhatsApp`
        }, { quoted: msg });
    }

    try {
        await sock.updateBlockStatus(jid, 'unblock');
        
        const unblockedNumber = normalizeNumber(jid);
        
        const unblockMessage = `╭━━━『 *UNBLOCK SUCCESS* 』━━━╮
│
│ ✅ *Status:* Unblocked
│ 📱 *Number:* +${unblockedNumber}
│ 🔓 *Action:* User unblocked successfully
│
╰━━━━━━━━━━━━━━━━━━━━╯`;

        return await sock.sendMessage(context.from, {
            text: unblockMessage
        }, { quoted: msg });
        
    } catch (error) {
        return await sock.sendMessage(context.from, {
            text: `❌ Failed to unblock user\n\nError: ${error.message}`
        }, { quoted: msg });
    }
};

const listBlocked = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can view blocked users' 
        }, { quoted: msg });
    }

    try {
        const blockedList = await sock.fetchBlocklist();
        
        if (!blockedList || blockedList.length === 0) {
            return await sock.sendMessage(context.from, {
                text: `╭━━━『 *BLOCKED USERS* 』━━━╮
│
│ 📋 No blocked users
│
╰━━━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: msg });
        }

        let blockedMessage = `╭━━━『 *BLOCKED USERS* 』━━━╮\n│\n`;
        blockedMessage += `│ 📋 *Total:* ${blockedList.length}\n│\n`;
        
        blockedList.forEach((jid, index) => {
            const number = normalizeNumber(jid);
            blockedMessage += `│ ${index + 1}. +${number}\n`;
        });
        
        blockedMessage += `│\n╰━━━━━━━━━━━━━━━━━━━━╯`;

        return await sock.sendMessage(context.from, {
            text: blockedMessage
        }, { quoted: msg });
        
    } catch (error) {
        return await sock.sendMessage(context.from, {
            text: `❌ Failed to fetch blocked list\n\nError: ${error.message}`
        }, { quoted: msg });
    }
};

// Export each command separately so commandLoader can pick them up
module.exports = {
    block: blockUser,
    unblock: unblockUser,
    blocklist: listBlocked
};
