# UI & Design Guidelines (Anti-Slop Standard)

## 1. Zero-Emoji Policy in UI (Anti AI-Slop)
- **STRICTLY PROHIBITED:** Menggunakan karakter emoji Unicode (seperti 🎯, ⚡, 💾, 🎮, 👁️, 🔒, 🤖, ✨, 💡, 📋, ⭐, 🔬, dll) pada tombol, judul, label, opsi select, badge, atau kartu antarmuka.
- **ALASAN:** Penggunaan emoji kartun pada antarmuka perangkat lunak adalah penanda kuat *AI-generated slop* yang tidak profesional.
- **STANDAR PENGGANTI:**
  - Gunakan **vektor SVG minimalis (line-icons / stroke 2px)** monokrom yang beradaptasi dengan `currentColor`.
  - Gunakan tipografi teks murni yang jelas dan lugas (standar Linear, Stripe, Apple, Vercel).

## 2. Default Light Theme
- Tema bawaan (*default*) untuk antarmuka pengguna adalah **LIGHT THEME**.
- Latar belakang: Neutral off-white (`#f8fafc`), kartu putih murni (`#ffffff`), border halus (`#e2e8f0`).
- Tipografi kontras tinggi: Slate 900 (`#0f172a`), Slate 700 (`#334155`), Slate 500 (`#64748b`).
- Dark theme tetap didukung sebagai opsi toggle, namun Light theme selalu menjadi inisialisasi default.

## 3. Disiplin Warna & Elevasi (Antislop UI)
- Satu aksen warna terkurasi (*One deliberate accent*), misal Indigo `#4f46e5`.
- Bayangan mikro halus (*subtle elevation*), bukan blur kabur atau glow berlebihan.
