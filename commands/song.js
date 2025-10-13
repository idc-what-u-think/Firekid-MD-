const axios = require('axios');
const ytSearch = require('yt-search');
const { YTMusic } = require('ytmusic-api');

const ytmusic = new YTMusic();
let ytmusicInitialized = false;

const RAPIDAPI_KEYS = [
    '926738c8e1mshefb92a5bc1fe6a0p1a55a3jsn1830795de8b5',
    'cc55783228msh1f7f79520170cecp1273ecjsn871a52b845c7',
    '3a4532559dmsh2d32efab5354e28p16c43djsn2d47c231e588'
];

let currentKeyIndex = 0;

const getNextKey = () => {
    const key = RAPIDAPI_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % RAPIDAPI_KEYS.length;
    return key;
};

const song = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a song name\n\nExample:\n${context.prefix}song Shape of You` 
        }, { quoted: msg });
    }
    
    try {
        await sock.sendMessage(context.from, { 
            text: '⏳ Searching for song...' 
        }, { quoted: msg });
        
        const songInput = args.join(' ');
        let downloadUrl = null;
        let songTitle = '';
        let artist = '';
        let thumbnail = '';
        let videoId = '';
        
        if (!ytmusicInitialized) {
            await ytmusic.initialize();
            ytmusicInitialized = true;
        }
        
        try {
            const ytmusicResults = await ytmusic.searchSongs(songInput);
            
            if (ytmusicResults && ytmusicResults.length > 0) {
                const track = ytmusicResults[0];
                videoId = track.videoId;
                songTitle = track.name;
                artist = track.artist?.name || 'Unknown Artist';
                thumbnail = track.thumbnails?.[0]?.url || '';
                
                await sock.sendMessage(context.from, { 
                    text: `⏳ Downloading: ${songTitle}\n👤 By: ${artist}` 
                }, { quoted: msg });
                
                const apiKey = getNextKey();
                
                try {
                    const rapidResponse = await axios.get('https://yt-search-and-download-mp3.p.rapidapi.com/mp3', {
                        params: { id: videoId },
                        headers: {
                            'x-rapidapi-key': apiKey,
                            'x-rapidapi-host': 'yt-search-and-download-mp3.p.rapidapi.com'
                        },
                        timeout: 30000
                    });
                    
                    if (rapidResponse.data && rapidResponse.data.downloadUrl) {
                        downloadUrl = rapidResponse.data.downloadUrl;
                    } else if (rapidResponse.data && rapidResponse.data.link) {
                        downloadUrl = rapidResponse.data.link;
                    }
                } catch (rapidError) {
                    console.log('RapidAPI failed, trying alternatives...');
                }
            }
        } catch (ytmusicError) {
            console.log('YTMusic failed, falling back to yt-search...');
        }
        
        if (!downloadUrl) {
            try {
                const searchResults = await ytSearch(songInput + ' audio');
                
                if (searchResults && searchResults.videos && searchResults.videos.length > 0) {
                    const video = searchResults.videos[0];
                    videoId = video.videoId;
                    songTitle = video.title;
                    artist = video.author.name;
                    thumbnail = video.thumbnail;
                    
                    await sock.sendMessage(context.from, { 
                        text: `⏳ Downloading: ${songTitle}\n👤 By: ${artist}` 
                    }, { quoted: msg });
                    
                    const apiKey = getNextKey();
                    
                    const rapidResponse = await axios.get('https://yt-search-and-download-mp3.p.rapidapi.com/mp3', {
                        params: { id: videoId },
                        headers: {
                            'x-rapidapi-key': apiKey,
                            'x-rapidapi-host': 'yt-search-and-download-mp3.p.rapidapi.com'
                        },
                        timeout: 30000
                    });
                    
                    if (rapidResponse.data && rapidResponse.data.downloadUrl) {
                        downloadUrl = rapidResponse.data.downloadUrl;
                    } else if (rapidResponse.data && rapidResponse.data.link) {
                        downloadUrl = rapidResponse.data.link;
                    }
                }
            } catch (ytSearchError) {
                console.log('YT-Search also failed, trying SoundCloud...');
            }
        }
        
        if (!downloadUrl) {
            try {
                const scResponse = await axios.get(`https://api-v2.soundcloud.com/search`, {
                    params: {
                        q: songInput,
                        client_id: 'a3e059563d7fd3372b49b37f00a00bcf',
                        limit: 1
                    },
                    timeout: 30000
                });
                
                if (scResponse.data && scResponse.data.collection && scResponse.data.collection.length > 0) {
                    const track = scResponse.data.collection[0];
                    
                    if (track.kind === 'track') {
                        songTitle = track.title;
                        artist = track.user.username;
                        thumbnail = track.artwork_url;
                        
                        const scDownload = await axios.get(`https://api.soundcloudmp3.org/track`, {
                            params: { url: track.permalink_url },
                            timeout: 30000
                        });
                        
                        if (scDownload.data && scDownload.data.url) {
                            downloadUrl = scDownload.data.url;
                        }
                    }
                }
            } catch (scError) {
                console.log('SoundCloud also failed');
            }
        }
        
        if (!downloadUrl) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Failed to download song. Try again later or search on YouTube:\n\n🎵 ${songTitle || songInput}` 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.mp3`,
            contextInfo: thumbnail ? {
                externalAdReply: {
                    title: songTitle,
                    body: artist,
                    thumbnailUrl: thumbnail,
                    mediaType: 2,
                    mediaUrl: `https://music.youtube.com/watch?v=${videoId}`
                }
            } : undefined
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in song command:', error.message);
        
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to download song. Please try again later.' 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'song',
    handler: song
};
