const menu = async (sock, msg, args, context) => {
    const user = msg.pushName || 'User';
    const time = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        let result = [];
        if (days > 0) result.push(`${days}d`);
        if (hours > 0) result.push(`${hours}h`);
        if (minutes > 0) result.push(`${minutes}m`);
        if (secs > 0 || result.length === 0) result.push(`${secs}s`);
        return result.join(' ');
    };
    const uptime = formatUptime(process.uptime());
    const ping = Math.abs(Date.now() - (msg.messageTimestamp * 1000));
    const menuText = `╭━━━『 *FIREKID XMD* 』━━━╮
│
│ 👤 *User:* ${user}
│ 📅 *Date:* ${date}
│ ⏰ *Time:* ${time}
│ ⚡ *Uptime:* ${uptime}
│ 📡 *Ping:* ${ping}ms
│ 🔖 *Version:* 1.0.0
│
╰━━━━━━━━━━━━━━━━━━━━╯
╭━━━『 *GENERAL* 』━━━╮
│
│ • menu - Show this menu
│ • ping - Check response time
│ • alive - Check bot status
│ • online - Toggle auto-read
│
╰━━━━━━━━━━━━━━━━━━━━╯
╭━━━『 *ADMIN TOOLS* 』━━━╮
│
│ • warn - Warn users
│ • resetwarning - Clear warnings
│ • kick - Remove members
│ • promote - Make admin
│ • delete - Delete messages
│ • tagall - Mention everyone
│ • tag - Tag without list
│ • mute - Lock group chat
│ • unmute - Unlock group chat
│ • setgrppp - Set group picture
│
╰━━━━━━━━━━━━━━━━━━━━╯
╭━━━『 *GROUP SETTINGS* 』━━━╮
│
│ • antilnk - Anti-link system
│ • allowdomain - Whitelist domains
│ • left - Leave notifications
│ • join - Join notifications
│ • filter - Word filtering
│
╰━━━━━━━━━━━━━━━━━━━━╯
╭━━━『 *MEDIA TOOLS* 』━━━╮
│
│ • vv - Reveal view once
│ • sticker - Create sticker
│ • toimg - Sticker to image
│
╰━━━━━━━━━━━━━━━━━━━━╯
╭━━━『 *DOWNLOADER* 』━━━╮
│
│ • ttdownload - TikTok videos
│ • song - Download songs
│ • movie - Movie details
│
╰━━━━━━━━━━━━━━━━━━━━╯
╭━━━『 *FUN & GAMES* 』━━━╮
│
│ • country - Guess the country
│ • kill - Wasted effect
│ • lyrics - Get song lyrics
│ • weather - Weather info
│
╰━━━━━━━━━━━━━━━━━━━━╯
╭━━━『 *OWNER ONLY* 』━━━╮
│
│ • sudo - Manage sudo users
│ • block - Block users
│ • unlock - Unblock users
│ • private - Private mode toggle
│ • update - Reload commands from GitHub
│
╰━━━━━━━━━━━━━━━━━━━━╯
┏━━━━━━━━━━━━━━━━━━━┓
┃ *Made with 🔥 by Firekid*
┗━━━━━━━━━━━━━━━━━━━┛`;
    return await sock.sendMessage(context.from, { text: menuText });
};
module.exports = {
    command: 'menu',
    handler: menu
};
