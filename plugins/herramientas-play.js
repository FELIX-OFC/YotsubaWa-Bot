import fetch from "node-fetch";
import yts from 'yt-search';

const API_KEY = 'Duarte-zz12';

async function getAudioFromApis(url) {

   const apis = [    
    { api: 'AlyaBot Play', endpoint: `https://rest.alyabotpe.xyz/dl/youtubeplay?query=\( {encodeURIComponent(url)}&key= \){API_KEY}`, extractor: res => res.status ? res.data?.download : null },
    { api: 'AlyaBot v2', endpoint: `https://rest.alyabotpe.xyz/dl/ytmp3?url=\( {encodeURIComponent(url)}&key= \){API_KEY}`, extractor: res => res.status ? (res.data?.dl || res.data?.url || res.data?.download) : null }
  ].filter(api => api.endpoint !== null); 

  for (const api of apis) {
    try {
      console.log(`🔄 Trying API: ${api.api}`);
      const response = await fetch(api.endpoint);
      const data = await response.json();
      console.log(`📊 API response:`, JSON.stringify(data, null, 2));

      const downloadUrl = api.extractor(data);
      if (downloadUrl && downloadUrl.startsWith('http')) {
        console.log(`✅ API exitoso: ${api.api}, URL: ${downloadUrl}`);
        return downloadUrl;
      } else {
        console.log(`❌ No se encontró URL válida en ${api.api}`);
      }
    } catch (error) {
      console.log(`❌ API ${api.api} falló:`, error.message);
    }
  }

  throw new Error('No se pudo obtener el enlace de descarga de ninguna API de audio');
}

async function getVideoFromApis(url) {

  const apis = [    
    { api: 'AlyaBot Video', endpoint: `https://rest.alyabotpe.xyz/dl/ytmp4?url=\( {encodeURIComponent(url)}&key= \){API_KEY}`, extractor: res => res.status ? (res.data?.dl || res.data?.url || res.data?.download) : null },
    { api: 'API Causas', endpoint: `https://api-causas.duckdns.org/api/v1/descargas/youtube?url=${encodeURIComponent(url)}&type=video&apikey=causa-adc2c572476abdd8`, extractor: res => res.status ? res.data?.download?.url : null }
  ].filter(api => api.endpoint !== null); 

  for (const api of apis) {
    try {
      console.log(`🔄 Trying API: ${api.api}`);
      const response = await fetch(api.endpoint);
      const data = await response.json();
      console.log(`📊 API response:`, JSON.stringify(data, null, 2));

      const downloadUrl = api.extractor(data);
      if (downloadUrl && downloadUrl.startsWith('http')) {
        console.log(`✅ API exitoso: ${api.api}, URL: ${downloadUrl}`);
        return downloadUrl;
      } else {
        console.log(`❌ No se encontró URL válida en ${api.api}`);
      }
    } catch (error) {
      console.log(`❌ API ${api.api} falló:`, error.message);
    }
  }

  throw new Error('No se pudo obtener el enlace de descarga de ninguna API de video');
}

