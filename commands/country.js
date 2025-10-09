const activeGames = new Map();

const continents = {
    'Africa': [
        'Nigeria', 'Kenya', 'Egypt', 'South Africa', 'Morocco', 'Ghana', 'Ethiopia', 
        'Algeria', 'Uganda', 'Tanzania', 'Libya', 'Tunisia', 'Sudan', 'Angola', 
        'Cameroon', 'Madagascar', 'Ivory Coast', 'Niger', 'Burkina Faso', 'Mali'
    ],
    'Asia': [
        'China', 'India', 'Japan', 'South Korea', 'Thailand', 'Vietnam', 'Indonesia', 
        'Malaysia', 'Philippines', 'Singapore', 'Pakistan', 'Bangladesh', 'Iran', 
        'Iraq', 'Saudi Arabia', 'Turkey', 'Israel', 'Jordan', 'Lebanon', 'Syria'
    ],
    'Europe': [
        'France', 'Germany', 'Italy', 'Spain', 'United Kingdom', 'Russia', 'Poland', 
        'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 
        'Denmark', 'Finland', 'Portugal', 'Greece', 'Czech Republic', 'Hungary', 'Romania'
    ],
    'North America': [
        'United States', 'Canada', 'Mexico', 'Guatemala', 'Honduras', 'El Salvador', 
        'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Jamaica', 'Haiti', 
        'Dominican Republic', 'Belize', 'Bahamas', 'Trinidad and Tobago'
    ],
    'South America': [
        'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Venezuela', 'Ecuador', 
        'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname', 'French Guiana'
    ],
    'Oceania': [
        'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga'
    ]
};

const countryGame = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This game can only be played in groups' 
        }, { quoted: msg });
    }

    const chatId = context.from;
    
    if (activeGames.has(chatId)) {
        return await sock.sendMessage(context.from, { 
            text: '🎮 A game is already active in this group!' 
        }, { quoted: msg });
    }

    const game = {
        players: [],
        phase: 'joining',
        currentPlayer: 0,
        round: 1,
        continent: '',
        usedCountries: [],
        timer: null,
        countdownTimer: null
    };

    activeGames.set(chatId, game);

    await sock.sendMessage(context.from, { 
        text: '🌍 *Country Game Started!*\n\nType *join* to enter the game\n⏰ You have 60 seconds to join' 
    }, { quoted: msg });

    let timeLeft = 60;
    
    const countdown = setInterval(async () => {
        timeLeft -= 15;
        
        if (timeLeft === 45) {
            await sock.sendMessage(context.from, { 
                text: '⏰ 45 seconds left to join' 
            });
        } else if (timeLeft === 30) {
            await sock.sendMessage(context.from, { 
                text: '⏰ 30 seconds left to join' 
            });
        } else if (timeLeft === 15) {
            await sock.sendMessage(context.from, { 
                text: '⏰ 15 seconds left to join' 
            });
        } else if (timeLeft <= 0) {
            clearInterval(countdown);
            await startGame(sock, context.from);
        }
    }, 15000);

    game.countdownTimer = countdown;

    setTimeout(async () => {
        for (let i = 5; i >= 1; i--) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sock.sendMessage(context.from, { text: i.toString() });
        }
    }, 55000);
};

const joinGame = async (sock, msg, context) => {
    const chatId = context.from;
    const game = activeGames.get(chatId);
    
    if (!game || game.phase !== 'joining') return;
    
    const userId = context.sender;
    if (game.players.some(p => p.id === userId)) {
        return;
    }
    
    const playerName = msg.pushName || 'Player';
    const senderNumber = context.sender.split('@')[0];
    
    game.players.push({
        id: userId,
        name: playerName,
        mention: `@${senderNumber}`
    });
    
    await sock.sendMessage(context.from, { 
        text: `✅ @${senderNumber} joined the game!\n👥 Total players: ${game.players.length}`,
        mentions: [userId]
    });
};

