const Jimp = require('jimp');
const axios = require('axios');

// Celebrity database
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

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getRandomEngagement() {
    return {
        retweets: Math.floor(Math.random() * 50000) + 1000,
        quotes: Math.floor(Math.random() * 5000) + 100,
        likes: Math.floor(Math.random() * 100000) + 5000,
        views: Math.floor(Math.random() * 1000000) + 10000
    };
}

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

async function generateFakeTweet(celebrity, message) {
    try {
        const width = 1200;
        const height = 800;
        
        // Create white background
        const image = new Jimp(width, height, '#FFFFFF');
        
        // Load and draw avatar
        let avatar;
        try {
            const response = await axios.get(celebrity.avatar, { responseType: 'arraybuffer' });
            avatar = await Jimp.read(response.data);
            avatar.resize(96, 96);
            avatar.circle();
            image.composite(avatar, 72, 72);
        } catch (error) {
            console.error('Failed to load avatar:', error.message);
        }
        
        // Load font
        const font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
        const font16 = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
        const font64 = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
        
        // Draw name
        image.print(font32, 190, 80, celebrity.name);
        
        // Draw handle
        image.print(font16, 190, 120, `@${celebrity.handle}`, 800);
        
        // Draw tweet text
        image.print(font64, 100, 200, message, 1000);
        
        // Draw time
        image.print(font16, 100, height - 300, getCurrentTime());
        
        // Draw engagement stats
        const engagement = getRandomEngagement();
        const stats = `${formatNumber(engagement.retweets)} Retweets  ${formatNumber(engagement.quotes)} Quotes  ${formatNumber(engagement.likes)} Likes`;
        image.print(font16, 100, height - 200, stats);
        
        const views = `${formatNumber(engagement.views)} Views`;
        image.print(font16, 100, height - 150, views);
        
        return await image.getBufferAsync(Jimp.MIME_PNG);
    } catch (error) {
        throw new Error(`Failed to generate tweet: ${error.message}`);
    }
}

const faketweet = async (sock, msg, args, context) => {
    try {
        if (args.length < 2) {
            await sock.sendMessage(context.from, {
                text: `FAKE TWEET GENERATOR

How to use:
.faketweet [celebrity] [message]

Example:
.faketweet ronaldo Siuuuu!

Available Celebrities:
• ronaldo • messi
• elon • trump
• drake • rihanna
• beyonce • kim
• kanye • lebron

Note: Generated tweets are clearly fake`
            });
            return;
        }

        const celebrityName = args[0].toLowerCase();
        const message = args.slice(1).join(' ');

        if (!celebrities[celebrityName]) {
            await sock.sendMessage(context.from, {
                text: `Celebrity not found\n\nAvailable: ${Object.keys(celebrities).join(', ')}`
            });
            return;
        }

        const genMsg = await sock.sendMessage(context.from, {
            text: 'Generating fake tweet...'
        });

        const celebrity = celebrities[celebrityName];
        const imageBuffer = await generateFakeTweet(celebrity, message);

        await sock.sendMessage(context.from, {
            image: imageBuffer,
            caption: `Fake tweet from ${celebrity.name}\n\nThis is NOT a real tweet`
        });

        await sock.sendMessage(context.from, { delete: genMsg.key });

    } catch (error) {
        console.error('Error in faketweet command:', error);
        await sock.sendMessage(context.from, {
            text: `Error generating fake tweet\n\n${error.message}`
        });
    }
};

module.exports = {
    command: 'faketweet',
    handler: faketweet
};
