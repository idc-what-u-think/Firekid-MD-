const mute = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This command is only for groups' 
        });
    }
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        
        const senderParticipant = groupMetadata.participants.find(p => p.id === context.sender);
        const isAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
        
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = groupMetadata.participants.find(p => p.id === botId);
        const botAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        
        console.log('Sender:', context.sender, 'IsAdmin:', isAdmin);
        console.log('Bot ID:', botId, 'IsBotAdmin:', botAdmin);
        
        if (!isAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ This command is only for admins' 
            });
        }
        
        if (!botAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Bot must be admin to mute group' 
            });
        }
        
        await sock.groupSettingUpdate(context.from, 'announcement');
        
        const time = new Date().toLocaleTimeString();
        const muteMsg = `🔇 Group has been muted by @${context.sender.split('@')[0]}\nTime: ${time}`;
        
        await sock.sendMessage(context.from, {
            text: muteMsg,
            mentions: [context.sender]
        });
        
    } catch (error) {
        console.error('Error in mute command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to mute group: ${error.message}` 
        });
    }
};

module.exports = {
    command: 'mute',
    handler: mute
};
