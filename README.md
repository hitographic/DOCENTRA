# 📋 DOCENTRA - Document Control System

### PT Indofood CBP Sukses Makmur Tbk — Divisi Noodle

---

## 🎯 Tentang DOCENTRA

DOCENTRA adalah sistem Document Control (DC) berbasis web internal yang dibangun di atas **Google Workspace** (Google Apps Script, Google Sheets, Google Drive). Sistem ini dirancang khusus untuk pabrik mie guna mengelola versi dokumen seperti SOP, Work Instruction (WI), Formula Produksi, Spesifikasi Raw Material, QC Report, dan dokumen lainnya.

### Fitur Utama:
- ✅ **Version Control** — Upload versi baru tanpa menghapus versi lama
- ✅ **Diff Engine** — Perbandingan Excel per cell (mirip GitHub diff)
- ✅ **Role-Based Access** — Staff, Supervisor, Manager, Admin
- ✅ **Status Workflow** — Draft → Review → Approved → Obsolete
- ✅ **Audit Trail** — Semua perubahan tercatat lengkap
- ✅ **Dashboard** — Statistik dan overview dokumen
- ✅ **Google Workspace Native** — Tidak perlu server eksternal

---

## 🏗 Arsitektur

```
┌─────────────────────────────────────────┐
│         DOCENTRA WebApp (UI)            │
│      HTML + CSS + JavaScript            │
├─────────────────────────────────────────┤
│       Google Apps Script (Backend)       │
│   Code.gs │ Controllers │ DiffEngine    │
├──────────────────┬──────────────────────┤
│  Google Sheets   │    Google Drive      │
│   (Database)     │    (File Storage)    │
│                  │                      │
│ DOCUMENT_MASTER  │ DOCENTRA/            │
│ VERSION_HISTORY  │  ├── DOC-001/        │
│ CHANGE_LOG       │  │   ├── v1.0.xlsx   │
│ USERS            │  │   └── v1.1.xlsx   │
│                  │  ├── DOC-002/        │
│                  │  └── Archive/        │
└──────────────────┴──────────────────────┘
```

---

## 📁 Struktur Project

```
DOCENTRA/
├── src/
│   ├── appsscript.json      # Manifest (scopes, timezone, services)
│   ├── Config.gs             # Konfigurasi global
│   ├── Setup.gs              # Initial setup & folder creation
│   ├── Code.gs               # Entry point & server functions
│   ├── Database.gs           # CRUD operations (Google Sheets)
│   ├── DriveManager.gs       # File management (Google Drive)
│   ├── DiffEngine.gs         # Excel comparison engine
│   ├── Auth.gs               # Authentication & role management
│   ├── DocumentController.gs # Document business logic
│   ├── VersionController.gs  # Version & upload management
│   ├── Index.html            # Main UI template
│   ├── SetupPage.html        # Initial setup page
│   ├── Stylesheet.html       # CSS (Indofood CBP theme)
│   └── JavaScript.html       # Client-side logic
└── README.md                 # Dokumentasi ini
```

---

## 🚀 Cara Deploy

### Prasyarat
- Akun Google Workspace (Google Suite/Gsuite perusahaan)
- Akses ke Google Apps Script (script.google.com)
- Browser modern (Chrome/Edge/Firefox)

### Langkah-langkah Deploy:

#### 1. Buat Project di Google Apps Script
1. Buka [script.google.com](https://script.google.com)
2. Klik **"Proyek Baru"** (New Project)
3. Beri nama project: `DOCENTRA`

#### 2. Copy File-file Script
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
1. `Index.html`
2. `SetupPage.html`
3. `Stylesheet.html`
4. `JavaScript.html`

#### 3. Konfigurasi Manifest
1. Klik ⚙️ **Project Settings** di sidebar kiri
2. Centang **"Show appsscript.json manifest file in editor"**
3. Buka `appsscript.json` dan replace isinya dengan file `appsscript.json` dari folder `src/`

#### 4. Aktifkan Advanced Service (Drive API)
1. Kembali ke **Editor** (klik ikon `< >` di sidebar kiri)
2. Di sidebar kiri, di sebelah **"Services"**, klik ikon **`+`** (Add a service)
3. Pada dialog yang muncul, scroll dan cari **"Drive API"**
4. Pilih **version: v2**
5. Klik **"Add"**

> 💡 **Catatan**: Menu "Services" ada di panel **Editor** (ikon `< >`), 
> bukan di Project Settings (ikon ⚙️). Lihat di bawah daftar file Anda,
> akan ada section "Services" dengan tombol `+` di sampingnya.

#### 5. Deploy sebagai Web App
1. Klik **"Deploy"** > **"New deployment"**
2. Klik ⚙️ di sebelah **"Select type"** > pilih **"Web app"**
3. Konfigurasi:
   - **Description**: `DOCENTRA v1.0`
   - **Execute as**: `User accessing the web app`
   - **Who has access**: `Anyone within [organization]` (untuk internal)
4. Klik **"Deploy"**
5. **Authorize** akses saat diminta
6. Copy **Web App URL** yang diberikan

#### 6. Jalankan Initial Setup
1. Buka **Web App URL** di browser
2. Halaman setup akan muncul
3. Klik **"🚀 Jalankan Setup Otomatis"**
4. Sistem akan membuat:
   - Folder `DOCENTRA - Document Control` di Google Drive
   - Spreadsheet database `DOCENTRA_DATABASE`
   - Sheet: DOCUMENT_MASTER, VERSION_HISTORY, CHANGE_LOG, USERS
   - User admin pertama (email Anda)
5. Setelah setup selesai, klik **"Muat Ulang Aplikasi"**

#### 7. Selesai! 🎉
Anda sekarang bisa mengakses DOCENTRA melalui Web App URL.

---

## 👥 Role System

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
| email | String | Email Google Workspace |
| name | String | Nama lengkap |
| role | String | Staff/Supervisor/Manager/Admin |
| department | String | Departemen |
| is_active | Boolean | Status aktif |
| created_at | DateTime | Tanggal terdaftar |

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

### "Drive API not enabled"
→ Pastikan Drive API v2 sudah di-enable di Services

### "Authorization required"
→ Klik "Review Permissions" dan izinkan akses

### "Folder not found"
→ Jalankan ulang setup atau periksa apakah folder DOCENTRA masih ada di Drive

### "Diff takes too long"
→ File Excel yang sangat besar (>5000 baris) mungkin memerlukan waktu lebih lama. Google Apps Script memiliki limit eksekusi 6 menit.

### "Cannot read .xls file"
→ File .xls (format lama) dikonversi melalui Google Drive API. Pastikan Drive API v2 aktif.

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

## 📞 Support

Untuk bantuan teknis, hubungi Tim IT atau Administrator DOCENTRA.

**Versi**: 1.0.0  
**Dibangun untuk**: PT Indofood CBP Sukses Makmur Tbk — Divisi Noodle  
**Platform**: Google Workspace (Apps Script)

---

*DOCENTRA © 2026 — Internal Use Only*
# DOCENTRA
