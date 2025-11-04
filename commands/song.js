const axios = require('axios');

const RAPIDAPI_KEYS = [
    '21713c9b31msh4812fb7a7b6ea42p17ebfajsn789ce0fb9cef',
    'da029cc853mshe5096f12a6929abp15279cjsne19de2899b9f'
];

let keyIndex = 0;

const getNextKey = () => {
    const key = RAPIDAPI_KEYS[keyIndex];
    keyIndex = (keyIndex + 1) % RAPIDAPI_KEYS.length;
    return key;
};

const extractSpotifyId = (input) => {
    // Handle different Spotify URL formats
    const patterns = [
        /spotify\.com\/track\/([a-zA-Z0-9]+)/,
        /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) return match[1];
    }
    
    return null;
};

const song = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a Spotify link\n\nExample:\n${context.prefix}song https://open.spotify.com/track/...` 
        }, { quoted: msg });
    }
    
    try {
        const input = args.join(' ');
        let spotifyTrackId = extractSpotifyId(input);

        // If no track ID found in URL, reject
        if (!spotifyTrackId) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Please provide a valid Spotify track link\n\nExample: https://open.spotify.com/track/...' 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, { 
            text: '⏳ Downloading from Spotify...' 
        }, { quoted: msg });

        // Get download link using RapidAPI
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

        // Extract download URL from various possible response formats
        let downloadUrl = null;
        let trackTitle = 'Unknown';
        let trackArtist = 'Unknown';

        if (downloadResponse.data) {
            const data = downloadResponse.data;
            
            // Try different possible paths for download URL
            downloadUrl = data.data?.downloadLink || 
                         data.link || 
                         data.url || 
                         data.downloadUrl ||
                         data.data?.url;

            // Extract track info
            trackTitle = data.data?.title || data.title || 'Unknown';
            trackArtist = data.data?.artist || data.artist || 'Unknown';
        }

        if (!downloadUrl) {
            console.log('API Response:', JSON.stringify(downloadResponse.data, null, 2));
            
            return await sock.sendMessage(context.from, { 
                text: `ℹ️ Song found: ${trackTitle}\n👤 By: ${trackArtist}\n\n❌ Download link not available. The API may be experiencing issues.` 
            }, { quoted: msg });
        }

        // Send the audio file
        await sock.sendMessage(context.from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${trackTitle} - ${trackArtist}.mp3`.replace(/[/\\?%*:|"<>]/g, '-')
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in song command:', error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }

        let errorMessage = '❌ Failed to download song';
        
        // Provide specific error messages
        if (error.code === 'ECONNABORTED') {
            errorMessage = '❌ Request timed out. Please try again.';
        } else if (error.response?.status === 429) {
            errorMessage = '❌ Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.response?.status === 404) {
            errorMessage = '❌ Song not found on Spotify.';
        } else if (error.response?.status === 403) {
            errorMessage = '❌ API access denied. Please try again later.';
        } else {
            errorMessage = `❌ Failed to download: ${error.message}`;
        }
        
        return await sock.sendMessage(context.from, { 
            text: errorMessage 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'song',
    handler: song
};
