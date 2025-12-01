const Jimp = require('jimp');

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

function generateZalgoText(text, intensity = 'medium') {
    const levels = { low: 5, medium: 10, high: 15, extreme: 25 };
    const maxMarks = levels[intensity] || 10;
    
    let result = '';
    
    for (let char of text) {
        result += char;
        
        const numMarks = Math.floor(Math.random() * maxMarks) + 1;
        
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

async function createGlitchImage(text1, text2) {
    try {
        const width = 1200;
        const height = 600;
        
        // Create base image with dark gradient background
        const image = await new Jimp(width, height, 0x0f0f23ff);
        
        // Create gradient effect
        await image.scan(0, 0, width, height, function(x, y, idx) {
            const gradientFactor = y / height;
            const r = Math.floor(15 + gradientFactor * (26 - 15));
            const g = Math.floor(15 + gradientFactor * (26 - 15));
            const b = Math.floor(35 + gradientFactor * (46 - 35));
            
            this.bitmap.data[idx] = r;
            this.bitmap.data[idx + 1] = g;
            this.bitmap.data[idx + 2] = b;
            this.bitmap.data[idx + 3] = 255;
        });
        
        // Add heavy noise/static effect for glitch look
        await image.scan(0, 0, width, height, function(x, y, idx) {
            if (Math.random() > 0.92) {
                const brightness = Math.floor(Math.random() * 150);
                this.bitmap.data[idx] = brightness;
                this.bitmap.data[idx + 1] = brightness;
                this.bitmap.data[idx + 2] = brightness;
            }
        });
        
        // Add random glitch bars
        for (let i = 0; i < 20; i++) {
            const barY = Math.floor(Math.random() * height);
            const barHeight = Math.floor(Math.random() * 5) + 1;
            const barColor = Math.random() > 0.5 ? 0xff00ffff : 0x00ffffff;
            
            await image.scan(0, barY, width, barHeight, function(x, y, idx) {
                const r = (barColor >> 24) & 0xff;
                const g = (barColor >> 16) & 0xff;
                const b = (barColor >> 8) & 0xff;
                
                this.bitmap.data[idx] = r;
                this.bitmap.data[idx + 1] = g;
                this.bitmap.data[idx + 2] = b;
                this.bitmap.data[idx + 3] = Math.floor(Math.random() * 100) + 50;
            });
        }
        
        // Load fonts
        const font128 = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
        const font64 = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
        
        // Create RGB split glitch effect for text
        const offsetX = 6;
        
        // Print text with chromatic aberration effect
        if (text1) {
            const y1 = text2 ? height / 2 - 80 : height / 2 - 64;
            
            // Cyan/Blue layer (offset left)
            const cyanLayer = await image.clone();
            await cyanLayer.print(font128, 0, y1, {
                text: text1,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            }, width);
            
            // Tint cyan layer
            await cyanLayer.scan(0, 0, width, height, function(x, y, idx) {
                if (this.bitmap.data[idx] > 200) {
                    this.bitmap.data[idx] = 0;
                    this.bitmap.data[idx + 1] = 255;
                    this.bitmap.data[idx + 2] = 255;
                }
            });
            
            await image.composite(cyanLayer, -offsetX, 0, {
                mode: Jimp.BLEND_ADD,
                opacitySource: 0.7
            });
            
            // Magenta/Red layer (offset right)
            const magentaLayer = await image.clone();
            await magentaLayer.print(font128, 0, y1, {
                text: text1,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            }, width);
            
            await magentaLayer.scan(0, 0, width, height, function(x, y, idx) {
                if (this.bitmap.data[idx] > 200) {
                    this.bitmap.data[idx] = 255;
                    this.bitmap.data[idx + 1] = 0;
                    this.bitmap.data[idx + 2] = 255;
                }
            });
            
            await image.composite(magentaLayer, offsetX, 0, {
                mode: Jimp.BLEND_ADD,
                opacitySource: 0.7
            });
            
            // White center layer
            await image.print(font128, 0, y1, {
                text: text1,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            }, width);
        }
        
        if (text2) {
            const y2 = height / 2 + 50;
            
            // Same RGB split for second text
            const cyanLayer2 = await image.clone();
            await cyanLayer2.print(font64, 0, y2, {
                text: text2,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            }, width);
            
            await cyanLayer2.scan(0, 0, width, height, function(x, y, idx) {
                if (this.bitmap.data[idx] > 200) {
                    this.bitmap.data[idx] = 0;
                    this.bitmap.data[idx + 1] = 255;
                    this.bitmap.data[idx + 2] = 255;
                }
            });
            
            await image.composite(cyanLayer2, -offsetX, 0, {
                mode: Jimp.BLEND_ADD,
                opacitySource: 0.7
            });
            
            const magentaLayer2 = await image.clone();
            await magentaLayer2.print(font64, 0, y2, {
                text: text2,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            }, width);
            
            await magentaLayer2.scan(0, 0, width, height, function(x, y, idx) {
                if (this.bitmap.data[idx] > 200) {
                    this.bitmap.data[idx] = 255;
                    this.bitmap.data[idx + 1] = 0;
                    this.bitmap.data[idx + 2] = 255;
                }
            });
            
            await image.composite(magentaLayer2, offsetX, 0, {
                mode: Jimp.BLEND_ADD,
                opacitySource: 0.7
            });
            
            await image.print(font64, 0, y2, {
                text: text2,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            }, width);
        }
        
        // Add scan lines effect
        for (let y = 0; y < height; y += 4) {
            await image.scan(0, y, width, 2, function(x, y, idx) {
                this.bitmap.data[idx] = Math.max(0, this.bitmap.data[idx] - 30);
                this.bitmap.data[idx + 1] = Math.max(0, this.bitmap.data[idx + 1] - 30);
                this.bitmap.data[idx + 2] = Math.max(0, this.bitmap.data[idx + 2] - 30);
            });
        }
        
        // Add random pixel corruption for more glitch
        await image.scan(0, 0, width, height, function(x, y, idx) {
            if (Math.random() > 0.995) {
                this.bitmap.data[idx] = Math.floor(Math.random() * 255);
                this.bitmap.data[idx + 1] = Math.floor(Math.random() * 255);
                this.bitmap.data[idx + 2] = Math.floor(Math.random() * 255);
            }
        });
        
        return await image.getBufferAsync(Jimp.MIME_PNG);
    } catch (error) {
        throw new Error(`Failed to create glitch image: ${error.message}`);
    }
}

const glitchtext = async (sock, msg, args, context) => {
    try {
        if (args.length === 0) {
            return await sock.sendMessage(context.from, {
                text: `GLITCH TEXT GENERATOR

Usage:
.glitchtext [text]
.glitchtext [text1], [text2]

Examples:
.glitchtext Firekid XMD
.glitchtext Firekid, XMD
.glitchtext Hello World

Features:
• Zalgo text effect
• Glitch image with RGB split
• Cyberpunk aesthetic
• Scan lines and noise`
            }, { quoted: msg });
        }

        const genMsg = await sock.sendMessage(context.from, {
            text: 'Generating glitch text...'
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
        const imageBuffer = await createGlitchImage(text1, text2);

        // Send zalgo text
        const zalgoMessage = text2 
            ? `${zalgoText1}\n\n${zalgoText2}`
            : zalgoText1;

        await sock.sendMessage(context.from, {
            text: `GLITCH TEXT\n\n${zalgoMessage}\n\nOriginal: ${text1}${text2 ? ' / ' + text2 : ''}`
        }, { quoted: msg });

        // Send glitch image
        await sock.sendMessage(context.from, {
            image: imageBuffer,
            caption: 'Glitch Image'
        }, { quoted: msg });

        await sock.sendMessage(context.from, { delete: genMsg.key });

    } catch (error) {
        console.error('Error in glitchtext command:', error);
        await sock.sendMessage(context.from, {
            text: `Failed to generate glitch text\n\n${error.message}`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'glitchtext',
    handler: glitchtext
};
