const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// Celebrity database with Twitter handles and profile data
const celebrities = {
    'ronaldo': { 
        name: 'Cristiano Ronaldo', 
        handle: 'Cristiano', 
        verified: true,
        avatar: 'https://pbs.twimg.com/profile_images/1594446880498401282/o4L2z8Ym_400x400.jpg'
    },
    'messi': { 
        name: 'Leo Messi', 
        handle: 'leomessi', 
        verified: true,
        avatar: 'https://pbs.twimg.com/profile_images/1778969163726802944/Xd77CRx__400x400.jpg'
    },
    'elon': { 
        name: 'Elon Musk', 
        handle: 'elonmusk', 
        verified: true,
        avatar: 'https://pbs.twimg.com/profile_images/1815749056821346304/jS8I28PL_400x400.jpg'
    },
    'trump': { 
        name: 'Donald J. Trump', 
        handle: 'realDonaldTrump', 
        verified: true,
        avatar: 'https://pbs.twimg.com/profile_images/874276197357596672/kUuht00m_400x400.jpg'
    },
    'drake': { 
        name: 'Drake', 
        handle: 'Drake', 
        verified: true,
        avatar: 'https://pbs.twimg.com/profile_images/1596545968561070080/u3ZAhVqn_400x400.jpg'
    },
    'rihanna': { 
        name: 'Rihanna', 
        handle: 'rihanna', 
        verified: true,
        avatar: 'https://pbs.twimg.com/profile_images/1415242814376972289/DixOWSsL_400x400.jpg'
    },
    'beyonce': { 
        name: 'Beyoncé', 
        handle: 'Beyonce', 
        verified: true,
        avatar: 'https://pbs.twimg.com/profile_images/1344074159870734341/VmUF7Vx2_400x400.jpg'
    },
    'kim': { 
        name: 'Kim Kardashian', 
        handle: 'KimKardashian', 
        verified: true,
        avatar: 'https://pbs.twimg.com/profile_images/1775603668344815616/Vl3BqGzL_400x400.jpg'
    },
    'kanye': { 
        name: 'ye', 
        handle: 'kanyewest', 
        verified: true,
        avatar: 'https://pbs.twimg.com/profile_images/1776722875531571200/Vx5O3FTo_400x400.jpg'
    },
    'lebron': { 
        name: 'LeBron James', 
        handle: 'KingJames', 
        verified: true,
        avatar: 'https://pbs.twimg.com/profile_images/1421526672215461891/Q5VXGwcD_400x400.jpg'
    }
};

// Function to wrap text for canvas
function wrapText(context, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Function to format numbers (1234 -> 1.2K)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Generate random engagement numbers
function getRandomEngagement() {
    return {
        retweets: Math.floor(Math.random() * 50000) + 1000,
        quotes: Math.floor(Math.random() * 5000) + 100,
        likes: Math.floor(Math.random() * 100000) + 5000,
        views: Math.floor(Math.random() * 1000000) + 10000
    };
}

// Get current time
function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    
    return `${hours}:${minutesStr} ${ampm} · ${month} ${day}, ${year}`;
}

