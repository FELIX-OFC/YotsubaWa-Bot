let handler = async (m, { conn, args, command }) => {
  let texto = args.join(' ');
  if (!texto) {
    // Reacciona con ❌ si no hay texto
    if (conn.sendMessage) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key }});
    }
    // Mensaje de advertencia usando contexto rcanal
    return await conn.sendMessage(m.chat, { text: '*👑 Ingresa un texto para hablar con la IA.*' }, m, rcanal);
  }

  // Reacciona con 🕰️ al recibir texto
  if (conn.sendMessage) {
    await conn.sendMessage(m.chat, { react: { text: '⏰', key: m.key }});
  }

  try {
    let url = `https://api-adonix.ultraplus.click/ai/gemini?apikey=AdonixKeyd6ne2h9555&text=${encodeURIComponent(texto)}`
    let res = await fetch(url);
    let json = await res.json();
    let respuesta = json.result || null;

    // Reacciona con 🤖 cuando la respuesta está lista
    if (conn.sendMessage) {
      await conn.sendMessage(m.chat, { react: { text: '🤖', key: m.key }});
    }

    if (!respuesta) {
      // Reacciona con ❌ si no hay respuesta
      if (conn.sendMessage) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key }});
      }
      return await conn.sendMessage(m.chat, { text: '❗ Ocurrió un error al conectar con la IA.' }, { quoted: m });
    }

    await conn.sendMessage(m.chat, { text: respuesta }, { quoted: m });
  } catch (e) {
    // Reacciona con ❌ ante error
    if (conn.sendMessage) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key }});
    }
    await conn.sendMessage(m.chat, { text: '❗ Ocurrió un error al conectar con la IA.' }, { quoted: m });
  }
}

handler.help = ['ia <texto>', 'ai <texto>']
handler.tags = ['ai', 'chatbot']
handler.command = /^(ia|ai)$/i

export default handler