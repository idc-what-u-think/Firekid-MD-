const Jimp = require('jimp');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const randomCrimes = [
    'Being too cool',
    'Stealing hearts',
    'Breaking the internet',
    'Excessive swag',
    'Being legendary'
];

const randomRewards = [
    '$5,000',
    '$10,000',
    '$25,000',
    '$50,000',
    '$100,000',
    '$500,000',
    '$1,000,000'
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function createWantedPoster(imageBuffer, crime, reward) {
    try {
        const width = 1200;
        const height = 1600;
        
        // Create aged paper background
        const poster = new Jimp(width, height, '#E8D5B7');
        
        // Add noise texture for aged look
        poster.scan(0, 0, width, height, function(x, y, idx) {
            if (Math.random() > 0.95) {
                this.bitmap.data[idx] = Math.max(0, this.bitmap.data[idx] - 30);
                this.bitmap.data[idx + 1] = Math.max(0, this.bitmap.data[idx + 1] - 30);
                this.bitmap.data[idx + 2] = Math.max(0, this.bitmap.data[idx + 2] - 30);
            }
        });
        
        // Load fonts
        const font128 = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
        const font64 = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
        const font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
        
        // Draw "WANTED" header
        poster.print(font128, 0, 50, {
            text: 'WANTED',
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        }, width);
        
        // Draw "DEAD OR ALIVE" subtitle
        poster.print(font64, 0, 220, {
            text: 'DEAD OR ALIVE',
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        }, width);
        
        // Load and process user image
        const userImage = await Jimp.read(imageBuffer);
        userImage.resize(700, 700);
        userImage.sepia();
        userImage.contrast(0.2);
        
        // Create white border for image
        const borderSize = 10;
        const imgX = 250;
        const imgY = 320;
        
        // Draw white background for border
        poster.scan(imgX - borderSize, imgY - borderSize, 720, 720, function(x, y, idx) {
            this.bitmap.data[idx] = 255;
            this.bitmap.data[idx + 1] = 255;
            this.bitmap.data[idx + 2] = 255;
        });
        
        // Composite user image
        poster.composite(userImage, imgX, imgY);
        
        // Draw "WANTED FOR:" text
        poster.print(font64, 0, 1080, {
            text: 'WANTED FOR:',
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        }, width);
        
        // Draw crime
        poster.print(font64, 100, 1180, {
            text: crime,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        }, width - 200);
        
        // Draw "REWARD" text
        poster.print(font64, 0, 1320, {
            text: 'REWARD',
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        }, width);
        
        // Draw reward amount
        poster.print(font128, 0, 1400, {
            text: reward,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        }, width);
        
        return await poster.getBufferAsync(Jimp.MIME_PNG);
    } catch (error) {
        throw new Error(`Failed to create wanted poster: ${error.message}`);
    }
}

const wanted = async (sock, msg, args, context) => {
    try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quotedMsg?.imageMessage || quotedMsg?.stickerMessage;
        
        if (!imageMessage) {
            return await sock.sendMessage(context.from, {
                text: `WANTED POSTER GENERATOR

How to use:
Reply to an image with .wanted

Examples:
.wanted
.wanted Being too cool
.wanted Stealing hearts $50000

Format:
.wanted [crime] [reward]

Both crime and reward are optional
If not provided, random values will be used`
            }, { quoted: msg });
        }

        const genMsg = await sock.sendMessage(context.from, {
            text: 'Creating wanted poster...'
        }, { quoted: msg });

        // Parse custom crime and reward
        let crime = '';
        let reward = '';
        
        if (args.length > 0) {
            const fullText = args.join(' ');
            const dollarIndex = fullText.indexOf('$');
            
            if (dollarIndex !== -1) {
                crime = fullText.substring(0, dollarIndex).trim();
                reward = '$' + fullText.substring(dollarIndex + 1).trim();
            } else {
                crime = fullText.trim();
            }
        }
        
        // Use random if not provided
        if (!crime) crime = getRandom(randomCrimes);
        if (!reward) reward = getRandom(randomRewards);

        // Download the image
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Generate wanted poster
        const posterBuffer = await createWantedPoster(buffer, crime, reward);

        // Send the wanted poster
        await sock.sendMessage(context.from, {
            image: posterBuffer,
            caption: `WANTED POSTER

Crime: ${crime}
Reward: ${reward}`
        }, { quoted: msg });

        await sock.sendMessage(context.from, { delete: genMsg.key });

    } catch (error) {
        console.error('Error in wanted command:', error);
        await sock.sendMessage(context.from, {
            text: `Failed to create wanted poster\n\n${error.message}\n\nMake sure you replied to an image`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'wanted',
    handler: wanted
};
