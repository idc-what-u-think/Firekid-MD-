const axios = require('axios')

const movie = async (m, client) => {
    if (!m.args[0]) return m.reply('❌ Please provide a movie name')

    const API_KEY = '8c75924a'
    
    try {
        const movieName = m.args.join(' ')
        const url = `http://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(movieName)}`
        
        const response = await axios.get(url)
        const data = response.data

        if (data.Response === 'False') {
            return m.reply('❌ Movie not found')
        }

        const movieInfo = `🎬 ${data.Title} (${data.Year})
⭐ Rating: ${data.imdbRating}
🎭 Genre: ${data.Genre}
👥 Cast: ${data.Actors}
📝 Plot: ${data.Plot}
🎪 Director: ${data.Director}
⏱️ Runtime: ${data.Runtime}
🌍 Language: ${data.Language}
🏆 Awards: ${data.Awards}`

        if (data.Poster && data.Poster !== 'N/A') {
            await client.sendMessage(m.chat, {
                image: { url: data.Poster },
                caption: movieInfo
            })
        } else {
            await m.reply(movieInfo)
        }
    } catch (error) {
        console.error('Error in movie command:', error)
        return m.reply('❌ Failed to fetch movie information')
    }
}

module.exports = {
    command: 'movie',
    handler: movie
}