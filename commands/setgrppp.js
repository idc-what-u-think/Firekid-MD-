const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const setGroupPP = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This command is only for groups' 
        });
    }
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        
        const senderParticipant = groupMetadata.participants.find(p => p.id === context.sender);
        const isAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
        
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = groupMetadata.participants.find(p => p.id === botId);
        const botAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        
        console.log('Sender:', context.sender, 'IsAdmin:', isAdmin);
        console.log('Bot ID:', botId, 'IsBotAdmin:', botAdmin);
        
        if (!isAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ This command is only for admins' 
            });
        }
        
        if (!botAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Bot must be admin to change group picture' 
            });
        }
        
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quotedMsg?.imageMessage;
        
        if (!imageMessage) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Reply to an image to set as group picture' 
            });
        }
        
        const buffer = await downloadMediaMessage(
            { message: quotedMsg },
            'buffer',
            {},
            { 
                logger: { info() {}, error() {}, warn() {}, trace() {}, debug() {} },
                reuploadRequest: sock.updateMediaMessage
            }
        );
        
        await sock.updateProfilePicture(context.from, buffer);
        
        await sock.sendMessage(context.from, { 
            text: '✅ Group picture has been updated' 
        });
        
    } catch (error) {
        console.error('Error in setgrppp command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to update group picture: ${error.message}` 
        });
    }
};

module.exports = {
    command: 'setgrppp',
    handler: setGroupPP
};
