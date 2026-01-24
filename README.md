<div align="center">

# 💚 YOTSUBA NAKANO BOT 💚

![Yotsuba Nakano Banner](https://imgur.com/a/6oDFtLh)

[![Bot Status](https://img.shields.io/badge/-SIMPLE--WHATSAPP--BOT-green?colorA=%21ff0000&colorB=%21017e40&style=for-the-badge)](https://github.com/FELIX-OFC)  
[![Desarrollador](https://img.shields.io/badge/Desarrollador-FELIX--OFC-orange?style=for-the-badge&logo=github)](https://github.com/FELIX-OFC)  
[![Editor](https://img.shields.io/badge/Editor-makiharukawa.bot%40gmail.com-blue?style=for-the-badge&logo=gmail)]

</div>

---

<div align="center">

### ⚠️ AVISO IMPORTANTE ⚠️  
**Este proyecto corre localmente (Termux / VPS). No depende de servicios de hosting externos.**

</div>

---

## ✨ Sobre Yotsuba Nakano Bot

Yotsuba Nakano Bot es un asistente para WhatsApp con personalidad alegre y estilo kawaii inspirado en Yotsuba: gestiona grupos, envía saludos, crea stickers y ofrece mini-juegos. Modular, personalizable y pensado para ejecutarse en Termux o en un servidor.

---

<div align="center">
  <img src="https://i.pinimg.com/originals/73/69/6e/73696e022df7cd5cb3d999c6875361dd.gif" width="60" height="60">

  ## ✅ Características principales
</div>

| Estado | Funcionalidad |
|:------:|:------------|
| ✅ | Comandos sociales (saludos, menús, respuestas kawaii) |
| ✅ | Gestión de grupos (bienvenida, menciones, moderación) |
| ✅ | Envío de GIFs/MP4 y stickers |
| ✅ | Plugins modulares y Sub-Bots (JadiBots) |
| ✅ | Protección anti-spam y anti-enlace |
| ✅ | Mini-juegos y sistema RPG básico |
| ✅ | Descargas de música y videos desde URLs |
| 🔜 | Nuevas características periódicas |

---

<div align="center">
  <img src="https://i.pinimg.com/originals/19/80/6e/19806e91932e6054965fc83b85241270.gif" width="60" height="60">

  ## 📱 Conéctate / Soporte
</div>

- 🔔 **Canal oficial (anuncios):** https://whatsapp.com/channel/0029VbBvrmwC1Fu5SYpbBE2A  
- 👥 **Comunidad / Grupo:** https://chat.whatsapp.com/HqWaAzi68tf37DHjJrvoRW  
- 📞 **Soporte / Owner:** **+57 310 7400303**  
- ✉️ **Editor / Contacto técnico:** makiharukawa.bot@gmail.com

---

## 📦 Requisitos

- Node.js (LTS recomendado)  
- npm  
- git  
- (opcional) sharp — para optimizar/redimensionar imágenes

---

## ⚙️ Instalación rápida (Termux / Linux)

```bash
# actualizar sistema
pkg update && pkg upgrade -y        # (Termux)
# o en Debian/Ubuntu:
# sudo apt update && sudo apt upgrade -y

# instalar git y node (Termux)
pkg install git nodejs -y

# clonar repo (ajusta la URL si es otra)
git clone https://github.com/FELIX-OFC/Yotsuba-Bot.git
cd Yotsuba-Bot

# instalar dependencias
npm install

# crear carpetas de medios
mkdir -p media/images media/gifs

# (opcional) instalar sharp para redimensionar imágenes
npm install sharp

# iniciar el bot
npm start