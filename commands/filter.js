const filter = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This command is only for groups' 
        });
    }
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        const participant = groupMetadata.participants.find(p => p.id === context.sender);
        const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
        
        if (!isAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ This command is only for admins' 
            });
        }
        
        if (!args.length) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Provide words to filter, separated by spaces\n\nExample: ${context.prefix}filter badword1 badword2` 
            });
        }
        
        sock.filteredWords = sock.filteredWords || new Map();
        let groupFilters = sock.filteredWords.get(context.from) || new Set();
        
        args.forEach(word => groupFilters.add(word.toLowerCase()));
        sock.filteredWords.set(context.from, groupFilters);
        
        return await sock.sendMessage(context.from, { 
            text: `✅ Added ${args.length} word(s) to filter` 
        });
        
    } catch (error) {
        console.error('Error in filter command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to add filtered words' 
        });
    }
};

const checkMessage = async (sock, msg, context) => {
    if (!context.isGroup) return;
    
    const filters = sock.filteredWords?.get(context.from);
    if (!filters?.size) return;
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        const participant = groupMetadata.participants.find(p => p.id === context.sender);
        const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
        
        if (isAdmin) return;
        
        const messageText = msg.message.conversation || 
                           msg.message.extendedTextMessage?.text || '';
        
        const words = messageText.toLowerCase().split(' ');
        const hasFilteredWord = words.some(word => filters.has(word));
        
        if (hasFilteredWord) {
            await sock.sendMessage(context.from, { delete: msg.key });
            await sock.sendMessage(context.from, { 
                text: '⚠️ Message deleted for containing filtered word' 
            });
        }
        
    } catch (error) {
        console.error('Error in filter check:', error.message);
    }
};

module.exports = {
    command: 'filter',
    handler: filter,
    checkMessage
};
