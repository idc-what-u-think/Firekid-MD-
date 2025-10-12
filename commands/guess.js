const axios = require('axios');

const activeGames = new Map();

const API_KEYS = [
    'AIzaSyAP3uSMIYuEnSjv37pG2pq6W3y26qNICas',
    'AIzaSyD1ruouUYPqAWg0MHFwZiqA7rp44zDNNdE',
    'AIzaSyAxp-gaokoC-BBW9Z83anytC0IDneF0ags'
];

let currentKeyIndex = 0;

const getApiKey = () => {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
};

const normalizeNumber = (jidOrNum) => {
    if (!jidOrNum) return '';
    const digits = jidOrNum.replace(/[^0-9]/g, '');
    return digits.replace(/^0+/, '');
};

const categories = [
    'famous person (actor, musician, politician, athlete, historical figure)',
    'animal',
    'country',
    'movie',
    'food or dish',
    'brand or company',
    'invention or technology',
    'sport',
    'instrument',
    'language'
];

const generateRiddle = async () => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const apiKey = getApiKey();
    
    const prompt = `Generate a mystery riddle for a guessing game. Pick a specific ${category}.

Format your response EXACTLY like this (no extra text):
ANSWER: [the answer]
HINT1: [A very vague, cryptic first hint]
HINT2: [A slightly less vague hint]
HINT3: [A medium difficulty hint]
HINT4: [A clearer hint]
HINT5: [An easier hint that gives more context]

Example for "Albert Einstein":
ANSWER: Albert Einstein
HINT1: Time bends to my theories, yet I never moved from thought
HINT2: My equation changed the world, just three letters and a number
HINT3: Wild hair, German roots, but America became my home
HINT4: Nobel Prize winner who revolutionized physics in the 1900s
HINT5: Famous physicist known for E=mc² and the theory of relativity

Make it challenging but fair! Add more hints if needed to make it solvable.`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }]
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const text = response.data.candidates[0].content.parts[0].text;
        
        const answerMatch = text.match(/ANSWER:\s*(.+)/i);
        const hints = [];
        
        for (let i = 1; i <= 10; i++) {
            const hintMatch = text.match(new RegExp(`HINT${i}:\\s*(.+)`, 'i'));
            if (hintMatch) {
                hints.push(hintMatch[1].trim());
            } else {
                break;
            }
        }

        if (!answerMatch || hints.length < 3) {
            throw new Error('Invalid response format');
        }

        return {
            answer: answerMatch[1].trim(),
            hints: hints,
            category: category
        };
    } catch (error) {
        console.error('Error generating riddle:', error.message);
        return null;
    }
};

const guessGame = async (sock, msg, args, context) => {
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
        riddle: null,
        currentHintIndex: 0,
        timer: null,
        countdownTimer: null
    };

    activeGames.set(chatId, game);

    await sock.sendMessage(context.from, { 
        text: '🤔 *Guess Who/What Game Started!*\n\nType *join* to enter the game\n⏰ You have 60 seconds to join' 
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
    const senderNumber = normalizeNumber(context.sender);
    
    game.players.push({
        id: userId,
        name: playerName,
        mention: `@${senderNumber}`,
        score: 0
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
    
    game.phase = 'generating';
    
    const playerList = game.players.map((p, i) => `${i + 1}. ${p.mention}`).join('\n');
    await sock.sendMessage(chatId, { 
        text: `🎮 *Game Starting!*\n\n👥 *Players:*\n${playerList}\n\n🧠 Generating riddle...`,
        mentions: game.players.map(p => p.id)
    });
    
    const riddle = await generateRiddle();
    
    if (!riddle) {
        activeGames.delete(chatId);
        return await sock.sendMessage(chatId, { 
            text: '❌ Failed to generate riddle. Try again!' 
        });
    }
    
    game.riddle = riddle;
    game.phase = 'playing';
    
    setTimeout(() => nextTurn(sock, chatId), 2000);
};

const nextTurn = async (sock, chatId) => {
    const game = activeGames.get(chatId);
    if (!game) return;
    
    if (game.players.length === 0) {
        await sock.sendMessage(chatId, { 
            text: `🎮 *Game Over!*\n\n❌ No players left!\n\n✅ *The answer was:* ${game.riddle.answer}` 
        });
        activeGames.delete(chatId);
        return;
    }
    
    if (game.players.length === 1) {
        await sock.sendMessage(chatId, { 
            text: `🏆 *${game.players[0].mention} WON!*\n\nOnly player remaining! 🔥\n\n✅ *The answer was:* ${game.riddle.answer}`,
            mentions: [game.players[0].id]
        });
        activeGames.delete(chatId);
        return;
    }
    
    if (game.currentPlayer === 0) {
        game.round++;
        
        if (game.currentHintIndex < game.riddle.hints.length - 1) {
            game.currentHintIndex++;
            
            await sock.sendMessage(chatId, { 
                text: `🔄 *New Round ${game.round}*\n\n💡 *New Hint:*\n${game.riddle.hints[game.currentHintIndex]}\n\nLet's continue!` 
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    const currentPlayer = game.players[game.currentPlayer];
    const nextPlayerIndex = (game.currentPlayer + 1) % game.players.length;
    const nextPlayer = game.players[nextPlayerIndex];
    
    const allHints = game.riddle.hints.slice(0, game.currentHintIndex + 1).map((h, i) => `💡 *Hint ${i + 1}:* ${h}`).join('\n\n');
    
    await sock.sendMessage(chatId, { 
        text: `🎯 *Round ${game.round}*\n\n${allHints}\n\n👤 ${currentPlayer.mention}'s turn!\n⏰ Time: 25s\n⏭️ Next: ${nextPlayer.mention}`,
        mentions: [currentPlayer.id, nextPlayer.id]
    });
    
    game.timer = setTimeout(async () => {
        await sock.sendMessage(chatId, { 
            text: `⏰ ${currentPlayer.mention} ran out of time!\n\nEliminated! 👋`,
            mentions: [currentPlayer.id]
        });
        
        game.players.splice(game.currentPlayer, 1);
        
        if (game.currentPlayer >= game.players.length) {
            game.currentPlayer = 0;
        }
        
        setTimeout(() => nextTurn(sock, chatId), 1500);
    }, 25000);
};

const checkGuess = async (sock, msg, context) => {
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
    
    const userGuess = messageText.trim().toLowerCase();
    const correctAnswer = game.riddle.answer.toLowerCase();
    
    const isCorrect = userGuess === correctAnswer || 
                     correctAnswer.includes(userGuess) && userGuess.length > 3 ||
                     userGuess.includes(correctAnswer);
    
    if (isCorrect) {
        if (game.timer) {
            clearTimeout(game.timer);
            game.timer = null;
        }
        
        currentPlayer.score++;
        
        await sock.sendMessage(chatId, { 
            text: `🎉 *CORRECT!*\n\n👑 ${currentPlayer.mention} guessed it!\n\n✅ *Answer:* ${game.riddle.answer}\n\n🔥 Congratulations! You're a genius! 🧠`,
            mentions: [currentPlayer.id]
        });
        
        activeGames.delete(chatId);
        return;
    }
    
    await sock.sendMessage(chatId, { 
        react: { text: '❌', key: msg.key } 
    });
    
    if (game.timer) {
        clearTimeout(game.timer);
        game.timer = null;
    }
    
    game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    
    setTimeout(() => nextTurn(sock, chatId), 1500);
};

module.exports = {
    command: 'guess',
    handler: guessGame,
    checkGuess
};
