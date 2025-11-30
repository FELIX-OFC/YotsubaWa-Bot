function user(a) {
  return '@' + a.split('@')[0]
}

function getRandomUnique(list, n) {
  const listCopy = [...list]
  const result = []
  while (result.length < n && listCopy.length > 0) {
    const idx = Math.floor(Math.random() * listCopy.length)
    result.push(listCopy.splice(idx, 1)[0])
  }
  return result
}

const handler = async (m, { groupMetadata, args, conn }) => {
  const entrada = args.join(' ').trim()
  if (!entrada) return conn.reply(m.chat, '🌛 Usa el formato: #formarsala <VS|Clanes/Países>\nEjemplo: #formarsala 2v2|ColombiavsMexico', m, rcanal)

  const [vsRaw, gruposRaw] = entrada.split('|').map(v => v?.trim())
  if (!vsRaw || !gruposRaw) return conn.reply(m.chat, '🌛 Escribe ambos parámetros: VS|Clanes/Países.\nEjemplo: #formarsala 2v2|ColombiavsMexico', m, rcanal)

  // Aquí se admite 1vs1, 2v2, v o vs minúsculas/mayúsculas (tanto "v" como "vs")
  const vsMatch = vsRaw.match(/^(\d+)\s*[vV][sS]?\s*(\d+)$/)
  if (!vsMatch) return conn.reply(m.chat, '🌛 El primer parámetro debe ser formato NºvNº o NºvsNº, ejemplo: 2v2, 1vs1, 5vs5', m, rcanal)

  const numA = parseInt(vsMatch[1])
  const numB = parseInt(vsMatch[2])
  const totalNecesarios = numA + numB + 2

  let ps = groupMetadata?.participants?.map(v => v.id) || []
  if (ps.length < totalNecesarios) {
    return conn.reply(m.chat, `👑 Se necesitan ${totalNecesarios} para formar la sala.`, m, rcanal)
  }

  const randomUsers = getRandomUnique(ps, totalNecesarios)
  const equipoA = randomUsers.slice(0, numA)
  const equipoB = randomUsers.slice(numA, numA + numB)
  const suplentes = randomUsers.slice(numA + numB, numA + numB + 2)

  let msg = `🌛 *Versus:* ${numA} vs ${numB}\n🏙 *Pais/Clans:* ${gruposRaw}\n\n`
  msg += `👑 *Equipo 1:*\n${equipoA.map(u => `- ${user(u)}`).join('\n')}\n\n`
  msg += `👑 *Equipo 2:*\n${equipoB.map(u => `- ${user(u)}`).join('\n')}\n\n`
  msg += `- Suplentes:\n${suplentes.map(u => `- ${user(u)}`).join('\n')}`

  conn.reply(m.chat, msg, m, { mentions: randomUsers })
}

handler.help = ['formarsala <vs|clanes/países>']
handler.command = ['formarsala']
handler.tags = ['group']
handler.group = true
handler.register = true

export default handler