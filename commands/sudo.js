let sudoUsers = new Set()

const countryCodes = {
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

const formatPhoneNumber = (number) => {
    let cleaned = number.replace(/[^0-9]/g, '')
    
    if (number.startsWith('+')) {
        cleaned = number.slice(1).replace(/[^0-9]/g, '')
        return cleaned + '@s.whatsapp.net'
    }
    
    if (cleaned.length > 10 && !cleaned.startsWith('0')) {
        return cleaned + '@s.whatsapp.net'
    }
    
    if (cleaned.startsWith('0')) {
        if (cleaned.length === 11) {
            if (cleaned.match(/^0[7-9][0-1]/)) {
                return '234' + cleaned.slice(1) + '@s.whatsapp.net'
            }
            if (cleaned.startsWith('08')) {
                return '62' + cleaned.slice(1) + '@s.whatsapp.net'
            }
        }
        
        return '62' + cleaned.slice(1) + '@s.whatsapp.net'
    }
    
    if (cleaned.length === 10) {
        return cleaned + '@s.whatsapp.net'
    }
    
    return cleaned + '@s.whatsapp.net'
}

const sudo = async (sock, msg, args, context) => {
    const OWNER_ID = '8064610975@s.whatsapp.net'
    
    if (context.sender !== OWNER_ID) {
        return await sock.sendMessage(context.from, {
            text: '❌ Only the bot owner can use sudo commands'
        });
    }

    const action = args[0]
    const number = args.slice(1).join(' ')
    
    if (!action) {
        return await sock.sendMessage(context.from, {
            text: `❌ Usage:
*sudo add [number]* - Add sudo user
*sudo remove [number]* - Remove sudo user  
*sudo list* - List all sudo users

📝 Number formats supported:
• +234801234567 (with country code)
• 08012345678 (Nigerian local)
• 081234567890 (Indonesian local)
• 2348012345678 (international without +)`
        });
    }

    try {
        switch (action.toLowerCase()) {
            case 'add':
                if (!number) {
                    return await sock.sendMessage(context.from, {
                        text: '❌ Provide a phone number'
                    });
                }
                
                const formattedNum = formatPhoneNumber(number)
                
                if (sudoUsers.has(formattedNum)) {
                    return await sock.sendMessage(context.from, {
                        text: '⚠️ This number is already a sudo user'
                    });
                }

                sudoUsers.add(formattedNum)
                
                const countryCode = formattedNum.split('@')[0]
                let detectedCountry = 'Unknown'
                
                for (const [code, country] of Object.entries(countryCodes)) {
                    if (countryCode.startsWith(code)) {
                        detectedCountry = country
                        break
                    }
                }
                
                return await sock.sendMessage(context.from, {
                    text: `✅ Added *${number}* to sudo users
🌍 Detected country: ${detectedCountry}
📱 Formatted as: ${countryCode}`
                });

            case 'remove':
                if (!number) {
                    return await sock.sendMessage(context.from, {
                        text: '❌ Provide a phone number'
                    });
                }
                
                const formatNum = formatPhoneNumber(number)

                if (sudoUsers.delete(formatNum)) {
                    return await sock.sendMessage(context.from, {
                        text: `✅ Removed *${number}* from sudo users`
                    });
                }
                return await sock.sendMessage(context.from, {
                    text: '❌ Number not found in sudo list'
                });

            case 'list':
                if (sudoUsers.size === 0) {
                    return await sock.sendMessage(context.from, {
                        text: '📝 No sudo users found'
                    });
                }
                
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
                
                return await sock.sendMessage(context.from, {
                    text: `📝 *Sudo Users (${sudoUsers.size}):*\n\n${list}`
                });

            default:
                return await sock.sendMessage(context.from, {
                    text: '❌ Invalid action. Use *add*, *remove*, or *list*'
                });
        }
    } catch (error) {
        console.error('Error in sudo command:', error)
        return await sock.sendMessage(context.from, {
            text: '❌ Failed to process sudo command'
        });
    }
}

const isSudo = (userId) => {
    return sudoUsers.has(userId)
}

module.exports = {
    command: 'sudo',
    handler: sudo,
    isSudo
}