function extractYouTubeId(url) {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9\-\_]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9\-\_]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9\-\_]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatViews(views) {
  if (views === undefined || views === null) {
    return "No disponible";
  }

  try {
    const numViews = parseInt(views);
    if (numViews >= 1_000_000_000) {
      return `${(numViews / 1_000_000_000).toFixed(1)}B`;
    } else if (numViews >= 1_000_000) {
      return `${(numViews / 1_000_000).toFixed(1)}M`;
    } else if (numViews >= 1_000) {
      return `${(numViews / 1_000).toFixed(1)}k`;
    }
    return numViews.toLocaleString();
  } catch (e) {
    return String(views);
  }
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text.trim()) {
      return conn.reply(m.chat, `🍀YOTSUBA NAKANO🍀\n\n🍀 Ingresa el nombre de la música o URL de YouTube a descargar.\n\nEjemplo: \( {usedPrefix} \){command} Let you Down Cyberpunk`, m);
    }

    let videoInfo;
    let url = '';


    if (text.includes('youtube.com') || text.includes('youtu.be')) {
      url = text;
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        return m.reply('URL de YouTube inválida');
      }


      const search = await yts(videoId);
      if (search.all && search.all.length > 0) {
        videoInfo = search.all.find(v => v.videoId === videoId);
      }
    } else {

      const search = await yts(text);
      if (!search.all || search.all.length === 0) {
        return m.reply('No se encontraron resultados para tu búsqueda.');
      }
      videoInfo = search.all[0];
      url = videoInfo.url;
    }

    if (!videoInfo) {
      return m.reply('No se pudo obtener información del video.');
    }

    const {
      title = 'Desconocido', 
      thumbnail = '', 
      timestamp = 'Desconocido', 
      views = 0, 
      ago = 'Desconocido', 
      author = { name: 'Desconocido' } 
    } = videoInfo;

    if (!url) {
      return m.reply('No se pudo obtener la URL del video.');
    }

    const vistas = formatViews(views);
    const canal = author.name || 'Desconocido';

    const buttons = [
      ['🎵 Audio MP3', 'ytdlv2_audio_mp3'],
      ['🎬 Video MP4', 'ytdlv2_video_mp4'],
      ['📁 MP3 Documento', 'ytdlv2_audio_doc'],
      ['📁 MP4 Documento', 'ytdlv2_video_doc']
    ];

    const infoText = `*𖹭.╭╭ִ╼࣪━ִﮩ٨ـﮩ🍀𝗬𝗼𝘁𝘀𝘂𝗯𝗮🍀ﮩ٨ـﮩ━ִ╾࣪╮╮.𖹭*

> 🍀 *Título:* ${title}
*°.⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸.°*
> 🌟 *Duración:* ${timestamp}
*°.⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸.°*
> 🍀 *Vistas:* ${vistas}
*°.⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸.°*
> 🌟 *Canal:* ${canal}
*°.⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸.°*
> 🍀 *Publicado:* ${ago}
*⏝ּׅ︣︢ۛ۫۫۫۫ۜ⏝ּׅ︣︢ۛ۫۫۫۫۫ۜ⏝ּׅ︣︢ۛ۫۫۫۫۫ۜ⏝ּׅ︣︢ۛ۫۫۫۫۫ۜ⏝ּׅ︣︢ۛ۫۫۫۫۫ۜ⏝ּׅ︣︢ۛ۫۫۫۫۫ۜ⏝ּׅ︣︢ۛ۫۫۫۫۫ۜ⏝ּׅ︣ׄۛ۫۫۫۫۫ۜ*

🌟 *Selecciona el formato para descargar:*`;

    const footer = '🍀 Yotsuba Nakano Bot - YouTube';

    try {
      const thumb = thumbnail ? (await conn.getFile(thumbnail))?.data : null;
      await conn.sendNCarousel(m.chat, infoText, footer, thumb, buttons, null, null, null, m);
    } catch (thumbError) {
      await conn.sendNCarousel(m.chat, infoText, footer, null, buttons, null, null, null, m);
      console.error("Error al obtener la miniatura:", thumbError);
    }

    const usr = global.getUser ? global.getUser(m.sender) : (global.db.data.users[m.sender] = global.db.data.users[m.sender] || {})
    usr.lastYTSearch = {
      url,
      title,
      messageId: m.key.id,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error("Error completo:", error);
    return m.reply(`🍀 Ocurrió un error: ${error.message || 'Desconocido'}`);
  }
};

