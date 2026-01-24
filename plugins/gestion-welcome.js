import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

export async function before(m, { conn, participants, groupMetadata }) {
  try {
    if (!m.isGroup) return true

    if (!global.db) global.db = { data: { chats: {} } }
    if (!global.db.data) global.db.data = { chats: {} }
    if (!global.db.data.chats) global.db.data.chats = {}
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}

    const chat = global.db.data.chats[m.chat]

    if (chat.welcome === undefined) chat.welcome = true
    if (chat.welcome === false && chat.welcome !== true) chat.welcome = true

    if (m.text) {
      const text = m.text.trim().toLowerCase()
      const cmd = text.split(/\s+/)
      if (cmd[0] === '#welcome') {
        const action = cmd[1]
        if (action === 'on') {
          chat.welcome = true
          await conn.reply(m.chat, '✅ Welcome activated 🍀', m)
          return true
        } else if (action === 'off') {
          chat.welcome = false
          await conn.reply(m.chat, '✅ Welcome deactivated', m)
          return true
        }
      }
    }

    if (!chat.welcome) return true

    if (!m.messageStubType) return true

    const groupSize = (participants || []).length

    const sendSingleWelcome = async (jid, text, user, quoted) => {
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
        imagePath = path.join(tmpDir, `welcome_${user}_${Date.now()}.jpg`)
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

    if (m.messageStubType === 27) {
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

        const welcomeText = `🍀*YOTSUBA NAKANO*🍀

🌟*¡NUEVO AMIGO EN LA AVENTURA!*🌟
〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜
🍀 ¡Hola ${displayName}! 😄 🍀
🎉 ¡Bienvenido a *${groupMetadata?.subject || 'el grupo'}*! ¡Yotsuba está súper emocionada!
👥 ¡Ahora somos *${groupSize}* compañeros listos para divertirnos!
🏃‍♀️ ¡Usa *.menu* para ver todas las cosas geniales que podemos hacer juntos!
🤗 ¡Yotsuba siempre da lo mejor! ¡Vamos a ser los mejores amigos!
〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜

🌟*Yotsuba Nakano*🍀
🍀*¡La hermana que siempre ayuda con una sonrisa!*🍀`

        await sendSingleWelcome(m.chat, welcomeText, user, m)
      }
    }
  } catch {}
  return true
}