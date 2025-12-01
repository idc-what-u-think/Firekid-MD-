const Jimp = require('jimp');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// Logo URLs - transparent PNGs
const LOGOS = {
    capcut: 'https://i.imgur.com/vr2KCLT.png',
    tiktok: 'https://i.imgur.com/pn255KI.jpg',
    ae: 'https://i.imgur.com/IUNy2l0.png',
    alight: 'https://i.imgur.com/3QX2b4O.jpg',
    am: 'https://i.imgur.com/3QX2b4O.jpg'
};

async function createEditorPFP(userImageBuffer, logoNames) {
    // Load base image
    const baseImage = await Jimp.read(userImageBuffer);
    await baseImage.resize(1000, 1000);

    // Logo positions
    const positions = [
        { x: 800, y: 800 },  // Bottom right
        { x: 0, y: 800 },    // Bottom left
        { x: 400, y: 0 },    // Top center
        { x: 800, y: 0 }     // Top right
    ];

    // Download and overlay logos
    for (let i = 0; i < logoNames.length && i < 4; i++) {
        try {
            const logoUrl = LOGOS[logoNames[i]];
            const logoResponse = await axios.get(logoUrl, { responseType: 'arraybuffer' });
            const logo = await Jimp.read(logoResponse.data);
            
            // Resize and set opacity
            await logo.resize(200, 200);
            await logo.opacity(0.7);
            
            // Composite logo on base image
            const pos = positions[i];
            await baseImage.composite(logo, pos.x, pos.y);
        } catch (logoError) {
            console.error(`Failed to load logo ${logoNames[i]}:`, logoError.message);
        }
    }

    return await baseImage.getBufferAsync(Jimp.MIME_PNG);
}

const editorpfp = async (sock, msg, args, context) => {
    try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quotedMsg?.imageMessage || quotedMsg?.stickerMessage;
        
        if (!imageMessage) {
            return await sock.sendMessage(context.from, {
                text: `EDITOR PFP

How to use:
Reply to an image with:
.editorpfp [app names]

Examples:
.editorpfp capcut tiktok
.editorpfp ae
.editorpfp capcut alight tiktok

Available Apps:
• capcut - CapCut logo
• tiktok - TikTok logo
• ae - After Effects logo
• alight/am - Alight Motion logo

Features:
• Combine up to 4 logos
• Transparent logo overlay
• 1000x1000 output size`
            }, { quoted: msg });
        }

        if (args.length === 0) {
            return await sock.sendMessage(context.from, {
                text: 'Please specify app names\n\nExample: .editorpfp capcut tiktok'
            }, { quoted: msg });
        }

        const genMsg = await sock.sendMessage(context.from, {
            text: 'Creating editor PFP...'
        }, { quoted: msg });

        // Parse requested logos
        const requestedLogos = args.map(arg => arg.toLowerCase());
        const validLogos = [];
        const invalidLogos = [];

        for (const logoName of requestedLogos) {
            if (LOGOS[logoName]) {
                validLogos.push(logoName);
            } else {
                invalidLogos.push(logoName);
            }
        }

        if (validLogos.length === 0) {
            await sock.sendMessage(context.from, {
                text: `No valid app names found\n\nAvailable: capcut, tiktok, ae, alight, am\n\nYou entered: ${requestedLogos.join(', ')}`
            }, { quoted: msg });
            
            await sock.sendMessage(context.from, { delete: genMsg.key });
            return;
        }

        if (validLogos.length > 4) {
            await sock.sendMessage(context.from, {
                text: 'Maximum 4 logos allowed. Using first 4...'
            }, { quoted: msg });
            validLogos.splice(4);
        }

        // Download user image
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Create editor PFP
        const pfpBuffer = await createEditorPFP(buffer, validLogos);

        // Send the PFP
        await sock.sendMessage(context.from, {
            image: pfpBuffer,
            caption: `EDITOR PFP CREATED

Logos added:
${validLogos.map(l => `• ${l.toUpperCase()}`).join('\n')}
${invalidLogos.length > 0 ? `\nIgnored: ${invalidLogos.join(', ')}` : ''}`
        }, { quoted: msg });

        await sock.sendMessage(context.from, { delete: genMsg.key });

    } catch (error) {
        console.error('Error in editorpfp command:', error);
        await sock.sendMessage(context.from, {
            text: `Failed to create editor PFP\n\n${error.message}\n\nMake sure you replied to an image`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'editorpfp',
    handler: editorpfp
};