const startGame = async (sock, chatId) => {
    const game = activeGames.get(chatId);
    
    if (!game || game.players.length < 2) {
        if (game && game.countdownTimer) {
            clearInterval(game.countdownTimer);
        }
        activeGames.delete(chatId);
        return await sock.sendMessage(chatId, { 
            text: '❌ Need at least 2 players to start the game' 
        });
    }
    
    if (game.countdownTimer) {
        clearInterval(game.countdownTimer);
    }
    
    game.phase = 'playing';
    
    const playerList = game.players.map((p, i) => `${i + 1}. ${p.mention}`).join('\n');
    await sock.sendMessage(chatId, { 
        text: `🎮 *Game Starting!*\n\n👥 *Players:*\n${playerList}\n\nGet ready!`,
        mentions: game.players.map(p => p.id)
    });
    
    setTimeout(() => nextTurn(sock, chatId), 2000);
};

const nextTurn = async (sock, chatId) => {
    const game = activeGames.get(chatId);
    if (!game) return;
    
    if (game.players.length <= 1) {
        if (game.players.length === 1) {
            await sock.sendMessage(chatId, { 
                text: `🏆 *${game.players[0].mention} WON!*\n\nGGs, bro is him 🔥`,
                mentions: [game.players[0].id]
            });
        } else {
            await sock.sendMessage(chatId, { 
                text: '🎮 Game ended - no players left' 
            });
        }
        activeGames.delete(chatId);
        return;
    }
    
    const continentNames = Object.keys(continents);
    game.continent = continentNames[Math.floor(Math.random() * continentNames.length)];
    
    const currentPlayer = game.players[game.currentPlayer];
    const nextPlayerIndex = (game.currentPlayer + 1) % game.players.length;
    const nextPlayer = game.players[nextPlayerIndex];
    
    let timeLimit = 25;
    if (game.round >= 3) timeLimit = 20;
    if (game.round >= 5) timeLimit = 15;
    if (game.round >= 7) timeLimit = 10;
    
    await sock.sendMessage(chatId, { 
        text: `🎯 *Round ${game.round}*\n\n${currentPlayer.mention} mention a country in *${game.continent}*\n⏰ Time: ${timeLimit}s\n⏭️ Next: ${nextPlayer.mention}`,
        mentions: [currentPlayer.id, nextPlayer.id]
    });
    
    game.timer = setTimeout(async () => {
        await sock.sendMessage(chatId, { 
            text: `⏰ ${currentPlayer.mention} ran out of time!\n\nBetter luck next time 👋`,
            mentions: [currentPlayer.id]
        });
        
        game.players.splice(game.currentPlayer, 1);
        
        if (game.currentPlayer >= game.players.length) {
            game.currentPlayer = 0;
        }
        
        setTimeout(() => nextTurn(sock, chatId), 1000);
    }, timeLimit * 1000);
};

const checkAnswer = async (sock, msg, context) => {
    if (!context.isGroup) return;
    
    const chatId = context.from;
    const game = activeGames.get(chatId);
    
    const messageText = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || '';
    
    if (messageText.toLowerCase() === 'join') {
        return joinGame(sock, msg, context);
    }
    
    if (!game || game.phase !== 'playing') return;
    
    const currentPlayer = game.players[game.currentPlayer];
    if (context.sender !== currentPlayer.id) return;
    
    const userAnswer = messageText.trim();
    const validCountries = continents[game.continent];
    
    const isValidCountry = validCountries.some(country => 
        country.toLowerCase() === userAnswer.toLowerCase()
    );
    
    if (!isValidCountry) return;
    
    if (game.usedCountries.includes(userAnswer.toLowerCase())) {
        return;
    }
    
    game.usedCountries.push(userAnswer.toLowerCase());
    
    if (game.timer) {
        clearTimeout(game.timer);
        game.timer = null;
    }
    
    await sock.sendMessage(chatId, { 
        react: { text: '✅', key: msg.key } 
    });
    
    game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    
    if (game.currentPlayer === 0) {
        game.round++;
    }
    
    setTimeout(() => nextTurn(sock, chatId), 1500);
};

module.exports = {
    command: 'country',
    handler: countryGame,
    checkAnswer
};
