const normalizeNumber = (jidOrNum) => {
    if (!jidOrNum) return '';
    let str = jidOrNum.toString();

    // Remove any JID or device tag after :
    str = str.split(':')[0];

    // Extract only digits
    const digits = str.replace(/[^0-9]/g, '');
    return digits.replace(/^0+/, ''); // remove leading zeros
};

const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;

    const senderNum = normalizeNumber(sender);
    const ownerNum = normalizeNumber(ownerNumber);

    return senderNum === ownerNum;
};

const getValidWhatsAppJid = async (sock, number) => {
    const normalized = normalizeNumber(number);
    const query = await sock.onWhatsApp(normalized);

    if (!query || !query[0]?.jid) return null;
    return query[0].jid;
};

const blockUser = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can block users' 
        }, { quoted: msg });
    }

    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    let targetNumber = quotedSender || args[0];

    if (!targetNumber) {
        return await sock.sendMessage(context.from, {
            text: `❌ Reply to a user’s message or include their number\n\nExample: ${context.prefix}block 2348012345678`
        }, { quoted: msg });
    }

    const jid = await getValidWhatsAppJid(sock, targetNumber);

    if (!jid) {
        return await sock.sendMessage(context.from, {
            text: `❌ Number is not registered on WhatsApp`
        }, { quoted: msg });
    }

    if (isOwner(jid)) {
        return sock.sendMessage(context.from, {
            text: '❌ You cannot block yourself'
        }, { quoted: msg });
    }

    try {
        console.log(`[Block Command] Blocking user: ${jid}`);

        await sock.updateBlockStatus(jid, 'block');

        return await sock.sendMessage(context.from, {
            text: `✅ Blocked Successfully\n📱 +${normalizeNumber(jid)}`
        }, { quoted: msg });

    } catch (error) {
        console.error('Block Error:', error);
        return await sock.sendMessage(context.from, {
            text: '❌ Failed to block user'
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
    let targetNumber = quotedSender || args[0];

    if (!targetNumber) {
        return await sock.sendMessage(context.from, {
            text: `❌ Reply to a user’s message or include their number\n\nExample: ${context.prefix}unblock 2348012345678`
        }, { quoted: msg });
    }

    const jid = await getValidWhatsAppJid(sock, targetNumber);

    if (!jid) {
        return await sock.sendMessage(context.from, {
            text: `❌ Number is not registered on WhatsApp`
        }, { quoted: msg });
    }

    try {
        console.log(`[Unblock Command] Unblocking user: ${jid}`);

        await sock.updateBlockStatus(jid, 'unblock');

        return await sock.sendMessage(context.from, {
            text: `✅ Unblocked Successfully\n📱 +${normalizeNumber(jid)}`
        }, { quoted: msg });

    } catch (error) {
        console.error('Unblock Error:', error);
        return await sock.sendMessage(context.from, {
            text: '❌ Failed to unblock user'
        }, { quoted: msg });
    }
};

module.exports = {
    block: {
        command: 'block',
        handler: blockUser
    },
    unblock: {
        command: 'unblock',
        handler: unblockUser
    }
};
