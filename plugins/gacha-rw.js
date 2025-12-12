/* Código criado por Félix ofc 
Por favor, respeite os créditos ou faça uma doação :D
*/

import fs from 'fs'

const RW_COOLDOWN = 5 * 60 * 1000 // 5 minutos en ms

let userCooldowns = {} // Esto debería ir en una base de datos global para multiserver

const handler = async (m, { conn }) => {
  // Control de cooldown por usuario
  const now = Date.now()
  userCooldowns[m.sender] = userCooldowns[m.sender] || 0
  if (now - userCooldowns[m.sender] < RW_COOLDOWN) {
    const mins = Math.ceil((RW_COOLDOWN - (now - userCooldowns[m.sender])) / 1000 / 60)
    return await conn.sendMessage(m.chat, { text: `🌛 Espera ${mins} min para volver a usar este comando.` }, { quoted: m })
  }
  userCooldowns[m.sender] = now

  // Lee personajes y database
  let chars, db
  try {
    chars = JSON.parse(fs.readFileSync('jsons/character/character.json', 'utf8'))
    db = JSON.parse(fs.readFileSync('jsons/character/database.json', 'utf8'))
  } catch (e) {
    return await conn.sendMessage(m.chat, { text: 'No se pudo acceder a la base de datos.' }, { quoted: m })
  }

  // Personaje random
  const personaje = chars[Math.floor(Math.random() * chars.length)]
  const foto = personaje.fotos[Math.floor(Math.random() * personaje.fotos.length)]

  // Estado dinámico: ¿está reclamado?
  let estado, por = ''
  if (db[personaje.id]) {
    estado = `Reclamado por ${db[personaje.id].nombre}`
    por = db[personaje.id].user
  } else {
    estado = 'Libre'
  }

  const texto = [
    `Nombre: *${personaje.nombre}*`,
    `Id: *${personaje.id}*`,
    `Estado: *${estado}*`,
    `Valor: *${personaje.valor.toLocaleString()}*`
  ].join('\n')

  await conn.sendMessage(m.chat, {
    image: { url: foto },
    caption: texto
  }, {
    quoted: m, 
    contextInfo: {
      externalAdReply: {},
      // Mención opcional al usuario que lo usó
      mentionedJid: [m.sender]
    }
  })
}

handler.command = ['rw']
handler.help = ['rw']
handler.tags = ['game']
export default handler