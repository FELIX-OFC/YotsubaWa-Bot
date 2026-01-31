import fetch from "node-fetch";
import yts from "yt-search";
import fs from "fs";
import path from "path";

const API_KEY = "Duarte-zz12"; // deja como lo tenías

/* ---------- Helpers ---------- */

async function getAudioFromApis(url) {
  const apis = [
    { api: "AlyaBot Play", endpoint: `https://rest.alyabotpe.xyz/dl/youtubeplay?query=${encodeURIComponent(url)}&key=${API_KEY}`, extractor: res => res?.status ? res.data?.download : null },
    { api: "AlyaBot v2",   endpoint: `https://rest.alyabotpe.xyz/dl/ytmp3?url=${encodeURIComponent(url)}&key=${API_KEY}`, extractor: res => res?.status ? (res.data?.dl || res.data?.url || res.data?.download) : null }
  ];
  for (const api of apis) {
    try {
      console.log(`🔄 Intentando API audio: ${api.api}`);
      const r = await fetch(api.endpoint);
      const j = await r.json();
      console.log(`📊 Resp audio ${api.api}:`, JSON.stringify(j, null, 2));
      const dl = api.extractor(j);
      if (dl && dl.startsWith("http")) return dl;
    } catch (e) { console.log(`❌ ${api.api} audio falló:`, e.message || e); }
  }
  throw new Error("No se encontró URL de audio en las APIs.");
}

async function getVideoFromApis(url) {
  const apis = [
    { api: "AlyaBot Video", endpoint: `https://rest.alyabotpe.xyz/dl/ytmp4?url=${encodeURIComponent(url)}&key=${API_KEY}`, extractor: res => res?.status ? (res.data?.dl || res.data?.url || res.data?.download) : null },
    { api: "API Causas", endpoint: `https://api-causas.duckdns.org/api/v1/descargas/youtube?url=${encodeURIComponent(url)}&type=video&apikey=causa-adc2c572476abdd8`, extractor: res => res?.status ? res.data?.download?.url : null }
  ];
  for (const api of apis) {
    try {
      console.log(`🔄 Intentando API video: ${api.api}`);
      const r = await fetch(api.endpoint);
      const j = await r.json();
      console.log(`📊 Resp video ${api.api}:`, JSON.stringify(j, null, 2));
      const dl = api.extractor(j);
      if (dl && dl.startsWith("http")) return dl;
    } catch (e) { console.log(`❌ ${api.api} video falló:`, e.message || e); }
  }
  throw new Error("No se encontró URL de video en las APIs.");
}