async function processDownload(conn, m, url, title, option) {
  const downloadTypes = {
    1: '🎵 audio MP3',
    2: '🎬 video MP4', 
    3: '📁 audio MP3 doc',
    4: '📁 video MP4 doc'
  };

  const downloadType = downloadTypes[option] || 'archivo';
  await conn.reply(m.chat, `🍀 Obteniendo ${downloadType}... 🌟`, m);

  try {
    const isVideo = option === 2 || option === 4;

    let downloadUrl;

    if (isVideo) {
      downloadUrl = await getVideoFromApis(url);
    } else {
      downloadUrl = await getAudioFromApis(url);
    }

    console.log(`✅ API exitoso, URL: ${downloadUrl}`);

    let fileName = `${title.replace(/[^\w\s]/gi, '').substring(0, 50)}`;

    if (option === 1 || option === 3) {
      fileName += '.mp3';

      if (option === 1) {
        await conn.sendMessage(m.chat, {
          audio: { url: downloadUrl },
          mimetype: 'audio/mpeg',
          fileName: fileName,
          ptt: false
        }, { quoted: m });
      } else {
        await conn.sendMessage(m.chat, {
          document: { url: downloadUrl },
          mimetype: 'audio/mpeg',
          fileName: fileName
        }, { quoted: m });
      }
    } else {
      fileName += '.mp4';

      if (option === 2) {
        await conn.sendMessage(m.chat, {
          video: { url: downloadUrl },
          mimetype: 'video/mp4',
          fileName: fileName,
          caption: `🎬 ${title}`
        }, { quoted: m });
      } else {
        await conn.sendMessage(m.chat, {
          document: { url: downloadUrl },
          mimetype: 'video/mp4',
          fileName: fileName,
          caption: `📁 ${title}`
        }, { quoted: m });
      }
    }

    const user = global.getUser ? global.getUser(m.sender) : global.db.data.users[m.sender];
    if (user && !user.monedaDeducted) {
      user.moneda = (user.moneda || 0) - 2;
      user.monedaDeducted = true;
      conn.reply(m.chat, `🍀 Has utilizado 2 *Tréboles 🌟*`, m);
    }

    return true;
  } catch (error) {
    console.error("Error al procesar descarga:", error);
    conn.reply(m.chat, `🍀 Error: ${error.message}`, m);
    return false;
  }
}

handler.before = async (m, { conn }) => {
  const buttonPatterns = [
    /ytdlv2_audio_mp3/,
    /ytdlv2_video_mp4/,
    /ytdlv2_audio_doc/,
    /ytdlv2_video_doc/
  ];

  let isButtonResponse = false;
  for (const pattern of buttonPatterns) {
    if (pattern.test(m.text)) {
      isButtonResponse = true;
      break;
    }
  }

  if (!isButtonResponse) {
    return false;
  }

  const user = global.db.data.users[m.sender];
  if (!user || !user.lastYTSearch) {
    await conn.reply(m.chat, '⏰ No hay búsqueda activa. Realiza una nueva búsqueda.', m);
    return false;
  }

  console.log(`🎵 Procesando: ${user.lastYTSearch.title}`);

  const currentTime = Date.now();
  const searchTime = user.lastYTSearch.timestamp || 0;

  if (currentTime - searchTime > 10 * 60 * 1000) {
    await conn.reply(m.chat, '⏰ La búsqueda ha expirado. Por favor realiza una nueva búsqueda.', m);
    return false; 
  }

  let option = null;
  if (m.text.includes('audio_mp3')) {
    option = 1; 
  } else if (m.text.includes('video_mp4')) {
    option = 2; 
  } else if (m.text.includes('audio_doc')) {
    option = 3; 
  } else if (m.text.includes('video_doc')) {
    option = 4; 
  }

  if (!option) {
    return false;
  }

  user.monedaDeducted = false;

  try {
    await processDownload(
      conn, 
      m, 
      user.lastYTSearch.url, 
      user.lastYTSearch.title, 
      option
    );

    user.lastYTSearch = null;

  } catch (error) {
    console.error(`❌ Error en descarga:`, error.message);
    await conn.reply(m.chat, `🍀 Error al procesar la descarga: ${error.message}`, m);
  }

  return true;
};

handler.command = handler.help = ['play', 'ytdlv2'];
handler.tags = ['downloader'];
handler.register = true;

export default handler;