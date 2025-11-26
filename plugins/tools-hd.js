import axios from 'axios';

// Debes implementar esta función para subir la imagen y obtener el enlace público
const subirImagen = async (stream) => {
  // Implementación necesaria según tu sistema de imágenes.
  // Ejemplo: return await uploadToImgurOrYourHost(stream);
};

const handler = async (m, { conn }) => {
  let imgUrl;

  // Detecta imagen enviada o respondida
  if ((m.msg && m.msg.mtype === 'imageMessage') || (m.quoted && m.quoted.mtype === 'imageMessage')) {
    const q = m.quoted ? m.quoted : m.msg;
    const stream = await conn.download(q);
    imgUrl = await subirImagen(stream); // Implementa la carga y obtén el URL público
  }

  if (!imgUrl) {
    return m.reply('❌ Debes enviar o responder a una imagen para mejorar su calidad.');
  }

  await m.reply('✨ Mejorando Calidad...');
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

  // Endpoints y claves
  const apiStellar = `https://api.stellarwa.xyz/tools/upscale?url=${encodeURIComponent(imgUrl)}&key=stellar-5ny4YdAV`;
  const apiAlya    = `https://rest.alyabotpe.xyz/tools/upscale?url=${encodeURIComponent(imgUrl)}&key=stellar-0QNEPI8v`;

  // Intenta Stellar, si falla, Alya
  let enhancedImg;
  try {
    let res = await axios.get(apiStellar);
    if (res.data?.status && res.data.result) enhancedImg = res.data.result;
  } catch (e) {}

  if (!enhancedImg) {
    try {
      let res = await axios.get(apiAlya);
      if (res.data?.status && res.data.result) enhancedImg = res.data.result;
    } catch (e) {}
  }

  if (!enhancedImg) {
    return m.reply('❌ No se pudo mejorar la calidad de la imagen, intenta luego.');
  }

  await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
  await conn.sendMessage(m.chat, {
    image: { url: enhancedImg },
    caption: '✨ Esta es tu imagen con su calidad mejorada ✨'
  }, { quoted: m });
};

handler.command = /^hd$/i;
export default handler;