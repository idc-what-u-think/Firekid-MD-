const axios = require('axios')

const ttdownload = async (m, client) => {
    if (!m.args[0]) return m.reply('❌ Please provide a TikTok video URL')

    const API_KEY = '21713c9b31msh4812fb7a7b6ea42p17ebfajsn789ce0fb9cef'
    const API_HOST = 'tiktok-video-downloader-api.p.rapidapi.com'

    try {
        m.reply('⏳ Processing TikTok video...')

        const options = {
            method: 'GET',
            url: `https://${API_HOST}/download`,
            params: { url: m.args[0] },
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': API_HOST
            }
        }

        const response = await axios.request(options)
        const videoUrl = response.data.video_url

        await client.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: '✅ Downloaded from TikTok'
        })
    } catch (error) {
        console.error('Error in ttdownload command:', error)
        return m.reply('❌ Failed to download TikTok video')
    }
}

module.exports = {
    command: 'ttdownload',
    handler: ttdownload
}