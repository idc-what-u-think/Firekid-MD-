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
        const videoId = video.videoId;
        const songTitle = video.title;
        const artist = video.author.name;
        const thumbnail = video.thumbnail;
        const duration = video.timestamp;
        
        await sock.sendMessage(context.from, { 
            text: `⏳ Downloading: ${songTitle}\n👤 By: ${artist}\n⏱️ Duration: ${duration}` 
        }, { quoted: msg });
        
        let downloadUrl = null;
        
        try {
            const response = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.yt-download.org/api/button/mp3/${videoId}`)}`, {
                timeout: 30000
            });
            
            if (response.data && typeof response.data === 'string') {
                const urlMatch = response.data.match(/https?:\/\/[^\s"']+\.mp3/);
                if (urlMatch) {
                    downloadUrl = urlMatch[0];
                }
            }
        } catch (error1) {
            console.log('YT-Download failed, trying Y2Mate alternative...');
            
            try {
                const response2 = await axios.get(`https://api-cdn.y2mate.com/api/getWish`, {
                    params: {
                        url: videoUrl,
                        t: Date.now()
                    },
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    },
                    timeout: 30000
                });
                
                if (response2.data && response2.data.data && response2.data.data.audio) {
                    const audioFormats = response2.data.data.audio;
                    const mp3Format = Object.values(audioFormats).find(f => f.f === 'mp3');
                    
                    if (mp3Format && mp3Format.k) {
                        const convertResponse = await axios.post('https://backend.y2mate.com/mates/convertV2/index', 
                            new URLSearchParams({
                                vid: videoId,
                                k: mp3Format.k
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
                }
            } catch (error2) {
                console.log('Y2Mate failed, trying loader.to...');
                
                try {
                    const response3 = await axios.post('https://ab.cococococ.com/ajax/download.php',
                        new URLSearchParams({
                            copyright: 'undefined',
                            format: 'mp3',
                            url: videoUrl,
                            api: 'dfcb6d76f2f6a9894gjkege8a4ab232222'
                        }),
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'User-Agent': 'Mozilla/5.0'
                            },
                            timeout: 30000
                        }
                    );
                    
                    if (response3.data && response3.data.success && response3.data.url) {
                        downloadUrl = response3.data.url;
                    }
                } catch (error3) {
                    console.log('Loader.to failed, trying ytdl API...');
                    
                    try {
                        const response4 = await axios.get(`https://youtube-mp36.p.rapidapi.com/dl`, {
                            params: {
                                id: videoId
                            },
                            headers: {
                                'X-RapidAPI-Key': '21713c9b31msh4812fb7a7b6ea42p17ebfajsn789ce0fb9cef',
                                'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
                            },
                            timeout: 30000
                        });
                        
                        if (response4.data && response4.data.link) {
                            downloadUrl = response4.data.link;
                        }
                    } catch (error4) {
                        throw new Error('All download methods failed');
                    }
                }
            }
        }
        
        if (!downloadUrl) {
            return await sock.sendMessage(context.from, { 
                text: `❌ Failed to download. Here's the YouTube link:\n\n🎵 *${songTitle}*\n👤 ${artist}\n⏱️ ${duration}\n\n🔗 ${videoUrl}` 
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
