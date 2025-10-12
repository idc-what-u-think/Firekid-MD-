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

const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;
    
    const senderNum = normalizeNumber(sender);
    const ownerNum = normalizeNumber(ownerNumber);
    
    return senderNum === ownerNum;
};

const blockUser = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can block users' 
        }, { quoted: msg });
    }
    
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    
    if (!quotedSender && !args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Reply to user's message or provide their number\n\nExample: ${context.prefix}block 2348012345678` 
        }, { quoted: msg });
    }
    
    try {
        let userToBlock;
        
        if (quotedSender) {
            userToBlock = quotedSender;
            if (!userToBlock.includes('@')) {
                userToBlock = userToBlock + '@s.whatsapp.net';
            }
        } else if (args[0]) {
            const number = args[0].replace(/[^0-9]/g, '');
            userToBlock = number + '@s.whatsapp.net';
        }
        
        const userNumber = userToBlock.split('@')[0];
        
        if (isOwner(userToBlock)) {
            return await sock.sendMessage(context.from, { 
                text: '❌ You cannot block yourself' 
            }, { quoted: msg });
        }

        console.log(`[Block Command] Blocking user: ${userToBlock}`);
        
        await sock.updateBlockStatus(userToBlock, 'block');
        
        return await sock.sendMessage(context.from, { 
            text: `✅ User blocked successfully\n📱 Number: +${userNumber}` 
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in block command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to block user: ${error.message}` 
        }, { quoted: msg });
    }
};

const unblockUser = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can unblock users' 
        }, { quoted: msg });
    }
    
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    
    if (!quotedSender && !args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Reply to user's message or provide their number\n\nExample: ${context.prefix}unblock 2348012345678` 
        }, { quoted: msg });
    }
    
    try {
        let userToUnblock;
        
        if (quotedSender) {
            userToUnblock = quotedSender;
            if (!userToUnblock.includes('@')) {
                userToUnblock = userToUnblock + '@s.whatsapp.net';
            }
        } else if (args[0]) {
            const number = args[0].replace(/[^0-9]/g, '');
            userToUnblock = number + '@s.whatsapp.net';
        }
        
        const userNumber = userToUnblock.split('@')[0];
        
        console.log(`[Unblock Command] Unblocking user: ${userToUnblock}`);
        
        await sock.updateBlockStatus(userToUnblock, 'unblock');
        
        return await sock.sendMessage(context.from, { 
            text: `✅ User unblocked successfully\n📱 Number: +${userNumber}` 
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in unblock command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to unblock user: ${error.message}` 
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
