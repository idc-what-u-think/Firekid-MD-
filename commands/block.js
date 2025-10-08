const blockUser = async (sock, msg, args, context) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    
    if (!ownerNumber) {
        return await sock.sendMessage(context.from, { 
            text: '❌ OWNER_NUMBER not configured' 
        });
    }
    
    const normalizedOwner = ownerNumber.includes('@') 
        ? ownerNumber 
        : `${ownerNumber}@s.whatsapp.net`;
    
    console.log('Sender:', context.sender);
    console.log('Owner:', normalizedOwner);
    
    if (context.sender !== normalizedOwner) {
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
            userToBlock = quotedSender;
        } else if (args[0]) {
            let number = args[0].replace(/[^0-9]/g, '');
            if (!number.includes('@')) {
                userToBlock = number + '@s.whatsapp.net';
            } else {
                userToBlock = number;
            }
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
        console.error('Error in block command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to block user: ${error.message}` 
        });
    }
};

const unblockUser = async (sock, msg, args, context) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    
    if (!ownerNumber) {
        return await sock.sendMessage(context.from, { 
            text: '❌ OWNER_NUMBER not configured' 
        });
    }
    
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
            text: `❌ Reply to user's message or provide their number\n\nExample: ${context.prefix}unblock 2348012345678` 
        });
    }
    
    try {
        let userToUnblock;
        
        if (quotedSender) {
            userToUnblock = quotedSender;
        } else if (args[0]) {
            let number = args[0].replace(/[^0-9]/g, '');
            if (!number.includes('@')) {
                userToUnblock = number + '@s.whatsapp.net';
            } else {
                userToUnblock = number;
            }
        }
        
        await sock.updateBlockStatus(userToUnblock, 'unblock');
        
        const phoneNum = userToUnblock.replace('@s.whatsapp.net', '');
        return await sock.sendMessage(context.from, { 
            text: `✅ User unblocked successfully\n📱 Number: +${phoneNum}` 
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
