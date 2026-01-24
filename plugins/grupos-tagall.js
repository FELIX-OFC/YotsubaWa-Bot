const handler = async (m, { isOwner, isAdmin, conn, text, participants, args, command, usedPrefix }) => {
  if (usedPrefix == 'a' || usedPrefix == 'A') return;

  const customEmoji = global.db.data.chats[m.chat]?.customEmoji || '🍀';
  m.react(customEmoji);

  if (!(isAdmin || isOwner)) {
    global.dfail('admin', m, conn);
    throw false;
  }

  const pesan = args.join` `;
  const oi = `*🍀 ANUNCIO DE YOTSUBA :* ${pesan} 🍀`;
  let teks = `*🌟  YOTSUBA INVOCA A TODOS LOS AMIGOS  🌟*\n  *🎉 PARA ${participants.length} COMPAÑEROS DE AVENTURA 🎉* 😄\n\n ${oi}\n\n╭  ┄ 𝅄 ۪꒰ \`⡞᪲=͟͟͞${botname} ≼᳞ׄ\` ꒱ ۟ 𝅄 ┄\n`;
  for (const mem of participants) {
    teks += `┊🍀 @${mem.id.split('@')[0]}\n`;
  }
  teks += `╰⸼ ┄ ┄ ┄ ─  ꒰  ׅ୭ *${vs}* ୧ ׅ ꒱  ┄  ─ ┄ ⸼`;

  const yotsubaImageUrl = 'https://img.goodfon.com/original/2912x1632/a/48/anime-art-wallpaper-ryzhie-volosy-the-quintessential-quint-1.jpg';

  conn.sendMessage(m.chat, { 
    image: { url: yotsubaImageUrl },
    caption: teks,
    mentions: participants.map((a) => a.id) 
  });
};

handler.help = ['todos *<mensaje opcional>*'];
handler.tags = ['group'];
handler.command = ['todos', 'invocar', 'tagall'];
handler.admin = true;
handler.group = true;

export default handler;