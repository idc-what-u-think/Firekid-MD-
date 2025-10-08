const blockUser = async (sock, msg, args, context) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    const normalizedOwner = ownerNumber.includes('@') 
        ? ownerNumber 
        : `${ownerNumber}@s.whatsapp.net`;
    
    if (context.sender !== normalizedOwner) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can block users' 
        });
    }
    
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    
    if (!quotedMsg && !args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Reply to user's message or provide their number\n\nExample: ${context.prefix}block +2348012345678` 
        });
    }
    
    try {
        let userToBlock;
        
        if (quotedSender) {
            userToBlock = quotedSender;
        } else if (args[0]) {
            const number = args[0].replace(/[^0-9]/g, '');
            userToBlock = number + '@s.whatsapp.net';
        }
        
        if (userToBlock === normalizedOwner) {
            return await sock.sendMessage(context.from, { 
                text: '❌ You cannot block yourself' 
            });
        }
        
        await sock.updateBlockStatus(userToBlock, 'block');
        
        const phoneNum = userToBlock.replace('@s.whatsapp.net', '');
        return await sock.sendMessage(context.from, { 
            text: `✅ User blocked successfully\n📱 Number: +${phoneNum}` 
        });
        
    } catch (error) {
        console.error('Error in block command:', error);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to block user. Make sure the number is valid.' 
        });
    }
};

const unblockUser = async (sock, msg, args, context) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    const normalizedOwner = ownerNumber.includes('@') 
        ? ownerNumber 
        : `${ownerNumber}@s.whatsapp.net`;
    
    if (context.sender !== normalizedOwner) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can unblock users' 
        });
    }
    
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    
    if (!quotedMsg && !args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Reply to user's message or provide their number\n\nExample: ${context.prefix}unblock +2348012345678` 
        });
    }
    
    try {
        let userToUnblock;
        
        if (quotedSender) {
            userToUnblock = quotedSender;
        } else if (args[0]) {
            const number = args[0].replace(/[^0-9]/g, '');
            userToUnblock = number + '@s.whatsapp.net';
        }
        
        await sock.updateBlockStatus(userToUnblock, 'unblock');
        
        const phoneNum = userToUnblock.replace('@s.whatsapp.net', '');
        return await sock.sendMessage(context.from, { 
            text: `✅ User unblocked successfully\n📱 Number: +${phoneNum}` 
        });
        
    } catch (error) {
        console.error('Error in unblock command:', error);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to unblock user. Make sure the number is valid.' 
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
