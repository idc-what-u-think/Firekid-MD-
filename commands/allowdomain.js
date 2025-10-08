let allowedDomains = new Set();

const allowdomain = async (sock, msg, args, context) => {
    const OWNER_ID = '6281234567890@s.whatsapp.net';
    
    if (context.sender !== OWNER_ID) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Only the bot owner can manage allowed domains' 
        });
    }
    
    const action = args[0];
    const domain = args[1];
    
    if (!action) {
        return await sock.sendMessage(context.from, { 
            text: '❌ Usage:\nallowdomain add domain.com\nallowdomain remove domain.com\nallowdomain list' 
        });
    }
    
    try {
        switch (action.toLowerCase()) {
            case 'add':
                if (!domain) {
                    return await sock.sendMessage(context.from, { 
                        text: '❌ Provide a domain name' 
                    });
                }
                
                if (!/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/.test(domain)) {
                    return await sock.sendMessage(context.from, { 
                        text: '❌ Invalid domain format' 
                    });
                }
                
                allowedDomains.add(domain.toLowerCase());
                return await sock.sendMessage(context.from, { 
                    text: `✅ Added ${domain} to allowed domains` 
                });
                
            case 'remove':
                if (!domain) {
                    return await sock.sendMessage(context.from, { 
                        text: '❌ Provide a domain name' 
                    });
                }
                
                if (allowedDomains.delete(domain.toLowerCase())) {
                    return await sock.sendMessage(context.from, { 
                        text: `✅ Removed ${domain} from allowed domains` 
                    });
                }
                return await sock.sendMessage(context.from, { 
                    text: '❌ Domain not found in allowed list' 
                });
                
            case 'list':
                if (allowedDomains.size === 0) {
                    return await sock.sendMessage(context.from, { 
                        text: 'No allowed domains' 
                    });
                }
                
                const list = Array.from(allowedDomains).join('\n');
                return await sock.sendMessage(context.from, { 
                    text: `📝 Allowed Domains:\n${list}` 
                });
                
            default:
                return await sock.sendMessage(context.from, { 
                    text: '❌ Invalid action. Use add, remove, or list' 
                });
        }
    } catch (error) {
        console.error('Error in allowdomain command:', error);
        return await sock.sendMessage(context.from, { 
            text: '❌ Failed to process allowdomain command' 
        });
    }
};

const isDomainAllowed = (url) => {
    try {
        const domain = new URL(url).hostname.toLowerCase();
        return allowedDomains.has(domain);
    } catch {
        return false;
    }
};

module.exports = {
    command: 'allowdomain',
    handler: allowdomain,
    isDomainAllowed
};
