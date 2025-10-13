const axios = require('axios');

const SPOTIFY_KEYS = [
    '21713c9b31msh4812fb7a7b6ea42p17ebfajsn789ce0fb9cef',
    'da029cc853mshe5096f12a6929abp15279cjsne19de2899b9f'
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
        let spotifyTrackId = null;

        if (input.includes('spotify.com/track/')) {
            spotifyTrackId = input.split('spotify.com/track/')[1].split('?')[0];
        } else if (input.includes('open.spotify.com')) {
            spotifyTrackId = input.split('/track/')[1]?.split('?')[0];
        } else {
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
                songId: spotifyTrackId
            },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'spotify-downloader9.p.rapidapi.com'
            },
            timeout: 30000
        });

        let downloadUrl = null;

        if (downloadResponse.data && downloadResponse.data.data && downloadResponse.data.data.downloadLink) {
            downloadUrl = downloadResponse.data.data.downloadLink;
        } else if (downloadResponse.data && downloadResponse.data.link) {
            downloadUrl = downloadResponse.data.link;
        } else if (downloadResponse.data && downloadResponse.data.url) {
            downloadUrl = downloadResponse.data.url;
        } else if (downloadResponse.data && downloadResponse.data.downloadUrl) {
            downloadUrl = downloadResponse.data.downloadUrl;
        }

        if (!downloadUrl) {
            console.log('Full response:', JSON.stringify(downloadResponse.data));
            
            const trackTitle = downloadResponse.data.data?.title || 'Unknown';
            const trackArtist = downloadResponse.data.data?.artist || 'Unknown';
            
            return await sock.sendMessage(context.from, { 
                text: `ℹ️ Song found: ${trackTitle}\n👤 By: ${trackArtist}\n\n❌ Download not available.` 
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
