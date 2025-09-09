const axios = require('axios')

const song = async (m, client) => {
    if (!m.args[0]) return m.reply('❌ Please provide a song name')

    try {
        m.reply('⏳ Searching for song...')

        // Search for song
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
        
        // Fetch song URL
        const fetchUrl = 'https://musicapi.x007.workers.dev/fetch'
        const fetchResponse = await axios.get(fetchUrl, {
            params: { id: song.id }
        })

        if (!fetchResponse.data.response) {
            return m.reply('❌ Failed to get song URL')
        }

        // Send song with thumbnail
        await client.sendMessage(m.chat, {
            audio: { url: fetchResponse.data.response },
            mimetype: 'audio/mpeg',
            fileName: song.title + '.mp3',
            thumbnail: { url: song.img },
            title: song.title
        })

    } catch (error) {
        console.error('Error in song command:', error)
        return m.reply('❌ Failed to download song')
    }
}

module.exports = {
    command: 'song',
    handler: song
}