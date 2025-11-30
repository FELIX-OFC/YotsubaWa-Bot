const handler = async (m, { args, participants }) => {
  // Espera: #formarsala 5vs5|ColombiavsMexico
  const entrada = args.join(' ').trim();
  if (!entrada) return m.reply('*⚠️ Usa el formato: #formarsala <VS|Clanes/Países>*\nEjemplo: #formarsala 5vs5|ColombiavsMexico');
  
  const [vsRaw, gruposRaw] = entrada.split('|').map(v => v?.trim());
  if (!vsRaw || !gruposRaw) return m.reply('*⚠️ Escribe ambos parámetros: VS|Clanes/Países*\nEjemplo: #formarsala 5vs5|ColombiavsMexico');

  // Extraer cantidad vs
  const vsMatch = vsRaw.match(/^(\d+)\s*vs\s*(\d+)$/i);
  if (!vsMatch) return m.reply('*⚠️ El primer parámetro debe ser formato NºvsNº, ejemplo: 5vs5*');

  const numA = parseInt(vsMatch[1]);
  const numB = parseInt(vsMatch[2]);

  // Nombres del grupo
  let miembros = (participants || []).filter(u => u.id && u.name);
  let nombres = miembros.map(u => u.name);

  // Mezclado aleatorio y selección sin repetir
  nombres = nombres.sort(() => Math.random() - 0.5);
  const equipoA = nombres.slice(0, numA);
  const equipoB = nombres.slice(numA, numA + numB);
  const suplentes = nombres.slice(numA + numB, numA + numB + 2);

  let msg = `🌛 *Versus:* ${numA} vs ${numB}\n🏙 *Pais/Clans:* ${gruposRaw}\n\n`;
  msg += `👑 *Equipo 1:*\n${equipoA.map(n => `- ${n}`).join('\n')}\n\n`;
  msg += `👑 *Equipo 2:*\n${equipoB.map(n => `- ${n}`).join('\n')}\n\n`;
  msg += `- Suplentes:\n${suplentes.map(n => `- ${n}`).join('\n')}`;

  m.reply(msg);
};

handler.command = /^formarsala$/i;

export default handler;