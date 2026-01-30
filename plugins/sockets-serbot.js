const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = (await import("@whiskeysockets/baileys"))
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import util from 'util'
import * as ws from 'ws'
const { spawn, exec } = await import('child_process') // spawn, exec disponibles
const { CONNECTING } = ws
import { makeWASocket } from '../lib/simple.js'
import { fileURLToPath } from 'url'

let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"
let drm1 = ""
let drm2 = ""

let rtx = "✿  *Vincula tu cuenta usando el código.*\n\nSigue las instrucciones:\n\n✎ *Mas opciones » Dispositivos vinculados » Vincular nuevo dispositivo » Escanea el código Qr.*\n\n↺ El codigo es valido por 60 segundos."
let rtx2 = "✿  *Vincula tu cuenta usando el código.*\n\nSigue las instrucciones:\n\n✎ *Mas opciones » Dispositivos vinculados » Vincular nuevo dispositivo » Vincular usando número.*\n\n↺ El codigo es valido por 60 segundos."

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const yukiJBOptions = {}
if (global.conns instanceof Array) console.log()
else global.conns = []

function isSubBotConnected(jid) { return global.conns.some(sock => sock?.user?.jid && sock.user.jid.split("@")[0] === jid.split("@")[0]) }

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
  // normalizar args (si viene string o undefined)
  args = Array.isArray(args) ? args : (typeof args === 'string' && args.trim() ? args.trim().split(/\s+/) : [])

  // protecciones a global.db
  if (!globalThis.db) globalThis.db = { data: { settings: {}, users: {} } }
  if (!globalThis.db.data) globalThis.db.data = { settings: {}, users: {} }
  if (!globalThis.db.data.settings) globalThis.db.data.settings = {}
  if (!globalThis.db.data.users) globalThis.db.data.users = {}

  if (!globalThis.db?.data?.settings?.[conn.user.jid]?.jadibotmd) return m.reply(`ꕥ El Comando *${command}* está desactivado temporalmente.`)

  // asegurar usuario en DB
  if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}
  const lastSubs = global.db.data.users[m.sender].Subs || 0
  let time = lastSubs + 120000
  if (Date.now() - lastSubs < 120000) return conn.reply(m.chat, `ꕥ Debes esperar ${msToTime(time - Date.now())} para volver a vincular un *Sub-Bot.*`, m)

  const socklimit = global.conns.filter(sock => sock?.user).length
  if (socklimit >= 50) {
    return m.reply(`ꕥ No se han encontrado espacios para *Sub-Bots* disponibles.`)
  }

  let mentionedJid = m.mentionedJid
  let who = mentionedJid && mentionedJid[0] ? mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
  let id = `${who.split('@')[0]}`
  let jadi = 'jadibot'
  let pathYukiJadiBot = path.join(`./${jadi}/`, id)

  if (!fs.existsSync(pathYukiJadiBot)){
    fs.mkdirSync(pathYukiJadiBot, { recursive: true })
  }

  yukiJBOptions.pathYukiJadiBot = pathYukiJadiBot
  yukiJBOptions.m = m
  yukiJBOptions.conn = conn
  yukiJBOptions.args = args
  yukiJBOptions.usedPrefix = usedPrefix
  yukiJBOptions.command = command
  yukiJBOptions.fromCommand = true

  // iniciar el sub-bot (no bloqueo)
  yukiJadiBot(yukiJBOptions)

  // guardar timestamp correctamente
  global.db.data.users[m.sender].Subs = Date.now()
}

handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']
export default handler 

