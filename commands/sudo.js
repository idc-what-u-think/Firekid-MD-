const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const SUDO_FILE = path.join(DATA_DIR, 'sudo_users.json');

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
};

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

const ensureDataDir = () => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    } catch (error) {
        console.error('Error creating data directory:', error.message);
    }
};

const loadSudoUsers = () => {
    try {
        ensureDataDir();
        if (fs.existsSync(SUDO_FILE)) {
            const data = fs.readFileSync(SUDO_FILE, 'utf8');
            const parsed = JSON.parse(data);
            return new Set(parsed.users || []);
        }
        return new Set();
    } catch (error) {
        console.error('Error loading sudo users:', error.message);
        return new Set();
    }
};

const saveSudoUsers = (users) => {
    try {
        ensureDataDir();
        const data = {
            users: Array.from(users),
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(SUDO_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving sudo users:', error.message);
        return false;
    }
};

let sudoUsers = loadSudoUsers();

const formatPhoneNumber = (number) => {
    const cleaned = number.replace(/[^0-9]/g, '');
    
    if (number.startsWith('+')) {
        return cleaned + '@s.whatsapp.net';
    }
    
    if (cleaned.length > 10 && !cleaned.startsWith('0')) {
        return cleaned + '@s.whatsapp.net';
    }
    
    if (cleaned.startsWith('0')) {
        if (cleaned.length === 11 && cleaned.match(/^0[7-9][0-1]/)) {
            return '234' + cleaned.slice(1) + '@s.whatsapp.net';
        }
        if (cleaned.startsWith('08')) {
            return '62' + cleaned.slice(1) + '@s.whatsapp.net';
        }
        return '62' + cleaned.slice(1) + '@s.whatsapp.net';
    }
    
    if (cleaned.length === 10) {
        return cleaned + '@s.whatsapp.net';
    }
    
    return cleaned + '@s.whatsapp.net';
};

const isOwner = (sender) => {
    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) return false;
    
    const senderNum = normalizeNumber(sender);
    const ownerNum = normalizeNumber(ownerNumber);
    
    return senderNum === ownerNum;
};

const extractMentionedJid = (msg) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length > 0) return mentioned[0];
    
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (quotedSender) return quotedSender;
    
    return null;
};

const sudo = async (sock, msg, args, context) => {
    const action = args[0]?.toLowerCase();
    
    if (!action || !['add', 'remove', 'del', 'list'].includes(action)) {
        return await sock.sendMessage(context.from, {
            text: `❌ Usage:
*${context.prefix}sudo add <@user|number>* - Add sudo user
*${context.prefix}sudo remove <@user|number>* - Remove sudo user  
*${context.prefix}sudo list* - List all sudo users

📝 Number formats supported:
- +234801234567 (with country code)
- 08012345678 (Nigerian local)
- 081234567890 (Indonesian local)
- 2348012345678 (international without +)
- @mention user
- Reply to user's message`
        }, { quoted: msg });
    }

    try {
        if (action === 'list') {
            if (sudoUsers.size === 0) {
                return await sock.sendMessage(context.from, {
                    text: '📝 No sudo users found'
                }, { quoted: msg });
            }
            
            const list = Array.from(sudoUsers)
                .map((num, index) => {
                    const phoneNum = num.replace('@s.whatsapp.net', '');
                    let country = 'Unknown';
                    
                    for (const [code, countryName] of Object.entries(countryCodes)) {
                        if (phoneNum.startsWith(code)) {
                            country = countryName;
                            break;
                        }
                    }
                    
                    return `${index + 1}. +${phoneNum} (${country})`;
                })
                .join('\n');
            
            return await sock.sendMessage(context.from, {
                text: `📝 *Sudo Users (${sudoUsers.size}):*\n\n${list}`
            }, { quoted: msg });
        }

        if (!isOwner(context.sender)) {
            return await sock.sendMessage(context.from, {
                text: '❌ Only the bot owner can add/remove sudo users'
            }, { quoted: msg });
        }

        let targetJid = extractMentionedJid(msg);
        
        if (!targetJid && args[1]) {
            targetJid = formatPhoneNumber(args.slice(1).join(' '));
        }
        
        if (!targetJid) {
            return await sock.sendMessage(context.from, {
                text: '❌ Please mention a user, reply to their message, or provide their number'
            }, { quoted: msg });
        }

        if (action === 'add') {
            if (sudoUsers.has(targetJid)) {
                return await sock.sendMessage(context.from, {
                    text: '⚠️ This user is already a sudo user'
                }, { quoted: msg });
            }

            sudoUsers.add(targetJid);
            
            if (!saveSudoUsers(sudoUsers)) {
                sudoUsers.delete(targetJid);
                return await sock.sendMessage(context.from, {
                    text: '❌ Failed to save sudo user'
                }, { quoted: msg });
            }
            
            const countryCode = targetJid.split('@')[0];
            let detectedCountry = 'Unknown';
            
            for (const [code, country] of Object.entries(countryCodes)) {
                if (countryCode.startsWith(code)) {
                    detectedCountry = country;
                    break;
                }
            }
            
            return await sock.sendMessage(context.from, {
                text: `✅ Added sudo user successfully
🌍 Detected country: ${detectedCountry}
📱 Number: +${countryCode}
💾 Saved to storage`
            }, { quoted: msg });
        }

        if (action === 'remove' || action === 'del') {
            if (isOwner(targetJid)) {
                return await sock.sendMessage(context.from, {
                    text: '❌ Owner cannot be removed from sudo'
                }, { quoted: msg });
            }

            if (sudoUsers.delete(targetJid)) {
                if (!saveSudoUsers(sudoUsers)) {
                    sudoUsers.add(targetJid);
                    return await sock.sendMessage(context.from, {
                        text: '❌ Failed to save changes'
                    }, { quoted: msg });
                }
                
                const phoneNum = targetJid.replace('@s.whatsapp.net', '');
                return await sock.sendMessage(context.from, {
                    text: `✅ Removed sudo user successfully\n📱 Number: +${phoneNum}`
                }, { quoted: msg });
            }
            
            return await sock.sendMessage(context.from, {
                text: '❌ User not found in sudo list'
            }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error in sudo command:', error.message);
        return await sock.sendMessage(context.from, {
            text: `❌ Failed to process sudo command: ${error.message}`
        }, { quoted: msg });
    }
};

const isSudo = (userId) => {
    return sudoUsers.has(userId);
};

module.exports = {
    command: 'sudo',
    handler: sudo,
    isSudo,
    isOwner,
    normalizeNumber
};
