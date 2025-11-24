// Store filter settings: { groupId: { enabled: true, words: Set(['word1', 'word2']), action: 'delete' } }
const filterSettings = new Map();

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

const filterHandler = async (sock, msg, args, context) => {
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
        
        const action = args[0]?.toLowerCase();
        
        // Handle "filter off"
        if (action === 'off') {
            if (!filterSettings.has(context.from)) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Word filter is already disabled' 
                }, { quoted: msg });
            }
            
            filterSettings.delete(context.from);
            return await sock.sendMessage(context.from, { 
                text: '✅ Word filter has been disabled' 
            }, { quoted: msg });
        }
        
        // Handle "filter on [words] delete"
        if (action === 'on') {
            if (args.length < 2) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Please provide words to filter\n\nUsage:\n• `.filter on word1 word2 delete` - Filter words and delete messages\n• `.filter off` - Disable filter\n• `.filter list` - Show filtered words' 
                }, { quoted: msg });
            }
            
            // Extract words and check for "delete" at the end
            const lastArg = args[args.length - 1].toLowerCase();
            const hasDeleteAction = lastArg === 'delete';
            
            // Get words (exclude "on" and optionally "delete")
            const wordsToFilter = hasDeleteAction 
                ? args.slice(1, -1) 
                : args.slice(1);
            
            if (wordsToFilter.length === 0) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Please provide at least one word to filter' 
                }, { quoted: msg });
            }
            
            // Get existing settings or create new
            let settings = filterSettings.get(context.from) || {
                enabled: true,
                words: new Set(),
                action: 'delete'
            };
            
            // Add new words (case-insensitive)
            wordsToFilter.forEach(word => {
                settings.words.add(word.toLowerCase());
            });
            
            settings.enabled = true;
            settings.action = hasDeleteAction ? 'delete' : 'delete'; // Default to delete
            
            filterSettings.set(context.from, settings);
            
            const wordList = Array.from(settings.words).join(', ');
            return await sock.sendMessage(context.from, { 
                text: `✅ Word filter enabled\n\n📝 Filtered words: ${wordList}\n🗑️ Action: Delete message\n\n⚠️ Admins are exempt from filter` 
            }, { quoted: msg });
        }
        
        // Handle "filter list"
        if (action === 'list') {
            const settings = filterSettings.get(context.from);
            
            if (!settings || !settings.enabled) {
                return await sock.sendMessage(context.from, { 
                    text: '📊 Word filter is currently disabled' 
                }, { quoted: msg });
            }
            
            const wordList = Array.from(settings.words).join(', ');
            return await sock.sendMessage(context.from, { 
                text: `📊 Word Filter Status: ON\n\n📝 Filtered words: ${wordList}\n🗑️ Action: ${settings.action}` 
            }, { quoted: msg });
        }
        
        // Show usage if no valid action
        return await sock.sendMessage(context.from, { 
            text: '📋 Word Filter Commands:\n\n• `.filter on word1 word2 delete` - Enable filter with words\n• `.filter off` - Disable filter\n• `.filter list` - Show filtered words\n\nExample:\n`.filter on badword fuck delete`' 
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in filter command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to process filter command' 
        }, { quoted: msg });
    }
};

const checkMessage = async (sock, msg, context) => {
    if (!context.isGroup) return;
    
    const settings = filterSettings.get(context.from);
    if (!settings?.enabled || !settings.words.size) return;
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        
        // Check if sender is admin
        const senderParticipant = groupMetadata.participants.find(p => {
            return participantMatches(p.id, context.sender, groupMetadata);
        });
        const isSenderAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
        
        // Admins are exempt
        if (isSenderAdmin) return;
        
        const messageText = msg.message?.conversation || 
                           msg.message?.extendedTextMessage?.text || '';
        
        if (!messageText) return;
        
        // Check if message contains any filtered words
        const lowerMessage = messageText.toLowerCase();
        const words = lowerMessage.split(/\s+/); // Split by whitespace
        
        let foundWord = null;
        for (const word of words) {
            if (settings.words.has(word)) {
                foundWord = word;
                break;
            }
        }
        
        // Also check if filtered words appear within the message (substring match)
        if (!foundWord) {
            for (const filteredWord of settings.words) {
                if (lowerMessage.includes(filteredWord)) {
                    foundWord = filteredWord;
                    break;
                }
            }
        }
        
        if (foundWord) {
            // Check if bot is admin (needed to delete messages)
            const botParticipant = groupMetadata.participants.find(p => {
                return participantMatches(p.id, sock.user.id, groupMetadata);
            });
            const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
            
            if (!isBotAdmin) {
                return await sock.sendMessage(context.from, { 
                    text: '⚠️ Filtered word detected but bot is not admin to delete message' 
                });
            }
            
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
                text: `⚠️ @${normalizeNumber(context.sender)}, your message was deleted for containing a filtered word!`,
                mentions: [context.sender]
            });
        }
        
    } catch (error) {
        console.error('Error in filter check:', error.message);
    }
};

module.exports = {
    command: 'filter',
    handler: filterHandler,
    checkMessage,
    filterSettings // Export for persistence if needed
};
