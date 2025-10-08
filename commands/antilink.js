let antilinkSettings = new Map();

const isAdmin = async (sock, groupId, userId) => {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participant = groupMetadata.participants.find(p => p.id === userId);
        return participant?.admin ? true : false;
    } catch {
        return false;
    }
};

const isBotAdmin = async (sock, groupId) => {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = groupMetadata.participants.find(p => p.id === botId);
        return botParticipant?.admin ? true : false;
    } catch {
        return false;
    }
};

const antilink = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This command is only for groups' 
        });
    }
    
    if (!(await isAdmin(sock, context.from, context.sender))) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This command is only for admins' 
        });
    }
    
    try {
        const action = args[0]?.toLowerCase();
        const mode = args[1]?.toLowerCase();
        
        if (!action || !['on', 'off'].includes(action)) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Usage: 
*antilnk on* (kick/delete) - Enable antilink
*antilnk off* - Disable antilink

Current modes:
• *kick* - Kick user after 3 warnings
• *delete* - Delete message and warn user` 
            });
        }
        
        if (action === 'on' && !['kick', 'delete'].includes(mode)) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Please specify action: *kick* or *delete*' 
            });
        }
        
        if (action === 'on') {
            if (mode === 'kick' && !(await isBotAdmin(sock, context.from))) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Bot needs admin privileges to kick members' 
                });
            }
            
            antilinkSettings.set(context.from, mode);
            return await sock.sendMessage(context.from, { 
                text: `✅ Antilink enabled with *${mode}* action\n\n💡 Tip: Use *allowdomain* command to whitelist trusted domains` 
            });
        } else {
            antilinkSettings.delete(context.from);
            return await sock.sendMessage(context.from, { 
                text: '✅ Antilink disabled' 
            });
        }
    } catch (error) {
        console.error('Error in antilink command:', error);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to update antilink settings' 
        });
    }
};

module.exports = {
    command: 'antilnk',
    handler: antilink
};
