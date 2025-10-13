let allowedDomains = new Set();

const normalizeNumber = (jidOrNum) => {
  if (!jidOrNum) return '';
  let str = jidOrNum.toString();

  const atIndex = str.indexOf('@');
  if (atIndex !== -1) {
    const local = str.slice(0, atIndex);
    const domain = str.slice(atIndex);
    const cleanedLocal = local.split(':')[0];
    str = cleanedLocal + domain;
  } else {
    str = str.split(':')[0];
  }

  const digits = str.replace(/[^0-9]/g, '');
  return digits.replace(/^0+/, '');
};

const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;
    
    const senderNum = normalizeNumber(sender);
    const ownerNum = normalizeNumber(ownerNumber);
    
    return senderNum === ownerNum;
};

const allowdomain = async (sock, msg, args, context) => {
    if (!isOwner(context.sender)) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can manage allowed domains' 
        }, { quoted: msg });
    }
    
    const action = args[0];
    const domain = args[1];
    
    if (!action) {
        return await sock.sendMessage(context.from, { 
            text: '❌ *Usage:*\n\n`.allowdomain add domain.com`\n`.allowdomain remove domain.com`\n`.allowdomain list`' 
        }, { quoted: msg });
    }
    
    try {
        switch (action.toLowerCase()) {
            case 'add':
                if (!domain) {
                    return await sock.sendMessage(context.from, { 
                        text: '❌ Provide a domain name\n\nExample: `.allowdomain add youtube.com`' 
                    }, { quoted: msg });
                }
                
                if (!/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/.test(domain)) {
                    return await sock.sendMessage(context.from, { 
                        text: '❌ Invalid domain format\n\nExample: `youtube.com` or `chat.whatsapp.com`' 
                    }, { quoted: msg });
                }
                
                allowedDomains.add(domain.toLowerCase());
                return await sock.sendMessage(context.from, { 
                    text: `✅ Added *${domain}* to allowed domains\n\nLinks from this domain will not trigger antilink` 
                }, { quoted: msg });
                
            case 'remove':
                if (!domain) {
                    return await sock.sendMessage(context.from, { 
                        text: '❌ Provide a domain name\n\nExample: `.allowdomain remove youtube.com`' 
                    }, { quoted: msg });
                }
                
                if (allowedDomains.delete(domain.toLowerCase())) {
                    return await sock.sendMessage(context.from, { 
                        text: `✅ Removed *${domain}* from allowed domains` 
                    }, { quoted: msg });
                }
                return await sock.sendMessage(context.from, { 
                    text: '❌ Domain not found in allowed list' 
                }, { quoted: msg });
                
            case 'list':
                if (allowedDomains.size === 0) {
                    return await sock.sendMessage(context.from, { 
                        text: '📝 *Allowed Domains:*\n\nNo allowed domains configured' 
                    }, { quoted: msg });
                }
                
                const list = Array.from(allowedDomains).map((d, i) => `${i + 1}. ${d}`).join('\n');
                return await sock.sendMessage(context.from, { 
                    text: `📝 *Allowed Domains:*\n\n${list}\n\n_Total: ${allowedDomains.size}_` 
                }, { quoted: msg });
                
            default:
                return await sock.sendMessage(context.from, { 
                    text: '❌ Invalid action\n\nUse: `add`, `remove`, or `list`' 
                }, { quoted: msg });
        }
    } catch (error) {
        console.error('Error in allowdomain command:', error.message);
        return await sock.sendMessage(context.from, { 
            text: `❌ Failed to process allowdomain command: ${error.message}` 
        }, { quoted: msg });
    }
};

const isDomainAllowed = (url) => {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase();
        
        return allowedDomains.has(domain);
    } catch {
        const domainMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-_.]+\.[a-zA-Z]{2,})/i);
        if (domainMatch) {
            return allowedDomains.has(domainMatch[1].toLowerCase());
        }
        return false;
    }
};

module.exports = {
    command: 'allowdomain',
    handler: allowdomain,
    isDomainAllowed
};
