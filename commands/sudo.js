// Store sudo users in memory
let sudoUsers = new Set()

// Country codes mapping
const countryCodes = {
    // Common country codes
    '1': 'US/Canada',
    '44': 'UK',
    '49': 'Germany', 
    '33': 'France',
    '39': 'Italy',
    '34': 'Spain',
    '7': 'Russia',
    '86': 'China',
    '91': 'India',
    '81': 'Japan',
    '82': 'South Korea',
    '65': 'Singapore',
    '60': 'Malaysia',
    '66': 'Thailand',
    '84': 'Vietnam',
    '63': 'Philippines',
    '62': 'Indonesia',
    '234': 'Nigeria',
    '27': 'South Africa',
    '254': 'Kenya',
    '233': 'Ghana',
    '256': 'Uganda',
    '255': 'Tanzania',
    '251': 'Ethiopia',
    '212': 'Morocco',
    '20': 'Egypt',
    '213': 'Algeria',
    '216': 'Tunisia',
    '218': 'Libya',
    '55': 'Brazil',
    '54': 'Argentina',
    '56': 'Chile',
    '57': 'Colombia',
    '58': 'Venezuela',
    '51': 'Peru',
    '52': 'Mexico',
    '61': 'Australia',
    '64': 'New Zealand'
}

// Function to format phone numbers intelligently
const formatPhoneNumber = (number) => {
    // Remove all non-digit characters
    let cleaned = number.replace(/[^0-9]/g, '')
    
    // If number starts with +, it's already international format
    if (number.startsWith('+')) {
        cleaned = number.slice(1).replace(/[^0-9]/g, '')
        return cleaned + '@s.whatsapp.net'
    }
    
    // Check if already has country code (length > 10 and doesn't start with 0)
    if (cleaned.length > 10 && !cleaned.startsWith('0')) {
        return cleaned + '@s.whatsapp.net'
    }
    
    // Handle local numbers that start with 0
    if (cleaned.startsWith('0')) {
        // Try to detect country by length and format
        if (cleaned.length === 11) {
            // Could be Nigerian (0xxx xxx xxxx) or Indonesian (0xxx xxxx xxxx)
            // Nigerian numbers: 070x, 080x, 081x, 090x, 091x series
            if (cleaned.match(/^0[7-9][0-1]/)) {
                return '234' + cleaned.slice(1) + '@s.whatsapp.net' // Nigeria
            }
            // Indonesian numbers: 08xx xxxx xxxx
            if (cleaned.startsWith('08')) {
                return '62' + cleaned.slice(1) + '@s.whatsapp.net' // Indonesia
            }
        }
        
        // For other patterns, you might want to ask user or default to a country
        // For now, let's try Indonesia as fallback for 0-starting numbers
        return '62' + cleaned.slice(1) + '@s.whatsapp.net'
    }
    
    // If no country code and doesn't start with 0, assume it's missing country code
    // This is tricky - might want to ask user or use bot's location as hint
    if (cleaned.length === 10) {
        // Could be US/Nigeria without country code
        // You might want to add logic here or ask for clarification
        return cleaned + '@s.whatsapp.net' // Return as is, let user add country code manually
    }
    
    return cleaned + '@s.whatsapp.net'
}

const sudo = async (m, client) => {
    // Bot owner ID - replace with actual owner number
    const OWNER_ID = '6281234567890@s.whatsapp.net' // Replace with actual owner
    
    if (m.sender !== OWNER_ID) {
        return m.reply('❌ Only the bot owner can use sudo commands')
    }

    const args = m.text.split(' ').slice(1)
    const action = args[0]
    const number = args.slice(1).join(' ') // Join in case number has spaces
    
    if (!action) {
        return m.reply(`❌ Usage:
*sudo add [number]* - Add sudo user
*sudo remove [number]* - Remove sudo user  
*sudo list* - List all sudo users

📝 Number formats supported:
• +234801234567 (with country code)
• 08012345678 (Nigerian local)
• 081234567890 (Indonesian local)
• 2348012345678 (international without +)`)
    }

    try {
        switch (action.toLowerCase()) {
            case 'add':
                if (!number) return m.reply('❌ Provide a phone number')
                
                const formattedNum = formatPhoneNumber(number)
                
                if (sudoUsers.has(formattedNum)) {
                    return m.reply('⚠️ This number is already a sudo user')
                }

                sudoUsers.add(formattedNum)
                
                // Show which country was detected
                const countryCode = formattedNum.split('@')[0]
                let detectedCountry = 'Unknown'
                
                for (const [code, country] of Object.entries(countryCodes)) {
                    if (countryCode.startsWith(code)) {
                        detectedCountry = country
                        break
                    }
                }
                
                return m.reply(`✅ Added *${number}* to sudo users
🌍 Detected country: ${detectedCountry}
📱 Formatted as: ${countryCode}`)

            case 'remove':
                if (!number) return m.reply('❌ Provide a phone number')
                
                const formatNum = formatPhoneNumber(number)

                if (sudoUsers.delete(formatNum)) {
                    return m.reply(`✅ Removed *${number}* from sudo users`)
                }
                return m.reply('❌ Number not found in sudo list')

            case 'list':
                if (sudoUsers.size === 0) return m.reply('📝 No sudo users found')
                
                const list = Array.from(sudoUsers)
                    .map((num, index) => {
                        const phoneNum = num.replace('@s.whatsapp.net', '')
                        let country = 'Unknown'
                        
                        for (const [code, countryName] of Object.entries(countryCodes)) {
                            if (phoneNum.startsWith(code)) {
                                country = countryName
                                break
                            }
                        }
                        
                        return `${index + 1}. +${phoneNum} (${country})`
                    })
                    .join('\n')
                
                return m.reply(`📝 *Sudo Users (${sudoUsers.size}):*\n\n${list}`)

            default:
                return m.reply('❌ Invalid action. Use *add*, *remove*, or *list*')
        }
    } catch (error) {
        console.error('Error in sudo command:', error)
        return m.reply('❌ Failed to process sudo command')
    }
}

// Helper function to check if user is sudo
const isSudo = (userId) => {
    return sudoUsers.has(userId)
}

module.exports = {
    command: 'sudo',
    handler: sudo,
    isSudo
}