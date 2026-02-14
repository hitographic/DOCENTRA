# 📋 DOCENTRA - Document Control System

### PT Indofood CBP Sukses Makmur Tbk — Divisi Noodle

> **Live Demo**: [https://hitographic.github.io/DOCENTRA/](https://hitographic.github.io/DOCENTRA/)  
> **Repository**: [https://github.com/hitographic/DOCENTRA](https://github.com/hitographic/DOCENTRA)

---

## 🎯 Tentang DOCENTRA

DOCENTRA adalah sistem Document Control (DC) berbasis web yang dibangun di atas **Google Workspace** (Google Apps Script, Google Sheets, Google Drive). Sistem ini dirancang khusus untuk pabrik mie guna mengelola versi dokumen seperti SOP, Work Instruction (WI), Formula Produksi, Spesifikasi Raw Material, QC Report, dan dokumen lainnya.

### Fitur Utama:
- ✅ **Version Control** — Upload versi baru tanpa menghapus versi lama
- ✅ **Diff Engine** — Perbandingan Excel per cell (mirip GitHub diff)
- ✅ **Role-Based Access** — Staff, Supervisor, Manager, Admin
- ✅ **Status Workflow** — Draft → Review → Approved → Obsolete
- ✅ **Audit Trail** — Semua perubahan tercatat lengkap
- ✅ **Dashboard** — Statistik dan overview dokumen
- ✅ **Dual Deployment** — Akses via Google Apps Script ATAU GitHub Pages
- ✅ **Multi-User Login** — Setiap user punya akun sendiri dengan password

---

## 🏗 Arsitektur

DOCENTRA mendukung **dua mode akses**:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Pilih salah satu)               │
│                                                              │
│  ┌─────────────────────┐    ┌──────────────────────────┐    │
│  │  Mode 1: GAS Native │    │  Mode 2: GitHub Pages    │    │
│  │  (Index.html di GAS)│    │  (docs/index.html)       │    │
│  │  google.script.run   │    │  fetch() → JSON API      │    │
│  └──────────┬──────────┘    └────────────┬─────────────┘    │
│             │                            │                   │
└─────────────┼────────────────────────────┼───────────────────┘
              │                            │
              ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│          Google Apps Script (Backend API)                     │
│     doGet() + doPost() │ Controllers │ DiffEngine            │
│                                                              │
│  ┌─── Token Auth ───┐  ┌─── Session Auth ───┐               │
│  │ Base64(email:pwd) │  │ getActiveUser()    │               │
│  │ (GitHub Pages)    │  │ (GAS Native)       │               │
│  └──────────────────┘  └────────────────────┘               │
├──────────────────────────┬───────────────────────────────────┤
│      Google Sheets       │         Google Drive              │
│       (Database)         │       (File Storage)              │
│                          │                                    │
│  DOCUMENT_MASTER         │  DOCENTRA - Document Control/     │
│  VERSION_HISTORY         │    ├── DOC-001/                   │
│  CHANGE_LOG              │    │   ├── v1.0.xlsx              │
│  USERS (+ password_hash) │    │   └── v1.1.xlsx              │
│                          │    └── DOC-002/                   │
└──────────────────────────┴───────────────────────────────────┘
```

---

## 📁 Struktur Project

```
DOCENTRA/
├── src/                          # Google Apps Script source files
│   ├── appsscript.json           # Manifest (scopes, timezone, services)
│   ├── Config.gs                 # Konfigurasi global
│   ├── Setup.gs                  # Initial setup & folder creation
│   ├── Code.gs                   # Entry point, doGet/doPost, JSON API router
│   ├── Database.gs               # CRUD operations (Google Sheets)
│   ├── DriveManager.gs           # File management (Google Drive)
│   ├── DiffEngine.gs             # Excel comparison engine
│   ├── Auth.gs                   # Authentication, login, token validation
│   ├── DocumentController.gs     # Document business logic
│   ├── VersionController.gs      # Version & upload management
│   ├── Index.html                # GAS Native UI template
│   ├── SetupPage.html            # Initial setup page
│   ├── Stylesheet.html           # CSS (Indofood CBP theme)
│   └── JavaScript.html           # Client-side logic (GAS mode)
├── docs/                         # GitHub Pages frontend
│   └── index.html                # Standalone SPA (login, dashboard, semua fitur)
└── README.md                     # Dokumentasi ini
```

---

## 🚀 Cara Deploy

DOCENTRA punya **dua mode deployment** yang bisa digunakan bersamaan:

| Mode | Akses | Cocok untuk |
|------|-------|-------------|
| **Mode 1: GAS Native** | Buka Web App URL langsung | User internal Google Workspace |
| **Mode 2: GitHub Pages** | Buka hitographic.github.io/DOCENTRA | Semua orang, semua device |

---

### 📌 BAGIAN A — Deploy Backend (Google Apps Script)

> ⚠️ **Wajib dilakukan** untuk kedua mode. Backend adalah "otak" DOCENTRA.

#### A1. Buat Project di Google Apps Script
1. Buka [script.google.com](https://script.google.com)
2. Klik **"Proyek Baru"** (New Project)
3. Beri nama project: `DOCENTRA`

#### A2. Copy File-file Script
Buat file-file berikut di Apps Script editor (klik **+** di sebelah "Files"):

**File `.gs` (Server-side):**
1. Hapus `Code.gs` default, lalu buat ulang
2. Copy isi dari masing-masing file `.gs` di folder `src/`:
   - `Config.gs`
   - `Setup.gs`
   - `Code.gs`
   - `Database.gs`
   - `DriveManager.gs`
   - `DiffEngine.gs`
   - `Auth.gs`
   - `DocumentController.gs`
   - `VersionController.gs`

**File `.html` (Client-side):**
Klik **+** > **HTML** untuk membuat file HTML:
1. `Index` (menjadi Index.html)
2. `SetupPage` (menjadi SetupPage.html)
3. `Stylesheet` (menjadi Stylesheet.html)
4. `JavaScript` (menjadi JavaScript.html)

> ⚠️ **Jangan** ketik ekstensi `.html` saat membuat file di Apps Script Editor, 
> cukup ketik nama file saja (misal: `Index`, `SetupPage`, dsb).

#### A3. Konfigurasi Manifest
1. Klik ⚙️ **Project Settings** di sidebar kiri
2. Centang **"Show appsscript.json manifest file in editor"**
3. Buka `appsscript.json` dan replace isinya dengan file `appsscript.json` dari folder `src/`

#### A4. Aktifkan Advanced Service (Drive API)
1. Kembali ke **Editor** (klik ikon `< >` di sidebar kiri)
2. Di sidebar kiri, di bawah daftar file, cari section **"Services"**
3. Klik ikon **`+`** (Add a service) di sebelah "Services"
4. Pada dialog yang muncul, scroll dan cari **"Drive API"**
5. Pilih **version: v2**
6. Klik **"Add"**

> 💡 **Catatan**: Menu "Services" ada di panel **Editor** (ikon `< >`), 
> bukan di Project Settings (ikon ⚙️). Lihat di bawah daftar file Anda,
> akan ada section "Services" dengan tombol `+` di sampingnya.

#### A5. Deploy sebagai Web App
1. Klik **"Deploy"** > **"New deployment"**
2. Klik ⚙️ di sebelah **"Select type"** > pilih **"Web app"**
3. Konfigurasi:
   - **Description**: `DOCENTRA v2.0`
   - **Execute as**: `Me` (akun Anda — PENTING!)
   - **Who has access**: `Anyone` (agar bisa diakses dari GitHub Pages)
4. Klik **"Deploy"**
5. **Authorize** akses saat diminta (review permissions)
6. ✅ Copy **Web App URL** — Anda akan butuh URL ini!

> ⚠️ **PENTING**: 
> - **Execute as** harus `Me` (bukan "User accessing the web app")
> - **Who has access** harus `Anyone` (bukan "Anyone within organization")
> - Ini diperlukan agar API bisa diakses dari GitHub Pages

#### A6. Jalankan Initial Setup
1. Buka **Web App URL** di browser
2. Halaman setup akan muncul otomatis (pertama kali)
3. Klik **"🚀 Jalankan Setup Otomatis"**
4. Sistem akan membuat:
   - 📁 Folder `DOCENTRA - Document Control` di Google Drive
   - 📊 Spreadsheet database `DOCENTRA_DATABASE`
   - 📋 Sheet: DOCUMENT_MASTER, VERSION_HISTORY, CHANGE_LOG, USERS
   - 👤 User admin pertama (email Anda)
5. Setelah setup selesai, klik **"Muat Ulang Aplikasi"**

#### A7. Set Password Admin
Setelah setup berhasil dan masuk ke dashboard:
1. Buka spreadsheet **DOCENTRA_DATABASE** di Google Drive
2. Buka sheet **USERS**
3. Anda akan melihat akun admin Anda di baris pertama
4. Kolom `password_hash` (kolom ke-7) masih kosong — ini normal
5. Password akan di-set otomatis saat login pertama via GitHub Pages

---

### 📌 BAGIAN B — Mode 1: Akses via GAS Native (Langsung)

Setelah Bagian A selesai, Anda sudah bisa menggunakan DOCENTRA:

1. Buka **Web App URL** di browser
2. Dashboard langsung muncul (login otomatis via Google Account)
3. Bagikan URL ke rekan kerja yang punya akun Google Workspace

> 💡 Pada mode ini, autentikasi menggunakan Google Account secara otomatis.
> Tidak perlu input email/password.

---

### 📌 BAGIAN C — Mode 2: Deploy di GitHub Pages

Mode ini memungkinkan **siapa saja** mengakses DOCENTRA dari **HP, tablet, atau laptop** menggunakan **akun masing-masing** (email + password).

#### C1. Push ke GitHub
```bash
cd "/path/to/DOCENTRA"
git add .
git commit -m "DOCENTRA v2.0 - Dual mode deployment"
git push origin main
```

#### C2. Aktifkan GitHub Pages
1. Buka repository di GitHub: [github.com/hitographic/DOCENTRA](https://github.com/hitographic/DOCENTRA)
2. Klik **Settings** (tab di atas)
3. Di sidebar kiri, klik **Pages**
4. Di section "Build and deployment":
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/docs`
5. Klik **Save**
6. Tunggu ~1 menit, lalu akses: **https://hitographic.github.io/DOCENTRA/**

#### C3. Konfigurasi API URL
1. Buka **https://hitographic.github.io/DOCENTRA/**
2. Di halaman login, masukkan **API URL** (Web App URL dari langkah A5)
3. Klik **"Simpan & Hubungkan"**
4. URL akan tersimpan di browser (localStorage)

#### C4. Login / Register
- **Admin pertama**: Login dengan email yang sama dengan Google Account pemilik GAS
  - Email: `[email-anda]@gmail.com`
  - Password: Buat password baru saat pertama login (akan ter-set otomatis)
- **User baru**: Klik "Daftar Akun Baru" → isi form → admin akan approve

#### C5. Bagikan ke Tim
Cukup bagikan link: **https://hitographic.github.io/DOCENTRA/**
- Setiap orang login dengan akun masing-masing
- Bisa diakses dari HP, tablet, laptop, dimana saja
- Admin mengelola user dan role dari halaman Admin

---

## � Sistem Autentikasi

### Mode GAS Native
- Otomatis menggunakan Google Account (`Session.getActiveUser()`)
- Tidak perlu input email/password
- Hanya bisa diakses oleh pengguna yang sudah authorize

### Mode GitHub Pages
- **Token-based auth**: `Base64(email:password)`
- Password di-hash dengan **SHA-256** sebelum disimpan
- Token dikirim di setiap request API
- Session tersimpan di localStorage browser
- Logout menghapus token dari browser

### Alur Login (GitHub Pages)
```
User input email + password
        │
        ▼
  Hash password (SHA-256)
        │
        ▼
  Kirim ke API: POST /doPost
  { action: "login", email, passwordHash }
        │
        ▼
  Backend: cek email di USERS sheet
  → cocokkan password_hash
  → return user info + token
        │
        ▼
  Frontend simpan token di localStorage
  → Redirect ke Dashboard
```

---

## �👥 Role System

| Role | Upload | Review | Approve | Manage Users |
|------|--------|--------|---------|-------------|
| Staff | ✅ | ❌ | ❌ | ❌ |
| Supervisor | ✅ | ✅ | ❌ | ❌ |
| Manager | ✅ | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ |

---

## 🔄 Workflow Status Dokumen

```
     ┌──────────┐
     │  Draft   │ ←─── Upload versi baru
     └────┬─────┘      (dari Approved)
          │
     Submit Review
          │
     ┌────▼─────┐
     │  Review  │
     └────┬─────┘
          │
    ┌─────┴──────┐
    │            │
  Approve    Return
    │            │
┌───▼────┐  ┌───▼────┐
│Approved│  │ Draft  │
└───┬────┘  └────────┘
    │
 Set Obsolete
    │
┌───▼─────┐
│Obsolete │
└─────────┘
```

---

## 🔍 Diff Engine — Cara Kerja

1. **Upload file baru** → Sistem ambil file versi terakhir dari Drive
2. **Konversi** kedua file Excel ke Google Sheet (sementara)
3. **Baca semua sheet** dalam Excel — data values + formulas
4. **Bandingkan per cell** menggunakan nested loop:
   ```
   for each sheet:
     for each row:
       for each column:
         if oldCell ≠ newCell → catat perubahan
   ```
5. **Hasil diff** ditampilkan dalam format GitHub-style:
   - 🟢 Hijau = Nilai baru / ditambahkan
   - 🔴 Merah = Nilai lama / dihapus
   - 🔵 Biru = Dimodifikasi
6. **Simpan ke CHANGE_LOG** untuk audit trail

### Tipe Perubahan yang Dideteksi:
- ✅ Perubahan nilai cell
- ✅ Perubahan formula
- ✅ Penambahan baris/cell baru
- ✅ Penghapusan baris/cell
- ✅ Sheet baru ditambahkan
- ✅ Sheet dihapus

---

## 📊 Database Schema

### DOCUMENT_MASTER
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| doc_id | String | ID unik (DOC-001, DOC-002, ...) |
| doc_number | String | Nomor dokumen (SOP-PRD-001) |
| title | String | Judul dokumen |
| category | String | Kategori (SOP, WI, Formula, dll) |
| department | String | Departemen pemilik |
| current_version | String | Versi terakhir (1.0, 1.1, ...) |
| status | String | Draft/Review/Approved/Obsolete |
| folder_id | String | Google Drive Folder ID |
| created_at | DateTime | Tanggal dibuat |
| updated_at | DateTime | Tanggal diupdate |

### VERSION_HISTORY
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| doc_id | String | Referensi ke DOCUMENT_MASTER |
| version | String | Nomor versi |
| file_id | String | Google Drive File ID |
| file_name | String | Nama file di Drive |
| uploaded_by | String | Email uploader |
| upload_date | DateTime | Tanggal upload |
| change_summary | String | Ringkasan perubahan |

### CHANGE_LOG
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| doc_id | String | Referensi ke DOCUMENT_MASTER |
| version | String | Nomor versi |
| sheet_name | String | Nama sheet Excel |
| cell_address | String | Alamat cell (e.g., B12) |
| old_value | String | Nilai lama |
| new_value | String | Nilai baru |
| change_type | String | Modified/Added/Removed |
| changed_by | String | Email pengubah |
| changed_at | DateTime | Waktu perubahan |

### USERS
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| email | String | Email pengguna |
| name | String | Nama lengkap |
| role | String | Staff/Supervisor/Manager/Admin |
| department | String | Departemen |
| is_active | Boolean | Status aktif |
| created_at | DateTime | Tanggal terdaftar |
| password_hash | String | Hash SHA-256 password (untuk login GitHub Pages) |

---

## 🎨 Tema Warna

Menggunakan warna khas **Indofood CBP**:

| Warna | Kode | Penggunaan |
|-------|------|-----------|
| Biru Tua | `#1a237e` | Header, primary dark |
| Biru | `#283593` | Primary buttons |
| Biru Muda | `#5c6bc0` | Secondary elements |
| Merah | `#e53935` | Accent, CTA buttons |
| Putih | `#ffffff` | Background, text |
| Hijau (Diff) | `#e8f5e9` | Perubahan baru |
| Merah (Diff) | `#ffebee` | Perubahan lama |

---

## 🚫 Rules Penting

1. ❌ **Tidak boleh overwrite** file versi lama
2. ✅ **Semua revisi** harus menaikkan nomor versi
3. 📝 **Semua perubahan** tercatat di CHANGE_LOG
4. 🔒 **Dokumen Approved** tidak bisa diedit — harus upload versi baru
5. 👤 **Semua aktivitas** tercatat waktu & user
6. 📎 **Hanya .xlsx dan .xls** yang diterima
7. 📏 **Max file size** 25MB

---

## 🛠 Troubleshooting

### "Akses ditolak: Anda tidak memiliki izin"
→ Pastikan deployment menggunakan **Execute as: Me** dan **Who has access: Anyone**
→ Jika sudah terlanjur deploy dengan konfigurasi lama, buat **New Deployment** baru (jangan edit deployment lama)

### "CORS Error" atau "Failed to fetch" (GitHub Pages)
→ Pastikan Web App URL sudah benar (copy persis dari Deploy result)
→ URL harus diakhiri dengan `/exec`
→ Pastikan deployment sudah diset **Anyone** (bukan "Anyone within organization")

### "Drive API not enabled"
→ Pastikan Drive API v2 sudah di-enable di **Services** (di Editor, bukan Project Settings)

### "Authorization required"
→ Klik "Review Permissions" dan izinkan semua akses yang diminta

### "Folder not found"
→ Jalankan ulang setup atau periksa apakah folder DOCENTRA masih ada di Drive

### "Diff takes too long"
→ File Excel yang sangat besar (>5000 baris) mungkin memerlukan waktu lebih lama
→ Google Apps Script memiliki limit eksekusi 6 menit

### "Cannot read .xls file"
→ File .xls (format lama) dikonversi melalui Google Drive API. Pastikan Drive API v2 aktif

### "Token expired / Silakan login ulang" (GitHub Pages)
→ Token login tersimpan di localStorage browser
→ Klik Logout, lalu Login ulang

### Setelah update code, fitur baru tidak muncul
→ Anda harus membuat **New Deployment** baru setiap kali mengubah code
→ Edit deployment yang lama **tidak** akan mengupdate versi yang sudah live
→ Setelah deploy baru, copy Web App URL baru dan update di GitHub Pages

---

## 📈 Target Dokumen

| Kategori | Contoh |
|----------|--------|
| SOP | SOP Mixing, SOP Packaging, SOP Steaming |
| WI | WI Operasi Mesin, WI Sanitasi |
| Formula | Formula Mi Goreng, Formula Mi Kuah |
| Spec RM | Spec Tepung, Spec Minyak, Spec Bumbu |
| QC Report | Laporan Harian QC, Monitoring Suhu |

---

## 🔄 Update / Re-deploy

### Jika mengubah file .gs atau .html:
1. Update code di Apps Script Editor
2. **Deploy** > **New deployment** (BUKAN Manage deployments > Edit)
3. Copy Web App URL baru
4. Jika menggunakan GitHub Pages, update API URL di halaman login

### Jika mengubah docs/index.html (frontend GitHub Pages):
1. Edit file, commit, push ke GitHub
2. GitHub Pages akan otomatis update dalam ~1 menit
3. Tidak perlu deploy ulang di Apps Script

---

## 📞 Support

Untuk bantuan teknis, hubungi Tim IT atau Administrator DOCENTRA.

**Versi**: 2.0.0  
**Dibangun untuk**: PT Indofood CBP Sukses Makmur Tbk — Divisi Noodle  
**Platform**: Google Workspace (Apps Script) + GitHub Pages  
**Repository**: [github.com/hitographic/DOCENTRA](https://github.com/hitographic/DOCENTRA)

---

*DOCENTRA © 2025 — PT Indofood CBP Sukses Makmur Tbk*
