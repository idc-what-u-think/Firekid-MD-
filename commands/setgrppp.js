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
        
        const botFullId = sock.user.id;
        const botNumber = sock.user.id.split(':')[0];
        
        console.log('DEBUG - Bot Full ID:', botFullId);
        console.log('DEBUG - Bot Number:', botNumber);
        console.log('DEBUG - All Participants:');
        groupMetadata.participants.forEach(p => {
            console.log(`  - ID: ${p.id}, Admin: ${p.admin || 'none'}`);
        });
        
        const senderNumber = context.sender.split('@')[0].split(':')[0];
        const senderParticipant = groupMetadata.participants.find(p => {
            const pNum = p.id.split('@')[0].split(':')[0];
            return pNum === senderNumber;
        });
        const isAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
        
        const botParticipant = groupMetadata.participants.find(p => {
            const pId = p.id;
            return pId.includes(botNumber) || pId === `${botNumber}@s.whatsapp.net`;
        });
        const botAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        
        console.log('DEBUG - Sender:', senderNumber, 'IsAdmin:', isAdmin);
        console.log('DEBUG - Bot Participant Found:', botParticipant ? botParticipant.id : 'NOT FOUND');
        console.log('DEBUG - Bot IsAdmin:', botAdmin);
        
        if (!isAdmin && !isOwner(context.sender)) {
            return await sock.sendMessage(context.from, { 
                text: '❌ This command is only for admins' 
            });
        }
        
        if (!botParticipant) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Bot not found in group participants!\n\n🤖 Bot ID: ${botFullId}\n📝 Looking for: ${botNumber}@s.whatsapp.net\n\nPlease make sure the bot is actually in this group.` 
            });
        }
        
        if (!botAdmin) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Bot must be admin to change group picture\n\n🤖 Bot: ${botParticipant.id}\n⚠️ Bot Status: ${botParticipant.admin || 'Member (not admin)'}\n\nPlease promote the bot to admin!` 
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
