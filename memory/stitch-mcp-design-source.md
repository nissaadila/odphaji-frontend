---
name: stitch-mcp-design-source
description: "MCP"/desain acuan UI proyek ini = Stitch project, beserta mapping screen → halaman
metadata:
  type: reference
---

Saat user bilang "sesuai MCP", yang dimaksud adalah desain di **Stitch MCP** (tools `mcp__stitch__*`).

- Project: `Aplikasi Tabungan Haji Digital`, id `4803069294910973474` (design system "Islamic Wealth & Hajj Banking" — emerald `#003527`/`#064e3b` + gold `#d4af37`, font Geist+Inter).
- Screen → halaman:
  - `73b688f7dfb84bcc84bc622d4780d6d5` = **Dashboard** (customer) → `app/dashboard/page.tsx`. Layout (verified via screenshot 2026-05-29): **TOP-NAVBAR** (brand + nav Dashboard/Mutasi/Estimasi + notif/Logout) → "Assalamualaikum" → 2 kartu (Saldo + Status Pendaftaran) → Progress Menuju Pelunasan (bar + marker porsi emas) → quick actions (Setor Dana/Lihat Mutasi/Estimasi) → tabel Transaksi Terakhir → footer.
  - `8a6018d059604995b03f13dbf1a28063` = **Registrasi** → `app/register/page.tsx`. Layout (verified via screenshot 2026-05-29): **SPLIT-SCREEN** — kiri panel hijau (gambar Kaaba, "Niat Suci, Langkah Pasti.", OJK), kanan form (NIK, Nama, Email, Nomor HP +62) + info box. Sama dengan `referensi/register.html`.

  CATATAN PENTING (pelajaran): `htmlCode.downloadUrl` & `screenshot.downloadUrl` dari `get_screen` adalah versi yang TERSIMPAN di Stitch (kadang dianggap "cache lama" oleh user). Untuk tahu desain SEBENARNYA, **download `screenshot.downloadUrl` (PNG) lalu LIHAT dengan Read tool** — itu ground truth. JANGAN pernah menulis desain dari ingatan saat download gagal/kosong; verifikasi byte > 0 dulu.
  - `c0738de32e964233be83e59cf3613bee` = Admin Report (BUKAN dashboard customer)
  - `5fed61c672d641e983afb6329e2a3e0d` = Login → `app/login/page.tsx`
  - `73e452ff1b6141eeae47cc2459853ba4` = Setor Dana
  - `243ae92623bf4fac8ea842655941cf3e` = Estimasi Haji
  - `8a6018d059604995b03f13dbf1a28063` = Registrasi Nasabah
  - `af6d2731062e4149b09d49e70325edf4` = Atur Kata Sandi / Aktivasi

Cara port: `get_screen` → ambil `htmlCode.downloadUrl` → `curl` HTML mentah → port ke React, pakai design token yang sudah ada di `app/globals.css` (jangan ubah globals.css/layout.tsx, itu work-in-progress milik user). File HTML di `referensi/*.html` adalah LFS pointer (kosong) — jangan andalkan, ambil dari MCP.

Stack asli: Next.js 16, React 19, Tailwind v4 (`@theme`), Material Symbols (bukan lucide), bukan shadcn. API client di `@/lib/api`.
