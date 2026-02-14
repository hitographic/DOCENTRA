/**
 * ============================================================
 *  DOCENTRA - Document Control System
 *  Database.gs - Layer Akses Database (Google Sheets)
 * ============================================================
 */

/**
 * Class Database - Mengelola semua operasi CRUD ke Google Sheets
 */
var Database = {
  
  /**
   * Mendapatkan spreadsheet database
   */
  getDB: function() {
    getStoredConfig();
    return SpreadsheetApp.openById(CONFIG.DATABASE_SPREADSHEET_ID);
  },
  
  /**
   * Mendapatkan sheet tertentu
   */
  getSheet: function(sheetName) {
    return this.getDB().getSheetByName(sheetName);
  },
  
  // =============================================
  //  DOCUMENT_MASTER OPERATIONS
  // =============================================
  
  /**
   * Generate Doc ID baru
   */
  generateDocId: function() {
    var sheet = this.getSheet(CONFIG.SHEETS.DOCUMENT_MASTER);
    var lastRow = sheet.getLastRow();
    var nextNum = 1;
    
    if (lastRow > 1) {
      var allIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < allIds.length; i++) {
        var num = parseInt(allIds[i][0].toString().replace('DOC-', ''));
        if (num >= nextNum) nextNum = num + 1;
      }
    }
    
    return 'DOC-' + ('000' + nextNum).slice(-3);
  },
  
  /**
   * Tambah dokumen baru
   */
  addDocument: function(data) {
    var sheet = this.getSheet(CONFIG.SHEETS.DOCUMENT_MASTER);
    var docId = this.generateDocId();
    var now = new Date().toISOString();
    
    sheet.appendRow([
      docId,
      data.doc_number || '',
      data.title || '',
      data.category || '',
      data.department || '',
      '1.0',
      CONFIG.STATUS.DRAFT,
      data.folder_id || '',
      now,
      now
    ]);
    
    return docId;
  },
  
  /**
   * Mendapatkan semua dokumen
   */
  getAllDocuments: function() {
    var sheet = this.getSheet(CONFIG.SHEETS.DOCUMENT_MASTER);
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return [];
    
    var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    var documents = [];
    
    for (var i = 0; i < data.length; i++) {
      documents.push({
        doc_id: data[i][0],
        doc_number: data[i][1],
        title: data[i][2],
        category: data[i][3],
        department: data[i][4],
        current_version: data[i][5],
        status: data[i][6],
        folder_id: data[i][7],
        created_at: data[i][8],
        updated_at: data[i][9]
      });
    }
    
    return documents;
  },
  
  /**
   * Mendapatkan dokumen berdasarkan ID
   */
  getDocumentById: function(docId) {
    var docs = this.getAllDocuments();
    for (var i = 0; i < docs.length; i++) {
      if (docs[i].doc_id === docId) return docs[i];
    }
    return null;
  },
  
  /**
   * Update dokumen
   */
  updateDocument: function(docId, updates) {
    var sheet = this.getSheet(CONFIG.SHEETS.DOCUMENT_MASTER);
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return false;
    
    var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === docId) {
        var row = i + 2;
        
        if (updates.doc_number !== undefined) sheet.getRange(row, 2).setValue(updates.doc_number);
        if (updates.title !== undefined) sheet.getRange(row, 3).setValue(updates.title);
        if (updates.category !== undefined) sheet.getRange(row, 4).setValue(updates.category);
        if (updates.department !== undefined) sheet.getRange(row, 5).setValue(updates.department);
        if (updates.current_version !== undefined) sheet.getRange(row, 6).setValue(updates.current_version);
        if (updates.status !== undefined) sheet.getRange(row, 7).setValue(updates.status);
        if (updates.folder_id !== undefined) sheet.getRange(row, 8).setValue(updates.folder_id);
        
        // Always update updated_at
        sheet.getRange(row, 10).setValue(new Date().toISOString());
        
        return true;
      }
    }
    
    return false;
  },
  
  /**
   * Mendapatkan statistik dashboard
   */
  getDashboardStats: function() {
    var docs = this.getAllDocuments();
    var stats = {
      total: docs.length,
      draft: 0,
      review: 0,
      approved: 0,
      obsolete: 0,
      recentUpdates: []
    };
    
    for (var i = 0; i < docs.length; i++) {
      switch (docs[i].status) {
        case CONFIG.STATUS.DRAFT: stats.draft++; break;
        case CONFIG.STATUS.REVIEW: stats.review++; break;
        case CONFIG.STATUS.APPROVED: stats.approved++; break;
        case CONFIG.STATUS.OBSOLETE: stats.obsolete++; break;
      }
    }
    
    // Sort by updated_at desc
    docs.sort(function(a, b) {
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
    
    stats.recentUpdates = docs.slice(0, 10);
    
    return stats;
  },
  
  /**
   * Search dokumen
   */
  searchDocuments: function(query) {
    var docs = this.getAllDocuments();
    var q = query.toLowerCase();
    
    return docs.filter(function(doc) {
      return doc.doc_id.toLowerCase().indexOf(q) > -1 ||
             doc.doc_number.toLowerCase().indexOf(q) > -1 ||
             doc.title.toLowerCase().indexOf(q) > -1 ||
             doc.category.toLowerCase().indexOf(q) > -1 ||
             doc.department.toLowerCase().indexOf(q) > -1;
    });
  },
  
  // =============================================
  //  VERSION_HISTORY OPERATIONS
  // =============================================
  
  /**
   * Tambah entri versi baru
   */
  addVersion: function(data) {
    var sheet = this.getSheet(CONFIG.SHEETS.VERSION_HISTORY);
    var now = new Date().toISOString();
    
    sheet.appendRow([
      data.doc_id,
      data.version,
      data.file_id,
      data.file_name || '',
      data.uploaded_by || Session.getActiveUser().getEmail(),
      now,
      data.change_summary || ''
    ]);
    
    return true;
  },
  
  /**
   * Mendapatkan semua versi untuk dokumen tertentu
   */
  getVersionHistory: function(docId) {
    var sheet = this.getSheet(CONFIG.SHEETS.VERSION_HISTORY);
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return [];
    
    var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    var versions = [];
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === docId) {
        versions.push({
          doc_id: data[i][0],
          version: data[i][1],
          file_id: data[i][2],
          file_name: data[i][3],
          uploaded_by: data[i][4],
          upload_date: data[i][5],
          change_summary: data[i][6]
        });
      }
    }
    
    // Sort by version desc
    versions.sort(function(a, b) {
      return parseFloat(b.version) - parseFloat(a.version);
    });
    
    return versions;
  },
  
  /**
   * Mendapatkan versi terakhir file_id untuk dokumen
   */
  getLatestVersion: function(docId) {
    var versions = this.getVersionHistory(docId);
    return versions.length > 0 ? versions[0] : null;
  },
  
  /**
   * Mendapatkan versi tertentu
   */
  getVersion: function(docId, version) {
    var versions = this.getVersionHistory(docId);
    for (var i = 0; i < versions.length; i++) {
      if (versions[i].version.toString() === version.toString()) {
        return versions[i];
      }
    }
    return null;
  },
  
  // =============================================
  //  CHANGE_LOG OPERATIONS
  // =============================================
  
  /**
   * Batch insert change log entries
   */
  addChangeLogs: function(changes) {
    if (!changes || changes.length === 0) return;
    
    var sheet = this.getSheet(CONFIG.SHEETS.CHANGE_LOG);
    var now = new Date().toISOString();
    var user = Session.getActiveUser().getEmail();
    
    var rows = [];
    for (var i = 0; i < changes.length; i++) {
      rows.push([
        changes[i].doc_id,
        changes[i].version,
        changes[i].sheet_name,
        changes[i].cell_address,
        changes[i].old_value,
        changes[i].new_value,
        changes[i].change_type || 'Modified',
        changes[i].changed_by || user,
        now
      ]);
    }
    
    // Batch insert untuk performa
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
    }
    
    return rows.length;
  },
  
  /**
   * Mendapatkan change log untuk dokumen dan versi tertentu
   */
  getChangeLogs: function(docId, version) {
    var sheet = this.getSheet(CONFIG.SHEETS.CHANGE_LOG);
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return [];
    
    var data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    var logs = [];
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === docId && 
          (version === undefined || data[i][1].toString() === version.toString())) {
        logs.push({
          doc_id: data[i][0],
          version: data[i][1],
          sheet_name: data[i][2],
          cell_address: data[i][3],
          old_value: data[i][4],
          new_value: data[i][5],
          change_type: data[i][6],
          changed_by: data[i][7],
          changed_at: data[i][8]
        });
      }
    }
    
    return logs;
  },
  
  // =============================================
  //  USERS OPERATIONS
  // =============================================
  
  /**
   * Mendapatkan user berdasarkan email
   */
  getUserByEmail: function(email) {
    var sheet = this.getSheet(CONFIG.SHEETS.USERS);
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return null;
    
    var numCols = Math.max(sheet.getLastColumn(), 7);
    var data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === email.toLowerCase()) {
        // is_active bisa boolean true/false atau string 'TRUE'/'FALSE'
        var isActive = data[i][4];
        if (typeof isActive === 'boolean') {
          isActive = isActive;
        } else {
          isActive = isActive.toString().toUpperCase() === 'TRUE';
        }
        
        return {
          email: data[i][0],
          name: data[i][1],
          role: data[i][2],
          department: data[i][3],
          is_active: isActive,
          created_at: data[i][5]
        };
      }
    }
    
    return null;
  },
  
  /**
   * Mendapatkan password hash user
   */
  getUserPasswordHash: function(email) {
    var sheet = this.getSheet(CONFIG.SHEETS.USERS);
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return null;
    
    var numCols = Math.max(sheet.getLastColumn(), 7);
    var data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === email.toLowerCase()) {
        return (data[i][6] || '').toString();
      }
    }
    
    return null;
  },
  
  /**
   * Set password hash user
   */
  setUserPasswordHash: function(email, hash) {
    var sheet = this.getSheet(CONFIG.SHEETS.USERS);
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return false;
    
    // Pastikan header kolom ke-7 ada
    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 7)).getValues()[0];
    if (!headers[6] || headers[6] === '') {
      sheet.getRange(1, 7).setValue('password_hash');
    }
    
    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === email.toLowerCase()) {
        sheet.getRange(i + 2, 7).setValue(hash);
        return true;
      }
    }
    
    return false;
  },
  
  /**
   * Mendapatkan semua users
   */
  getAllUsers: function() {
    var sheet = this.getSheet(CONFIG.SHEETS.USERS);
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return [];
    
    var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    var users = [];
    
    for (var i = 0; i < data.length; i++) {
      var isActive = data[i][4];
      if (typeof isActive === 'boolean') {
        isActive = isActive;
      } else {
        isActive = isActive.toString().toUpperCase() === 'TRUE';
      }
      
      users.push({
        email: data[i][0],
        name: data[i][1],
        role: data[i][2],
        department: data[i][3],
        is_active: isActive,
        created_at: data[i][5]
      });
    }
    
    return users;
  },
  
  /**
   * Tambah user baru
   */
  addUser: function(data) {
    var sheet = this.getSheet(CONFIG.SHEETS.USERS);
    var now = new Date().toISOString();
    
    // Cek apakah user sudah ada
    if (this.getUserByEmail(data.email)) {
      return { success: false, message: 'User dengan email ini sudah terdaftar' };
    }
    
    // Pastikan header kolom ke-7 ada
    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 7)).getValues()[0];
    if (!headers[6] || headers[6] === '') {
      sheet.getRange(1, 7).setValue('password_hash');
    }
    
    sheet.appendRow([
      data.email,
      data.name || '',
      data.role || CONFIG.ROLES.STAFF,
      data.department || '',
      'TRUE',
      now,
      data.password_hash || ''
    ]);
    
    return { success: true, message: 'User berhasil ditambahkan' };
  },
  
  /**
   * Update user
   */
  updateUser: function(email, updates) {
    var sheet = this.getSheet(CONFIG.SHEETS.USERS);
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return false;
    
    var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === email.toLowerCase()) {
        var row = i + 2;
        if (updates.name !== undefined) sheet.getRange(row, 2).setValue(updates.name);
        if (updates.role !== undefined) sheet.getRange(row, 3).setValue(updates.role);
        if (updates.department !== undefined) sheet.getRange(row, 4).setValue(updates.department);
        if (updates.is_active !== undefined) sheet.getRange(row, 5).setValue(updates.is_active ? 'TRUE' : 'FALSE');
        return true;
      }
    }
    
    return false;
  },
  
  /**
   * Hapus user (soft delete)
   */
  deactivateUser: function(email) {
    return this.updateUser(email, { is_active: false });
  }
};
