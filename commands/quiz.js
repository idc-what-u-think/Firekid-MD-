const axios = require('axios');

const activeGames = new Map();

const difficultyMap = {
    'easy': { time: 30, label: 'Easy' },
    'medium': { time: 25, label: 'Medium' },
    'hard': { time: 20, label: 'Hard' }
};

const getDifficulty = (round, totalPoints) => {
    const easyRounds = Math.ceil(totalPoints * 0.3);
    const mediumRounds = Math.ceil(totalPoints * 0.4);
    
    if (round <= easyRounds) return 'easy';
    if (round <= easyRounds + mediumRounds) return 'medium';
    return 'hard';
};

const fetchQuestion = async (difficulty) => {
    try {
        const response = await axios.get(`https://opentdb.com/api.php?amount=1&difficulty=${difficulty}&type=boolean`, {
            timeout: 10000
        });
        
        if (response.data && response.data.results && response.data.results.length > 0) {
            const q = response.data.results[0];
            return {
                question: q.question.replace(/&quot;/g, '"')
                                   .replace(/&#039;/g, "'")
                                   .replace(/&amp;/g, '&')
                                   .replace(/&ldquo;/g, '"')
                                   .replace(/&rdquo;/g, '"'),
                correctAnswer: q.correct_answer.toLowerCase()
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching question:', error.message);
        return null;
    }
};

const normalizeAnswer = (answer) => {
    return answer.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

const quizGame = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: '❌ This game can only be played in groups' 
        }, { quoted: msg });
    }

    const chatId = context.from;
    
    if (activeGames.has(chatId)) {
        return await sock.sendMessage(context.from, { 
            text: '🧠 A quiz game is already active in this group!' 
        }, { quoted: msg });
    }

    const targetPoints = parseInt(args[0]);
    
    if (!targetPoints || targetPoints < 1 || targetPoints > 50) {
        return await sock.sendMessage(context.from, { 
            text: `❌ Invalid target points\n\nUsage: ${context.prefix}quiz <points>\n\nExample: ${context.prefix}quiz 10\n\nPoints must be between 1-50` 
        }, { quoted: msg });
    }

    const game = {
        targetPoints,
        scores: new Map(),
        round: 0,
        currentQuestion: null,
        timer: null,
        answered: false
    };

    activeGames.set(chatId, game);

    await sock.sendMessage(context.from, { 
        text: `🧠 *QUIZ GAME STARTED!*\n\n🎯 First to ${targetPoints} points wins!\n\nCountdown starting...` 
    }, { quoted: msg });

    for (let i = 10; i >= 1; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await sock.sendMessage(context.from, { text: i.toString() });
    }

    await sock.sendMessage(context.from, { text: '*GO!*' });

    setTimeout(() => nextRound(sock, chatId), 2000);
};

const nextRound = async (sock, chatId) => {
    const game = activeGames.get(chatId);
    if (!game) return;

    game.round++;
    game.answered = false;

    const difficulty = getDifficulty(game.round, game.targetPoints);
    const difficultyInfo = difficultyMap[difficulty];

    const question = await fetchQuestion(difficulty);
    
    if (!question) {
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to fetch question. Trying again...' 
        });
        return setTimeout(() => nextRound(sock, chatId), 2000);
    }

    game.currentQuestion = question;

    await sock.sendMessage(chatId, { 
        text: `🎯 *ROUND ${game.round}*\n\n❓ ${question.question}\n\n⏰ ${difficultyInfo.time} seconds to answer!` 
    });

    game.timer = setTimeout(async () => {
        if (game.answered) return;

        await sock.sendMessage(chatId, { 
            text: `⏰ Time's up!\n\n✅ Correct answer: ${question.correctAnswer}\n\nNo points awarded. Moving to next round...` 
        });

        setTimeout(() => nextRound(sock, chatId), 2000);
    }, difficultyInfo.time * 1000);
};

const checkQuizAnswer = async (sock, msg, context) => {
    if (!context.isGroup) return;
    
    const chatId = context.from;
    const game = activeGames.get(chatId);
    
    if (!game || !game.currentQuestion || game.answered) return;
    
    const messageText = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || '';
    
    const userAnswer = normalizeAnswer(messageText);
    const correctAnswer = normalizeAnswer(game.currentQuestion.correctAnswer);
    
    if (userAnswer !== correctAnswer) {
        return;
    }

    game.answered = true;

    if (game.timer) {
        clearTimeout(game.timer);
        game.timer = null;
    }

    await sock.sendMessage(chatId, { 
        react: { text: '✅', key: msg.key } 
    });

    const userId = context.sender;
    const currentScore = game.scores.get(userId) || 0;
    const newScore = currentScore + 1;
    game.scores.set(userId, newScore);

    const senderNumber = context.sender.split('@')[0];
    
    await sock.sendMessage(chatId, { 
        text: `🎉 @${senderNumber} won Round ${game.round}!`,
        mentions: [userId]
    });

    const sortedScores = Array.from(game.scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    let scoreboard = '\n📊 *SCOREBOARD:*\n';
    for (let i = 0; i < sortedScores.length; i++) {
        const [playerId, score] = sortedScores[i];
        const playerNumber = playerId.split('@')[0];
        const position = i + 1;
        const emoji = position === 1 ? '⭐' : '';
        scoreboard += `${position}. @${playerNumber} - ${score} point${score !== 1 ? 's' : ''} ${emoji}\n`;
    }

    const mentions = sortedScores.map(([playerId]) => playerId);
    await sock.sendMessage(chatId, { 
        text: scoreboard,
        mentions
    });

    if (newScore >= game.targetPoints) {
        const totalRounds = game.round;
        
        await sock.sendMessage(chatId, { 
            text: `🏆 *@${senderNumber} WINS THE GAME!* 🏆\n\n🎯 Total rounds: ${totalRounds}\n🎮 Thanks for playing!`,
            mentions: [userId]
        });
        
        activeGames.delete(chatId);
        return;
    }

    setTimeout(() => nextRound(sock, chatId), 2000);
};

module.exports = {
    command: 'quiz',
    handler: quizGame,
    checkQuizAnswer
};
