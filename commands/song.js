const axios = require('axios');

const song = async (sock, msg, args, context) => {
    if (!args[0]) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Please provide a song name or Spotify URL\n\nExamples:\n${context.prefix}song Shape of You\n${context.prefix}song https://open.spotify.com/track/...` 
        }, { quoted: msg });
    }
    
    try {
        await sock.sendMessage(context.from, { 
            text: '⏳ Searching for song...' 
        }, { quoted: msg });
        
        const songInput = args.join(' ');
        let downloadUrl = null;
        let songTitle = '';
        let songArtist = '';
        let thumbnail = '';
        
        const isSpotifyUrl = songInput.includes('spotify.com');
        
        if (isSpotifyUrl) {
            try {
                const response = await axios.get(`https://api.fabdl.com/spotify/get?url=${encodeURIComponent(songInput)}`, {
                    timeout: 30000
                });
                
                if (response.data && response.data.result) {
                    downloadUrl = response.data.result.download_url;
                    songTitle = response.data.result.name || 'Unknown Title';
                    songArtist = response.data.result.artists || 'Unknown Artist';
                    thumbnail = response.data.result.image;
                }
            } catch (error) {
                console.log('FabDL failed, trying alternative...');
                
                try {
                    const response2 = await axios.get(`https://api.spotifydown.com/download/${songInput.split('/track/')[1]?.split('?')[0]}`, {
                        timeout: 30000
                    });
                    
                    if (response2.data && response2.data.link) {
                        downloadUrl = response2.data.link;
                        songTitle = response2.data.metadata?.title || 'Unknown Title';
                        songArtist = response2.data.metadata?.artists || 'Unknown Artist';
                        thumbnail = response2.data.metadata?.cover;
                    }
                } catch (error2) {
                    throw new Error('Failed to download from Spotify URL');
                }
            }
        } else {
            try {
                const searchResponse = await axios.get(`https://api.fabdl.com/spotify/search?q=${encodeURIComponent(songInput)}`, {
                    timeout: 30000
                });
                
                if (!searchResponse.data || !searchResponse.data.result || searchResponse.data.result.length === 0) {
                    return await sock.sendMessage(context.from, { 
                        text: '❌ Song not found. Please try a different search term.' 
                    }, { quoted: msg });
                }
                
                const firstResult = searchResponse.data.result[0];
                songTitle = firstResult.name || 'Unknown Title';
                songArtist = firstResult.artists || 'Unknown Artist';
                thumbnail = firstResult.image;
                
                await sock.sendMessage(context.from, { 
                    text: `⏳ Downloading: ${songTitle} by ${songArtist}...` 
                }, { quoted: msg });
                
                const downloadResponse = await axios.get(`https://api.fabdl.com/spotify/get?url=${encodeURIComponent(firstResult.id)}`, {
                    timeout: 30000
                });
                
                if (downloadResponse.data && downloadResponse.data.result) {
                    downloadUrl = downloadResponse.data.result.download_url;
                }
            } catch (error) {
                console.log('FabDL search failed, trying YouTube alternative...');
                
                try {
                    const ytSearchResponse = await axios.get(`https://api.popcat.xyz/spotify?q=${encodeURIComponent(songInput)}`, {
                        timeout: 30000
                    });
                    
                    if (ytSearchResponse.data && ytSearchResponse.data[0]) {
                        const track = ytSearchResponse.data[0];
                        songTitle = track.title;
                        songArtist = track.artist;
                        thumbnail = track.image;
                        
                        const ytDownload = await axios.get(`https://api.popcat.xyz/youtube/download?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${track.id}`)}`, {
                            timeout: 30000
                        });
                        
                        if (ytDownload.data && ytDownload.data.url) {
                            downloadUrl = ytDownload.data.url;
                        }
                    }
                } catch (error2) {
                    throw new Error('All search methods failed');
                }
            }
        }
        
        if (!downloadUrl) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Failed to get download link. Please try again later.' 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.mp3`,
            contextInfo: thumbnail ? {
                externalAdReply: {
                    title: songTitle,
                    body: songArtist,
                    thumbnailUrl: thumbnail,
                    mediaType: 2,
                    mediaUrl: downloadUrl
                }
            } : undefined
        }, { quoted: msg });
        
    } catch (error) {
        console.error('Error in song command:', error.message);
        
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to download song. Please try again later or check if the link is valid.' 
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'song',
    handler: song
};