function extractYouTubeId(url) {
  const patterns = [/youtu\.be\/([a-zA-Z0-9\-\_]{11})/, /youtube\.com\/watch\?v=([a-zA-Z0-9\-\_]{11})/, /youtube\.com\/shorts\/([a-zA-Z0-9\-\_]{11})/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function formatViews(views) {
  if (views == null) return "No disponible";
  const n = parseInt(views) || 0;
  if (n >= 1e9) return `${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}k`;
  return n.toLocaleString();
}

async function downloadToTmp(url, filenamePrefix) {
  const tmpDir = "./tmp";
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `${filenamePrefix.replace(/\s+/g,'_')}_${Date.now()}`);
  const res = await fetch(url, { timeout: 120000 });
  if (!res.ok) throw new Error(`Error fetching file: ${res.status} ${res.statusText}`);
  // try to determine ext from content-type
  const ct = res.headers.get("content-type") || "";
  let ext = "";
  if (ct.includes("audio")) ext = ".mp3";
  else if (ct.includes("video")) ext = ".mp4";
  else ext = path.extname(new URL(url).pathname) || ".bin";
  const finalPath = tmpPath + ext;
  const fileStream = fs.createWriteStream(finalPath);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
  return finalPath;
}

/* ---------- Handler principal ---------- */

const handler = async (m, { conn, text = "", usedPrefix = ".", command = "play" }) => {
  try {
    text = (text || "").trim();
    if (!text) {
      return conn.reply(m.chat, `🍀 Solo Yotsuba 🍀\n\nUsa: ${usedPrefix}${command} <nombre o link>\nEjemplo: ${usedPrefix}${command} Let you Down Cyberpunk`, m);
    }

    let url = "";
    let videoInfo;

    if (text.includes("youtube.com") || text.includes("youtu.be")) {
      url = text;
      const id = extractYouTubeId(url);
      if (!id) return m.reply("URL de YouTube inválida.", m);
      const s = await yts(id);
      videoInfo = (s?.all?.length) ? s.all.find(v => v.videoId === id) || s.all[0] : null;
    } else {
      const s = await yts(text);
      if (!s?.all?.length) return m.reply("No se encontraron resultados.", m);
      videoInfo = s.all[0];
      url = videoInfo.url;
    }

    if (!videoInfo) return m.reply("No se pudo obtener información del video.", m);

    const { title = "Desconocido", thumbnail = "", timestamp = "Desconocido", views = 0, ago = "Desconocido", author = { name: "Desconocido" } } = videoInfo;
    const vistas = formatViews(views);
    const canal = author?.name || "Desconocido";

    const buttons = [
      ["🎵 Descargar Audio (mp3)", "ytdlv2_audio_mp3"],
      ["🎬 Descargar Video (mp4)", "ytdlv2_video_mp4"]
    ];

    const infoText = `*Solo Yotsuba — Descargador YouTube*

> 🍀 *Título:* ${title}
> 🌟 *Duración:* ${timestamp}
> 🍀 *Vistas:* ${vistas}
> 🌟 *Canal:* ${canal}
> 🍀 *Publicado:* ${ago}

🌟 *Selecciona: Audio (mp3) o Video (mp4)*`;

    const footer = "🍀 Solo Yotsuba";

    // intenta enviar miniatura con tu método de carousel/plantilla
    try {
      const thumb = thumbnail ? (await conn.getFile(thumbnail))?.data : null;
      await conn.sendNCarousel?.(m.chat, infoText, footer, thumb, buttons, null, null, null, m);
    } catch (err) {
      try { await conn.sendNCarousel?.(m.chat, infoText, footer, null, buttons, null, null, null, m); }
      catch { await conn.reply(m.chat, infoText + "\n\n" + footer, m); }
    }

    // guarda búsqueda para el usuario
    if (!global.db) global.db = { data: { users: {} } };
    if (!global.db.data) global.db.data = { users: {} };
    if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {};
    global.db.data.users[m.sender].lastYTSearch = { url, title, timestamp: Date.now() };

  } catch (error) {
    console.error("Error handler play:", error);
    return m.reply(`🍀 Error: ${error.message || "Desconocido"}`, m);
  }
};

/* ---------- Proceso de descarga y envío ---------- */

async function processDownload(conn, m, url, title, option) {
  // option: 1 = audio mp3, 2 = video mp4
  const safeName = (title || "yotsuba_file").replace(/[\/\\?%*:|"<>]/g, "").trim().substring(0, 60) || "yotsuba_file";

  try {
    if (option === 1) {
      // audio -> obtener URL y descargar localmente y enviar como audio
      const dlUrl = await getAudioFromApis(url);
      if (!dlUrl) throw new Error("No se obtuvo URL de audio.");
      const tmpPath = await downloadToTmp(dlUrl, safeName);
      await conn.sendMessage(m.chat, { audio: fs.createReadStream(tmpPath), mimetype: "audio/mpeg", fileName: `${safeName}.mp3`, ptt: false }, { quoted: m });
      try { await fs.promises.unlink(tmpPath); } catch(e) {}
      return true;
    } else {
      // video -> preferir enviar por URL; si falla, descargar y enviar
      const dlUrl = await getVideoFromApis(url);
      if (!dlUrl) throw new Error("No se obtuvo URL de video.");
      // intenta enviar por URL
      try {
        await conn.sendMessage(m.chat, { video: { url: dlUrl }, mimetype: "video/mp4", fileName: `${safeName}.mp4`, caption: `🎬 ${title}` }, { quoted: m });
        return true;
      } catch (sendErr) {
        console.log("Envio por URL falló, descargando localmente...:", sendErr.message || sendErr);
        const tmpPath = await downloadToTmp(dlUrl, safeName);
        // intenta enviar como video (stream)
        try {
          await conn.sendMessage(m.chat, { video: fs.createReadStream(tmpPath), mimetype: "video/mp4", fileName: `${safeName}.mp4`, caption: `🎬 ${title}` }, { quoted: m });
        } catch (e) {
          // fallback: enviar como documento
          await conn.sendMessage(m.chat, { document: fs.createReadStream(tmpPath), mimetype: "video/mp4", fileName: `${safeName}.mp4`, caption: `🎬 ${title}` }, { quoted: m });
        }
        try { await fs.promises.unlink(tmpPath); } catch(e) {}
        return true;
      }
    }
  } catch (err) {
    console.error("Error processDownload:", err);
    await conn.reply(m.chat, `🍀 Error en descarga: ${err.message || "Desconocido"}`, m);
    return false;
  }
}

/* ---------- Manejo de botones (solo audio/video) ---------- */

handler.before = async (m, { conn }) => {
  try {
    if (!m.message?.buttonsResponseMessage) return false;
    const id = m.message.buttonsResponseMessage.selectedButtonId;
    const map = { ytdlv2_audio_mp3: 1, ytdlv2_video_mp4: 2 };
    const option = map[id];
    if (!option) return false;

    const user = global.db?.data?.users?.[m.sender];
    if (!user || !user.lastYTSearch) {
      await conn.reply(m.chat, "⏰ No hay búsqueda activa. Realiza una nueva búsqueda.", m);
      return false;
    }

    const now = Date.now();
    if (now - (user.lastYTSearch.timestamp || 0) > 10 * 60 * 1000) {
      await conn.reply(m.chat, "⏰ La búsqueda ha expirado. Por favor realiza una nueva búsqueda.", m);
      return false;
    }

    await processDownload(conn, m, user.lastYTSearch.url, user.lastYTSearch.title, option);
    user.lastYTSearch = null;
    return true;
  } catch (e) {
    console.error("Error handler.before (buttons):", e);
    return false;
  }
};

handler.command = handler.help = ["play", "ytdlv2"];
handler.tags = ["downloader"];
handler.register = true;

export default handler;