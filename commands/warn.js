const userWarnings = new Map();

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

const warn = async (sock, msg, args, context) => {
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
        
        if (!isSenderAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ This command is only for admins' 
            }, { quoted: msg });
        }
        
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        let targetUser = null;
        
        if (quotedMsg) {
            targetUser = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (mentionedJid && mentionedJid.length > 0) {
            targetUser = mentionedJid[0];
        }
        
        if (!targetUser) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Reply to a message or mention a user to warn them' 
            }, { quoted: msg });
        }
        
        const targetParticipant = groupMetadata.participants.find(p => {
            return participantMatches(p.id, targetUser, groupMetadata);
        });
        const isTargetAdmin = targetParticipant && (targetParticipant.admin === 'admin' || targetParticipant.admin === 'superadmin');
        
        if (isTargetAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Cannot warn group admins' 
            }, { quoted: msg });
        }
        
        const reason = args.join(' ') || 'No reason provided';
        
        const groupWarnings = userWarnings.get(context.from) || new Map();
        const currentWarnings = groupWarnings.get(targetUser) || 0;
        const newWarnings = currentWarnings + 1;
        
        groupWarnings.set(targetUser, newWarnings);
        userWarnings.set(context.from, groupWarnings);
        
        const targetNumber = normalizeNumber(targetUser);
        const userMention = `@${targetNumber}`;
        
        if (newWarnings >= 3) {
            const botParticipant = groupMetadata.participants.find(p => {
                return participantMatches(p.id, sock.user.id, groupMetadata);
            });
            const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
            
            if (isBotAdmin) {
                try {
                    await sock.groupParticipantsUpdate(context.from, [targetUser], 'remove');
                    groupWarnings.delete(targetUser);
                    
                    return await sock.sendMessage(context.from, {
                        text: `🚨 ${userMention} has been kicked for reaching 3 warnings!\n\nLast warning reason: ${reason}`,
                        mentions: [targetUser]
                    }, { quoted: msg });
                } catch (kickError) {
                    return await sock.sendMessage(context.from, {
                        text: `⚠️ ${userMention} received warning ${newWarnings}/3\n\nReason: ${reason}\n❌ Failed to kick user: ${kickError.message}`,
                        mentions: [targetUser]
                    }, { quoted: msg });
                }
            } else {
                return await sock.sendMessage(context.from, {
                    text: `🚨 ${userMention} has reached 3 warnings!\n\nReason: ${reason}\n❌ Cannot kick (bot needs admin privileges)`,
                    mentions: [targetUser]
                }, { quoted: msg });
            }
        } else {
            return await sock.sendMessage(context.from, {
                text: `⚠️ ${userMention} received warning ${newWarnings}/3\n\nReason: ${reason}`,
                mentions: [targetUser]
            }, { quoted: msg });
        }
        
    } catch (error) {
        console.error('Error in warn command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to warn user: ${error.message}` 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'warn',
    handler: warn
};
