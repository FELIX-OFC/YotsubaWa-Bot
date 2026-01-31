// plugins/ytdlv2.js
import fetch from "node-fetch"; // v2 recomendado en Termux
import yts from "yt-search";
import fs from "fs";
import path from "path";
import ytdl from "ytdl-core";

const API_KEY = "Duarte-zz12"; // deja tu clave

/* ---------- Helpers ---------- */

function safeFilename(name) {
  return (name || "yotsuba_file").replace(/[\/\\?%*:|"<>]/g, "").trim().substring(0, 60) || "yotsuba_file";
}

function formatViews(views) {
  if (views == null) return "No disponible";
  const n = parseInt(views) || 0;
  if (n >= 1e9) return `${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}k`;
  return n.toLocaleString();
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9\-\_]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9\-\_]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9\-\_]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function tryJson(endpoint) {
  const res = await fetch(endpoint, { timeout: 120000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getAudioFromApis(url) {
  const apis = [
    { api: "AlyaBot Play", endpoint: `https://rest.alyabotpe.xyz/dl/youtubeplay?query=${encodeURIComponent(url)}&key=${API_KEY}`, extractor: res => res?.status ? res.data?.download : null },
    { api: "AlyaBot v2",   endpoint: `https://rest.alyabotpe.xyz/dl/ytmp3?url=${encodeURIComponent(url)}&key=${API_KEY}`, extractor: res => res?.status ? (res.data?.dl || res.data?.url || res.data?.download) : null }
  ];
  for (const a of apis) {
    try {
      console.log(`🔄 Intentando API audio: ${a.api}`);
      const j = await tryJson(a.endpoint);
      console.log(`📊 Resp audio ${a.api}:`, j);
      const dl = a.extractor(j);
      if (dl && dl.startsWith("http")) return dl;
      console.log(`❌ ${a.api} no devolvió URL válida`);
    } catch (e) {
      console.log(`❌ ${a.api} audio falló:`, e.message || e);
    }
  }
  return null;
}

async function getVideoFromApis(url) {
  const apis = [
    { api: "AlyaBot Video", endpoint: `https://rest.alyabotpe.xyz/dl/ytmp4?url=${encodeURIComponent(url)}&key=${API_KEY}`, extractor: res => res?.status ? (res.data?.dl || res.data?.url || res.data?.download) : null },
    { api: "API Causas", endpoint: `https://api-causas.duckdns.org/api/v1/descargas/youtube?url=${encodeURIComponent(url)}&type=video&apikey=causa-adc2c572476abdd8`, extractor: res => res?.status ? res.data?.download?.url : null }
  ];
  for (const a of apis) {
    try {
      console.log(`🔄 Intentando API video: ${a.api}`);
      const j = await tryJson(a.endpoint);
      console.log(`📊 Resp video ${a.api}:`, j);
      const dl = a.extractor(j);
      if (dl && dl.startsWith("http")) return dl;
      console.log(`❌ ${a.api} no devolvió URL válida`);
    } catch (e) {
      console.log(`❌ ${a.api} video falló:`, e.message || e);
    }
  }
  return null;
}

async function downloadToTmp(url, filenamePrefix, forcedExt = null) {
  const tmpDir = "./tmp";
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const base = `${filenamePrefix.replace(/\s+/g,'_')}_${Date.now()}`;
  const res = await fetch(url, { timeout: 180000 });
  if (!res.ok) throw new Error(`Error fetching file: ${res.status} ${res.statusText}`);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  let ext = ".bin";
  if (forcedExt) ext = forcedExt;
  else if (ct.includes("audio")) ext = ".mp3";
  else if (ct.includes("mpeg")) ext = ".mp3";
  else if (ct.includes("video")) ext = ".mp4";
  else {
    try { ext = path.extname(new URL(url).pathname) || ".bin"; } catch {}
  }
  const finalPath = path.join(tmpDir, base + ext);
  const fileStream = fs.createWriteStream(finalPath);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
  return finalPath;
}

function isLikelyMp3(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(3);
    fs.readSync(fd, buf, 0, 3, 0);
    fs.closeSync(fd);
    // ID3 tag or frame sync 0xFF 0xFB
    return buf.slice(0,3).toString() === "ID3" || (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0);
  } catch (e) {
    return false;
  }
}

async function downloadAudioWithYtdl(url, outPath) {
  return new Promise((resolve, reject) => {
    const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
    const ws = fs.createWriteStream(outPath);
    stream.pipe(ws);
    stream.on('error', (err) => { try{ ws.close() }catch{}; reject(err); });
    ws.on('finish', () => resolve(outPath));
    ws.on('error', reject);
  });
}

/* ---------- Handler principal ---------- */

const handler = async (m, { conn, text = "", usedPrefix = ".", command = "play" }) => {
  try {
    text = (text || "").trim();
    if (!text) return conn.reply(m.chat, `🍀 Solo Yotsuba 🍀\n\nUsa: ${usedPrefix}${command} <nombre o link>`, m);

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

    try {
      const thumb = thumbnail ? (await conn.getFile(thumbnail))?.data : null;
      await conn.sendNCarousel?.(m.chat, infoText, footer, thumb, buttons, null, null, null, m);
    } catch (err) {
      try { await conn.sendNCarousel?.(m.chat, infoText, footer, null, buttons, null, null, null, m); }
      catch { await conn.reply(m.chat, infoText + "\n\n" + footer, m); }
    }

    // guarda búsqueda
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
  const safeName = safeFilename(title);
  try {
    if (option === 1) {
      // audio mp3: primero APIs, si falla -> ytdl
      let dlUrl = await getAudioFromApis(url);
      let tmpPath = null;

      if (dlUrl) {
        try {
          tmpPath = await downloadToTmp(dlUrl, safeName, ".mp3"); // forzamos .mp3 si la API devolvió URL
        } catch (e) {
          console.log("Error descargando desde API audio:", e.message || e);
          tmpPath = null;
        }
      }

      // si tmpPath existe, validar que sea mp3
      if (tmpPath && isLikelyMp3(tmpPath)) {
        await conn.sendMessage(m.chat, { audio: fs.createReadStream(tmpPath), mimetype: "audio/mpeg", fileName: `${safeName}.mp3`, ptt: false }, { quoted: m });
        try { await fs.promises.unlink(tmpPath); } catch {}
        return true;
      }

      // fallback con ytdl (descarga directa desde YouTube)
      const videoId = extractYouTubeId(url) || (await yts(url)).all?.[0]?.videoId;
      if (!videoId) throw new Error("No se pudo extraer videoId para ytdl fallback.");
      const ytdlUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const outPath = path.join("./tmp", `${safeName}_${Date.now()}.mp3`);
      console.log("Fallback: descargando audio con ytdl-core...");
      await downloadAudioWithYtdl(ytdlUrl, outPath);
      if (!isLikelyMp3(outPath)) throw new Error("ytdl generó un archivo que no parece MP3.");
      await conn.sendMessage(m.chat, { audio: fs.createReadStream(outPath), mimetype: "audio/mpeg", fileName: `${safeName}.mp3`, ptt: false }, { quoted: m });
      try { await fs.promises.unlink(outPath); } catch {}
      return true;

    } else {
      // video mp4: intentamos APIs y enviamos por URL si posible, si no, descargamos y enviamos
      const dlUrl = await getVideoFromApis(url);
      if (!dlUrl) throw new Error("No se obtuvo URL de video.");
      try {
        await conn.sendMessage(m.chat, { video: { url: dlUrl }, mimetype: "video/mp4", fileName: `${safeName}.mp4`, caption: `🎬 ${title}` }, { quoted: m });
        return true;
      } catch (err) {
        console.log("Envio por URL falló, descargando localmente...:", err.message || err);
        const tmpPath = await downloadToTmp(dlUrl, safeName, ".mp4");
        try {
          await conn.sendMessage(m.chat, { video: fs.createReadStream(tmpPath), mimetype: "video/mp4", fileName: `${safeName}.mp4`, caption: `🎬 ${title}` }, { quoted: m });
        } catch (err2) {
          console.log("Envio local video falló, enviando como documento...", err2.message || err2);
          await conn.sendMessage(m.chat, { document: fs.createReadStream(tmpPath), mimetype: "video/mp4", fileName: `${safeName}.mp4`, caption: `🎬 ${title}` }, { quoted: m });
        }
        try { await fs.promises.unlink(tmpPath); } catch {}
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