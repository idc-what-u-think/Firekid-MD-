const axios = require('axios');

// Jikan API v4 - Free, no API key needed!
const JIKAN_API = 'https://api.jikan.moe/v4';

// Helper function to format anime info
function formatAnimeInfo(anime) {
    const title = anime.title || 'N/A';
    const titleJapanese = anime.title_japanese || 'N/A';
    const titleEnglish = anime.title_english || title;
    const type = anime.type || 'N/A';
    const episodes = anime.episodes || 'Unknown';
    const status = anime.status || 'N/A';
    const score = anime.score || 'N/A';
    const ranked = anime.rank ? `#${anime.rank}` : 'N/A';
    const popularity = anime.popularity ? `#${anime.popularity}` : 'N/A';
    const members = anime.members ? anime.members.toLocaleString() : 'N/A';
    const aired = anime.aired?.string || 'N/A';
    const duration = anime.duration || 'N/A';
    const rating = anime.rating || 'N/A';
    const studios = anime.studios?.map(s => s.name).join(', ') || 'N/A';
    const genres = anime.genres?.map(g => g.name).join(', ') || 'N/A';
    
    // Synopsis - limit to 300 characters
    let synopsis = anime.synopsis || 'No synopsis available.';
    if (synopsis.length > 300) {
        synopsis = synopsis.substring(0, 297) + '...';
    }
    
    // Season info
    const season = anime.season ? `${anime.season} ${anime.year || ''}` : 'N/A';
    
    return {
        title,
        titleJapanese,
        titleEnglish,
        type,
        episodes,
        status,
        score,
        ranked,
        popularity,
        members,
        aired,
        duration,
        rating,
        studios,
        genres,
        synopsis,
        season,
        imageUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        url: anime.url,
        malId: anime.mal_id
    };
}

// Main anime search function
async function searchAnime(query) {
    try {
        const response = await axios.get(`${JIKAN_API}/anime`, {
            params: {
                q: query,
                limit: 1,
                sfw: true // Safe for work filter
            }
        });
        
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0];
        }
        
        return null;
    } catch (error) {
        // Handle rate limiting (Jikan has 3 requests/second, 60/minute limit)
        if (error.response?.status === 429) {
            throw new Error('Too many requests! Please wait a moment and try again.');
        }
        throw error;
    }
}

// Get anime image
async function getAnimeImage(imageUrl) {
    try {
        const response = await axios.get(imageUrl, { 
            responseType: 'arraybuffer',
            timeout: 10000 
        });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error fetching anime image:', error.message);
        return null;
    }
}

// Main command handler
const anime = async (sock, msg, args, context) => {
    try {
        // Check if user provided anime name
        if (args.length === 0) {
            await sock.sendMessage(context.from, {
                text: `╭━━━『 *ANIME SEARCH* 』━━━╮
│
│ ⚠️ *How to use:*
│ .anime [anime name]
│
│ 📝 *Examples:*
│ .anime Naruto
│ .anime Attack on Titan
│ .anime Solo Leveling
│ .anime Demon Slayer
│
│ 📊 *Information shown:*
│ • Title (English/Japanese)
│ • Type & Episodes
│ • Score & Ranking
│ • Status & Season
│ • Synopsis
│ • Genres & Studios
│ • Cover Image
│
╰━━━━━━━━━━━━━━━━━━━━╯

💡 *Powered by MyAnimeList*`
            });
            return;
        }

        const searchQuery = args.join(' ');

        // Send searching message
        const searchMsg = await sock.sendMessage(context.from, {
            text: `🔍 *Searching for anime...*\n⏳ "${searchQuery}"\n\nPlease wait...`
        });

        // Search for anime
        const animeData = await searchAnime(searchQuery);

        if (!animeData) {
            await sock.sendMessage(context.from, {
                text: `❌ *Anime not found!*\n\nNo results for: "${searchQuery}"\n\n💡 *Try:*\n• Check spelling\n• Use English or Japanese title\n• Try shorter name`
            });
            
            // Delete searching message
            await sock.sendMessage(context.from, {
                delete: searchMsg.key
            });
            return;
        }

        // Format anime information
        const info = formatAnimeInfo(animeData);

        // Prepare info message
        const infoMessage = `╭━━━『 *ANIME INFO* 』━━━╮
│
│ 📺 *${info.title}*
│ 🇯🇵 ${info.titleJapanese}
│
├─『 *DETAILS* 』─
│
│ 📊 *Score:* ${info.score}/10 ⭐
│ 🏆 *Ranked:* ${info.ranked}
│ 📈 *Popularity:* ${info.popularity}
│ 👥 *Members:* ${info.members}
│
│ 🎬 *Type:* ${info.type}
│ 📺 *Episodes:* ${info.episodes}
│ ⏱️ *Duration:* ${info.duration}
│ 📡 *Status:* ${info.status}
│ 🗓️ *Season:* ${info.season}
│ 📅 *Aired:* ${info.aired}
│
│ 🎭 *Genres:* ${info.genres}
│ 🎨 *Studios:* ${info.studios}
│ 🔞 *Rating:* ${info.rating}
│
├─『 *SYNOPSIS* 』─
│
${info.synopsis}
│
├─『 *LINKS* 』─
│
│ 🔗 MyAnimeList: ${info.url}
│
╰━━━━━━━━━━━━━━━━━━━━╯

📡 *Data from MyAnimeList*`;

        // Get anime image
        let imageBuffer = null;
        if (info.imageUrl) {
            imageBuffer = await getAnimeImage(info.imageUrl);
        }

        // Send anime info with image
        if (imageBuffer) {
            await sock.sendMessage(context.from, {
                image: imageBuffer,
                caption: infoMessage
            });
        } else {
            // If image fails, just send text
            await sock.sendMessage(context.from, {
                text: infoMessage
            });
        }

        // Delete the searching message
        await sock.sendMessage(context.from, {
            delete: searchMsg.key
        });

    } catch (error) {
        console.error('Error in anime command:', error);
        
        let errorMessage = '❌ *Error fetching anime data*\n\n';
        
        if (error.message.includes('Too many requests')) {
            errorMessage += '⏳ Rate limit reached! Please wait 1 minute and try again.';
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage += '⏱️ Request timed out. Please try again.';
        } else {
            errorMessage += `${error.message}\n\nPlease try again later.`;
        }
        
        await sock.sendMessage(context.from, {
            text: errorMessage
        });
    }
};

module.exports = {
    command: 'anime',
    handler: anime
};
