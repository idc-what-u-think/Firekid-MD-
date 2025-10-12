const kill = async (sock, msg, args, context) => {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMsg) {
        return await sock.sendMessage(context.from, {
            text: '❌ Reply to a message to add wasted effect'
        }, { quoted: msg });
    }
    
    try {
        const wastedVideo = 'https://ik.imagekit.io/firekid/video_2025-09-08_19-55-03.mp4';
        
        const quotedKey = {
            remoteJid: context.from,
            fromMe: msg.message.extendedTextMessage.contextInfo.participant === sock.user.id,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant
        };
        
        await sock.sendMessage(context.from, {
            video: { url: wastedVideo },
            caption: '💀 WASTED 💀',
            gifPlayback: false
        }, { quoted: { key: quotedKey, message: quotedMsg } });
        
    } catch (error) {
        console.error('Error in kill command:', error.message);
        return await sock.sendMessage(context.from, {
            text: '❌ Failed to send wasted effect'
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'kill',
    handler: kill
};
