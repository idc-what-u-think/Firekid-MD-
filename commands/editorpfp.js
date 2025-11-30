const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');

// Logo URLs (transparent PNGs)
const LOGOS = {
    capcut: 'https://i.imgur.com/vr2KCLT.png',
    tiktok: 'https://i.imgur.com/pn255KI.jpg',
    ae: 'https://i.imgur.com/IUNy2l0.png',
    alight: 'https://i.imgur.com/3QX2b4O.jpg',
    am: 'https://i.imgur.com/3QX2b4O.jpg' 

// Download logo from URL
async function downloadLogo(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        return null;
    }
}

// Create editor PFP
async function createEditorPFP(imagePath, logos) {
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext('2d');

    // Load user image
    const userImage = await loadImage(imagePath);
    
    // Draw user image (centered and scaled to fit)
    const size = 1000;
    ctx.drawImage(userImage, 0, 0, size, size);

    // Calculate logo positions based on number of logos
    const logoSize = 200;
    const positions = [];
    
    if (logos.length === 1) {
        positions.push({ x: size - logoSize - 50, y: size - logoSize - 50 });
    } else if (logos.length === 2) {
        positions.push({ x: size - logoSize - 50, y: size - logoSize - 50 });
        positions.push({ x: 50, y: size - logoSize - 50 });
    } else if (logos.length === 3) {
        positions.push({ x: size - logoSize - 50, y: size - logoSize - 50 });
        positions.push({ x: 50, y: size - logoSize - 50 });
        positions.push({ x: size / 2 - logoSize / 2, y: 50 });
    } else if (logos.length === 4) {
        positions.push({ x: size - logoSize - 50, y: size - logoSize - 50 });
        positions.push({ x: 50, y: size - logoSize - 50 });
        positions.push({ x: size - logoSize - 50, y: 50 });
        positions.push({ x: 50, y: 50 });
    }

    // Draw logos with slight transparency
    ctx.globalAlpha = 0.7;
    
    for (let i = 0; i < logos.length && i < positions.length; i++) {
        try {
            const logo = await loadImage(logos[i]);
            const pos = positions[i];
            ctx.drawImage(logo, pos.x, pos.y, logoSize, logoSize);
        } catch (error) {
            console.error('Error loading logo:', error.message);
        }
    }

    ctx.globalAlpha = 1.0;

    return canvas.toBuffer('image/png');
}

const editorpfp = async (sock, msg, args, context) => {
    try {
        // Check if message is a reply to an image
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quotedMsg?.imageMessage || quotedMsg?.stickerMessage;
        
        if (!imageMessage) {
            return await sock.sendMessage(context.from, {
                text: `╭━━━『 *EDITOR PFP* 』━━━╮
│
│ ⚠️ *How to use:*
│ Reply to an image with:
│ .editorpfp [app names]
│
│ 📝 *Examples:*
│ .editorpfp capcut tiktok
│ .editorpfp ae tiktok
│ .editorpfp capcut alight
│ .editorpfp capcut ae tiktok
│
│ 📱 *Available Apps:*
│ • capcut - CapCut logo
│ • tiktok - TikTok logo
│ • ae - After Effects logo
│ • alight/am - Alight Motion logo
│
│ 🎨 *Features:*
│ • Combine up to 4 logos
│ • Transparent logo overlay
│ • Perfect for editor profiles
│
╰━━━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: msg });
        }

        if (args.length === 0) {
            return await sock.sendMessage(context.from, {
                text: '❌ *Please specify app names!*\n\nExample: .editorpfp capcut tiktok'
            }, { quoted: msg });
        }

        const genMsg = await sock.sendMessage(context.from, {
            text: '🎨 *Creating editor PFP...*\n⏳ Please wait...'
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
                text: `❌ *No valid app names!*\n\nAvailable: capcut, tiktok, ae, alight/am\n\nYou entered: ${requestedLogos.join(', ')}`
            }, { quoted: msg });
            
            await sock.sendMessage(context.from, {
                delete: genMsg.key
            });
            return;
        }

        if (validLogos.length > 4) {
            await sock.sendMessage(context.from, {
                text: '⚠️ *Maximum 4 logos allowed!*\n\nUsing first 4...'
            }, { quoted: msg });
            validLogos.splice(4);
        }

        // Create tmp directory
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Download user image
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        const inputImagePath = path.join(tmpDir, `editorpfp_input_${Date.now()}.jpg`);
        fs.writeFileSync(inputImagePath, buffer);

        // Download logos
        const logoBuffers = [];
        for (const logoName of validLogos) {
            const logoBuffer = await downloadLogo(LOGOS[logoName]);
            if (logoBuffer) {
                const logoPath = path.join(tmpDir, `logo_${logoName}_${Date.now()}.png`);
                fs.writeFileSync(logoPath, logoBuffer);
                logoBuffers.push(logoPath);
            }
        }

        if (logoBuffers.length === 0) {
            await sock.sendMessage(context.from, {
                text: '❌ *Failed to download logos!*\n\nPlease check logo URLs in code.'
            }, { quoted: msg });
            
            fs.unlinkSync(inputImagePath);
            
            await sock.sendMessage(context.from, {
                delete: genMsg.key
            });
            return;
        }

        // Create editor PFP
        const pfpBuffer = await createEditorPFP(inputImagePath, logoBuffers);

        // Send the PFP
        await sock.sendMessage(context.from, {
            image: pfpBuffer,
            caption: `╭━━━『 *EDITOR PFP* 』━━━╮
│
│ ✅ Created with:
│ ${validLogos.map(l => `• ${l.toUpperCase()}`).join('\n│ ')}
│
${invalidLogos.length > 0 ? `│ ⚠️ Ignored: ${invalidLogos.join(', ')}\n│\n` : ''}│ 🎨 Perfect for editor profiles!
│
╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: msg });

        // Clean up
        fs.unlinkSync(inputImagePath);
        logoBuffers.forEach(logoPath => {
            if (fs.existsSync(logoPath)) {
                fs.unlinkSync(logoPath);
            }
        });

        await sock.sendMessage(context.from, {
            delete: genMsg.key
        });

    } catch (error) {
        console.error('Error in editorpfp command:', error);
        await sock.sendMessage(context.from, {
            text: `❌ *Failed to create editor PFP*\n\n${error.message}\n\nMake sure you replied to an image!`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'editorpfp',
    handler: editorpfp
};
