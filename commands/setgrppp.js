const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

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
        }, { quoted: msg });
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
        
        if (!botAdmin) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Bot must be admin to change group picture' 
            }, { quoted: msg });
        }

        if (!isAdmin && !isOwner(context.sender)) {
            return await sock.sendMessage(context.from, { 
                text: '❌ This command is only for admins' 
            }, { quoted: msg });
        }
        
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quotedMsg?.imageMessage || quotedMsg?.stickerMessage;
        
        if (!imageMessage) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Reply to an image to set as group picture' 
            }, { quoted: msg });
        }
        
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        const imagePath = path.join(tmpDir, `group_profile_${Date.now()}.jpg`);
        fs.writeFileSync(imagePath, buffer);
        
        await sock.updateProfilePicture(context.from, { url: imagePath });
        
        fs.unlinkSync(imagePath);
        
        await sock.sendMessage(context.from, { 
            text: '✅ Group picture has been updated successfully!' 
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in setgrppp command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to update group picture: ${error.message}` 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'setgrppp',
    handler: setGroupPP
};
