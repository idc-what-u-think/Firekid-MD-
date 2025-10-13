const axios = require('axios');

const SPOTIFY_KEYS = [
    'cc55783228msh1f7f79520170cecp1273ecjsn871a52b845c7',
    '926738c8e1mshefb92a5bc1fe6a0p1a55a3jsn1830795de8b5',
    '3a4532559dmsh2d32efab5354e28p16c43djsn2d47c231e588'
];

let keyIndex = 0;

const getNextKey = () => {
    const key = SPOTIFY_KEYS[keyIndex];
    keyIndex = (keyIndex + 1) % SPOTIFY_KEYS.length;
    return key;
};

const song = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a Spotify link or song name\n\nExamples:\n${context.prefix}song https://open.spotify.com/track/...\n${context.prefix}song Shape of You Ed Sheeran` 
        }, { quoted: msg });
    }
    
    try {
        const input = args.join(' ');
        let spotifyUrl = input;

        if (!input.includes('spotify.com')) {
            await sock.sendMessage(context.from, { 
                text: '🔍 Searching Spotify...' 
            }, { quoted: msg });

            const apiKey = getNextKey();
            
            const searchResponse = await axios.get('https://spotify-downloader9.p.rapidapi.com/downloader/search', {
                params: {
                    query: input
                },
                headers: {
                    'x-rapidapi-key': apiKey,
                    'x-rapidapi-host': 'spotify-downloader9.p.rapidapi.com'
                },
                timeout: 15000
            });

            if (!searchResponse.data || !searchResponse.data.success || !searchResponse.data.data || searchResponse.data.data.length === 0) {
                return await sock.sendMessage(context.from, { 
                    text: `❌ Song not found on Spotify: "${input}"` 
                }, { quoted: msg });
            }

            spotifyUrl = searchResponse.data.data[0].uri;
        }

        await sock.sendMessage(context.from, { 
            text: '⏳ Downloading song...' 
        }, { quoted: msg });

        const apiKey = getNextKey();

        const downloadResponse = await axios.get('https://spotify-downloader9.p.rapidapi.com/downloadSong', {
            params: {
                songId: spotifyUrl
            },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'spotify-downloader9.p.rapidapi.com'
            },
            timeout: 30000
        });

        let downloadUrl = null;

        if (downloadResponse.data && downloadResponse.data.link) {
            downloadUrl = downloadResponse.data.link;
        } else if (downloadResponse.data && downloadResponse.data.url) {
            downloadUrl = downloadResponse.data.url;
        } else if (downloadResponse.data && downloadResponse.data.downloadUrl) {
            downloadUrl = downloadResponse.data.downloadUrl;
        }

        if (!downloadUrl) {
            console.log('Download response:', JSON.stringify(downloadResponse.data).substring(0, 200));
            return await sock.sendMessage(context.from, { 
                text: '❌ Could not get download link. Try again later.' 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: 'song.mp3'
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in song command:', error.message);
        
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to download: ${error.message}` 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'song',
    handler: song
};
