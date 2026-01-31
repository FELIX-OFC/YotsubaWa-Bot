import fetch from "node-fetch";
import yts from "yt-search";
import fs from "fs";
import path from "path";

const API_KEY = "Duarte-zz12"; // deja tal cual si usas esa API

async function getAudioFromApis(url) {
  const apis = [
    {
      api: "AlyaBot Play",
      endpoint: `https://rest.alyabotpe.xyz/dl/youtubeplay?query=${encodeURIComponent(url)}&key=${API_KEY}`,
      extractor: (res) => (res?.status ? res.data?.download : null),
    },
    {
      api: "AlyaBot v2",
      endpoint: `https://rest.alyabotpe.xyz/dl/ytmp3?url=${encodeURIComponent(url)}&key=${API_KEY}`,
      extractor: (res) => (res?.status ? (res.data?.dl || res.data?.url || res.data?.download) : null),
    },
  ].filter((api) => api.endpoint !== null);

  for (const api of apis) {
    try {
      console.log(`🔄 Intentando API: ${api.api}`);
      const response = await fetch(api.endpoint);
      const data = await response.json();
      console.log(`📊 Respuesta de API (${api.api}):`, JSON.stringify(data, null, 2));
      const downloadUrl = api.extractor(data);
      if (downloadUrl && downloadUrl.startsWith("http")) {
        console.log(`✅ API exitosa: ${api.api}, URL: ${downloadUrl}`);
        return downloadUrl;
      } else {
        console.log(`❌ No se encontró URL válida en ${api.api}`);
      }
    } catch (error) {
      console.log(`❌ API ${api.api} falló:`, error.message || error);
    }
  }
  throw new Error("No se pudo obtener el enlace de descarga de ninguna API de audio");
}

async function getVideoFromApis(url) {
  const apis = [
    {
      api: "AlyaBot Video",
      endpoint: `https://rest.alyabotpe.xyz/dl/ytmp4?url=${encodeURIComponent(url)}&key=${API_KEY}`,
      extractor: (res) => (res?.status ? (res.data?.dl || res.data?.url || res.data?.download) : null),
    },
    {
      api: "API Causas",
      endpoint: `https://api-causas.duckdns.org/api/v1/descargas/youtube?url=${encodeURIComponent(url)}&type=video&apikey=causa-adc2c572476abdd8`,
      extractor: (res) => (res?.status ? res.data?.download?.url : null),
    },
  ].filter((api) => api.endpoint !== null);

  for (const api of apis) {
    try {
      console.log(`🔄 Intentando API: ${api.api}`);
      const response = await fetch(api.endpoint);
      const data = await response.json();
      console.log(`📊 Respuesta de API (${api.api}):`, JSON.stringify(data, null, 2));
      const downloadUrl = api.extractor(data);
      if (downloadUrl && downloadUrl.startsWith("http")) {
        console.log(`✅ API exitosa: ${api.api}, URL: ${downloadUrl}`);
        return downloadUrl;
      } else {
        console.log(`❌ No se encontró URL válida en ${api.api}`);
      }
    } catch (error) {
      console.log(`❌ API ${api.api} falló:`, error.message || error);
    }
  }
  throw new Error("No se pudo obtener el enlace de descarga de ninguna API de video");
}

function extractYouTubeId(url) {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9\-\_]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9\-\_]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9\-\_]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatViews(views) {
  if (views === undefined || views === null) return "No disponible";
  try {
    const numViews = parseInt(views);
    if (isNaN(numViews)) return String(views);
    if (numViews >= 1_000_000_000) return `${(numViews / 1_000_000_000).toFixed(1)}B`;
    if (numViews >= 1_000_000) return `${(numViews / 1_000_000).toFixed(1)}M`;
    if (numViews >= 1_000) return `${(numViews / 1_000).toFixed(1)}k`;
    return numViews.toLocaleString();
  } catch (e) {
    return String(views);
  }
}

