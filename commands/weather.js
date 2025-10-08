const axios = require('axios');

const weather = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a location\n\nExample: ${context.prefix}weather London` 
        });
    }
    
    const API_KEY = '33133755e9ca4490862114921250608';
    
    try {
        const location = args.join(' ');
        const url = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(location)}`;
        
        const response = await axios.get(url);
        const data = response.data;
        
        const weatherInfo = `📍 Weather for ${data.location.name}, ${data.location.country}
🌡️ Temperature: ${data.current.temp_c}°C / ${data.current.temp_f}°F
🌤️ Condition: ${data.current.condition.text}
💨 Wind: ${data.current.wind_kph} km/h
💧 Humidity: ${data.current.humidity}%
🌡️ Feels like: ${data.current.feelslike_c}°C`;
        
        await sock.sendMessage(context.from, { 
            text: weatherInfo 
        });
        
    } catch (error) {
        console.error('Error in weather command:', error.message);
        
        if (error.response && error.response.status === 400) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Location not found. Please check the spelling and try again.' 
            });
        }
        
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to fetch weather information. Please try again later.' 
        });
    }
};

module.exports = {
    command: 'weather',
    handler: weather
};
