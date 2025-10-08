const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;
    
    const senderNumber = sender.split('@')[0].split(':')[0];
    const ownerNum = ownerNumber.replace(/[^0-9]/g, '');
    
    return senderNumber === ownerNum;
};

const unmute = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This command is only for groups' 
        }, { quoted: msg });
    }
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        
        const senderNumber = context.sender.split('@')[0].split(':')[0];
        const senderParticipant = groupMetadata.participants.find(p => {
            const pNum = p.id.split('@')[0].split(':')[0];
            return pNum === senderNumber;
        });
        const isSenderAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
        
        const botNumber = sock.user.id.split(':')[0];
        const botParticipant = groupMetadata.participants.find(p => {
            const pNum = p.id.split('@')[0].split(':')[0];
            return pNum === botNumber;
        });
        const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        
        if (!isBotAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Bot must be admin to unmute group' 
            }, { quoted: msg });
        }

        if (!isSenderAdmin && !isOwner(context.sender)) {
            return await sock.sendMessage(context.from, { 
                text: '❌ This command is only for admins' 
            }, { quoted: msg });
        }
        
        await sock.groupSettingUpdate(context.from, 'not_announcement');
        
        const time = new Date().toLocaleTimeString();
        const unmuteMsg = `🔊 Group has been unmuted by @${senderNumber}\nTime: ${time}`;
        
        await sock.sendMessage(context.from, {
            text: unmuteMsg,
            mentions: [context.sender]
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in unmute command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to unmute group: ${error.message}` 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'unmute',
    handler: unmute
};
