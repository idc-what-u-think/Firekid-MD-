const axios = require('axios');

const movie = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a movie name\n\nExample: ${context.prefix}movie Inception` 
        });
    }
    
    const API_KEY = '8c75924a';
    
    try {
        const movieName = args.join(' ');
        const url = `http://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(movieName)}`;
        
        const response = await axios.get(url);
        const data = response.data;
        
        if (data.Response === 'False') {
            return await sock.sendMessage(context.from, { 
                text: '❌ Movie not found. Please check the spelling and try again.' 
            });
        }
        
        const movieInfo = `🎬 ${data.Title} (${data.Year})
⭐ Rating: ${data.imdbRating}
🎭 Genre: ${data.Genre}
👥 Cast: ${data.Actors}
📝 Plot: ${data.Plot}
🎪 Director: ${data.Director}
⏱️ Runtime: ${data.Runtime}
🌍 Language: ${data.Language}
🏆 Awards: ${data.Awards}`;
        
        if (data.Poster && data.Poster !== 'N/A') {
            await sock.sendMessage(context.from, {
                image: { url: data.Poster },
                caption: movieInfo
            });
        } else {
            await sock.sendMessage(context.from, { 
                text: movieInfo 
            });
        }
        
    } catch (error) {
        console.error('Error in movie command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to fetch movie information. Please try again later.' 
        });
    }
};

module.exports = {
    command: 'movie',
    handler: movie
};
