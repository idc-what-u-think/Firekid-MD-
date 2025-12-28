const tag = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, {
            text: '❌ This command is only for groups'
        });
    }
    
    const OWNER_ID = `${process.env.OWNER_NUMBER}@s.whatsapp.net`;
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const participant = groupMetadata.participants.find(p => p.id === context.sender);
        const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
        const isOwner = context.sender === OWNER_ID;
        
        if (!isAdmin && !isOwner) {
            return await sock.sendMessage(context.from, {
                text: '❌ Only group admins and the bot owner can use this command'
            });
        }
        
        const message = args.join(' ');
        
        if (!message) {
            return await sock.sendMessage(context.from, {
                text: '❌ Please provide a message to tag\n\nExample: tag Hello everyone!'
            });
        }
        
        const participants = groupMetadata.participants.map(p => p.id);
        
        await sock.sendMessage(context.from, {
            text: message,
            mentions: participants
        });
        
    } catch (error) {
        console.error('Error in tag command:', error);
        return await sock.sendMessage(context.from, {
            text: '❌ Failed to tag message'
        });
    }
};

module.exports = {
    command: 'tag',
    handler: tag
};
