# Portofolio Profesional — Saif Al Daffa

Website portofolio dwibahasa (**Bahasa Indonesia / English**) untuk **Saif Al Daffa** (*Operasional Aviasi & Ground Handling, Ekspor-Impor / EXIM, Gudang & QC, serta Dukungan Teknis IT & Jaringan*), dilengkapi fitur **Mode Edit** untuk merevisi pengalaman, skill/kompetensi, sertifikasi, dan profil secara langsung.

---

## Cara Upload ke Repository GitHub & Aktifkan Website Gratis (GitHub Pages)

### Cara 1: Upload Langsung via Browser (Tanpa Git CLI)
1. Buat repository baru di GitHub (misalnya bernama `portofolio-saif`).
2. Ekstrak file `portfolio-github.zip` di komputer Anda.
3. Di halaman repository GitHub, klik **Add file** → **Upload files**.
4. Drag & drop seluruh isi folder hasil ekstrak (termasuk folder `.github`, `src`, `public`, dan file `package.json`, `vite.config.ts`, `index.html`).
5. Klik **Commit changes** pada branch `main`.

### Cara 2: Upload via Git CLI
```bash
git init
git add .
git commit -m "Initial commit: Portofolio Saif Al Daffa"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/portofolio-saif.git
git push -u origin main
```

### Mengaktifkan GitHub Pages (Website Online 24 Jam Gratis)
1. Buka repository Anda di GitHub → masuk ke tab **Settings**.
2. Di menu kiri, pilih **Pages**.
3. Pada bagian **Build and deployment → Source**, ubah dari *Deploy from a branch* menjadi **GitHub Actions**.
4. Tunggu 1–2 menit hingga workflow `Deploy Portfolio to GitHub Pages` di tab **Actions** selesai (centang hijau).
5. Website portofolio Anda langsung aktif online di `https://USERNAME_ANDA.github.io/portofolio-saif/`.

---

## Cara Merevisi Pengalaman, Skill, Sertifikasi & Profil
1. Buka website portofolio Anda, lalu klik tombol **Edit Portofolio** di panel profil atau di bagian bawah halaman (*footer*).
2. Ubah data **Profil & Metrik**, **Pengalaman Kerja**, **Skill & Kompetensi**, maupun **Pendidikan & Sertifikasi** — perubahan langsung tampil dan tersimpan otomatis di browser Anda.
3. Agar perubahan tersebut **tampil permanen untuk semua perekrut/pengunjung** di GitHub Pages:
   - Di dalam panel Edit, buka tab **Simpan ke GitHub**.
   - Klik **Unduh `portfolio-data.json`**.
   - Buka repository GitHub Anda → masuk ke folder `public/` → klik **Add file → Upload files** → unggah `portfolio-data.json` untuk menimpa file lama → **Commit changes**.
   - GitHub Actions akan otomatis memperbarui website Anda dalam ~1 menit.

---

## Menjalankan di Komputer Lokal (Opsional)
```bash
npm install
npm run dev
```
Lalu buka `http://localhost:3000`.
