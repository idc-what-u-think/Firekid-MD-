const kill = async (sock, msg, args, context) => {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMsg) {
        return await sock.sendMessage(context.from, {
            text: '❌ Reply to a message to add wasted effect'
        });
    }
    
    try {
        const wastedVideo = 'https://ik.imagekit.io/firekid/video_2025-09-08_19-55-03.mp4';
        
        await sock.sendMessage(context.from, {
            video: { url: wastedVideo },
            caption: '💀 WASTED 💀',
            gifPlayback: true
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in kill command:', error);
        return await sock.sendMessage(context.from, {
            text: '❌ Failed to send wasted effect'
        });
    }
};

module.exports = {
    command: 'kill',
    handler: kill
};
