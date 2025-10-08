const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;
    
    const senderNumber = sender.split('@')[0].split(':')[0];
    const ownerNum = ownerNumber.replace(/[^0-9]/g, '');
    
    return senderNumber === ownerNum;
};

const setGroupPP = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This command is only for groups' 
        });
    }
    
    try {
        const groupMetadata = await sock.groupMetadata(context.from);
        
        const senderNumber = context.sender.split('@')[0].split(':')[0];
        const senderParticipant = groupMetadata.participants.find(p => {
            const pNum = p.id.split('@')[0].split(':')[0];
            return pNum === senderNumber;
        });
        const isAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
        
        const botNumber = sock.user.id.split(':')[0];
        const botParticipant = groupMetadata.participants.find(p => {
            const pNum = p.id.split('@')[0].split(':')[0];
            return pNum === botNumber;
        });
        const botAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        
        if (!isAdmin && !isOwner(context.sender)) {
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
