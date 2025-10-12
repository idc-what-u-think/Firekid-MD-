const https = require('https');
const fs = require('fs');
const path = require('path');

const commandList = [
    'sudo', 'warn', 'resetwarning', 'allowdomain', 'menu', 'ping', 'alive',
    'vv', 'delete', 'kick', 'tagall', 'promote', 'mute', 'unmute', 'left',
    'tag', 'join', 'setgrppp', 'antilnk', 'sticker', 'toimg', 'filter',
    'country', 'kill', 'online', 'block', 'ttdownload', 'song', 'lyrics',
    'weather', 'movie', 'private', 'update'
];

const fetchFileFromGitHub = (token, owner, repo, filePath, branch = 'main') => {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
        
        const options = {
            headers: {
                'User-Agent': 'WhatsApp-Bot',
                'Accept': 'application/vnd.github.v3.raw',
                'Authorization': `token ${token}`
            }
        };
        
        https.get(apiUrl, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`GitHub API returned ${res.statusCode} for ${filePath}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

const parseRepoUrl = (repoUrl) => {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!match) throw new Error('Invalid GitHub repository URL');
    return { owner: match[1], repo: match[2] };
};

const loadCommands = async (githubToken, repoUrl) => {
    const commands = {};
    const { owner, repo } = parseRepoUrl(repoUrl);
    const tempDir = path.join(__dirname, '..', 'temp_commands');
    
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    for (const commandName of commandList) {
        try {
            const fileName = `${commandName}.js`;
            console.log(`📥 Fetching ${fileName}...`);
            
            const content = await fetchFileFromGitHub(githubToken, owner, repo, `commands/${fileName}`);
            
            const tempFilePath = path.join(tempDir, fileName);
            fs.writeFileSync(tempFilePath, content, 'utf8');
            
            delete require.cache[require.resolve(tempFilePath)];
            
            const loadedCommand = require(tempFilePath);
            commands[commandName] = loadedCommand;
            
            console.log(`✅ Loaded: ${commandName}`);
        } catch (error) {
            console.error(`❌ Failed to load ${commandName}: ${error.message}`);
        }
    }
    
    console.log(`📦 Total commands loaded: ${Object.keys(commands).length}`);
    return commands;
};

const reloadCommandsFromGitHub = async (githubToken, repoUrl) => {
    console.log('🔄 Reloading commands from GitHub...');
    return await loadCommands(githubToken, repoUrl);
};

module.exports = {
    loadCommands,
    reloadCommandsFromGitHub,
    commandList
};
