const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Zalgo characters for glitch effect
const zalgoUp = [
    '\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310',
    '\u0352', '\u0357', '\u0351', '\u0307', '\u0308', '\u030a', '\u0342', '\u0343',
    '\u0344', '\u034a', '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350',
    '\u0300', '\u0301', '\u030b', '\u030f', '\u0312', '\u0313', '\u0314', '\u033d',
    '\u0309', '\u0363', '\u0364', '\u0365', '\u0366', '\u0367', '\u0368', '\u0369',
    '\u036a', '\u036b', '\u036c', '\u036d', '\u036e', '\u036f', '\u033e', '\u035b',
    '\u0346', '\u031a'
];

const zalgoMid = [
    '\u0315', '\u031b', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322', '\u0327',
    '\u0328', '\u0334', '\u0335', '\u0336', '\u034f', '\u035c', '\u035d', '\u035e',
    '\u035f', '\u0360', '\u0362', '\u0338', '\u0337', '\u0361', '\u0489'
];

const zalgoDown = [
    '\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f',
    '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a', '\u032b', '\u032c',
    '\u032d', '\u032e', '\u032f', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339',
    '\u033a', '\u033b', '\u033c', '\u0345', '\u0347', '\u0348', '\u0349', '\u034d',
    '\u034e', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359', '\u035a', '\u0323'
];

// Generate zalgo glitch text
function generateZalgoText(text, intensity = 'medium') {
    let levels = { low: 5, medium: 10, high: 15, extreme: 25 };
    let maxMarks = levels[intensity] || 10;
    
    let result = '';
    
    for (let char of text) {
        result += char;
        
        let numMarks = Math.floor(Math.random() * maxMarks) + 1;
        
        for (let i = 0; i < numMarks; i++) {
            const position = Math.random();
            
            if (position < 0.33) {
                result += zalgoUp[Math.floor(Math.random() * zalgoUp.length)];
            } else if (position < 0.66) {
                result += zalgoMid[Math.floor(Math.random() * zalgoMid.length)];
            } else {
                result += zalgoDown[Math.floor(Math.random() * zalgoDown.length)];
            }
        }
    }
    
    return result;
}

// Create glitch text image with canvas
async function createGlitchImage(text1, text2) {
    const width = 1200;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add noise effect
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const opacity = Math.random() * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(x, y, 2, 2);
    }

    // Text settings
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // First text (top)
    const fontSize1 = 100;
    ctx.font = `bold ${fontSize1}px Arial`;
    
    // Glitch effect layers for text 1
    ctx.fillStyle = '#ff00ff';
    ctx.fillText(text1, width/2 - 4, height/2 - 80);
    
    ctx.fillStyle = '#00ffff';
    ctx.fillText(text1, width/2 + 4, height/2 - 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text1, width/2, height/2 - 80);

    // Second text (bottom)
    if (text2) {
        const fontSize2 = 100;
        ctx.font = `bold ${fontSize2}px Arial`;
        
        ctx.fillStyle = '#ff00ff';
        ctx.fillText(text2, width/2 - 4, height/2 + 80);
        
        ctx.fillStyle = '#00ffff';
        ctx.fillText(text2, width/2 + 4, height/2 + 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text2, width/2, height/2 + 80);
    }

    // Scan lines effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < height; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }

    return canvas.toBuffer('image/png');
}

const glitchtext = async (sock, msg, args, context) => {
    try {
        if (args.length === 0) {
            return await sock.sendMessage(context.from, {
                text: `╭━━━『 *GLITCH TEXT* 』━━━╮
│
│ ⚠️ *Usage:*
│ .glitchtext [text]
│ .glitchtext [text1], [text2]
│
│ 📝 *Examples:*
│ .glitchtext Firekid XMD
│ .glitchtext Firekid, XMD
│ .glitchtext Hello World
│
│ 🎨 *Features:*
│ • Zalgo text effect
│ • Glitch image with RGB split
│ • Cyberpunk aesthetic
│
╰━━━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: msg });
        }

        const genMsg = await sock.sendMessage(context.from, {
            text: '⚡ *Generating glitch text...*'
        }, { quoted: msg });

        const fullText = args.join(' ');
        let text1, text2;

        // Check if comma separated
        if (fullText.includes(',')) {
            const parts = fullText.split(',');
            text1 = parts[0].trim();
            text2 = parts[1]?.trim() || '';
        } else {
            text1 = fullText;
            text2 = '';
        }

        // Generate zalgo text
        const zalgoText1 = generateZalgoText(text1, 'high');
        const zalgoText2 = text2 ? generateZalgoText(text2, 'high') : '';

        // Create glitch image
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const imageBuffer = await createGlitchImage(text1, text2);

        // Send zalgo text
        const zalgoMessage = text2 
            ? `${zalgoText1}\n${zalgoText2}`
            : zalgoText1;

        await sock.sendMessage(context.from, {
            text: `╭━━━『 *GLITCH TEXT* 』━━━╮
│
${zalgoMessage}
│
╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: msg });

        // Send glitch image
        await sock.sendMessage(context.from, {
            image: imageBuffer
        }, { quoted: msg });

        await sock.sendMessage(context.from, {
            delete: genMsg.key
        });

    } catch (error) {
        console.error('Error in glitchtext command:', error);
        await sock.sendMessage(context.from, {
            text: `❌ *Failed to generate glitch text*\n\n${error.message}`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'glitchtext',
    handler: glitchtext
};
