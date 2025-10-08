const blockUser = async (sock, msg, args, context) => {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    
    if (!quotedSender && !args[0]) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Reply to user\'s message or provide their number' 
        });
    }
    
    try {
        let userToBlock = quotedSender || args[0];
        
        if (!userToBlock.includes('@s.whatsapp.net')) {
            userToBlock = userToBlock.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }
        
        await sock.updateBlockStatus(userToBlock, 'block');
        return await sock.sendMessage(context.from, { 
            text: '✅ User has been blocked' 
        });
    } catch (error) {
        console.error('Error in block command:', error);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to block user' 
        });
    }
};

const unblockUser = async (sock, msg, args, context) => {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    
    if (!quotedSender && !args[0]) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Reply to user\'s message or provide their number' 
        });
    }
    
    try {
        let userToUnblock = quotedSender || args[0];
        
        if (!userToUnblock.includes('@s.whatsapp.net')) {
            userToUnblock = userToUnblock.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }
        
        await sock.updateBlockStatus(userToUnblock, 'unblock');
        return await sock.sendMessage(context.from, { 
            text: '✅ User has been unblocked' 
        });
    } catch (error) {
        console.error('Error in unlock command:', error);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to unblock user' 
        });
    }
};

module.exports = {
    block: {
        command: 'block',
        handler: blockUser
    },
    unlock: {
        command: 'unlock',
        handler: unblockUser
    }
};
