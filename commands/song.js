const axios = require('axios');
const ytSearch = require('yt-search');

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
        
        const searchResults = await ytSearch(songInput + ' audio');
        
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Song not found. Please try a different search term.' 
            }, { quoted: msg });
        }
        
        const video = searchResults.videos[0];
        const videoUrl = video.url;
        const songTitle = video.title;
        const artist = video.author.name;
        const thumbnail = video.thumbnail;
        const duration = video.timestamp;
        
        await sock.sendMessage(context.from, { 
            text: `⏳ Downloading: ${songTitle}\n👤 By: ${artist}\n⏱️ Duration: ${duration}` 
        }, { quoted: msg });
        
        let downloadUrl = null;
        
        try {
            const response = await axios.get(`https://api.downloadmp3.app/api/convert`, {
                params: {
                    url: videoUrl,
                    format: 'mp3'
                },
                timeout: 30000
            });
            
            if (response.data && response.data.downloadUrl) {
                downloadUrl = response.data.downloadUrl;
            }
        } catch (error1) {
            console.log('DownloadMP3 failed, trying alternative...');
            
            try {
                const videoId = videoUrl.split('v=')[1]?.split('&')[0];
                
                const response2 = await axios.post('https://mp3-download.to/api/ajax/search', {
                    query: videoUrl,
                    vt: 'mp3'
                }, {
                    timeout: 30000
                });
                
                if (response2.data && response2.data.url) {
                    downloadUrl = response2.data.url;
                }
            } catch (error2) {
                console.log('MP3Download.to failed, trying tomp3.cc...');
                
                try {
                    const response3 = await axios.post('https://tomp3.cc/api/ajax/search', 
                        new URLSearchParams({
                            query: videoUrl,
                            vt: 'mp3'
                        }),
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            timeout: 30000
                        }
                    );
                    
                    if (response3.data && response3.data.links && response3.data.links.mp3) {
                        const mp3Key = Object.keys(response3.data.links.mp3)[0];
                        
                        const convertResponse = await axios.post('https://tomp3.cc/api/ajax/convert',
                            new URLSearchParams({
                                vid: response3.data.vid,
                                k: response3.data.links.mp3[mp3Key].k
                            }),
                            {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                                timeout: 30000
                            }
                        );
                        
                        if (convertResponse.data && convertResponse.data.dlink) {
                            downloadUrl = convertResponse.data.dlink;
                        }
                    }
                } catch (error3) {
                    throw new Error('All download methods failed');
                }
            }
        }
        
        if (!downloadUrl) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Failed to download. Here's the YouTube link instead:\n${videoUrl}` 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: songTitle,
                    body: `${artist} • ${duration}`,
                    thumbnailUrl: thumbnail,
                    mediaType: 2,
                    mediaUrl: videoUrl
                }
            }
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
