const tagall = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, {
            text: '❌ This command is only for groups'
        });
    }
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        const participant = groupMetadata.participants.find(p => p.id === context.sender);
        const isAdmin = participant?.admin;
        
        if (!isAdmin) {
            return await sock.sendMessage(context.from, {
                text: '❌ This command is only for admins'
            });
        }
        
        let message = args.join(' ') || 'No message';
        let mentionText = `${message}\n\n`;
        let mentions = [];
        
        for (let participant of groupMetadata.participants) {
            mentions.push(participant.id);
            mentionText += `- @${participant.id.split('@')[0]}\n`;
        }
        
        await sock.sendMessage(context.from, {
            text: mentionText,
            mentions: mentions
        });
        
    } catch (error) {
        console.error('Error in tagall command:', error);
        return await sock.sendMessage(context.from, {
            text: '❌ Failed to tag all members'
        });
    }
};

module.exports = {
    command: 'tagall',
    handler: tagall
};
