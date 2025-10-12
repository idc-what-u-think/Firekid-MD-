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

const participantMatches = (participantId, targetJid, groupMetadata) => {
    if (participantId === targetJid) {
        return true;
    }
    
    if (targetJid.includes('@s.whatsapp.net') && groupMetadata) {
        const targetNumber = normalizeNumber(targetJid);
        
        const matchingParticipant = groupMetadata.participants.find(p => {
            return normalizeNumber(p.jid || p.id) === targetNumber;
        });
        
        if (matchingParticipant && matchingParticipant.id === participantId) {
            return true;
        }
    }
    
    const participantNum = normalizeNumber(participantId);
    const targetNum = normalizeNumber(targetJid);
    
    return participantNum === targetNum;
};

const kick = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This command is only for groups' 
        }, { quoted: msg });
    }
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        
        const senderParticipant = groupMetadata.participants.find(p => {
            return participantMatches(p.id, context.sender, groupMetadata);
        });
        const isSenderAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
        
        const botParticipant = groupMetadata.participants.find(p => {
            return participantMatches(p.id, sock.user.id, groupMetadata);
        });
        const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        
        if (!isSenderAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ This command is only for admins' 
            }, { quoted: msg });
        }
        
        if (!isBotAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Bot must be admin to kick members' 
            }, { quoted: msg });
        }
        
        let users = [];
        
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (quotedMsg) {
            const targetUser = msg.message.extendedTextMessage.contextInfo.participant;
            users.push(targetUser);
        } else if (mentionedJid && mentionedJid.length > 0) {
            users = mentionedJid;
        } else if (args[0]) {
            let number = args[0].replace(/[^0-9]/g, '');
            if (!number.includes('@')) {
                number = number + '@s.whatsapp.net';
            }
            users.push(number);
        } else {
            return await sock.sendMessage(context.from, { 
                text: '❌ Reply to user\'s message, mention them, or provide their number' 
            }, { quoted: msg });
        }
        
        for (const user of users) {
            const userParticipant = groupMetadata.participants.find(p => {
                return participantMatches(p.id, user, groupMetadata);
            });
            const isUserAdmin = userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin');
            
            if (isUserAdmin) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Cannot kick admin users' 
                }, { quoted: msg });
            }
        }
        
        await sock.groupParticipantsUpdate(context.from, users, 'remove');
        
        return await sock.sendMessage(context.from, { 
            text: '✅ User has been kicked from the group' 
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in kick command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to kick user: ${error.message}` 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'kick',
    handler: kick
};
