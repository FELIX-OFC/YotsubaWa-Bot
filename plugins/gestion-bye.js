import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { WAMessageStubType } from '@whiskeysockets/baileys'

export async function before(m, { conn, participants, groupMetadata }) {
  try {
    if (!m.isGroup) return true

    if (!global.db) global.db = { data: { chats: {} } }
    if (!global.db.data) global.db.data = { chats: {} }
    if (!global.db.data.chats) global.db.data.chats = {}
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}

    const chat = global.db.data.chats[m.chat]

    if (chat.bye === undefined) chat.bye = true

    if (m.text) {
      const text = m.text.trim().toLowerCase()
      const cmd = text.split(/\s+/)
      if (cmd[0] === '#bye') {
        const action = cmd[1]
        if (action === 'on') {
          chat.bye = true
          await conn.reply(m.chat, '✅ Bye activated 🍀', m)
          return true
        } else if (action === 'off') {
          chat.bye = false
          await conn.reply(m.chat, '✅ Bye deactivated', m)
          return true
        }
      }
    }

    if (!chat.bye) return true

    if (!m.messageStubType) return true

    const groupSize = (participants || []).length

    const sendSingleBye = async (jid, text, user, quoted) => {
      try {
        let ppUrl = null
        try {
          ppUrl = await conn.profilePictureUrl(user, 'image')
        } catch {}

        if (!ppUrl) {
          ppUrl = 'https://img.goodfon.com/original/2912x1632/d/bf/anime-art-wallpaper-bele-ryzhie-volosy-the-quintessential--4.jpg'
        }

        let imagePath = null
        const response = await fetch(ppUrl)
        if (!response.ok) throw new Error('Failed to fetch image')
        const buffer = await response.buffer()
        const tmpDir = './tmp'
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
        imagePath = path.join(tmpDir, `bye_${user}_${Date.now()}.jpg`)
        fs.writeFileSync(imagePath, buffer)

        let contextInfo = {
          mentionedJid: [user]
        }
        if (global.ch && global.ch.ch1) {
          contextInfo = {
            ...contextInfo,
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: global.ch.ch1,
              newsletterName: '🍀 YOTSUBA NAKANO CHANNEL 🍀',
              serverMessageId: -1
            }
          }
        }

        if (imagePath && fs.existsSync(imagePath)) {
          await conn.sendMessage(jid, {
            image: { url: imagePath },
            caption: text,
            ...contextInfo
          }, { quoted })

          setTimeout(() => {
            try {
              fs.unlinkSync(imagePath)
            } catch {}
          }, 5000)
        } else {
          await conn.reply(jid, text, quoted, { mentions: [user] })
        }

      } catch (err) {
        await conn.reply(jid, text, quoted, { mentions: [user] })
      }
    }

    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_REMOVE || m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_LEAVE) {
      const users = m.messageStubParameters || []
      if (users.length === 0) return true

      for (const user of users) {
        if (!user) continue

        const mentionTag = '@' + user.replace(/@.+/, '')

        let displayName = mentionTag
        try {
          const userName = await conn.getName(user)
          if (userName && userName.trim()) {
            displayName = userName
          }
        } catch {}

        const byeText = `🍀*YOTSUBA NAKANO*🍀

😢*¡ADIÓS AMIGO, VUELVE PRONTO!*😢
〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜
🍀 ¡Adiós ${mentionTag}! 😭 🍀
💔 ¡Yotsuba te va a extrañar mucho en *${groupMetadata?.subject || 'el grupo'}*! ¡El grupo se siente vacío sin ti!
👥 ¡Ahora somos *${groupSize}* compañeros, pero esperamos tu regreso!
🏃‍♀️ ¡Cuando vuelvas, usa *.menu* para unirte de nuevo a la diversión!
🤗 ¡Yotsuba siempre guarda un lugar para ti! ¡No tardes en volver!
〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜

🌟*Yotsuba Nakano*🍀
🍀*¡La hermana que despide con un abrazo y una lágrima!*🍀`

        await sendSingleBye(m.chat, byeText, user, m)
      }
    }
  } catch {}
  return true
}