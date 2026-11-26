# Saif Al Daffa — Portofolio Profesional (Siap Buka Tanpa Server)

Website portofolio bilingual (**Indonesia / Inggris**) yang sudah dikemas dalam format **statis siap pakai (tanpa server)** sehingga dapat langsung dibuka di browser maupun diunggah ke GitHub Pages dan web hosting apa pun.

## 1. Cara Membuka Langsung Tanpa Server (Offline)
- Ekstrak file `saif-al-daffa-portofolio.zip`, lalu **klik dua kali file `index.html`** di folder utama.
- Atau buka file tunggal `portofolio-saif-al-daffa.html` langsung dari laptop maupun HP tanpa instalasi apa pun.

## 2. Cara Upload ke GitHub Pages (Tanpa Server / Tanpa Build)
1. Ekstrak `saif-al-daffa-portofolio.zip`.
2. Unggah isi folder utama (`index.html`, `portfolio-data.json`, `.nojekyll`, dan folder `assets/`) ke repositori GitHub Anda.
3. Di repositori GitHub, buka **Settings → Pages → Source**, pilih **Deploy from a branch** → branch **`main`** → folder **`/ (root)`** → **Save**.
4. Website Anda langsung online dalam 1–2 menit.

## 3. Cara Mengedit Isi & Tampilan Website (Mode Admin)
1. Buka website, klik **Mode Admin** di footer bawah (atau tambahkan `?admin=1` pada URL), lalu masukkan PIN bawaan **`2026`**.
2. Ubah profil, foto, pengalaman kerja, sertifikasi, warna judul, atau ukuran huruf → klik **Simpan Perubahan** → klik **Unduh `portfolio-data.json`**.
3. Unggah dan timpa file **`portfolio-data.json`** di repositori GitHub Anda agar pembaruan tampil untuk semua pengunjung.

## 4. Kode Sumber Pengembang (Opsional)
Kode sumber React + Vite + Tailwind CSS tersimpan rapi di folder `source-code/` jika sewaktu-waktu ingin dikembangkan secara manual:
```bash
cd source-code
npm install
npm run dev
```
