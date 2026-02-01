import fetch from "node-fetch";
import yts from 'yt-search';

const API_KEY = 'Duarte-zz12'; // Deja como está si es tu key

async function getAudioFromApis(url) {
  const apis = [
    { api: 'AlyaBot Play', endpoint: `https://rest.alyabotpe.xyz/dl/youtubeplay?query=\( {encodeURIComponent(url)}&key= \){API_KEY}`, extractor: res => res?.status ? (res.data?.download || res.data?.dl || res.data?.url) : null },
    { api: 'AlyaBot v2', endpoint: `https://rest.alyabotpe.xyz/dl/ytmp3?url=\( {encodeURIComponent(url)}&key= \){API_KEY}`, extractor: res => res?.status ? (res.data?.dl || res.data?.url || res.data?.download) : null }
  ];

  for (const api of apis) {
    try {
      const response = await fetch(api.endpoint);
      if (!response.ok) continue;
      const data = await response.json();
      const downloadUrl = api.extractor(data);
      if (downloadUrl && String(downloadUrl).startsWith('http')) {
        return downloadUrl;
      }
    } catch {}
  }
  throw new Error('No se pudo obtener el enlace de descarga de ninguna API de audio');
}

async function getVideoFromApis(url) {
  const apis = [
    { api: 'AlyaBot Video', endpoint: `https://rest.alyabotpe.xyz/dl/ytmp4?url=\( {encodeURIComponent(url)}&key= \){API_KEY}`, extractor: res => res?.status ? (res.data?.dl || res.data?.url || res.data?.download) : null },
    { api: 'API Causas', endpoint: `https://api-causas.duckdns.org/api/v1/descargas/youtube?url=${encodeURIComponent(url)}&type=video&apikey=causa-adc2c572476abdd8`, extractor: res => res?.status ? (res.data?.download?.url || res.data?.download) : null }
  ];

  for (const api of apis) {
    try {
      const response = await fetch(api.endpoint);
      if (!response.ok) continue;
      const data = await response.json();
      const downloadUrl = api.extractor(data);
      if (downloadUrl && String(downloadUrl).startsWith('http')) {
        return downloadUrl;
      }
    } catch {}
  }
  throw new Error('No se pudo obtener el enlace de descarga de ninguna API de video');
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatViews(views) {
  if (views === undefined || views === null) return "No disponible";
  const numViews = parseInt(views, 10) || 0;
  if (numViews >= 1_000_000_000) return `${(numViews / 1_000_000_000).toFixed(1)}B`;
  if (numViews >= 1_000_000) return `${(numViews / 1_000_000).toFixed(1)}M`;
  if (numViews >= 1_000) return `${(numViews / 1_000).toFixed(1)}K`;
  return numViews.toLocaleString();
}

const handler = async (m, { conn, text = '', usedPrefix = '', command = '' }) => {
  try {
    text = text.trim();
    if (!text) {
      return conn.reply(m.chat, `🍀 *YOTSUBA NAKANO PREMIUM BOT* 🍀\n\n🌟 ¡Bienvenido al descargador ultra premium de Yotsuba! 🌟\n\nIngresa el nombre de un video o canción de YouTube, o proporciona un enlace directo.\n\n*Ejemplo:* \( {usedPrefix} \){command} Let You Down Cyberpunk\n\n🍀 ¡Disfruta de descargas rápidas y de alta calidad! 🍀`, m);
    }

    let videoInfo = null;
    let url = '';

    const isYouTubeUrl = /youtube\.com|youtu\.be/i.test(text);

    const search = await yts(isYouTubeUrl ? text : text);
    if (!search || ((!search.videos || search.videos.length === 0) && (!search.all || search.all.length === 0))) {
      return conn.reply(m.chat, '🍀 No se encontraron resultados para tu búsqueda. Intenta con palabras clave más precisas. 🍀', m);
    }

    videoInfo = (search.videos && search.videos[0]) || (search.all && search.all[0]);
    url = videoInfo?.url;

    if (!videoInfo || !url) {
      return conn.reply(m.chat, '🍀 No se pudo obtener información del video. Por favor, intenta de nuevo. 🍀', m);
    }

    const title = videoInfo.title || 'Desconocido';
    const thumbnail = videoInfo.thumbnail || videoInfo.image || '';
    const timestamp = videoInfo.timestamp || videoInfo.duration || 'Desconocido';
    const views = videoInfo.views ?? videoInfo.viewCount ?? 0;
    const ago = videoInfo.ago || videoInfo.uploaded || 'Desconocido';
    const author = (videoInfo.author && videoInfo.author.name) ? videoInfo.author.name : (videoInfo.author || 'Desconocido');

    const vistas = formatViews(views);
    const canal = author || 'Desconocido';

    const buttons = [
      ['🎵 Audio MP3 Premium', 'ytdlv2_audio_mp3'],
      ['🎬 Video MP4 HD', 'ytdlv2_video_mp4'],
      ['📁 Audio como Documento', 'ytdlv2_audio_doc'],
      ['📁 Video como Documento', 'ytdlv2_video_doc']
    ];

    const infoText = `*🍀 YOTSUBA NAKANO ULTRA PREMIUM BOT 🍀*

🌟 *Título:* ${title}
🍀 *Duración:* ${timestamp}
🌟 *Vistas:* ${vistas}
🍀 *Canal:* ${canal}
🌟 *Publicado:* ${ago}

🍀 *Elige tu formato premium para una descarga impecable:* 🍀`;

    const footer = '🌟 Yotsuba Nakano Bot - Descargador Elite de YouTube 🌟\n🍀 ¡Experiencia premium garantizada! 🍀';

    try {
      let thumbBuffer = null;
      if (thumbnail) {
        const response = await fetch(thumbnail);
        if (response.ok) {
          thumbBuffer = await response.buffer();
        }
      }

      if (typeof conn.sendNCarousel === 'function') {
        await conn.sendNCarousel(m.chat, infoText, footer, thumbBuffer, buttons.map(b => [b[0], `\( {usedPrefix} \){b[1]}`]), null, null, null, m);
      } else {
        const btns = buttons.map(b => ({ buttonId: `\( {usedPrefix} \){b[1]}`, buttonText: { displayText: b[0] }, type: 1 }));
        await conn.sendMessage(m.chat, { text: infoText + '\n\n' + footer, buttons: btns, headerType: 1, image: thumbBuffer ? { url: thumbnail } : undefined }, { quoted: m });
      }
    } catch {
      const btns = buttons.map(b => ({ buttonId: `\( {usedPrefix} \){b[1]}`, buttonText: { displayText: b[0] }, type: 1 }));
      await conn.sendMessage(m.chat, { text: infoText + '\n\n' + footer, buttons: btns, headerType: 1 }, { quoted: m });
    }

    if (!global.db) global.db = { data: { users: {} } };
    if (!global.db.data) global.db.data = { users: {} };
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {};
    global.db.data.users[m.sender].lastYTSearch = {
      url,
      title,
      messageId: m.key?.id,
      timestamp: Date.now()
    };

  } catch (error) {
    return conn.reply(m.chat, `🍀 Ocurrió un error premium: ${error.message || 'Desconocido'}. Intenta de nuevo o contacta al soporte. 🍀`, m);
  }
};

async function processDownload(conn, m, url, title, option) {
  const downloadTypes = {
    1: '🎵 audio MP3 premium',
    2: '🎬 video MP4 HD',
    3: '📁 audio MP3 como documento',
    4: '📁 video MP4 como documento'
  };
  const downloadType = downloadTypes[option] || 'archivo premium';
  await conn.reply(m.chat, `🍀 Preparando tu ${downloadType} con calidad elite... 🌟`, m);

  try {
    const isVideo = option === 2 || option === 4;
    const downloadUrl = isVideo ? await getVideoFromApis(url) : await getAudioFromApis(url);

    let safeName = (title || 'yotsuba_premium_file').replace(/[\/\\<>:"|?*\x00-\x1F]/g, '_').trim();
    if (!safeName) safeName = 'yotsuba_premium_file';
    safeName = safeName.substring(0, 100);

    if (option === 1 || option === 3) {
      const fileName = `${safeName}.mp3`;
      const msg = {
        [option === 1 ? 'audio' : 'document']: { url: downloadUrl },
        mimetype: 'audio/mpeg',
        fileName
      };
      await conn.sendMessage(m.chat, msg, { quoted: m });
    } else {
      const fileName = `${safeName}.mp4`;
      const msg = {
        [option === 2 ? 'video' : 'document']: { url: downloadUrl },
        mimetype: 'video/mp4',
        fileName,
        caption: `🌟 ${title} - Descargado por Yotsuba Nakano🍀`
      };
      await conn.sendMessage(m.chat, msg, { quoted: m });
    }

    const user = global.db?.data?.users?.[m.sender] || {};
    if (!user.monedaDeducted) {
      user.moneda = (user.moneda || 0) - 2;
      user.monedaDeducted = true;
      await conn.reply(m.chat, `🍀  *Realizado con exito 🌟* para esta descarga elite.`, m);
    }

    return true;
  } catch (error) {
    await conn.reply(m.chat, `🍀 Error en la descarga premium: ${error.message || 'Desconocido'}. Intenta otra API o verifica el enlace. 🍀`, m);
    return false;
  }
}

handler.before = async (m, { conn, usedPrefix }) => {
  try {
    const msg = m.message || {};
    const br = msg.buttonsResponseMessage || msg.listResponseMessage || msg.templateButtonReplyMessage || null;
    let selectedId = br?.selectedButtonId || br?.singleSelectReply?.selectedRowId || br?.selectedId || null;

    if (!selectedId && m.text) {
      const textLower = m.text.trim().toLowerCase();
      if (textLower.includes('audio mp3 premium')) selectedId = 'ytdlv2_audio_mp3';
      else if (textLower.includes('video mp4 hd')) selectedId = 'ytdlv2_video_mp4';
      else if (textLower.includes('audio como documento')) selectedId = 'ytdlv2_audio_doc';
      else if (textLower.includes('video como documento')) selectedId = 'ytdlv2_video_doc';
    }

    if (!selectedId) return false;

    const buttonPatterns = {
      'ytdlv2_audio_mp3': 1,
      'ytdlv2_video_mp4': 2,
      'ytdlv2_audio_doc': 3,
      'ytdlv2_video_doc': 4
    };

    const option = buttonPatterns[selectedId];
    if (!option) return false;

    const user = global.db?.data?.users?.[m.sender];
    if (!user || !user.lastYTSearch) {
      await conn.reply(m.chat, '🍀 No hay búsqueda premium activa. Realiza una nueva búsqueda con .play 🍀', m);
      return false;
    }

    if (Date.now() - (user.lastYTSearch.timestamp || 0) > 10 * 60 * 1000) {
      await conn.reply(m.chat, '🍀 La búsqueda premium ha expirado. Por favor, inicia una nueva. 🍀', m);
      user.lastYTSearch = null;
      return false;
    }

    user.monedaDeducted = false;

    await processDownload(conn, m, user.lastYTSearch.url, user.lastYTSearch.title, option);
    user.lastYTSearch = null;

    return true;
  } catch (error) {
    await conn.reply(m.chat, `🍀 Error en el procesamiento premium: ${error.message || 'Desconocido'}. 🍀`, m);
    return false;
  }
};

handler.command = handler.help = ['play', 'ytdlv2'];
handler.tags = ['downloader'];
handler.register = true;

export default handler;