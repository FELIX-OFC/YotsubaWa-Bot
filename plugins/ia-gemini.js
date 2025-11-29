import axios from 'axios';

const handler = async (m, { args }) => {
  const texto = args.join(' ').trim();

  // Si no hay texto, advierte y reacciona con ❌
  if (!texto) {
    if (m?.react) await m.react('❌');
    return m.reply('*⚠️ Por favor escribe un texto después del comando. Ejemplo:\n#ia ¿Cómo está el clima hoy?*');
  }

  // Reacciona con ⏰ mientras espera respuesta de la API
  if (m?.react) await m.react('⏰');

  try {
    const url = `https://api-adonix.ultraplus.click/ai/gemini?apikey=AdonixKeyd6ne2h9555&text=${encodeURIComponent(texto)}`;
    const res = await axios.get(url);

    // Reacciona con 🤖 cuando ya tiene respuesta
    if (m?.react) await m.react('🤖');

    const respuesta = res.data?.result;
    if (!respuesta) {
      if (m?.react) await m.react('❌');
      return m.reply('*❗ Ocurrió un error al conectar con la IA.*');
    }
    m.reply(respuesta);
  } catch (e) {
    if (m?.react) await m.react('❌');
    m.reply('*❗ Ocurrió un error al conectar con la IA.*');
  }
}

handler.help = ['ia <texto>', 'ai <texto>'];
handler.tags = ['ai', 'chatbot'];
handler.command = /^(ia|ai)$/i;

export default handler;