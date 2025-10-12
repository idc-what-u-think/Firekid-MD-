const fs = require('fs');
const path = require('path');
const axios = require('axios');

const commandList = [
    'sudo', 'warn', 'resetwarning', 'allowdomain', 'menu', 'ping', 'alive', 
    'vv', 'delete', 'kick', 'tagall', 'promote', 'mute', 'unmute', 'left', 
    'tag', 'join', 'setgrppp', 'antilnk', 'sticker', 'toimg', 'filter', 
    'country', 'kill', 'online', 'block', 'ttdownload', 'song', 'lyrics', 
    'weather', 'movie', 'private', 'update'
];

const loadCommandsLocal = async () => {
    const commands = {};
    
    commandList.forEach(commandName => {
        const filePath = path.join(__dirname, `../${commandName}.js`);
        try {
            if (fs.existsSync(filePath)) {
                delete require.cache[require.resolve(filePath)];
                commands[commandName] = require(filePath);
                console.log(`✅ Loaded: ${commandName}`);
            } else {
                console.log(`⚠️ Missing: ${commandName}.js`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${commandName}:`, error.message);
        }
    });
    
    console.log(`📋 Total commands loaded: ${Object.keys(commands).length}`);
    return commands;
};

const loadCommandsFromGitHub = async (githubToken, githubRepo) => {
    const commands = {};
    const repoUrl = githubRepo.replace('https://github.com/', '').replace('.git', '');
    
    for (const commandName of commandList) {
        try {
            const apiUrl = `https://api.github.com/repos/${repoUrl}/contents/commands/${commandName}.js`;
            
            const response = await axios.get(apiUrl, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3.raw'
                },
                timeout: 10000
            });
            
            const tempFile = path.join(__dirname, `../../tmp_${commandName}.js`);
            fs.writeFileSync(tempFile, response.data);
            
            delete require.cache[require.resolve(tempFile)];
            commands[commandName] = require(tempFile);
            
            fs.unlinkSync(tempFile);
            console.log(`✅ Updated: ${commandName}`);
        } catch (error) {
            console.error(`⚠️ Failed to update ${commandName}:`, error.message);
        }
    }
    
    console.log(`📋 Total commands updated: ${Object.keys(commands).length}`);
    return commands;
};

const loadCommands = async (githubToken, githubRepo, fromGitHub = false) => {
    if (fromGitHub) {
        return await loadCommandsFromGitHub(githubToken, githubRepo);
    }
    return await loadCommandsLocal();
};

module.exports = {
    loadCommands,
    loadCommandsLocal,
    loadCommandsFromGitHub
};