const handler = async (m, { conn, text = "", usedPrefix = ".", command = "play" }) => {
  try {
    text = (text || "").trim();
    if (!text) {
      return conn.reply(
        m.chat,
        `🍀 Solo Yotsuba 🍀\n\nIngresa el nombre del video o canción de YouTube que deseas descargar.\n\nEjemplo: ${usedPrefix}${command} Let you Down Cyberpunk`,
        m
      );
    }

    let videoInfo;
    let url = "";

    if (text.includes("youtube.com") || text.includes("youtu.be")) {
      url = text;
      const videoId = extractYouTubeId(url);
      if (!videoId) return m.reply("URL de YouTube inválida", m);
      const search = await yts(videoId);
      if (search?.all?.length) {
        videoInfo = search.all.find((v) => v.videoId === videoId) || search.all[0];
      }
    } else {
      const search = await yts(text);
      if (!search?.all?.length) return m.reply("No se encontraron resultados para tu búsqueda.", m);
      videoInfo = search.all[0];
      url = videoInfo.url;
    }

    if (!videoInfo) return m.reply("No se pudo obtener información del video.", m);

    const {
      title = "Desconocido",
      thumbnail = "",
      timestamp = "Desconocido",
      views = 0,
      ago = "Desconocido",
      author = { name: "Desconocido" },
    } = videoInfo;

    const vistas = formatViews(views);
    const canal = author?.name || "Desconocido";

    const buttons = [
      ["🎵 Descargar Audio", "ytdlv2_audio_mp3"],
      ["🎬 Descargar Video", "ytdlv2_video_mp4"],
      ["📁 Audio como Documento", "ytdlv2_audio_doc"],
      ["📁 Video como Documento", "ytdlv2_video_doc"],
    ];

    const infoText = `*Solo Yotsuba — Descargador YouTube*

> 🍀 *Título:* ${title}
> 🌟 *Duración:* ${timestamp}
> 🍀 *Vistas:* ${vistas}
> 🌟 *Canal:* ${canal}
> 🍀 *Publicado:* ${ago}

🌟 *Selecciona el formato para descargar:*`;

    const footer = "🍀 Solo Yotsuba";

    // enviar carousel o mensaje con botones (tu framework tiene sendNCarousel; uso el mismo)
    try {
      const thumb = thumbnail ? (await conn.getFile(thumbnail))?.data : null;
      await conn.sendNCarousel?.(m.chat, infoText, footer, thumb, buttons, null, null, null, m);
    } catch (thumbErr) {
      try {
        await conn.sendNCarousel?.(m.chat, infoText, footer, null, buttons, null, null, null, m);
      } catch (e) {
        // fallback genérico
        await conn.reply(m.chat, infoText + "\n\n" + footer, m);
      }
      console.error("Error miniatura:", thumbErr);
    }

    // guardar búsqueda para uso con botones
    if (!global.db) global.db = { data: { users: {} } };
    if (!global.db.data) global.db.data = { users: {} };
    if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {};
    global.db.data.users[m.sender].lastYTSearch = {
      url,
      title,
      messageId: m.key?.id,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error completo:", error);
    return m.reply(`🍀 Ocurrió un error inesperado: ${error.message || "Desconocido"}`, m);
  }
};

async function processDownload(conn, m, url, title, option) {
  // Option mapping:
  // 1 = audio mp3 (stream as audio)
  // 2 = video mp4 (video)
  // 3 = audio doc (document mp3)
  // 4 = video doc (document mp4)
  const safeName = (title || "yotsuba_file").replace(/[\/\\?%*:|"<>]/g, "").trim().substring(0, 60) || "yotsuba_file";
  const tmpDir = "./tmp";
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  try {
    const isVideo = option === 2 || option === 4;
    let downloadUrl;

    if (isVideo) {
      downloadUrl = await getVideoFromApis(url);
    } else {
      downloadUrl = await getAudioFromApis(url);
    }

    console.log(`✅ Descarga lista, URL: ${downloadUrl}`);

    if (!downloadUrl) throw new Error("No se obtuvo URL de descarga.");

    // AUDIO: siempre descargar a tmp y enviar como audio (para evitar formato inusual)
    if (option === 1 || option === 3) {
      const fileName = `${safeName}.mp3`;
      const tmpPath = path.join(tmpDir, `${safeName.replace(/\s+/g, "_")}_${Date.now()}.mp3`);
      // descarga
      const res = await fetch(downloadUrl, { timeout: 120000 });
      if (!res.ok) throw new Error(`Error al descargar: ${res.status} ${res.statusText}`);

      // Comprobar tamaño antes de guardar (si está el header)
      const contentLength = res.headers.get("content-length");
      const maxBytes = 50 * 1024 * 1024; // 50 MB
      if (contentLength && parseInt(contentLength) > maxBytes) {
        throw new Error("El archivo es demasiado grande para procesarlo (mayor a 50MB).");
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(tmpPath, buffer);

      // Enviar como audio (no como documento), así WhatsApp lo reconoce correctamente
      await conn.sendMessage(
        m.chat,
        {
          audio: fs.createReadStream(tmpPath),
          mimetype: "audio/mpeg",
          fileName,
          ptt: false,
        },
        { quoted: m }
      );

      // limpieza
      try {
        await fs.promises.unlink(tmpPath);
      } catch (e) {}

      return true;
    } else {
      // VIDEO: enviar por URL directo (ya te funciona) o como documento si prefieres
      const fileName = `${safeName}.mp4`;
      if (option === 2) {
        await conn.sendMessage(
          m.chat,
          {
            video: { url: downloadUrl },
            mimetype: "video/mp4",
            fileName,
            caption: `🎬 ${title}`,
          },
          { quoted: m }
        );
      } else {
        await conn.sendMessage(
          m.chat,
          {
            document: { url: downloadUrl },
            mimetype: "video/mp4",
            fileName,
            caption: `📁 ${title}`,
          },
          { quoted: m }
        );
      }
      return true;
    }
  } catch (error) {
    console.error("Error al procesar descarga:", error);
    // fallback: intentar enviar como documento directo si existe url
    try {
      if (option === 1 || option === 3) {
        // audio fallback as document
        const downloadUrl = await getAudioFromApis(url).catch(() => null);
        if (downloadUrl) {
          await conn.sendMessage(
            m.chat,
            {
              document: { url: downloadUrl },
              mimetype: "audio/mpeg",
              fileName: `${safeName}.mp3`,
            },
            { quoted: m }
          );
          return true;
        }
      } else {
        const downloadUrl = await getVideoFromApis(url).catch(() => null);
        if (downloadUrl) {
          await conn.sendMessage(
            m.chat,
            {
              document: { url: downloadUrl },
              mimetype: "video/mp4",
              fileName: `${safeName}.mp4`,
            },
            { quoted: m }
          );
          return true;
        }
      }
    } catch (fallbackErr) {
      console.error("Fallback fallo:", fallbackErr);
    }
    await conn.reply(m.chat, `🍀 Error en la descarga: ${error.message || "Desconocido"}`, m);
    return false;
  }
}

// Manejo de botones (cuando el usuario presiona la opción)
handler.before = async (m, { conn }) => {
  try {
    if (!m.message?.buttonsResponseMessage) return false;
    const selectedId = m.message.buttonsResponseMessage.selectedButtonId;
    const buttonPatterns = {
      ytdlv2_audio_mp3: 1,
      ytdlv2_video_mp4: 2,
      ytdlv2_audio_doc: 3,
      ytdlv2_video_doc: 4,
    };
    const option = buttonPatterns[selectedId];
    if (!option) return false;

    const user = global.db?.data?.users?.[m.sender];
    if (!user || !user.lastYTSearch) {
      await conn.reply(m.chat, "⏰ No hay búsqueda activa. Realiza una nueva búsqueda.", m);
      return false;
    }

    const currentTime = Date.now();
    const searchTime = user.lastYTSearch.timestamp || 0;
    if (currentTime - searchTime > 10 * 60 * 1000) {
      await conn.reply(m.chat, "⏰ La búsqueda ha expirado. Por favor realiza una nueva búsqueda.", m);
      return false;
    }

    // marca para permitir nuevos intentos en el futuro (sin "tréboles")
    try {
      await processDownload(conn, m, user.lastYTSearch.url, user.lastYTSearch.title, option);
      user.lastYTSearch = null;
    } catch (err) {
      console.error("Error en descarga via buttons:", err);
      await conn.reply(m.chat, `🍀 Error al procesar la descarga: ${err.message || "Desconocido"}`, m);
    }

    return true;
  } catch (e) {
    console.error("Error handler.before:", e);
    return false;
  }
};

handler.command = handler.help = ["play", "ytdlv2"];
handler.tags = ["downloader"];
handler.register = true;

export default handler;