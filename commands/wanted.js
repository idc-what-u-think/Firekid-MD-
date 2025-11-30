const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// Random crimes for fun
const randomCrimes = [
    'Him No Get Sense',
    'Him na theif'
];

// Random rewards
const randomRewards = [
    '$5,000',
    '$10,000',
    '$25,000',
    '$50,000',
    '$100,000',
    '$500,000',
    '$1,000,000',
    '10,000 DIAMONDS',
    '50,000 DOLLARS',
    'ONE MILLION NAIRA'
];

// Function to get random item from array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Function to create wanted poster
async function createWantedPoster(imagePath, crime, reward) {
    try {
        // Canvas dimensions
        const width = 1200;
        const height = 1600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background - Aged paper texture
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#F4E8D0');
        gradient.addColorStop(0.5, '#E8D5B7');
        gradient.addColorStop(1, '#D4C4A8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add paper texture (noise)
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const opacity = Math.random() * 0.1;
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.fillRect(x, y, 2, 2);
        }

        // Dark border
        ctx.strokeStyle = '#5C4033';
        ctx.lineWidth = 20;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        // Inner decorative border
        ctx.strokeStyle = '#8B6F47';
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 40, width - 80, height - 80);

        // "WANTED" header
        ctx.fillStyle = '#2C1810';
        ctx.font = 'bold 140px serif';
        ctx.textAlign = 'center';
        ctx.fillText('WANTED', width / 2, 180);

        // Underline for WANTED
        ctx.strokeStyle = '#2C1810';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(200, 200);
        ctx.lineTo(width - 200, 200);
        ctx.stroke();

        // "DEAD OR ALIVE" subtitle
        ctx.fillStyle = '#8B0000';
        ctx.font = 'bold 50px serif';
        ctx.fillText('DEAD OR ALIVE', width / 2, 260);

        // Load and draw user image
        const userImage = await loadImage(imagePath);
        
        // Image frame position
        const imgFrameX = 250;
        const imgFrameY = 320;
        const imgFrameWidth = 700;
        const imgFrameHeight = 700;

        // Draw image frame (dark border)
        ctx.fillStyle = '#2C1810';
        ctx.fillRect(imgFrameX - 15, imgFrameY - 15, imgFrameWidth + 30, imgFrameHeight + 30);
        
        // Draw white inner border
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(imgFrameX - 10, imgFrameY - 10, imgFrameWidth + 20, imgFrameHeight + 20);

        // Apply sepia effect on the image
        ctx.save();
        ctx.filter = 'sepia(100%) contrast(120%)';
        ctx.drawImage(userImage, imgFrameX, imgFrameY, imgFrameWidth, imgFrameHeight);
        ctx.restore();

        // Crime section
        ctx.fillStyle = '#2C1810';
        ctx.font = 'bold 45px serif';
        ctx.fillText('WANTED FOR:', width / 2, 1100);

        // Crime text with word wrap
        ctx.font = 'italic 55px serif';
        const maxCrimeWidth = width - 200;
        const words = crime.split(' ');
        let line = '';
        let yPos = 1170;
        
        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxCrimeWidth && line !== '') {
                ctx.fillText(line, width / 2, yPos);
                line = word + ' ';
                yPos += 60;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, width / 2, yPos);

        // Decorative line
        ctx.strokeStyle = '#8B6F47';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150, yPos + 40);
        ctx.lineTo(width - 150, yPos + 40);
        ctx.stroke();

        // Reward section
        ctx.fillStyle = '#8B0000';
        ctx.font = 'bold 50px serif';
        ctx.fillText('REWARD', width / 2, yPos + 110);

        // Reward amount
        ctx.fillStyle = '#2C1810';
        ctx.font = 'bold 80px serif';
        ctx.fillText(reward, width / 2, yPos + 200);

        // Warning text at bottom
        ctx.fillStyle = '#5C4033';
        ctx.font = 'italic 30px serif';
        ctx.fillText('APPROACH WITH CAUTION', width / 2, height - 80);

        return canvas.toBuffer('image/png');
    } catch (error) {
        throw new Error(`Failed to create wanted poster: ${error.message}`);
    }
}

const wanted = async (sock, msg, args, context) => {
    try {
        // Check if message is a reply to an image
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quotedMsg?.imageMessage || quotedMsg?.stickerMessage;
        
        if (!imageMessage) {
            return await sock.sendMessage(context.from, {
                text: `╭━━━『 *WANTED POSTER* 』━━━╮
│
│ ⚠️ *How to use:*
│ Reply to an image with .wanted
│
│ 📝 *Examples:*
│ .wanted
│ .wanted Being too cool
│ .wanted Stealing hearts $50000
│
│ 🎨 *Features:*
│ • Vintage wanted poster style
│ • Sepia-toned image effect
│ • Random crime & reward
│ • Or specify your own!
│
│ 💡 *Format:*
│ .wanted [crime] [reward]
│ Both crime and reward are optional!
│
╰━━━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: msg });
        }

        // Send generating message
        const genMsg = await sock.sendMessage(context.from, {
            text: '🎨 *Creating wanted poster...*\n⏳ Please wait...'
        }, { quoted: msg });

        // Parse custom crime and reward from args
        let crime = '';
        let reward = '';
        
        if (args.length > 0) {
            const fullText = args.join(' ');
            
            // Check if there's a $ sign for reward
            const dollarIndex = fullText.indexOf('$');
            
            if (dollarIndex !== -1) {
                // Split by $ to separate crime and reward
                crime = fullText.substring(0, dollarIndex).trim();
                reward = '$' + fullText.substring(dollarIndex + 1).trim();
            } else {
                // No $ sign, treat everything as crime
                crime = fullText.trim();
            }
        }
        
        // Use random if not provided
        if (!crime) crime = getRandom(randomCrimes);
        if (!reward) reward = getRandom(randomRewards);

        // Create tmp directory if it doesn't exist
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Download the image
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        const inputImagePath = path.join(tmpDir, `wanted_input_${Date.now()}.jpg`);
        fs.writeFileSync(inputImagePath, buffer);

        // Generate wanted poster
        const posterBuffer = await createWantedPoster(inputImagePath, crime, reward);

        // Send the wanted poster
        await sock.sendMessage(context.from, {
            image: posterBuffer,
            caption: `╭━━━『 *WANTED POSTER* 』━━━╮
│
│ 🚨 *Crime:* ${crime}
│ 💰 *Reward:* ${reward}
│
│ ⚠️ If seen, report immediately!
│
╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: msg });

        // Clean up
        fs.unlinkSync(inputImagePath);

        // Delete generating message
        await sock.sendMessage(context.from, {
            delete: genMsg.key
        });

    } catch (error) {
        console.error('Error in wanted command:', error);
        await sock.sendMessage(context.from, {
            text: `❌ *Failed to create wanted poster*\n\n${error.message}\n\nMake sure you replied to an image!`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'wanted',
    handler: wanted
};
