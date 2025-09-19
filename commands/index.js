const fs = require('fs')
const path = require('path')

const commands = {}

const commandList = [
    'sudo', 'warn', 'resetwarning', 'allowdomain', 'menu', 'ping', 'alive', 
    'vv', 'delete', 'kick', 'tagall', 'promote', 'mute', 'unmute', 'left', 
    'tag', 'join', 'setgrppp', 'antilnk', 'sticker', 'toimg', 'filter', 
    'country', 'kill', 'online', 'block', 'ttdownload', 'song', 'lyrics', 
    'weather', 'movie'
]

commandList.forEach(commandName => {
    const filePath = path.join(__dirname, `${commandName}.js`)
    
    try {
        if (fs.existsSync(filePath)) {
            commands[commandName] = require(`./${commandName}`)
            console.log(`✅ Loaded: ${commandName}`)
        } else {
            console.log(`⚠️ Missing: ${commandName}.js`)
        }
    } catch (error) {
        console.error(`❌ Error loading ${commandName}:`, error.message)
    }
})

console.log(`📋 Total commands loaded: ${Object.keys(commands).length}`)

module.exports = commands
