// Store antilink settings: { groupId: { enabled: true, mode: 'delete' | 'remove' } }
const antilinkSettings = new Map();

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
        
        // Parse command: antilink on delete | antilink on remove | antilink off
        const action = args[0]?.toLowerCase();
        const mode = args[1]?.toLowerCase();
        
        if (action === 'off') {
            antilinkSettings.delete(context.from);
            return await sock.sendMessage(context.from, { 
                text: '✅ Anti-link has been disabled for this group' 
            }, { quoted: msg });
        }
        
        if (action === 'on') {
            if (!mode || !['delete', 'remove'].includes(mode)) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Please specify a mode:\n\n• `.antilink on delete` - Delete link messages\n• `.antilink on remove` - Remove users who send links\n• `.antilink off` - Disable antilink' 
                }, { quoted: msg });
            }
            
            antilinkSettings.set(context.from, {
                enabled: true,
                mode: mode
            });
            
            const modeText = mode === 'delete' 
                ? '🗑️ Link messages will be deleted' 
                : '👋 Users who send links will be removed';
            
            return await sock.sendMessage(context.from, { 
                text: `✅ Anti-link enabled\n\n${modeText}\n\n⚠️ Admins are exempt from antilink` 
            }, { quoted: msg });
        }
        
        // Show status if no valid action
        const currentSettings = antilinkSettings.get(context.from);
        if (currentSettings?.enabled) {
            const statusText = currentSettings.mode === 'delete' 
                ? '🗑️ Mode: Delete messages' 
                : '👋 Mode: Remove users';
            return await sock.sendMessage(context.from, { 
                text: `📊 Antilink Status: ON\n${statusText}\n\nUse \`.antilink off\` to disable` 
            }, { quoted: msg });
        } else {
            return await sock.sendMessage(context.from, { 
                text: '📊 Antilink Status: OFF\n\nUse \`.antilink on delete\` or \`.antilink on remove\` to enable' 
            }, { quoted: msg });
        }
        
    } catch (error) {
        console.error('Error in antilink command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to process antilink: ${error.message}` 
        }, { quoted: msg });
    }
};

const detectAndHandleLink = async (sock, msg, context) => {
    if (!context.isGroup) return;
    
    const settings = antilinkSettings.get(context.from);
    if (!settings?.enabled) return;
    
    const messageText = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || '';
    
    // Detect various types of links
    const linkPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io|co|me|app|dev|xyz|info|tv|link)[^\s]*)/gi;
    
    if (linkPattern.test(messageText)) {
        try {
            const groupMetadata = await sock.groupMetadata(context.from);
            
            // Check if sender is admin
            const senderParticipant = groupMetadata.participants.find(p => {
                return participantMatches(p.id, context.sender, groupMetadata);
            });
            const isSenderAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
            
            // Admins are exempt
            if (isSenderAdmin) return;
            
            // Check if bot is admin (needed for both delete and remove)
            const botParticipant = groupMetadata.participants.find(p => {
                return participantMatches(p.id, sock.user.id, groupMetadata);
            });
            const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
            
            if (!isBotAdmin) {
                return await sock.sendMessage(context.from, { 
                    text: '⚠️ Link detected but bot is not admin to take action' 
                });
            }
            
            // Handle based on mode
            if (settings.mode === 'delete') {
                // Delete the message
                await sock.sendMessage(context.from, {
                    delete: {
                        remoteJid: context.from,
                        fromMe: false,
                        id: msg.key.id,
                        participant: context.sender
                    }
                });
                
                // Send warning
                await sock.sendMessage(context.from, { 
                    text: `⚠️ @${normalizeNumber(context.sender)}, links are not allowed in this group!`,
                    mentions: [context.sender]
                });
                
            } else if (settings.mode === 'remove') {
                // Remove the user
                await sock.sendMessage(context.from, { 
                    text: `🚫 @${normalizeNumber(context.sender)} sent a link and has been removed!`,
                    mentions: [context.sender]
                });
                
                await sock.groupParticipantsUpdate(context.from, [context.sender], 'remove');
            }
            
        } catch (error) {
            console.error('Error handling link:', error.message);
        }
    }
};

module.exports = {
    command: 'antilink',
    handler: antilinkHandler,
    detectAndHandleLink,
    antilinkSettings // Export for persistence if needed
};
