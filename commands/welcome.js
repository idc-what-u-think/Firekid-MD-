const joinMessageEnabled = new Set();

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

const welcomeHandler = async (sock, msg, args, context) => {
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
        
        // Check if there's an argument (on/off)
        const action = args[0]?.toLowerCase();
        
        if (action === 'off') {
            if (!joinMessageEnabled.has(context.from)) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Welcome message is already disabled' 
                }, { quoted: msg });
            }
            
            joinMessageEnabled.delete(context.from);
            return await sock.sendMessage(context.from, { 
                text: '✅ Welcome message notification has been disabled' 
            }, { quoted: msg });
        }
        
        if (action === 'on') {
            if (joinMessageEnabled.has(context.from)) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Welcome message is already enabled' 
                }, { quoted: msg });
            }
            
            joinMessageEnabled.add(context.from);
            return await sock.sendMessage(context.from, { 
                text: '✅ Welcome message notification has been enabled\n\n👋 New members will receive a welcome message' 
            }, { quoted: msg });
        }
        
        // Show current status if no valid action
        const isEnabled = joinMessageEnabled.has(context.from);
        return await sock.sendMessage(context.from, { 
            text: `📊 Welcome Message Status: ${isEnabled ? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n• \`.welcome on\` - Enable welcome messages\n• \`.welcome off\` - Disable welcome messages` 
        }, { quoted: msg });
        
    } catch (error) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to toggle welcome message' 
        }, { quoted: msg });
    }
};

const handleJoin = async (sock, groupId, participants) => {
    // Only send message if enabled for this group
    if (!joinMessageEnabled.has(groupId)) return;
    
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        
        for (const participant of participants) {
            const participantNumber = normalizeNumber(participant);
            const welcomeMsg = `Welcome @${participantNumber} to ${groupMetadata.subject}\nEnjoy`;
            
            await sock.sendMessage(groupId, {
                text: welcomeMsg,
                mentions: [participant]
            });
        }
    } catch (error) {
        // Silent error handling
    }
};

const isJoinEnabled = (groupId) => {
    return joinMessageEnabled.has(groupId);
};

module.exports = {
    command: 'welcome',
    handler: welcomeHandler,
    handleJoin,
    isJoinEnabled
};
