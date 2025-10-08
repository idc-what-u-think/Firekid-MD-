const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;
    
    const senderNumber = sender.split('@')[0].split(':')[0];
    const ownerNum = ownerNumber.replace(/[^0-9]/g, '');
    
    return senderNumber === ownerNum;
};

const mute = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This command is only for groups' 
        });
    }
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        
        const senderNumber = context.sender.split('@')[0].split(':')[0];
        const senderParticipant = groupMetadata.participants.find(p => {
            const pNum = p.id.split('@')[0].split(':')[0];
            return pNum === senderNumber;
        });
        const isAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
        
        const botNumber = sock.user.id.split(':')[0];
        const botParticipant = groupMetadata.participants.find(p => {
            const pNum = p.id.split('@')[0].split(':')[0];
            return pNum === botNumber;
        });
        const botAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        
        if (!isAdmin && !isOwner(context.sender)) {
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
        const muteMsg = `🔇 Group has been muted by @${senderNumber}\nTime: ${time}`;
        
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
