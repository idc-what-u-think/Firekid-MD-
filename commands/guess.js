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
    'very famous person (globally known actor, musician, politician, athlete, or historical figure)',
    'common animal that everyone knows',
    'popular country',
    'blockbuster movie or very famous film',
    'popular food or dish',
    'well-known brand or company',
    'famous invention or everyday technology',
    'popular sport',
    'common musical instrument'
];

const generateRiddle = async () => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const apiKey = getApiKey();
    
    const prompt = `Generate a mystery riddle for a casual guessing game. Pick something SIMPLE, WELL-KNOWN, and FAMOUS from this category: ${category}.

IMPORTANT RULES:
- Pick something that 90% of people would recognize
- NO obscure items, rare things, or niche knowledge
- Pick globally famous things only
- Make it challenging but FAIR

Format your response EXACTLY like this:
ANSWER: [the answer - must be something very famous and widely known]
HINT1: [Very cryptic and vague first clue]
HINT2: [Medium difficulty, gives more context]
HINT3: [Very obvious hint that almost gives it away]

Example for "Michael Jackson":
ANSWER: Michael Jackson
HINT1: I moonwalked into history and changed music forever
HINT2: American singer who died in 2009, sold over 400 million records, known for Thriller
HINT3: The King of Pop, white glove, moonwalk dance

Make it fun and accessible for everyone!`;

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
        const hint1Match = text.match(/HINT1:\s*(.+)/i);
        const hint2Match = text.match(/HINT2:\s*(.+)/i);
        const hint3Match = text.match(/HINT3:\s*(.+)/i);

        if (!answerMatch || !hint1Match || !hint2Match || !hint3Match) {
            throw new Error('Invalid response format');
        }

        return {
            answer: answerMatch[1].trim(),
            hints: [
                hint1Match[1].trim(),
                hint2Match[1].trim(),
                hint3Match[1].trim()
            ]
        };
    } catch (error) {
        console.error('Error generating riddle:', error.message);
        return null;
    }
};

const guessGame = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, { 
            text: 'This game can only be played in groups' 
        }, { quoted: msg });
    }

    const chatId = context.from;
    
    if (activeGames.has(chatId)) {
        return await sock.sendMessage(context.from, { 
            text: 'A game is already active in this group! Type your answer to guess.' 
        }, { quoted: msg });
    }

    const game = {
        riddle: null,
        hintLevel: 0,
        winner: null,
        startTime: Date.now()
    };

    activeGames.set(chatId, game);

    await sock.sendMessage(context.from, { 
        text: 'Generating riddle...' 
    }, { quoted: msg });

    const riddle = await generateRiddle();
    
    if (!riddle) {
        activeGames.delete(chatId);
        return await sock.sendMessage(context.from, { 
            text: 'Failed to generate riddle. Try again!' 
        });
    }
    
    game.riddle = riddle;

    await sock.sendMessage(context.from, { 
        text: `GUESS WHO/WHAT?\n\nHINT 1:\n${riddle.hints[0]}\n\nHINT 2:\n${riddle.hints[1]}\n\nHINT 3:\n${riddle.hints[2]}\n\nType your answer directly in the chat. First person to guess correctly wins!` 
    }, { quoted: msg });
};

const checkGuess = async (sock, msg, context) => {
    if (!context.isGroup) return;
    
    const chatId = context.from;
    const game = activeGames.get(chatId);
    
    if (!game || !game.riddle) return;
    
    const messageText = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || '';
    
    if (messageText.toLowerCase().startsWith('hint')) {
        if (game.hintLevel < game.riddle.hints.length - 1) {
            game.hintLevel++;
            return await sock.sendMessage(context.from, { 
                text: `HINT ${game.hintLevel + 1}:\n${game.riddle.hints[game.hintLevel]}` 
            }, { quoted: msg });
        }
        return;
    }
    
    const userGuess = messageText.trim().toLowerCase();
    const correctAnswer = game.riddle.answer.toLowerCase();
    
    const isCorrect = userGuess === correctAnswer || 
                     (correctAnswer.includes(userGuess) && userGuess.length > 3) ||
                     (userGuess.includes(correctAnswer) && userGuess.length > 3);
    
    if (isCorrect) {
        const senderNumber = normalizeNumber(context.sender);
        const timeTaken = Math.floor((Date.now() - game.startTime) / 1000);
        
        game.winner = context.sender;

        await sock.sendMessage(chatId, { 
            text: `CORRECT!\n\n@${senderNumber} guessed it!\n\nAnswer: ${game.riddle.answer}\n\nTime: ${timeTaken}s`,
            mentions: [context.sender]
        });
        
        activeGames.delete(chatId);
    }
};

module.exports = {
    command: 'guess',
    handler: guessGame,
    checkGuess
};
