/**
 * ============================================================
 *  DOCENTRA - Document Control System
 *  PT Indofood CBP Sukses Makmur Tbk
 *  Divisi Mi Instan
 * ============================================================
 *  Config.gs - Konfigurasi Global Sistem
 * ============================================================
 */

// ============ KONFIGURASI UTAMA ============
var CONFIG = {
  // Google Spreadsheet ID sebagai database
  // Ganti dengan ID spreadsheet Anda setelah setup
  DATABASE_SPREADSHEET_ID: '',
  
  // Google Drive Root Folder ID untuk penyimpanan dokumen
  // Ganti dengan ID folder Google Drive Anda setelah setup
  ROOT_FOLDER_ID: '',
  
  // Nama Sheets dalam Spreadsheet Database
  SHEETS: {
    DOCUMENT_MASTER: 'DOCUMENT_MASTER',
    VERSION_HISTORY: 'VERSION_HISTORY',
    CHANGE_LOG: 'CHANGE_LOG',
    USERS: 'USERS'
  },
  
  // Status Dokumen
  STATUS: {
    DRAFT: 'Draft',
    REVIEW: 'Review',
    APPROVED: 'Approved',
    OBSOLETE: 'Obsolete'
  },
  
  // Role Pengguna
  ROLES: {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    SUPERVISOR: 'Supervisor',
    STAFF: 'Staff'
  },
  
  // Kategori Dokumen Pabrik Mi
  CATEGORIES: [
    'SOP',
    'WI (Work Instruction)',
    'Formula Produksi',
    'Spec Raw Material',
    'QC Report',
    'HACCP Plan',
    'GMP Document',
    'Training Record',
    'Maintenance Record',
    'Other'
  ],
  
  // Departemen
  DEPARTMENTS: [
    'Produksi',
    'Quality Control',
    'Quality Assurance',
    'Warehouse',
    'Engineering',
    'HRD',
    'PPIC',
    'Purchasing',
    'R&D',
    'Finance',
    'IT',
    'HSE',
    'General Affair'
  ],
  
  // Format file yang diizinkan
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls'],
  
  // Mime types yang diizinkan
  ALLOWED_MIME_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ],
  
  // Ukuran maksimal file (dalam bytes) - 25MB
  MAX_FILE_SIZE: 25 * 1024 * 1024,
  
  // Nama Aplikasi
  APP_NAME: 'DOCENTRA',
  APP_FULL_NAME: 'Document Control Application',
  APP_VERSION: '1.0.0',
  COMPANY: 'PT Indofood CBP Sukses Makmur Tbk',
  DIVISION: 'Divisi Noodle',
  
  // Warna Tema (Indofood CBP)
  COLORS: {
    PRIMARY_DARK: '#1a237e',    // Biru tua
    PRIMARY: '#283593',         // Biru
    PRIMARY_LIGHT: '#5c6bc0',   // Biru muda
    ACCENT: '#e53935',          // Merah Indofood
    ACCENT_LIGHT: '#ff6f60',    // Merah muda
    WHITE: '#ffffff',
    LIGHT_GRAY: '#f5f5f5',
    GRAY: '#e0e0e0',
    DARK_GRAY: '#616161',
    TEXT_PRIMARY: '#212121',
    TEXT_SECONDARY: '#757575',
    SUCCESS: '#2e7d32',
    WARNING: '#f57f17',
    ERROR: '#c62828',
    DIFF_ADD: '#e8f5e9',        // Hijau muda untuk penambahan
    DIFF_REMOVE: '#ffebee',     // Merah muda untuk penghapusan
    DIFF_ADD_TEXT: '#1b5e20',
    DIFF_REMOVE_TEXT: '#b71c1c'
  }
};

/**
 * Mendapatkan konfigurasi yang tersimpan di Properties Service
 */
function getStoredConfig() {
  var props = PropertiesService.getScriptProperties();
  var dbId = props.getProperty('DATABASE_SPREADSHEET_ID');
  var folderId = props.getProperty('ROOT_FOLDER_ID');
  
  if (dbId) CONFIG.DATABASE_SPREADSHEET_ID = dbId;
  if (folderId) CONFIG.ROOT_FOLDER_ID = folderId;
  
  return CONFIG;
}

/**
 * Menyimpan konfigurasi ke Properties Service
 */
function saveConfig(dbId, folderId) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('DATABASE_SPREADSHEET_ID', dbId);
  props.setProperty('ROOT_FOLDER_ID', folderId);
  CONFIG.DATABASE_SPREADSHEET_ID = dbId;
  CONFIG.ROOT_FOLDER_ID = folderId;
}

/**
 * Cek apakah sistem sudah di-setup
 */
function isSystemConfigured() {
  getStoredConfig();
  return CONFIG.DATABASE_SPREADSHEET_ID !== '' && CONFIG.ROOT_FOLDER_ID !== '';
}
