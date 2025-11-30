function user(a) {
  return '@' + a.split('@')[0]
}

function getRandomUnique(list, n) {
  // Devuelve n elementos únicos al azar de una lista
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
  if (!entrada) return conn.reply(m.chat, '🌛 Usa el formato: #formarsala <VS|Clanes/Países>\nEjemplo: #formarsala 5vs5|ColombiavsMexico', m)

  const [vsRaw, gruposRaw] = entrada.split('|').map(v => v?.trim())
  if (!vsRaw || !gruposRaw) return conn.reply(m.chat, '🌛 Escribe ambos parámetros: VS|Clanes/Países.\nEjemplo: #formarsala 5vs5|ColombiavsMexico', m, rcanal)

  const vsMatch = vsRaw.match(/^(\d+)\s*vs\s*(\d+)$/i)
  if (!vsMatch) return conn.reply(m.chat, '🌛 El primer parámetro debe ser formato NºvsNº, ejemplo: 5vs5', m, rcanal)

  const numA = parseInt(vsMatch[1])
  const numB = parseInt(vsMatch[2])
  const total = numA + numB
  const totalNecesarios = total + 2 // Sumando suplentes

  // IDs de los usuarios del grupo
  let ps = groupMetadata?.participants?.map(v => v.id) || []
  if (ps.length < totalNecesarios) {
    return conn.reply(m.chat, `👑 Se necesitan ${totalNecesarios} usuarios en el grupo para formar la sala.`, m, rcanal)
  }

  // Selecciona usuarios aleatorios, sin repetir
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