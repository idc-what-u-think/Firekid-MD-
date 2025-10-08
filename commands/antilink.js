const { detectAndHandleLink } = require('./commands/antilink');

sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return;

  for (const msg of messages) {
    if (!msg.message) continue;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = msg.key.participant || from;
    const messageText = msg.message.conversation || 
                       msg.message.extendedTextMessage?.text || '';

    if (!botState.isActive && sender !== 'admin') {
      continue;
    }

    if (!botState.users.has(sender)) {
      botState.users.set(sender, {
        id: sender,
        firstSeen: new Date(),
        lastSeen: new Date(),
        messageCount: 0,
      });
    }
    const user = botState.users.get(sender);
    user.lastSeen = new Date();
    user.messageCount++;

    const context = {
      from,
      sender,
      isGroup,
      prefix: config.prefix,
    };
    
    await detectAndHandleLink(sock, msg, context);

    if (!messageText.startsWith(config.prefix)) continue;

    const args = messageText.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands[commandName];
    if (command && command.handler) {
      try {
        console.log(`🎯 Executing command: ${commandName} from ${sender}`);
        botState.stats.totalCommands++;
        botState.stats.commandsToday++;

        await command.handler(sock, msg, args, {
          from,
          sender,
          isGroup,
          prefix: config.prefix,
        });
      } catch (error) {
        console.error(`❌ Error executing command ${commandName}:`, error.message);
        await sock.sendMessage(from, {
          text: `⚠️ Error executing command: ${error.message}`,
        });
      }
    }
  }
});
