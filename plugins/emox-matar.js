import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
  try {
    // resolver destinatario
    let who = (m.mentionedJid && m.mentionedJid.length > 0)
      ? m.mentionedJid[0]
      : (m.quoted ? m.quoted.sender : null)

    let name = who
      ? await conn.getName(who).catch(() => who.split('@')[0])
      : null

    let name2 = m.pushName || (await conn.getName(m.sender).catch(() => m.sender.split('@')[0])) || m.sender.split('@')[0]

    let str = who
      ? `👑 \`${name2}\` asesinó a \`${name}\` en el duelo ⚔️`
      : `👑 \`${name2}\` desapareció dramáticamente 💫`

    // sólo en grupos
    if (!m.isGroup) {
      await conn.sendMessage(m.chat, { text: 'Este comando solo funciona en grupos.' }, { quoted: m })
      return
    }

    // carpeta local de GIFs/MP4 (ruta relativa al root del proyecto)
    const gifDir = './media/gifs/kill'
    // si no existe la carpeta, avisar y crear la estructura mínima
    if (!fs.existsSync(gifDir)) {
      try {
        fs.mkdirSync(gifDir, { recursive: true })
        await conn.sendMessage(m.chat, { text: 'Carpeta de GIFs creada en `media/gifs/kill`. Sube algunos GIFs o MP4 allí y vuelve a intentarlo.' }, { quoted: m })
      } catch (err) {
        console.error('Error creando carpeta de GIFs:', err)
        await conn.sendMessage(m.chat, { text: 'No pude crear la carpeta de GIFs. Revisa permisos.' }, { quoted: m })
      }
      return
    }

    // leer archivos válidos
    let files = fs.readdirSync(gifDir).filter(f => {
      const lower = f.toLowerCase()
      return lower.endsWith('.gif') || lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.m4v')
    })

    if (!files.length) {
      await conn.sendMessage(m.chat, { text: '❌ No hay GIFs/MP4 en `media/gifs/kill`. Sube algunos archivos y vuelve a intentarlo.' }, { quoted: m })
      return
    }

    // elegir aleatorio
    const chosen = files[Math.floor(Math.random() * files.length)]
    const filePath = path.join(gifDir, chosen)
    const buffer = fs.readFileSync(filePath)

    // enviar: para GIF/MP4 usamos video + gifPlayback para que reproduzca como GIF
    await conn.sendMessage(
      m.chat,
      {
        video: buffer,
        gifPlayback: true,
        caption: str,
        mentions: who ? [who] : []
      },
      { quoted: m }
    )
  } catch (err) {
    console.error('Error en plugin kill:', err)
    try {
      await conn.sendMessage(m.chat, { text: 'Ocurrió un error al enviar el GIF. Revisa logs.' }, { quoted: m })
    } catch (e) {}
  }
}

handler.help = ['kill']
handler.tags = ['anime']
handler.command = ['kill', 'matar', 'muere']
handler.group = true
handler.register = true

export default handler