// Main function to generate fake tweet
async function generateFakeTweet(celebrity, message) {
    try {
        // Canvas dimensions matching Twitter's layout
        const width = 1200;
        const height = 800;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background - Twitter dark theme
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Load avatar
        let avatar;
        try {
            const response = await axios.get(celebrity.avatar, { responseType: 'arraybuffer' });
            avatar = await loadImage(Buffer.from(response.data));
        } catch (error) {
            // Fallback: draw a circle if avatar fails
            ctx.fillStyle = '#1DA1F2';
            ctx.beginPath();
            ctx.arc(120, 120, 48, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw avatar
        if (avatar) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(120, 120, 48, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 72, 72, 96, 96);
            ctx.restore();
        }

        // Draw name
        ctx.fillStyle = '#E7E9EA';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(celebrity.name, 190, 95);

        // Draw verified badge if verified
        if (celebrity.verified) {
            ctx.fillStyle = '#1D9BF0';
            ctx.beginPath();
            ctx.arc(190 + ctx.measureText(celebrity.name).width + 15, 85, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('✓', 190 + ctx.measureText(celebrity.name).width + 10, 92);
        }

        // Draw handle
        ctx.fillStyle = '#71767B';
        ctx.font = '28px Arial';
        ctx.fillText(`@${celebrity.handle}`, 190, 130);

        // Draw tweet text
        ctx.fillStyle = '#E7E9EA';
        ctx.font = '36px Arial';
        const lines = wrapText(ctx, message, width - 200);
        let yPosition = 200;
        lines.forEach(line => {
            ctx.fillText(line, 100, yPosition);
            yPosition += 50;
        });

        // Draw time
        yPosition += 30;
        ctx.fillStyle = '#71767B';
        ctx.font = '28px Arial';
        ctx.fillText(getCurrentTime(), 100, yPosition);
        ctx.fillText(' · ', 100 + ctx.measureText(getCurrentTime()).width, yPosition);
        
        // Draw "X for iPhone"
        ctx.fillStyle = '#1D9BF0';
        ctx.fillText('𝕏 for iPhone', 100 + ctx.measureText(getCurrentTime() + ' · ').width, yPosition);

        // Divider line
        yPosition += 40;
        ctx.strokeStyle = '#2F3336';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, yPosition);
        ctx.lineTo(width - 100, yPosition);
        ctx.stroke();

        // Engagement stats
        const engagement = getRandomEngagement();
        yPosition += 50;
        ctx.fillStyle = '#E7E9EA';
        ctx.font = 'bold 28px Arial';
        
        let xPos = 100;
        ctx.fillText(formatNumber(engagement.retweets), xPos, yPosition);
        ctx.fillStyle = '#71767B';
        ctx.font = '28px Arial';
        xPos += ctx.measureText(formatNumber(engagement.retweets)).width + 10;
        ctx.fillText('Retweets', xPos, yPosition);
        
        xPos += ctx.measureText('Retweets').width + 40;
        ctx.fillStyle = '#E7E9EA';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(formatNumber(engagement.quotes), xPos, yPosition);
        ctx.fillStyle = '#71767B';
        ctx.font = '28px Arial';
        xPos += ctx.measureText(formatNumber(engagement.quotes)).width + 10;
        ctx.fillText('Quotes', xPos, yPosition);
        
        xPos += ctx.measureText('Quotes').width + 40;
        ctx.fillStyle = '#E7E9EA';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(formatNumber(engagement.likes), xPos, yPosition);
        ctx.fillStyle = '#71767B';
        ctx.font = '28px Arial';
        xPos += ctx.measureText(formatNumber(engagement.likes)).width + 10;
        ctx.fillText('Likes', xPos, yPosition);

        // Views
        yPosition += 50;
        ctx.fillStyle = '#71767B';
        ctx.font = '26px Arial';
        ctx.fillText(`${formatNumber(engagement.views)} Views`, 100, yPosition);

        // Another divider
        yPosition += 30;
        ctx.strokeStyle = '#2F3336';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, yPosition);
        ctx.lineTo(width - 100, yPosition);
        ctx.stroke();

        return canvas.toBuffer('image/png');
    } catch (error) {
        throw new Error(`Failed to generate tweet: ${error.message}`);
    }
}

// Main command handler
const faketweet = async (sock, msg, args, context) => {
    try {
        // Check if user provided celebrity and message
        if (args.length < 2) {
            await sock.sendMessage(context.from, {
                text: `╭━━━『 *FAKE TWEET USAGE* 』━━━╮
│
│ ⚠️ *How to use:*
│ .faketweet [celebrity] [message]
│
│ 📝 *Example:*
│ .faketweet ronaldo Siuuuu! 🐐
│
│ 👥 *Available Celebrities:*
│ • ronaldo • messi
│ • elon • trump
│ • drake • rihanna
│ • beyonce • kim
│ • kanye • lebron
│
│ ⚠️ *Note:* Generated tweets are
│ clearly marked as FAKE.
│
╰━━━━━━━━━━━━━━━━━━━━╯`
            });
            return;
        }

        const celebrityName = args[0].toLowerCase();
        const message = args.slice(1).join(' ');

        // Check if celebrity exists
        if (!celebrities[celebrityName]) {
            await sock.sendMessage(context.from, {
                text: `❌ Celebrity "${celebrityName}" not found!\n\n👥 Available: ${Object.keys(celebrities).join(', ')}`
            });
            return;
        }

        // Send "generating" message
        const genMsg = await sock.sendMessage(context.from, {
            text: '🎨 *Generating fake tweet...*\n⏳ Please wait...'
        });

        // Generate the tweet image
        const celebrity = celebrities[celebrityName];
        const imageBuffer = await generateFakeTweet(celebrity, message);

        // Send the image
        await sock.sendMessage(context.from, {
            image: imageBuffer
        });

        // Delete the "generating" message
        await sock.sendMessage(context.from, {
            delete: genMsg.key
        });

    } catch (error) {
        console.error('Error in faketweet command:', error);
        await sock.sendMessage(context.from, {
            text: `❌ *Error generating fake tweet*\n\n${error.message}\n\nPlease try again later.`
        });
    }
};

module.exports = {
    command: 'faketweet',
    handler: faketweet
};
