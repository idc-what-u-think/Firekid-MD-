const axios = require('axios');

const spotifyApis = [
    {
        host: 'spotify-downloader9.p.rapidapi.com',
        key: 'cc55783228msh1f7f79520170cecp1273ecjsn871a52b845c7'
    },
    {
        host: 'spotify-downloader9.p.rapidapi.com',
        key: '3a4532559dmsh2d32efab5354e28p16c43djsn2d47c231e588'
    },
    {
        host: 'spotify-downloader9.p.rapidapi.com',
        key: '926738c8e1mshefb92a5bc1fe6a0p1a55a3jsn1830795de8b5'
    }
];

let currentApiIndex = 0;

const getNextApi = () => {
    const api = spotifyApis[currentApiIndex];
    currentApiIndex = (currentApiIndex + 1) % spotifyApis.length;
    return api;
};

const searchSpotify = async (songName) => {
    const api = getNextApi();
    
    try {
        const response = await axios.get(
            `https://${api.host}/search`,
            {
                params: { q: songName },
                headers: {
                    'x-rapidapi-key': api.key,
                    'x-rapidapi-host': api.host
                },
                timeout: 10000
            }
        );

        if (response.data && response.data.tracks && response.data.tracks.length > 0) {
            return response.data.tracks[0];
        }

        return null;
    } catch (error) {
        console.error('Search error:', error.message);
        return null;
    }
};

const downloadSong = async (spotifyUrl) => {
    const api = getNextApi();
    
    try {
        const response = await axios.get(
            `https://${api.host}/downloadSong`,
            {
                params: { songId: spotifyUrl },
                headers: {
                    'x-rapidapi-key': api.key,
                    'x-rapidapi-host': api.host
                },
                timeout: 15000
            }
        );

        if (response.data && response.data.link) {
            return response.data.link;
        }

        if (response.data && response.data.url) {
            return response.data.url;
        }

        if (response.data && typeof response.data === 'string' && response.data.startsWith('http')) {
            return response.data;
        }

        return null;
    } catch (error) {
        console.error('Download error:', error.message);
        return null;
    }
};

const song = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a song name\n\nExample: ${context.prefix}song Shape of You Ed Sheeran` 
        }, { quoted: msg });
    }
    
    try {
        await sock.sendMessage(context.from, { 
            text: '⏳ Searching for song...' 
        }, { quoted: msg });
        
        const songName = args.join(' ');
        const songData = await searchSpotify(songName);
        
        if (!songData) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Song not found. Please try a different search term.' 
            }, { quoted: msg });
        }

        if (!songData.link) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Invalid song data received. Please try again.' 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, { 
            text: '⏳ Downloading song...' 
        }, { quoted: msg });

        const downloadLink = await downloadSong(songData.link);
        
        if (!downloadLink) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Failed to get song download link. Please try again.' 
            }, { quoted: msg });
        }

        const audioMessage = {
            audio: { url: downloadLink },
            mimetype: 'audio/mpeg',
            fileName: `${songData.title || 'song'}.mp3`
        };

        if (songData.image) {
            try {
                audioMessage.contextInfo = {
                    externalAdReply: {
                        title: songData.title || 'Unknown Title',
                        body: songData.artist || 'Unknown Artist',
                        thumbnailUrl: songData.image,
                        sourceUrl: downloadLink,
                        mediaType: 1,
                        showAdAttribution: false
                    }
                };
            } catch (thumbError) {
                console.error('Thumbnail error:', thumbError.message);
            }
        }

        await sock.sendMessage(context.from, audioMessage, { quoted: msg });
        
    } catch (error) {
        console.error('Error in song command:', error.message);
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Request timed out. Please try again.' 
            }, { quoted: msg });
        }
        
        if (error.response) {
            return await sock.sendMessage(context.from, { 
                text: `❌ API error: ${error.response.status}. Please try again later.` 
            }, { quoted: msg });
        }
        
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to download song. Please try again later.' 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'song',
    handler: song
};
