const axios = require('axios')

const weather = async (m, client) => {
    if (!m.args[0]) return m.reply('❌ Please provide a location')

    const API_KEY = '33133755e9ca4490862114921250608'
    
    try {
        const location = m.args.join(' ')
        const url = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(location)}`
        
        const response = await axios.get(url)
        const data = response.data

        const weatherInfo = `📍 Weather for ${data.location.name}, ${data.location.country}
🌡️ Temperature: ${data.current.temp_c}°C / ${data.current.temp_f}°F
🌤️ Condition: ${data.current.condition.text}
💨 Wind: ${data.current.wind_kph} km/h
💧 Humidity: ${data.current.humidity}%
🌡️ Feels like: ${data.current.feelslike_c}°C`

        await m.reply(weatherInfo)
    } catch (error) {
        console.error('Error in weather command:', error)
        return m.reply('❌ Failed to fetch weather information')
    }
}

module.exports = {
    command: 'weather',
    handler: weather
}