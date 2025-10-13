const linkEnabledGroups = new Set();

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

const antilinkHandler = async (sock, msg, args, context) => {
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
        
        if (linkEnabledGroups.has(context.from)) {
            linkEnabledGroups.delete(context.from);
            return await sock.sendMessage(context.from, { 
                text: '✅ Anti-link has been disabled for this group' 
            }, { quoted: msg });
        } else {
            linkEnabledGroups.add(context.from);
            return await sock.sendMessage(context.from, { 
                text: '✅ Anti-link has been enabled for this group\n\n⚠️ Non-admins will be kicked for sending links' 
            }, { quoted: msg });
        }
        
    } catch (error) {
        console.error('Error in antilink command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to toggle antilink: ${error.message}` 
        }, { quoted: msg });
    }
};

const detectAndHandleLink = async (sock, msg, context) => {
    if (!context.isGroup || !linkEnabledGroups.has(context.from)) return;
    
    const messageText = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || '';
    
    const linkPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io|co|me|app|dev|xyz|info)[^\s]*)/gi;
    
    if (linkPattern.test(messageText)) {
        try {
            const groupMetadata = await sock.groupMetadata(context.from);
            
            const senderParticipant = groupMetadata.participants.find(p => {
                return participantMatches(p.id, context.sender, groupMetadata);
            });
            const isSenderAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
            
            if (isSenderAdmin) return;
            
            const botParticipant = groupMetadata.participants.find(p => {
                return participantMatches(p.id, sock.user.id, groupMetadata);
            });
            const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
            
            if (!isBotAdmin) {
                return await sock.sendMessage(context.from, { 
                    text: '⚠️ Link detected but bot is not admin to remove user' 
                });
            }
            
            await sock.sendMessage(context.from, { 
                text: `🚫 @${normalizeNumber(context.sender)} sent a link and has been removed!`,
                mentions: [context.sender]
            });
            
            await sock.groupParticipantsUpdate(context.from, [context.sender], 'remove');
            
        } catch (error) {
            console.error('Error handling link:', error.message);
        }
    }
};

module.exports = {
    command: 'antilnk',
    handler: antilinkHandler,
    detectAndHandleLink
};
