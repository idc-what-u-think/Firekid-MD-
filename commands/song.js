const axios = require('axios');

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
        let videoId = '';
        
        try {
            const searchResponse = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(songInput + ' audio')}`, {
                timeout: 15000
            });
            
            const videoIdMatch = searchResponse.data.match(/"videoId":"([^"]+)"/);
            
            if (!videoIdMatch) {
                return await sock.sendMessage(context.from, { 
                    text: '❌ Song not found. Please try a different search term.' 
                }, { quoted: msg });
            }
            
            videoId = videoIdMatch[1];
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            
            await sock.sendMessage(context.from, { 
                text: '⏳ Downloading song...' 
            }, { quoted: msg });
            
            try {
                const downloadResponse = await axios.get(`https://api.cobalt.tools/api/json`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    data: {
                        url: videoUrl,
                        isAudioOnly: true,
                        aFormat: 'mp3'
                    },
                    timeout: 30000
                });
                
                if (downloadResponse.data && downloadResponse.data.url) {
                    downloadUrl = downloadResponse.data.url;
                }
            } catch (error1) {
                console.log('Cobalt API failed, trying Y2Mate...');
                
                try {
                    const y2mateResponse = await axios.post('https://www.y2mate.com/mates/analyzeV2/ajax', 
                        `k_query=${encodeURIComponent(videoUrl)}&k_page=home&hl=en&q_auto=0`,
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'User-Agent': 'Mozilla/5.0'
                            },
                            timeout: 30000
                        }
                    );
                    
                    if (y2mateResponse.data && y2mateResponse.data.links && y2mateResponse.data.links.mp3) {
                        const audioKey = Object.keys(y2mateResponse.data.links.mp3)[0];
                        const kValue = y2mateResponse.data.links.mp3[audioKey].k;
                        
                        const convertResponse = await axios.post('https://www.y2mate.com/mates/convertV2/index',
                            `vid=${videoId}&k=${kValue}`,
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
                } catch (error2) {
                    console.log('Y2Mate failed, trying SaveFrom...');
                    
                    try {
                        const saveFromResponse = await axios.get(`https://yt1s.com/api/ajaxSearch/index`, {
                            params: {
                                q: videoUrl,
                                vt: 'mp3'
                            },
                            timeout: 30000
                        });
                        
                        if (saveFromResponse.data && saveFromResponse.data.links && saveFromResponse.data.links.mp3) {
                            const mp3Links = saveFromResponse.data.links.mp3;
                            const bestQuality = Object.keys(mp3Links).find(key => mp3Links[key].q === '128kbps');
                            
                            if (bestQuality) {
                                const convertKey = mp3Links[bestQuality].k;
                                
                                const finalResponse = await axios.get(`https://yt1s.com/api/ajaxConvert/convert`, {
                                    params: {
                                        vid: videoId,
                                        k: convertKey
                                    },
                                    timeout: 30000
                                });
                                
                                if (finalResponse.data && finalResponse.data.dlink) {
                                    downloadUrl = finalResponse.data.dlink;
                                }
                            }
                        }
                    } catch (error3) {
                        throw new Error('All download APIs failed');
                    }
                }
            }
            
            songTitle = songInput;
            
        } catch (error) {
            throw error;
        }
        
        if (!downloadUrl) {
            return await sock.sendMessage(context.from, { 
                text: '❌ Failed to get download link. Please try again later.' 
            }, { quoted: msg });
        }

        await sock.sendMessage(context.from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.mp3`
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
