const menu = async (sock, msg, args, context) => {
    const user = msg.pushName || 'user';
    const time = new Date().toLocaleTimeString();
    const uptime = Math.floor(process.uptime());
    const ping = Date.now() - (msg.messageTimestamp * 1000);
    
    const menuText = `----------------{Firekid XMD}---------------
Hello ${user}
Time: ${time}
UPTIME: ${uptime}s
PING: ${ping}ms
Version: 1.0.0

Available Commands:
- menu: Shows this menu
- ping: Check bot response time
- warn: Warn users (admin)
- alive: Check if bot is running
- vv: Anti view once/status sender
- delete: Delete messages (admin)
- kick: Kick users from group (admin)
- tagall: Tag all group members (admin)
- promote: Promote user to admin (admin)
- mute: Lock group chat (admin)
- unmute: Unlock group chat (admin)
- left: Left message notification (admin)
- tag: Tag users without listing
- join: Join message notification (admin)
- resetwarning: Remove warning from a user
- allowdomain: Allow specific domains in group (admin)
- setgrppp: Set group picture (admin)
- antilnk: Anti-link protection (admin)
- sticker: Create sticker
- toimg: Convert sticker to image
- filter: Delete filtered words
- country: Country guessing game
- kill: Send wasted effect
- online: Toggle auto-read
- block: Block user
- sudo: Sudo a new user to use the bot
- unlock: Unblock user
- ttdownload: Download TikTok video
- song: Download songs
- lyrics: Get song lyrics
- weather: Get weather info
- movie: Search movie details

[Made By Firekid]`;

    return await sock.sendMessage(context.from, { text: menuText });
};

module.exports = {
    command: 'menu',
    handler: menu
};
