const https = require('https');

const activeGames = new Map();

// Validate word using Dictionary API - just checks if word exists
const isValidWord = (word) => {
    return new Promise((resolve) => {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
        
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                resolve(false);
            }
            
            res.resume();
        }).on('error', () => {
            resolve(false);
        });
    });
};

const wordGame = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This game can only be played in groups' 
        }, { quoted: msg });
    }

    const chatId = context.from;
    
    if (activeGames.has(chatId)) {
        return await sock.sendMessage(context.from, { 
            text: '🎮 A word game is already active in this group!' 
        }, { quoted: msg });
    }

    const game = {
        players: [],
        phase: 'joining',
        currentPlayer: 0,
        round: 1,
        cycleCount: 0, // Track how many full cycles completed
        minLetters: 3, // Start with 3 letters
        currentLetter: '',
        usedWords: [],
        timer: null,
        countdownTimer: null
    };

    activeGames.set(chatId, game);

    await sock.sendMessage(context.from, { 
        text: '📝 *Word Chain Game Started!*\n\n' +
              'Type *join* to enter the game\n' +
              '⏰ You have 60 seconds to join\n\n' +
              '*Rules:*\n' +
              '• Say words starting with given letter\n' +
              '• Start with 3 letters minimum\n' +
              '• Increases by 1 letter each cycle\n' +
              '• Max 8 letters required\n' +
              '• Valid English words only\n' +
              '• No repeating words'
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
        text: `✅ ${playerName} joined the game!\n👥 Total players: ${game.players.length}`,
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
        text: `🎮 *Word Game Starting!*\n\n` +
              `👥 *Players:*\n${playerList}\n\n` +
              `📏 Starting with 3 letters minimum\n` +
              `📈 Increases by 1 each cycle (max 8)\n` +
              `Get ready!`,
        mentions: game.players.map(p => p.id)
    });
    
    setTimeout(() => nextTurn(sock, chatId), 2000);
};

const nextTurn = async (sock, chatId) => {
    const game = activeGames.get(chatId);
    if (!game) return;
    
    if (game.players.length <= 1) {
        if (game.players.length === 1) {
            const winner = game.players[0];
            const wordsUsed = game.usedWords.length;
            
            await sock.sendMessage(chatId, { 
                text: `🏆 *${winner.mention} WON!*\n\n` +
                      `🎯 Total rounds: ${game.round - 1}\n` +
                      `📝 Words used: ${wordsUsed}\n` +
                      `📏 Reached: ${game.minLetters} letters minimum\n\n` +
                      `GGs, you're a wordsmith! 🔥`,
                mentions: [winner.id]
            });
        } else {
            await sock.sendMessage(chatId, { 
                text: '🎮 Game ended - no players left' 
            });
        }
        activeGames.delete(chatId);
        return;
    }
    
    // Generate random letter with weighted probability
    // Common letters (96% chance): A-W excluding X,Y,Z
    // Rare letters (4% chance): X,Y,Z
    const commonLetters = 'ABCDEFGHIJKLMNOPQRSTUVW'.split('');
    const rareLetters = ['X', 'Y', 'Z'];
    
    const useRareLetter = Math.random() < 0.04; // 4% chance
    
    if (useRareLetter) {
        game.currentLetter = rareLetters[Math.floor(Math.random() * rareLetters.length)];
    } else {
        game.currentLetter = commonLetters[Math.floor(Math.random() * commonLetters.length)];
    }
    
    const currentPlayer = game.players[game.currentPlayer];
    const nextPlayerIndex = (game.currentPlayer + 1) % game.players.length;
    const nextPlayer = game.players[nextPlayerIndex];
    
    // Progressive time reduction
    let timeLimit = 30;
    if (game.round >= 3) timeLimit = 25;
    if (game.round >= 5) timeLimit = 20;
    if (game.round >= 7) timeLimit = 15;
    if (game.round >= 10) timeLimit = 12;
    
    await sock.sendMessage(chatId, { 
        text: `${currentPlayer.mention} a word that starts with *${game.currentLetter}*, ${game.minLetters} letters minimum\n\n` +
              `${nextPlayer.mention} get ready`,
        mentions: [currentPlayer.id, nextPlayer.id]
    });
    
    game.timer = setTimeout(async () => {
        await sock.sendMessage(chatId, { 
            text: `⏰ ${currentPlayer.mention} ran out of time!\n\n` +
                  `Better luck next time 👋`,
            mentions: [currentPlayer.id]
        });
        
        game.players.splice(game.currentPlayer, 1);
        
        if (game.currentPlayer >= game.players.length) {
            game.currentPlayer = 0;
        }
        
        setTimeout(() => nextTurn(sock, chatId), 1500);
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
    
    const userAnswer = messageText.trim().toLowerCase();
    
    // Check if word starts with correct letter
    if (!userAnswer.startsWith(game.currentLetter.toLowerCase())) {
        return;
    }
    
    // Check minimum length based on current cycle
    if (userAnswer.length < game.minLetters) {
        await sock.sendMessage(chatId, { 
            text: `❌ ${currentPlayer.mention} word too short! Need ${game.minLetters}+ letters`,
            mentions: [currentPlayer.id]
        });
        return;
    }
    
    // Check if word was already used
    if (game.usedWords.includes(userAnswer)) {
        await sock.sendMessage(chatId, { 
            text: `❌ ${currentPlayer.mention} word already used!`,
            mentions: [currentPlayer.id]
        });
        return;
    }
    
    // Show checking message
    await sock.sendMessage(chatId, { 
        react: { text: '⏳', key: msg.key } 
    });
    
    // Validate word using dictionary API
    const isValid = await isValidWord(userAnswer);
    
    if (!isValid) {
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: msg.key } 
        });
        
        await sock.sendMessage(chatId, { 
            text: `❌ ${currentPlayer.mention} invalid word!\n\n` +
                  `"${userAnswer}" is not a valid English word`,
            mentions: [currentPlayer.id]
        });
        
        // Give 5 second penalty and continue
        setTimeout(() => {
            if (game.timer) {
                clearTimeout(game.timer);
                game.timer = null;
            }
            
            game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
            
            if (game.currentPlayer === 0) {
                game.round++;
            }
            
            nextTurn(sock, chatId);
        }, 5000);
        
        return;
    }
    
    // Valid word!
    game.usedWords.push(userAnswer);
    
    if (game.timer) {
        clearTimeout(game.timer);
        game.timer = null;
    }
    
    await sock.sendMessage(chatId, { 
        react: { text: '✅', key: msg.key } 
    });
    
    // Show word definition if available (optional enhancement)
    const wordLength = userAnswer.length;
    const bonus = wordLength >= 8 ? '🔥 Long word bonus!' : '';
    
    await sock.sendMessage(chatId, { 
        text: `✅ Correct! ${bonus}`
    });
    
    game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    
    // Check if we completed a full cycle (back to first player)
    if (game.currentPlayer === 0) {
        game.round++;
        game.cycleCount++;
        
        // Increase minimum letters every cycle, max 8
        if (game.minLetters < 8) {
            game.minLetters++;
        }
    }
    
    setTimeout(() => nextTurn(sock, chatId), 1500);
};

module.exports = {
    command: 'wcg',
    handler: wordGame,
    checkAnswer
};
