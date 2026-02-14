/**
 * ============================================================
 *  DOCENTRA - Document Control System
 *  DriveManager.gs - Pengelolaan File di Google Drive
 * ============================================================
 */

var DriveManager = {
  
  /**
   * Mendapatkan root folder
   */
  getRootFolder: function() {
    getStoredConfig();
    return DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  },
  
  /**
   * Membuat folder untuk dokumen baru
   */
  createDocumentFolder: function(docId) {
    var root = this.getRootFolder();
    var folder = root.createFolder(docId);
    folder.setDescription('Document folder for ' + docId + ' - DOCENTRA');
    return folder;
  },
  
  /**
   * Mendapatkan folder dokumen
   */
  getDocumentFolder: function(folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      Logger.log('Folder not found: ' + folderId);
      return null;
    }
  },
  
  /**
   * Simpan file Excel ke folder dokumen
   * @param {string} folderId - ID folder tujuan
   * @param {Blob} fileBlob - Blob file yang diupload
   * @param {string} version - Nomor versi (e.g., "1.0")
   * @param {string} docId - ID dokumen
   * @returns {Object} Info file yang tersimpan
   */
  saveFile: function(folderId, fileBlob, version, docId) {
    var folder = this.getDocumentFolder(folderId);
    if (!folder) {
      throw new Error('Folder dokumen tidak ditemukan: ' + folderId);
    }
    
    // Tentukan nama file
    var originalName = fileBlob.getName();
    var extension = this.getExtension_(originalName);
    var newFileName = docId + '_v' + version + extension;
    
    // Set nama file
    fileBlob.setName(newFileName);
    
    // Simpan ke folder
    var file = folder.createFile(fileBlob);
    file.setDescription('Version ' + version + ' of ' + docId + ' - DOCENTRA');
    
    return {
      file_id: file.getId(),
      file_name: newFileName,
      file_url: file.getUrl(),
      mime_type: file.getMimeType(),
      size: file.getSize()
    };
  },
  
  /**
   * Ambil file dari Drive berdasarkan ID
   */
  getFile: function(fileId) {
    try {
      return DriveApp.getFileById(fileId);
    } catch (e) {
      Logger.log('File not found: ' + fileId);
      return null;
    }
  },
  
  /**
   * Konversi file Excel ke Google Sheet (sementara, untuk dibaca)
   * Ini diperlukan untuk membaca konten .xlsx/.xls
   * @param {string} fileId - ID file Excel di Drive
   * @returns {Object} Data spreadsheet hasil konversi
   */
  convertExcelToSheetData: function(fileId) {
    var file = this.getFile(fileId);
    if (!file) {
      throw new Error('File tidak ditemukan: ' + fileId);
    }
    
    var mimeType = file.getMimeType();
    var blob = file.getBlob();
    
    // Konversi ke Google Sheet sementara menggunakan Drive API v3
    var resource = {
      name: 'DOCENTRA_TEMP_' + new Date().getTime(),
      mimeType: MimeType.GOOGLE_SHEETS
    };
    
    var tempFile = Drive.Files.create(resource, blob, {
      fields: 'id'
    });
    
    var tempSpreadsheet = SpreadsheetApp.openById(tempFile.id);
    var result = this.readSpreadsheetData_(tempSpreadsheet);
    
    // Hapus file temporary
    DriveApp.getFileById(tempFile.id).setTrashed(true);
    
    return result;
  },
  
  /**
   * Baca semua data dari spreadsheet (semua sheets)
   */
  readSpreadsheetData_: function(spreadsheet) {
    var sheets = spreadsheet.getSheets();
    var data = {};
    
    for (var s = 0; s < sheets.length; s++) {
      var sheet = sheets[s];
      var sheetName = sheet.getName();
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      
      if (lastRow === 0 || lastCol === 0) {
        data[sheetName] = [];
        continue;
      }
      
      var range = sheet.getRange(1, 1, lastRow, lastCol);
      var values = range.getValues();
      var formulas = range.getFormulas();
      
      var sheetData = [];
      
      for (var r = 0; r < values.length; r++) {
        var rowData = [];
        for (var c = 0; c < values[r].length; c++) {
          var cellValue = values[r][c];
          var cellFormula = formulas[r][c];
          var cellAddress = this.columnToLetter_(c + 1) + (r + 1);
          
          rowData.push({
            address: cellAddress,
            value: cellValue !== null && cellValue !== undefined ? cellValue.toString() : '',
            formula: cellFormula || '',
            row: r + 1,
            col: c + 1
          });
        }
        sheetData.push(rowData);
      }
      
      data[sheetName] = sheetData;
    }
    
    return data;
  },
  
  /**
   * Konversi nomor kolom ke huruf (1=A, 2=B, 27=AA, dst)
   */
  columnToLetter_: function(column) {
    var letter = '';
    while (column > 0) {
      var temp = (column - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      column = Math.floor((column - temp - 1) / 26);
    }
    return letter;
  },
  
  /**
   * Mendapatkan ekstensi file
   */
  getExtension_: function(fileName) {
    var parts = fileName.split('.');
    if (parts.length > 1) {
      return '.' + parts[parts.length - 1].toLowerCase();
    }
    return '.xlsx';
  },
  
  /**
   * Validasi file yang diupload
   */
  validateFile: function(fileName, fileSize) {
    var extension = this.getExtension_(fileName).toLowerCase();
    
    if (CONFIG.ALLOWED_EXTENSIONS.indexOf(extension) === -1) {
      return {
        valid: false,
        message: 'Format file tidak diizinkan. Hanya ' + CONFIG.ALLOWED_EXTENSIONS.join(', ') + ' yang diterima.'
      };
    }
    
    if (fileSize > CONFIG.MAX_FILE_SIZE) {
      return {
        valid: false,
        message: 'Ukuran file melebihi batas maksimal (25MB).'
      };
    }
    
    return { valid: true, message: 'OK' };
  },
  
  /**
   * Pindahkan file ke Archive
   */
  archiveFile: function(fileId) {
    var root = this.getRootFolder();
    var archiveFolders = root.getFoldersByName('Archive');
    
    var archiveFolder;
    if (archiveFolders.hasNext()) {
      archiveFolder = archiveFolders.next();
    } else {
      archiveFolder = root.createFolder('Archive');
    }
    
    var file = this.getFile(fileId);
    if (file) {
      archiveFolder.addFile(file);
      return true;
    }
    return false;
  },
  
  /**
   * Mendapatkan URL download file
   */
  getDownloadUrl: function(fileId) {
    var file = this.getFile(fileId);
    if (file) {
      return file.getDownloadUrl();
    }
    return null;
  },
  
  /**
   * List semua file dalam folder dokumen
   */
  listDocumentFiles: function(folderId) {
    var folder = this.getDocumentFolder(folderId);
    if (!folder) return [];
    
    var files = folder.getFiles();
    var fileList = [];
    
    while (files.hasNext()) {
      var file = files.next();
      fileList.push({
        id: file.getId(),
        name: file.getName(),
        size: file.getSize(),
        mimeType: file.getMimeType(),
        url: file.getUrl(),
        createdDate: file.getDateCreated(),
        lastUpdated: file.getLastUpdated()
      });
    }
    
    return fileList;
  }
};
