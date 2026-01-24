/* 
🌛 Code created by Félix ofc 
Please leave credits  👑
🌟 Github -> https://github.com/FELIX-OFC
*/

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
  let who;

  if (m.mentionedJid.length > 0) {  
    who = m.mentionedJid[0];  
  } else if (m.quoted) {  
    who = m.quoted.sender;  
  } else {  
    who = m.sender;  
  }  

  let name = conn.getName(who);  
  let name2 = conn.getName(m.sender);  
  m.react('👋');  

  let str;  
  if (m.mentionedJid.length > 0) {  
    str = `${name2} saluda a ${name || who} con la energía de Yotsuba: ¡Hola! ¿Cómo estás? 😊`;  
  } else if (m.quoted) {  
    str = `${name2} dice hola a ${name || who} al estilo Yotsuba Nakano. ¡Genki desu ka! 🌟`;  
  } else {  
    str = `${name2} saluda a todo el grupo con la alegría de Yotsuba: ¡Hola a todos! ¿Cómo se encuentran? 🎉`.trim();  
  }  

  if (m.isGroup) {  
    let pp = 'https://media.tenor.com/KM3VNP5d1FIAAAPo/miku-hello.mp4';   
    let pp2 = 'https://media.tenor.com/vNapCUP0d3oAAAPo/pjsk-pjsk-anime.mp4';   
    let pp3 = 'https://media.tenor.com/dxwWkT10bmoAAAPo/wind-breaker-wind-breaker-togame.mp4';  
    let pp4 = 'https://media.tenor.com/2hBSkJhJarMAAAPo/hi.mp4';  
    let pp5 = 'https://media.tenor.com/2hBSkJhJarMAAAPo/hi.mp4';  
    let pp6 = 'https://media.tenor.com/6Gj1s-kpsd0AAAPo/dante-devil-may-cry-anime.mp4';  
    let pp7 = 'https://media.tenor.com/oylzydvTDV4AAAPo/kusuriya-no-hitorigoto-maomao.mp4';  
    let pp8 = 'https://media.tenor.com/t8Ab2Z5uMkUAAAPo/toji-jjk.mp4';  

    const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp7, pp8];  
    const video = videos[Math.floor(Math.random() * videos.length)];  

    let mentions = [who];  
    conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });  
  }
}

handler.help = ['hola @tag'];
handler.tags = ['anime'];
handler.command = ['hello', 'hola'];
handler.group = true;
handler.register = true;
export default handler;