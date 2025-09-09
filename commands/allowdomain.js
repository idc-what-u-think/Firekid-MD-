// Store allowed domains in memory
let allowedDomains = new Set()

const allowdomain = async (m, client) => {
    // Only bot owner can manage allowed domains
    const OWNER_ID = '6281234567890@s.whatsapp.net' // Replace with actual owner
    
    if (m.sender !== OWNER_ID) {
        return m.reply('❌ Only the bot owner can manage allowed domains')
    }

    const [action, domain] = m.text.split(' ').slice(1)
    
    if (!action) {
        return m.reply('❌ Usage:\nallowdomain add domain.com\nallowdomain remove domain.com\nallowdomain list')
    }

    try {
        switch (action.toLowerCase()) {
            case 'add':
                if (!domain) return m.reply('❌ Provide a domain name')
                
                // Basic domain validation
                if (!/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/.test(domain)) {
                    return m.reply('❌ Invalid domain format')
                }

                allowedDomains.add(domain.toLowerCase())
                return m.reply(`✅ Added ${domain} to allowed domains`)

            case 'remove':
                if (!domain) return m.reply('❌ Provide a domain name')
                
                if (allowedDomains.delete(domain.toLowerCase())) {
                    return m.reply(`✅ Removed ${domain} from allowed domains`)
                }
                return m.reply('❌ Domain not found in allowed list')

            case 'list':
                if (allowedDomains.size === 0) return m.reply('No allowed domains')
                
                const list = Array.from(allowedDomains).join('\n')
                return m.reply(`📝 Allowed Domains:\n${list}`)

            default:
                return m.reply('❌ Invalid action. Use add, remove, or list')
        }
    } catch (error) {
        console.error('Error in allowdomain command:', error)
        return m.reply('❌ Failed to process allowdomain command')
    }
}

// Helper function to check if domain is allowed
const isDomainAllowed = (url) => {
    try {
        const domain = new URL(url).hostname.toLowerCase()
        return allowedDomains.has(domain)
    } catch {
        return false
    }
}

module.exports = {
    command: 'allowdomain',
    handler: allowdomain,
    isDomainAllowed
}