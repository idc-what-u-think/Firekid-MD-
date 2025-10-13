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

const deleteMsg = async (sock, msg, args, context) => {
    if (!context.isGroup) {
        return await sock.sendMessage(context.from, {
            text: '❌ This command is only for groups'
        }, { quoted: msg });
    }

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quotedMsg) {
        return await sock.sendMessage(context.from, {
            text: '❌ Reply to the message you want to delete'
        }, { quoted: msg });
    }

    try {
        const groupMetadata = await sock.groupMetadata(context.from);

        let senderParticipant = groupMetadata.participants.find(p => p.id === context.sender);

        if (!senderParticipant && context.sender.includes('@lid')) {
            const senderNum = normalizeNumber(context.sender);
            senderParticipant = groupMetadata.participants.find(p => 
                normalizeNumber(p.jid || p.id) === senderNum
            );
        }

        const isSenderAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');

        if (!isSenderAdmin) {
            return await sock.sendMessage(context.from, {
                text: '❌ This command is only for admins'
            }, { quoted: msg });
        }

        const quotedId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (!quotedId || !quotedSender) {
            return await sock.sendMessage(context.from, {
                text: '❌ Could not identify the message to delete'
            }, { quoted: msg });
        }

        const key = {
            remoteJid: context.from,
            fromMe: false,
            id: quotedId,
            participant: quotedSender
        };

        await sock.sendMessage(context.from, { delete: key });

        return await sock.sendMessage(context.from, {
            text: '✅ Message deleted successfully'
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in delete command:', error.message);
        return await sock.sendMessage(context.from, {
            text: `❌ Failed to delete message: ${error.message}`
        }, { quoted: msg });
    }
};

module.exports = {
    command: 'delete',
    handler: deleteMsg
};
