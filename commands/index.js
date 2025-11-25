const https = require('https');
const fs = require('fs');
const path = require('path');

const commandList = [
    'sudo', 'warn', 'resetwarning', 'allowdomain', 'menu', 'ping', 'alive',
    'vv', 'delete', 'kick', 'tagall', 'promote', 'mute', 'unmute', 'left',
    'tag', 'welcome', 'setgrppp', 'antilink', 'sticker', 'toimg', 'filter',
    'country', 'kill', 'online', 'block', 'ttdownload', 'song', 'lyrics',
    'weather', 'movie', 'private', 'update', 'guess', 'wcg', 'quiz'
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
    
    let loadedCount = 0;
    
    for (const commandName of commandList) {
        try {
            const fileName = `${commandName}.js`;
            
            const content = await fetchFileFromGitHub(githubToken, owner, repo, `commands/${fileName}`);
            
            const tempFilePath = path.join(tempDir, fileName);
            fs.writeFileSync(tempFilePath, content, 'utf8');
            
            delete require.cache[require.resolve(tempFilePath)];
            
            const command = require(tempFilePath);
            
            // Pattern 1: Standard export with command and handler
            if (command && command.command && command.handler) {
                commands[command.command] = command;
                loadedCount++;
            }
            // Pattern 2: Direct handler export
            else if (command && command.handler) {
                commands[commandName] = command;
                loadedCount++;
            }
            // Pattern 3: Multiple direct function exports (like block.js)
            else if (command && typeof command === 'object') {
                let hasValidExport = false;
                
                for (const [key, value] of Object.entries(command)) {
                    if (typeof value === 'function') {
                        // Direct function export
                        commands[key] = { 
                            command: key, 
                            handler: value,
                            ...command // Preserve other exports
                        };
                        loadedCount++;
                        hasValidExport = true;
                    } else if (value && typeof value === 'object' && value.handler) {
                        // Nested object with handler
                        commands[key] = value;
                        loadedCount++;
                        hasValidExport = true;
                    }
                }
                
                // Keep the full command object accessible too
                if (hasValidExport) {
                    commands[commandName] = command;
                }
            }
            // Pattern 4: Direct function export
            else if (typeof command === 'function') {
                commands[commandName] = { command: commandName, handler: command };
                loadedCount++;
            }
            
        } catch (error) {
            // Silent error handling
        }
    }
    
    console.log(`✅ ${loadedCount} plugins loaded`);
    return commands;
};

const reloadCommandsFromGitHub = async (githubToken, repoUrl) => {
    console.log('🔄 Reloading commands...');
    return await loadCommands(githubToken, repoUrl);
};

module.exports = {
    loadCommands,
    reloadCommandsFromGitHub,
    commandList
};
