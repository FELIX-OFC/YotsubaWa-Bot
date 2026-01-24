/*
🍀💛 Plugin inspirado en Yotsuba Nakano 💛🍀
Genki mode: ON!! ✨
Código adaptado para bots tipo Yotsuba / anime fun style

Autor base: Félix-OFIC
Estilo Yotsuba Nakano 🌻
*/

import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
  let who = m.mentionedJid.length > 0
    ? m.mentionedJid[0]
    : (m.quoted ? m.quoted.sender : null)

  let name = who
    ? (await conn.getName(who)) || who.replace('@s.whatsapp.net', '')
    : null

  let name2 = m.pushName
    || (await conn.getName(m.sender))
    || m.sender.split('@')[0]

  // Mensajes estilo Yotsuba (genki + anime)
  let str = who
    ? `🍀💥 ¡Yotsubaaa! 💥🍀\n\`${name2}\` derrotó a \`${name}\` en una pelea súper caótica ⚔️😆`
    : `🍀✨ \`${name2}\` salió corriendo sin explicación… muy estilo Yotsuba 😜💨`

  if (!m.isGroup) {
    await conn.sendMessage(
      m.chat,
      { text: '🍀 Este comando solo funciona en grupos, ¡jeje!' },
      { quoted: m }
    )
    return
  }

  // GIFs / videos (anime vibes)
  const videos = [
    'https://media.tenor.com/jrnH6CdNne0AAAPo/2s.mp4',
    'https://media.tenor.com/NbBCakbfZnkAAAPo/die-kill.mp4',
    'https://media.tenor.com/SIrXZQWK9WAAAAPo/me-friends.mp4',
    'https://media.tenor.com/Ay1Nm0X2VP8AAAPo/falling-from-window-anime-death.mp4',
    'https://media.tenor.com/rblZGXCYSmAAAAPo/akame.mp4',
    'https://media.tenor.com/dtXcyLvxLLkAAAPo/akame.mp4',
    'https://media.tenor.com/WakyzIJP0t0AAAPo/angels-of-death-anime-boy-bandage.mp4',
    'https://media.tenor.com/wa_191SsAEwAAAPo/nana-anime.mp4'
  ]

  const video = videos[Math.floor(Math.random() * videos.length)]

  await conn.sendMessage(
    m.chat,
    {
      video: { url: video },
      gifPlayback: true,
      caption: str,
      mentions: who ? [who] : []
    },
    { quoted: m }
  )
}

handler.help = ['kill']
handler.tags = ['anime', 'yotsuba']
handler.command = ['kill', 'matar', 'muere']
handler.group = true
handler.register = true

export default handler