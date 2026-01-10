import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
unwatchFile(file)
console.log(chalk.redBright("Update 'settings.js'"))
import(`${file}?update=${Date.now()}`)
})

global.group = "https://chat.whatsapp.com/Ht5ck9c1Eji2TRBXSkTHjY?mode=wwt"
global.community = "https://whatsapp.com/channel/0029VbBkjlfLSmbWl3SH6737"
global.channel = "https://whatsapp.com/channel/0029VbBkjlfLSmbWl3SH6737"
global.github = "https://whatsapp.com/channel/0029VbBkjlfLSmbWl3SH6737"
global.gmail = "https://whatsapp.com/channel/0029VbBkjlfLSmbWl3SH6737"
global.ch = {
ch1: "120363421036863665@newsletter"
}

global.owner = [
"573235915041",
"18094374392",
"18293527611"
]

global.APIs = {
xyro: { url: "https://xyro.site", key: null },
yupra: { url: "https://api.yupra.my.id", key: null },
vreden: { url: "https://api.vreden.web.id", key: null },
delirius: { url: "https://api.delirius.store", key: null },
zenzxz: { url: "https://api.zenzxz.my.id", key: null },
siputzx: { url: "https://api.siputzx.my.id", key: null }
}

global.botname = "Yotsuba Nakano"
global.textbot = "𝓓𝓮𝓿𝓮𝓵𝓸𝓹𝓮𝓭 𝓫𝔂 𝗗𝙚𝙮𝙢𝙤𝙤𝙣𝗢𝙛𝙘 ❤️"
global.dev = "Made With ❤️ by 𝗗𝙚𝙮𝙢𝙤𝙤𝙣 𝗢𝙛𝙘"
global.author = "Made With ❤️ by 𝗗𝙚𝙮𝙢𝙤𝙤𝙣 𝗢𝙛𝙘"
global.etiqueta = "✰ 𝐃𝐞𝐬𝐜𝐨𝐧𝐨𝐬𝐢𝐝𝐨 𝐗𝐳𝐬𝐲 (•̀ᴗ•́)و"
global.currency = "Estrellas"
global.emoji = "👑"
global.suittag = ["1829×××××××"] 
global.prems = []
global.banner = "https://files.catbox.moe/o2zoj6.png"
global.icono = "https://files.catbox.moe/o2zoj6.png"
global.catalogo = "https://files.catbox.moe/o2zoj6.png"
global.libreria = "Baileys Multi Device"
global.vs = "^1.8.2|Latest"
global.nameqr = "✯ Yotsuba Nakano ✰"
global.sessions = "Session"
global.jadi = "JadiBots"
global.yukiJadibts = true