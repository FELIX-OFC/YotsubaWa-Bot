import fs from 'fs'

const handler = async (m, { conn, args }) => {
  // Identifica a qué usuario consultar (mencionado, respondido o el propio)
  let user =
    m.mentionedJid && m.mentionedJid.length ? m.mentionedJid[0] :
    m.quoted && m.quoted.sender ? m.quoted.sender :
    m.sender

  let isSelf = user === m.sender

  // Lee la base de datos
  let db
  try {
    db = JSON.parse(fs.readFileSync('jsons/character/database.json', 'utf8'))
  } catch (e) {
    return conn.sendMessage(m.chat, { text: '🍃 Error al leer la base de datos.', quoted: m })
  }

  // Construye el harem para ese usuario
  let personajes = Object.entries(db)
    .filter(([id, data]) => data.user === user)
    .map(([id, data]) => ({ id, nombre: data.nombrePersonaje || data.nombre || '', timestamp: data.timestamp }))

  // Si no tiene personajes
  if (personajes.length === 0) {
    if (isSelf) {
      return conn.sendMessage(m.chat, { text: '👑 No tienes personajes en tu harem.', quoted: m })
    } else {
      return conn.sendMessage(m.chat, { text: '🍃 El usuario no tiene personajes en su harem.', quoted: m })
    }
  }

  // Busca últimos reclamos (según timestamp mayor)
  personajes.sort((a, b) => b.timestamp - a.timestamp)
  const lastClaim = personajes[0]
  const minutos = Math.floor((Date.now() - lastClaim.timestamp) / 60000)

  // Crea la lista formateada
  const lista = personajes
    .map(p => `🌟 *${p.nombre}* (${p.id})`)
    .join('\n')

  // Nombre visible (para últimos reclamos opcional puedes agregar getName)
  const nameText = isSelf ? 'Tú' : (await conn.getName(user).catch(() => 'Usuario'))

  // Mensaje final
  const msg =
`*🍃 HAREM USER 🍃*

👑 Personajes: *${personajes.length}*
Último reclamo: *${minutos} minuto${minutos === 1 ? '' : 's'} atrás*

${lista}
`

  await conn.sendMessage(m.chat, { text: msg, mentions: [user] }, { quoted: m })
}

handler.command = ['harem']
handler.help = ['harem [@usuario]/[responder mensaje]']
handler.tags = ['game']

export default handler