export async function yukiJadiBot(options) {
  // recibir options y desestructurar
  let { pathYukiJadiBot, m, conn, args, usedPrefix, command } = options || {}
  args = Array.isArray(args) ? args : (typeof args === 'string' && args.trim() ? args.trim().split(/\s+/) : [])

  // Detectar si es modo code
  let isCodeMode = false
  let codeValue = null

  if (command === 'code' || args.some(arg => /code/i.test(arg))) {
    isCodeMode = true
    let codeIndex = args.findIndex(arg => /code/i.test(arg))
    if (codeIndex !== -1 && args[codeIndex + 1]) {
      codeValue = args[codeIndex + 1].trim()
    }
    console.log('🔍 Modo Code activado:', { isCodeMode, codeValue })
  }

  let txtCode, codeBot, txtQR

  const pathCreds = path.join(pathYukiJadiBot, "creds.json")
  if (!fs.existsSync(pathYukiJadiBot)){
    fs.mkdirSync(pathYukiJadiBot, { recursive: true })
  }

  // Si hay un valor de código (base64), intentar cargarlo
  if (codeValue && codeValue !== undefined) {
    try {
      let decodedCreds = JSON.parse(Buffer.from(codeValue, "base64").toString("utf-8"))
      fs.writeFileSync(pathCreds, JSON.stringify(decodedCreds, null, '\t'))
      console.log('✅ Credenciales cargadas desde base64')
    } catch (error) {
      console.error('❌ Error al cargar credenciales base64:', error)
      return conn.reply(m.chat, `ꕥ Error al cargar las credenciales. Use correctamente el comando » ${usedPrefix + command}`, m)
    }
  }

  const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64")
  exec(comb.toString("utf-8"), async (err, stdout, stderr) => {
    if (err) {
      console.error('Error ejecutando comando:', err)
      return
    }

    try {
      let { version, isLatest } = await fetchLatestBaileysVersion()
      const msgRetry = (MessageRetryMap) => { }
      const msgRetryCache = new NodeCache()
      const { state, saveState, saveCreds } = await useMultiFileAuthState(pathYukiJadiBot)

      const connectionOptions = {
        logger: pino({ level: "fatal" }),
        printQRInTerminal: false,
        auth: { 
          creds: state.creds, 
          keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
        },
        msgRetry,
        msgRetryCache, 
        browser: ['Windows', 'Firefox'],
        version: version,
        generateHighQualityLinkPreview: true
      }

      let sock = makeWASocket(connectionOptions)
      sock.isInit = false
      let isInit = true

      // auto limpieza si no se conecta en 60s
      setTimeout(async () => {
        if (!sock.user) {
          try { fs.rmSync(pathYukiJadiBot, { recursive: true, force: true }) } catch {}
          try { sock.ws?.close() } catch {}
          sock.ev.removeAllListeners()
          let i = global.conns.indexOf(sock)
          if (i >= 0) global.conns.splice(i, 1)
          console.log(`[AUTO-LIMPIEZA] Sesión ${path.basename(pathYukiJadiBot)} eliminada - credenciales invalidas.`)
        }
      }, 60000)

      // helper: espera a que socket esté 'open'
      const waitForSocketOpen = (sock, timeout = 30000) => new Promise((resolve, reject) => {
        try {
          if (sock?.ws?.readyState === 1 || sock?.user) return resolve()
          const timer = setTimeout(() => {
            sock.ev.off('connection.update', onUpdate)
            reject(new Error('timeout_wait_open'))
          }, timeout)
          function onUpdate(u) {
            if (u?.connection === 'open' || sock?.user) {
              clearTimeout(timer)
              sock.ev.off('connection.update', onUpdate)
              return resolve()
            }
          }
          sock.ev.on('connection.update', onUpdate)
        } catch (e) { reject(e) }
      })

      // definir creloadHandler en scope (se asigna más abajo)
      let creloadHandler

      async function connectionUpdate(update) {
        const { connection, lastDisconnect, isNewLogin, qr } = update

        if (isNewLogin) sock.isInit = false

        // Modo QR (no code)
        if (qr && !isCodeMode) {
          if (m?.chat) {
            txtQR = await conn.sendMessage(m.chat, { 
              image: await qrcode.toBuffer(qr, { scale: 8 }), 
              caption: rtx.trim()
            }, { quoted: m })
          } else {
            return 
          }
          if (txtQR && txtQR.key) {
            setTimeout(() => { 
              conn.sendMessage(m.chat, { delete: txtQR.key })
            }, 60000)
          }
          return
        } 

        // Modo pairing (code)
        if (qr && isCodeMode) {
          try {
            await waitForSocketOpen(sock, 15000)   // espera que socket esté listo
            console.log('🔄 Generando código de pairing...')
            let secret = await sock.requestPairingCode(m.sender.split('@')[0])
            secret = secret ? secret.match(/.{1,4}/g)?.join("-") : null

            if (secret) {
              txtCode = await conn.sendMessage(m.chat, { text: rtx2 }, { quoted: m })
              codeBot = await conn.sendMessage(m.chat, { text: secret }, { quoted: m })
              console.log('✅ Código generado:', secret)
            } else {
              await conn.reply?.(m.chat, '❌ Error al generar el código de vinculación', m)
            }
          } catch (err) {
            console.error('Error en pairing code:', err)
            await conn.reply?.(m.chat, '❌ Error al generar el código de vinculación. Intente nuevamente.', m)
          }
        }

        const endSesion = async (loaded) => {
          if (!loaded) {
            try { sock.ws.close() } catch {}
            sock.ev.removeAllListeners()
            let i = global.conns.indexOf(sock)                
            if (i < 0) return 
            delete global.conns[i]
            global.conns.splice(i, 1)
          }
        }

        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode

        if (connection === 'close') {
          if (reason === 428) {
            console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La conexión (+${path.basename(pathYukiJadiBot)}) fue cerrada inesperadamente. Intentando reconectar...\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`))
            await creloadHandler(true).catch(console.error)
          }
          if (reason === 408) {
            console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La conexión (+${path.basename(pathYukiJadiBot)}) se perdió o expiró. Razón: ${reason}. Intentando reconectar...\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`))
            await creloadHandler(true).catch(console.error)
          }
          if (reason === 440) {
            console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La conexión (+${path.basename(pathYukiJadiBot)}) fue reemplazada por otra sesión activa.\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`))
            try {
              if (options?.fromCommand) {
                await conn.sendMessage(`${path.basename(pathYukiJadiBot)}@s.whatsapp.net`, { 
                  text: '⚠︎ Hemos detectado una nueva sesión, borre la antigua sesión para continuar.\n\n> ☁︎ Si Hay algún problema vuelva a conectarse.' 
                }, { quoted: m || null })
              }
            } catch (error) {
              console.error(chalk.bold.yellow(`⚠︎ Error 440 no se pudo enviar mensaje a: +${path.basename(pathYukiJadiBot)}`))
            }
          }
          if (reason == 405 || reason == 401) {
            console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La sesión (+${path.basename(pathYukiJadiBot)}) fue cerrada. Credenciales no válidas o dispositivo desconectado manualmente.\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`))
            try {
              if (options?.fromCommand) {
                await conn.sendMessage(`${path.basename(pathYukiJadiBot)}@s.whatsapp.net`, { 
                  text: '⚠︎ Sesión incorrecta.\n\n> ☁︎ Vuelva a intentar nuevamente volver a ser *SUB-BOT*.' 
                }, { quoted: m || null })
              }
            } catch (error) {
              console.error(chalk.bold.yellow(`⚠︎ Error 405 no se pudo enviar mensaje a: +${path.basename(pathYukiJadiBot)}`))
            }
            fs.rmdirSync(pathYukiJadiBot, { recursive: true })
          }
          if (reason === 500) {
            console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Conexión perdida en la sesión (+${path.basename(pathYukiJadiBot)}). Borrando datos...\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`))
            if (options?.fromCommand) {
              await conn.sendMessage(`${path.basename(pathYukiJadiBot)}@s.whatsapp.net`, { 
                text: '⚠︎ Conexión perdida.\n\n> ☁︎ Intenté conectarse manualmente para volver a ser *SUB-BOT*' 
              }, { quoted: m || null })
            }
            return creloadHandler(true).catch(console.error)
          }
          if (reason === 515) {
            console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Reinicio automático para la sesión (+${path.basename(pathYukiJadiBot)}).\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`))
            await creloadHandler(true).catch(console.error)
          }
          if (reason === 403) {
            console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Sesión cerrada o cuenta en soporte para la sesión (+${path.basename(pathYukiJadiBot)}).\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`))
            fs.rmdirSync(pathYukiJadiBot, { recursive: true })
          }
        }

        if (global.db.data == null) loadDatabase()
        if (connection == `open`) {
          if (!global.db.data?.users) loadDatabase()
          await joinChannels(sock)
          let userName = sock.authState.creds.me.name || 'Anónimo'
          console.log(chalk.bold.cyanBright(`\n❒⸺⸺⸺⸺【• SUB-BOT •】⸺⸺⸺⸺❒\n│\n│ ❍ ${userName} conectado exitosamente.\n│\n❒⸺⸺⸺【• CONECTADO •】⸺⸺⸺❒`))
          sock.isInit = true
          if (!global.conns.includes(sock)) global.conns.push(sock)
          if (m?.chat) {
            await conn.sendMessage(m.chat, { text: `🔥 Has registrado un nuevo Sub-Bot! [@${m.sender.split('@')[0]}]\n> Puedes ver como personalizar tu Sub-Bot usando el comando *#set*`, mentions: [m.sender] }, { quoted: m })
          }
        }
      }

      // limpieza periódica
      setInterval(async () => {
        if (!sock.user) {
          try { sock.ws.close() } catch (e) {}
          sock.ev.removeAllListeners()
          let i = global.conns.indexOf(sock)
          if (i < 0) return
          delete global.conns[i]
          global.conns.splice(i, 1)
        }
      }, 60000)

      // importar handler y definir creloadHandler
      let handlerMod = await import('../handler.js')
      creloadHandler = async function (restatConn) {
        try {
          const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
          if (Object.keys(Handler || {}).length) handlerMod = Handler
        } catch (e) {
          console.error('⚠︎ Nuevo error: ', e)
        }
        if (restatConn) {
          const oldChats = sock.chats
          try { sock.ws.close() } catch { }
          sock.ev.removeAllListeners()
          sock = makeWASocket(connectionOptions, { chats: oldChats })
          isInit = true
        }
        if (!isInit) {
          sock.ev.off("messages.upsert", sock.handler)
          sock.ev.off("connection.update", sock.connectionUpdate)
          sock.ev.off('creds.update', sock.credsUpdate)
        }
        sock.handler = handlerMod.handler?.bind(sock)
        sock.connectionUpdate = connectionUpdate.bind(sock)
        sock.credsUpdate = saveCreds?.bind(sock, true)
        sock.ev.on("messages.upsert", sock.handler)
        sock.ev.on("connection.update", sock.connectionUpdate)
        sock.ev.on("creds.update", sock.credsUpdate)
        isInit = false
        return true
      }
      creloadHandler(false)

    } catch (error) {
      console.error('Error en yukiJadiBot:', error)
      if (m && conn) {
        try { await conn.reply(m.chat, `❌ Error al iniciar el Sub-Bot: ${error.message}`, m) } catch {}
      }
    }
  })
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
  seconds = Math.floor((duration / 1000) % 60),
  minutes = Math.floor((duration / (1000 * 60)) % 60),
  hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
  hours = (hours < 10) ? '0' + hours : hours
  minutes = (minutes < 10) ? '0' + minutes : minutes
  seconds = (seconds < 10) ? '0' + seconds : seconds
  return minutes + ' m y ' + seconds + ' s '
}

async function joinChannels(sock) {
  for (const value of Object.values(global.ch || {})) {
    if (typeof value === 'string' && value.endsWith('@newsletter')) {
      await sock.newsletterFollow(value).catch(() => {})
    }
  }
}