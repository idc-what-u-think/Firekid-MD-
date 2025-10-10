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
    
    console.log(`Owner check - Sender: ${senderNum}, Owner: ${ownerNum}, Match: ${senderNum === ownerNum}`);
    
    return senderNum === ownerNum;
};

const participantMatches = (participantId, targetJid) => {
    // First, try exact match
    if (participantId === targetJid) {
        return true;
    }
    
    // Always compare normalized numbers as fallback
    const participantNum = normalizeNumber(participantId);
    const targetNum = normalizeNumber(targetJid);
    
    return participantNum === targetNum;
};

const mute = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This command is only for groups' 
        }, { quoted: msg });
    }
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        
        console.log(`Debug - Raw sender JID: ${context.sender}`);
        console.log(`Debug - Raw bot JID: ${sock.user.id}`);
        console.log(`Debug - All participants:`, groupMetadata.participants.map(p => ({id: p.id, admin: p.admin})));
        
        const senderParticipant = groupMetadata.participants.find(p => {
            return participantMatches(p.id, context.sender);
        });
        const isSenderAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
        
        const botParticipant = groupMetadata.participants.find(p => {
            return participantMatches(p.id, sock.user.id);
        });
        const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        
        console.log(`Debug - Is Bot Admin: ${isBotAdmin}, Bot Participant:`, botParticipant);
        console.log(`Debug - Is Sender Admin: ${isSenderAdmin}, Sender Participant:`, senderParticipant);
        
        if (!isBotAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Bot must be admin to mute group' 
            }, { quoted: msg });
        }

        if (!isSenderAdmin && !isOwner(context.sender)) {
            return await sock.sendMessage(context.from, { 
                text: '❌ This command is only for admins' 
            }, { quoted: msg });
        }
        
        const durationInMinutes = args[0] ? parseInt(args[0]) : undefined;
        
        await sock.groupSettingUpdate(context.from, 'announcement');
        
        const senderNumber = normalizeNumber(context.sender);
        
        if (durationInMinutes !== undefined && durationInMinutes > 0 && !isNaN(durationInMinutes)) {
            const durationInMilliseconds = durationInMinutes * 60 * 1000;
            const time = new Date().toLocaleTimeString();
            const muteMsg = `🔇 Group has been muted by @${senderNumber} for ${durationInMinutes} minutes\nTime: ${time}`;
            
            await sock.sendMessage(context.from, {
                text: muteMsg,
                mentions: [context.sender]
            }, { quoted: msg });
            
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(context.from, 'not_announcement');
                    await sock.sendMessage(context.from, { 
                        text: '🔊 The group has been unmuted automatically.' 
                    });
                } catch (unmuteError) {
                    console.error('Error unmuting group:', unmuteError);
                }
            }, durationInMilliseconds);
        } else {
            const time = new Date().toLocaleTimeString();
            const muteMsg = `🔇 Group has been muted by @${senderNumber}\nTime: ${time}`;
            
            await sock.sendMessage(context.from, {
                text: muteMsg,
                mentions: [context.sender]
            }, { quoted: msg });
        }
        
    } catch (error) {
        console.error('Error in mute command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to mute group: ${error.message}` 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'mute',
    handler: mute
};
