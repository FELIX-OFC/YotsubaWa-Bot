// ping.js (handler para Baileys)
const handler = async (m, { conn }) => {
  try {
    // Marca el inicio para medir latencia
    const start = Date.now();

    // Envía el mensaje (se mide el tiempo que tarda sendMessage)
    await conn.sendMessage(
      m.chat,
      { text: `¡Pong! ${Date.now() - start}ms` },
      { quoted: m, contextInfo: rcanal } // <-- aquí pasas m y rcanal para el "contexto de canal"
    );
  } catch (err) {
    console.error(err);
    // intenta notificar el error (también usando quoted para mantener contexto)
    await conn.sendMessage(m.chat, { text: 'Error al calcular ping' }, { quoted: m, contextInfo: rcanal }).catch(() => {});
  }
};

handler.command = ['p', 'ping']; // disparadores: #p o #ping según tu sistema de prefixes
export default handler;