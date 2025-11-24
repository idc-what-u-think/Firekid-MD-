const leftMessageEnabled = new Set();

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

const leftHandler = async (sock, msg, args, context) => {
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
            if (!leftMessageEnabled.has(context.from)) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Left message is already disabled' 
                }, { quoted: msg });
            }
            
            leftMessageEnabled.delete(context.from);
            return await sock.sendMessage(context.from, { 
                text: '✅ Left message notification has been disabled' 
            }, { quoted: msg });
        }
        
        if (action === 'on') {
            if (leftMessageEnabled.has(context.from)) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Left message is already enabled' 
                }, { quoted: msg });
            }
            
            leftMessageEnabled.add(context.from);
            return await sock.sendMessage(context.from, { 
                text: '✅ Left message notification has been enabled\n\n👋 Members who leave will get a goodbye message' 
            }, { quoted: msg });
        }
        
        // Show current status if no valid action
        const isEnabled = leftMessageEnabled.has(context.from);
        return await sock.sendMessage(context.from, { 
            text: `📊 Left Message Status: ${isEnabled ? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n• \`.left on\` - Enable goodbye messages\n• \`.left off\` - Disable goodbye messages` 
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in left command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to toggle left message' 
        }, { quoted: msg });
    }
};

const handleLeft = async (sock, groupId, participants, action, actor) => {
    // Only send message if enabled for this group
    if (!leftMessageEnabled.has(groupId)) return;
    
    try {
        for (const participant of participants) {
            const participantNumber = normalizeNumber(participant);
            
            // Check if participant was removed by someone or left voluntarily
            if (action === 'remove' && actor) {
                const actorNumber = normalizeNumber(actor);
                const leftMsg = `👋 @${participantNumber} bites the dust. Removed by @${actorNumber}`;
                
                await sock.sendMessage(groupId, {
                    text: leftMsg,
                    mentions: [participant, actor]
                });
            } else {
                // Participant left on their own
                const leftMsg = `👋 @${participantNumber} left the group. Goodbye!`;
                
                await sock.sendMessage(groupId, {
                    text: leftMsg,
                    mentions: [participant]
                });
            }
        }
    } catch (error) {
        console.error('Error sending left message:', error.message);
    }
};

const isLeftEnabled = (groupId) => {
    return leftMessageEnabled.has(groupId);
};

module.exports = {
    command: 'left',
    handler: leftHandler,
    handleLeft,
    isLeftEnabled
};
