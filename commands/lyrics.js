const axios = require('axios')

const lyrics = async (m, client) => {
    if (!m.args[0]) return m.reply('❌ Please provide a song name')

    try {
        m.reply('⏳ Searching for lyrics...')

        // First search for song to get ID
        const searchUrl = 'https://musicapi.x007.workers.dev/search'
        const searchResponse = await axios.get(searchUrl, {
            params: {
                q: m.args.join(' '),
                searchEngine: 'gaama'
            }
        })

        if (!searchResponse.data.response?.length) {
            return m.reply('❌ Song not found')
        }

        const song = searchResponse.data.response[0]

        // Get lyrics using song ID
        const lyricsUrl = 'https://musicapi.x007.workers.dev/lyrics'
        const lyricsResponse = await axios.get(lyricsUrl, {
            params: { id: song.id }
        })

        if (!lyricsResponse.data.response) {
            return m.reply('❌ Lyrics not found')
        }

        // Clean up lyrics from HTML tags
        const cleanLyrics = lyricsResponse.data.response
            .replace(/<\/?p>/g, '')
            .replace(/<br\/?>/g, '\n')

        await m.reply(`📝 Lyrics for ${song.title}:\n\n${cleanLyrics}`)
    } catch (error) {
        console.error('Error in lyrics command:', error)
        return m.reply('❌ Failed to fetch lyrics')
    }
}

module.exports = {
    command: 'lyrics',
    handler: lyrics
}