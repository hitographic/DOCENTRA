/**
 * ============================================================
 *  DOCENTRA - Document Control System
 *  Setup.gs - Inisialisasi & Setup Sistem
 * ============================================================
 */

/**
 * Menjalankan setup awal sistem DOCENTRA
 * Buat spreadsheet database dan folder structure di Drive
 */
function initialSetup() {
  try {
    Logger.log('=== DOCENTRA INITIAL SETUP ===');
    
    // 1. Buat Root Folder di Google Drive
    var rootFolder = createDriveFolderStructure_();
    Logger.log('Root Folder ID: ' + rootFolder.getId());
    
    // 2. Buat Spreadsheet Database
    var dbSpreadsheet = createDatabaseSpreadsheet_(rootFolder);
    Logger.log('Database Spreadsheet ID: ' + dbSpreadsheet.getId());
    
    // 3. Simpan konfigurasi
    saveConfig(dbSpreadsheet.getId(), rootFolder.getId());
    
    // 4. Setup user pertama (Admin)
    setupFirstAdmin_();
    
    Logger.log('=== SETUP SELESAI ===');
    Logger.log('Database ID: ' + dbSpreadsheet.getId());
    Logger.log('Root Folder ID: ' + rootFolder.getId());
    Logger.log('');
    Logger.log('Buka URL berikut untuk database:');
    Logger.log(dbSpreadsheet.getUrl());
    Logger.log('');
    Logger.log('Buka URL berikut untuk folder:');
    Logger.log(rootFolder.getUrl());
    
    return {
      success: true,
      databaseId: dbSpreadsheet.getId(),
      databaseUrl: dbSpreadsheet.getUrl(),
      folderId: rootFolder.getId(),
      folderUrl: rootFolder.getUrl()
    };
    
  } catch (error) {
    Logger.log('ERROR SETUP: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Membuat struktur folder di Google Drive
 */
function createDriveFolderStructure_() {
  // Cek apakah folder sudah ada
  var existingFolders = DriveApp.getFoldersByName('DOCENTRA - Document Control');
  if (existingFolders.hasNext()) {
    var existing = existingFolders.next();
    Logger.log('Root folder sudah ada, menggunakan yang existing');
    return existing;
  }
  
  // Buat root folder
  var rootFolder = DriveApp.createFolder('DOCENTRA - Document Control');
  rootFolder.setDescription('DOCENTRA Document Control System - PT Indofood CBP Sukses Makmur Tbk');
  
  // Buat subfolder Archive
  rootFolder.createFolder('Archive');
  
  Logger.log('Folder structure berhasil dibuat');
  return rootFolder;
}

/**
 * Membuat Spreadsheet Database dengan 4 sheets
 */
function createDatabaseSpreadsheet_(parentFolder) {
  // Buat spreadsheet
  var ss = SpreadsheetApp.create('DOCENTRA_DATABASE');
  
  // Pindahkan ke root folder
  var file = DriveApp.getFileById(ss.getId());
  parentFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  
  // === Sheet 1: DOCUMENT_MASTER ===
  var masterSheet = ss.getSheets()[0];
  masterSheet.setName(CONFIG.SHEETS.DOCUMENT_MASTER);
  masterSheet.getRange(1, 1, 1, 10).setValues([[
    'doc_id', 'doc_number', 'title', 'category', 'department',
    'current_version', 'status', 'folder_id', 'created_at', 'updated_at'
  ]]);
  masterSheet.getRange(1, 1, 1, 10)
    .setBackground(CONFIG.COLORS.PRIMARY_DARK)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontWeight('bold');
  masterSheet.setFrozenRows(1);
  
  // Set lebar kolom
  masterSheet.setColumnWidth(1, 120); // doc_id
  masterSheet.setColumnWidth(2, 150); // doc_number
  masterSheet.setColumnWidth(3, 300); // title
  masterSheet.setColumnWidth(4, 150); // category
  masterSheet.setColumnWidth(5, 150); // department
  masterSheet.setColumnWidth(6, 120); // current_version
  masterSheet.setColumnWidth(7, 100); // status
  masterSheet.setColumnWidth(8, 250); // folder_id
  masterSheet.setColumnWidth(9, 180); // created_at
  masterSheet.setColumnWidth(10, 180); // updated_at
  
  // === Sheet 2: VERSION_HISTORY ===
  var versionSheet = ss.insertSheet(CONFIG.SHEETS.VERSION_HISTORY);
  versionSheet.getRange(1, 1, 1, 7).setValues([[
    'doc_id', 'version', 'file_id', 'file_name',
    'uploaded_by', 'upload_date', 'change_summary'
  ]]);
  versionSheet.getRange(1, 1, 1, 7)
    .setBackground(CONFIG.COLORS.PRIMARY_DARK)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontWeight('bold');
  versionSheet.setFrozenRows(1);
  
  versionSheet.setColumnWidth(1, 120);
  versionSheet.setColumnWidth(2, 80);
  versionSheet.setColumnWidth(3, 250);
  versionSheet.setColumnWidth(4, 200);
  versionSheet.setColumnWidth(5, 200);
  versionSheet.setColumnWidth(6, 180);
  versionSheet.setColumnWidth(7, 400);
  
  // === Sheet 3: CHANGE_LOG ===
  var changeSheet = ss.insertSheet(CONFIG.SHEETS.CHANGE_LOG);
  changeSheet.getRange(1, 1, 1, 9).setValues([[
    'doc_id', 'version', 'sheet_name', 'cell_address',
    'old_value', 'new_value', 'change_type', 'changed_by', 'changed_at'
  ]]);
  changeSheet.getRange(1, 1, 1, 9)
    .setBackground(CONFIG.COLORS.PRIMARY_DARK)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontWeight('bold');
  changeSheet.setFrozenRows(1);
  
  changeSheet.setColumnWidth(1, 120);
  changeSheet.setColumnWidth(2, 80);
  changeSheet.setColumnWidth(3, 150);
  changeSheet.setColumnWidth(4, 100);
  changeSheet.setColumnWidth(5, 250);
  changeSheet.setColumnWidth(6, 250);
  changeSheet.setColumnWidth(7, 100);
  changeSheet.setColumnWidth(8, 200);
  changeSheet.setColumnWidth(9, 180);
  
  // === Sheet 4: USERS ===
  var usersSheet = ss.insertSheet(CONFIG.SHEETS.USERS);
  usersSheet.getRange(1, 1, 1, 6).setValues([[
    'email', 'name', 'role', 'department', 'is_active', 'created_at'
  ]]);
  usersSheet.getRange(1, 1, 1, 6)
    .setBackground(CONFIG.COLORS.PRIMARY_DARK)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontWeight('bold');
  usersSheet.setFrozenRows(1);
  
  usersSheet.setColumnWidth(1, 250);
  usersSheet.setColumnWidth(2, 200);
  usersSheet.setColumnWidth(3, 100);
  usersSheet.setColumnWidth(4, 150);
  usersSheet.setColumnWidth(5, 80);
  usersSheet.setColumnWidth(6, 180);
  
  Logger.log('Database spreadsheet berhasil dibuat');
  return ss;
}

/**
 * Setup admin pertama (user yang menjalankan setup)
 */
function setupFirstAdmin_() {
  getStoredConfig();
  var ss = SpreadsheetApp.openById(CONFIG.DATABASE_SPREADSHEET_ID);
  var usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  
  var currentUser = Session.getActiveUser().getEmail();
  var now = new Date().toISOString();
  
  usersSheet.appendRow([
    currentUser,
    'Administrator',
    CONFIG.ROLES.ADMIN,
    'IT',
    'TRUE',
    now
  ]);
  
  Logger.log('Admin pertama: ' + currentUser);
}

/**
 * Reset sistem (HATI-HATI! Menghapus semua data)
 * Hanya untuk development/testing
 */
function resetSystem() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '⚠️ PERINGATAN',
    'Ini akan menghapus SEMUA data DOCENTRA.\nApakah Anda yakin?',
    ui.ButtonSet.YES_NO
  );
  
  if (response == ui.Button.YES) {
    PropertiesService.getScriptProperties().deleteAllProperties();
    Logger.log('Sistem berhasil direset');
  }
}

/**
 * Menu setup di Google Sheet (untuk debugging)
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🔧 DOCENTRA')
    .addItem('Initial Setup', 'initialSetup')
    .addItem('Check Config', 'checkConfig')
    .addSeparator()
    .addItem('⚠️ Reset System', 'resetSystem')
    .addToUi();
}

/**
 * Cek konfigurasi saat ini
 */
function checkConfig() {
  getStoredConfig();
  Logger.log('Database ID: ' + CONFIG.DATABASE_SPREADSHEET_ID);
  Logger.log('Root Folder ID: ' + CONFIG.ROOT_FOLDER_ID);
  Logger.log('Configured: ' + isSystemConfigured());
}
