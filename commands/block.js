const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;
    
    const senderNumber = sender.split('@')[0].split(':')[0];
    const ownerNum = ownerNumber.replace(/[^0-9]/g, '');
    
    return senderNumber === ownerNum;
};

const blockUser = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can block users' 
        });
    }
    
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    
    if (!quotedMsg && !args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Reply to user's message or provide their number\n\nExample: ${context.prefix}block 2348012345678` 
        });
    }
    
    try {
        let userToBlock;
        
        if (quotedSender) {
            userToBlock = quotedSender.split(':')[0];
            if (!userToBlock.includes('@')) {
                userToBlock = userToBlock + '@s.whatsapp.net';
            }
        } else if (args[0]) {
            let number = args[0].replace(/[^0-9]/g, '');
            userToBlock = number + '@s.whatsapp.net';
        }
        
        const userNumber = userToBlock.split('@')[0].split(':')[0];
        if (isOwner(userToBlock)) {
            return await sock.sendMessage(context.from, { 
                text: '❌ You cannot block yourself' 
            });
        }
        
        await sock.updateBlockStatus(userToBlock, 'block');
        
        return await sock.sendMessage(context.from, { 
            text: `✅ User blocked successfully\n📱 Number: +${userNumber}` 
        });
        
    } catch (error) {
        console.error('Error in block command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to block user: ${error.message}` 
        });
    }
};

const unblockUser = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can unblock users' 
        });
    }
    
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    
    if (!quotedMsg && !args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Reply to user's message or provide their number\n\nExample: ${context.prefix}unblock 2348012345678` 
        });
    }
    
    try {
        let userToUnblock;
        
        if (quotedSender) {
            userToUnblock = quotedSender.split(':')[0];
            if (!userToUnblock.includes('@')) {
                userToUnblock = userToUnblock + '@s.whatsapp.net';
            }
        } else if (args[0]) {
            let number = args[0].replace(/[^0-9]/g, '');
            userToUnblock = number + '@s.whatsapp.net';
        }
        
        const userNumber = userToUnblock.split('@')[0].split(':')[0];
        
        await sock.updateBlockStatus(userToUnblock, 'unblock');
        
        return await sock.sendMessage(context.from, { 
            text: `✅ User unblocked successfully\n📱 Number: +${userNumber}` 
        });
        
    } catch (error) {
        console.error('Error in unblock command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to unblock user: ${error.message}` 
        });
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
