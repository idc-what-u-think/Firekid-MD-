// Country game for WhatsApp bot
const activeGames = new Map();

// Countries by continent
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
    'Australia': [
        'Australia'
    ]
};

const countryGame = async (m, client) => {
    if (!m.isGroup) return m.reply('❌ This game can only be played in groups');

    const chatId = m.chat;
    
    if (activeGames.has(chatId)) {
        return m.reply('🎮 A game is already active in this group!');
    }

    // Initialize game
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

    await m.reply('🌍 Get ready to play Country game\nType *Join* to enter');

    // Start 60-second joining countdown
    let timeLeft = 60;
    
    const countdown = setInterval(async () => {
        timeLeft -= 15;
        
        if (timeLeft === 45) {
            await m.reply('⏰ 45 seconds left, get ready');
        } else if (timeLeft === 30) {
            await m.reply('⏰ 30 seconds left, get ready');
        } else if (timeLeft === 15) {
            await m.reply('⏰ 15 seconds left, get ready');
        } else if (timeLeft <= 0) {
            clearInterval(countdown);
            await startGame(m, client, chatId);
        }
    }, 15000);

    // Final countdown 5,4,3,2,1
    setTimeout(async () => {
        for (let i = 5; i >= 1; i--) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await m.reply(i.toString());
        }
    }, 55000);
};

const joinGame = async (m, client) => {
    const chatId = m.chat;
    const game = activeGames.get(chatId);
    
    if (!game || game.phase !== 'joining') return;
    
    const userId = m.sender;
    if (game.players.some(p => p.id === userId)) {
        return; // Already joined
    }
    
    game.players.push({
        id: userId,
        name: m.pushName || 'Player',
        mention: `@${userId.split('@')[0]}`
    });
    
    await m.reply(`✅ ${game.players[game.players.length - 1].mention} Joined`);
};

const startGame = async (m, client, chatId) => {
    const game = activeGames.get(chatId);
    
    if (!game || game.players.length < 2) {
        activeGames.delete(chatId);
        return m.reply('❌ Need at least 2 players to start the game');
    }
    
    game.phase = 'playing';
    await nextTurn(m, client, chatId);
};

const nextTurn = async (m, client, chatId) => {
    const game = activeGames.get(chatId);
    if (!game) return;
    
    if (game.players.length <= 1) {
        // Game over - announce winner
        if (game.players.length === 1) {
            await m.reply(`🏆 ${game.players[0].mention} won, GGs, bro is him`);
        } else {
            await m.reply('🎮 Game ended - no players left');
        }
        activeGames.delete(chatId);
        return;
    }
    
    // Pick random continent
    const continentNames = Object.keys(continents);
    game.continent = continentNames[Math.floor(Math.random() * continentNames.length)];
    
    const currentPlayer = game.players[game.currentPlayer];
    const nextPlayerIndex = (game.currentPlayer + 1) % game.players.length;
    const nextPlayer = game.players[nextPlayerIndex];
    
    // Determine timer based on round
    let timeLimit = 25; // Default
    if (game.round >= 3) timeLimit = 20;
    if (game.round >= 5) timeLimit = 15;
    if (game.round >= 7) timeLimit = 10;
    
    await m.reply(`🎯 Turn: ${currentPlayer.mention} mention a country in ${game.continent}\n⏭️ Next: ${nextPlayer.mention} get ready, you are next`);
    
    // Set timer for current player
    game.timer = setTimeout(async () => {
        await m.reply(`⏰ ${currentPlayer.mention} ran out of time, better luck next time gng`);
        
        // Remove player
        game.players.splice(game.currentPlayer, 1);
        
        // Adjust current player index
        if (game.currentPlayer >= game.players.length) {
            game.currentPlayer = 0;
        }
        
        // Continue to next turn
        setTimeout(() => nextTurn(m, client, chatId), 1000);
    }, timeLimit * 1000);
};

const checkAnswer = async (m, client) => {
    if (!m.isGroup) return;
    
    const chatId = m.chat;
    const game = activeGames.get(chatId);
    
    // Check for join command
    if (m.text.toLowerCase() === 'join') {
        return joinGame(m, client);
    }
    
    if (!game || game.phase !== 'playing') return;
    
    const currentPlayer = game.players[game.currentPlayer];
    if (m.sender !== currentPlayer.id) return;
    
    const userAnswer = m.text.trim();
    const validCountries = continents[game.continent];
    
    // Check if answer is a valid country in the continent
    const isValidCountry = validCountries.some(country => 
        country.toLowerCase() === userAnswer.toLowerCase()
    );
    
    if (!isValidCountry) return; // Bot ignores wrong continent answers
    
    // Check if country was already used
    if (game.usedCountries.includes(userAnswer.toLowerCase())) {
        return; // Ignore already used countries
    }
    
    // Valid answer!
    game.usedCountries.push(userAnswer.toLowerCase());
    
    // Clear current timer
    if (game.timer) {
        clearTimeout(game.timer);
        game.timer = null;
    }
    
    // React with checkmark
    await client.sendMessage(chatId, { react: { text: '✅', key: m.key } });
    
    // Move to next player
    game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    
    // If we've gone through all players once, increment round
    if (game.currentPlayer === 0) {
        game.round++;
    }
    
    // Continue to next turn after a short delay
    setTimeout(() => nextTurn(m, client, chatId), 1500);
};

module.exports = {
    command: 'country',
    handler: countryGame,
    checkAnswer
};