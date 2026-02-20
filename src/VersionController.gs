/**
 * ============================================================
 *  DOCENTRA - Document Control System
 *  VersionController.gs - Pengelolaan Versi & Upload
 * ============================================================
 */

var VersionController = {
  
  /**
   * Upload versi baru untuk dokumen
   * @param {string} docId - ID dokumen
   * @param {Blob} fileBlob - File yang diupload
   * @param {string} changeSummary - Ringkasan perubahan manual
   * @returns {Object} Hasil upload dan diff
   */
  uploadNewVersion: function(docId, fileBlob, changeSummary) {
    try {
      // Validasi akses
      Auth.authorize(CONFIG.ROLES.STAFF, 'upload versi baru');
      
      // Ambil dokumen
      var doc = Database.getDocumentById(docId);
      if (!doc) {
        return { success: false, message: 'Dokumen tidak ditemukan' };
      }
      
      // Cek status - Approved harus jadi Draft dulu untuk versi baru
      // Tapi upload versi baru pada Approved tetap boleh (membuat versi baru)
      
      // Validasi file
      var fileName = fileBlob.getName();
      var fileSize = fileBlob.getBytes().length;
      var validation = DriveManager.validateFile(fileName, fileSize);
      
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }
      
      // Hitung versi baru
      var currentVersion = parseFloat(doc.current_version) || 1.0;
      var newVersion = (currentVersion + 0.1).toFixed(1);
      
      // Ambil versi terakhir untuk perbandingan
      var latestVersion = Database.getLatestVersion(docId);
      var diffResult = null;
      var oldSheetData = null;
      var newSheetData = null;
      
      // Simpan file ke Drive
      var savedFile = DriveManager.saveFile(
        doc.folder_id, fileBlob, newVersion, doc.doc_id
      );
      
      // Lakukan diff jika ada versi sebelumnya
      if (latestVersion && latestVersion.file_id) {
        try {
          oldSheetData = DriveManager.convertExcelToSheetData(latestVersion.file_id);
          newSheetData = DriveManager.convertExcelToSheetData(savedFile.file_id);
          diffResult = DiffEngine.compareData(oldSheetData, newSheetData);
          
          // Auto-generate change summary jika tidak disediakan
          if (!changeSummary || changeSummary.trim() === '') {
            changeSummary = DiffEngine.generateChangeSummary(diffResult);
          }
          
          // Simpan change log ke database
          if (diffResult.changes.length > 0) {
            var changeLogs = [];
            for (var i = 0; i < diffResult.changes.length; i++) {
              changeLogs.push({
                doc_id: docId,
                version: newVersion,
                sheet_name: diffResult.changes[i].sheet_name,
                cell_address: diffResult.changes[i].cell_address,
                old_value: diffResult.changes[i].old_value,
                new_value: diffResult.changes[i].new_value,
                change_type: diffResult.changes[i].change_type
              });
            }
            Database.addChangeLogs(changeLogs);
          }
        } catch (diffError) {
          Logger.log('Diff error (non-fatal): ' + diffError.message);
          changeSummary = changeSummary || 'Versi baru diupload (diff tidak tersedia)';
        }
      } else {
        changeSummary = changeSummary || 'Versi awal dokumen';
      }
      
      // Simpan versi ke VERSION_HISTORY
      Database.addVersion({
        doc_id: docId,
        version: newVersion,
        file_id: savedFile.file_id,
        file_name: savedFile.file_name,
        change_summary: changeSummary
      });
      
      // Update current_version di DOCUMENT_MASTER
      var statusUpdate = { current_version: newVersion };
      
      // Jika dokumen sudah Approved, ubah ke Draft untuk versi baru
      if (doc.status === CONFIG.STATUS.APPROVED) {
        statusUpdate.status = CONFIG.STATUS.DRAFT;
      }
      
      Database.updateDocument(docId, statusUpdate);
      
      // Format diff untuk response
      var diffDisplay = null;
      if (diffResult) {
        diffDisplay = DiffEngine.formatDiffForDisplay(diffResult, oldSheetData, newSheetData);
      }
      
      return {
        success: true,
        message: 'Versi ' + newVersion + ' berhasil diupload',
        version: newVersion,
        file_id: savedFile.file_id,
        file_name: savedFile.file_name,
        diff: diffDisplay,
        changeSummary: changeSummary
      };
      
    } catch (error) {
      Logger.log('Upload error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Upload file untuk dokumen baru (versi awal)
   */
  uploadInitialVersion: function(docId, fileBlob, initialVersion) {
    try {
      Auth.authorize(CONFIG.ROLES.STAFF, 'upload dokumen');
      
      var doc = Database.getDocumentById(docId);
      if (!doc) {
        return { success: false, message: 'Dokumen tidak ditemukan' };
      }
      
      // Validasi file
      var fileName = fileBlob.getName();
      var fileSize = fileBlob.getBytes().length;
      var validation = DriveManager.validateFile(fileName, fileSize);
      
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }
      
      var version = initialVersion || '1.0';
      
      // Simpan file
      var savedFile = DriveManager.saveFile(
        doc.folder_id, fileBlob, version, doc.doc_id
      );
      
      // Simpan versi
      Database.addVersion({
        doc_id: docId,
        version: version,
        file_id: savedFile.file_id,
        file_name: savedFile.file_name,
        change_summary: 'Versi awal dokumen'
      });
      
      // Update current_version
      Database.updateDocument(docId, { current_version: version });
      
      return {
        success: true,
        message: 'Dokumen versi 1.0 berhasil diupload',
        version: version,
        file_id: savedFile.file_id
      };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Bandingkan dua versi dokumen
   * @param {string} docId - ID dokumen
   * @param {string} versionOld - Versi lama
   * @param {string} versionNew - Versi baru
   */
  compareVersions: function(docId, versionOld, versionNew) {
    try {
      var oldVer = Database.getVersion(docId, versionOld);
      var newVer = Database.getVersion(docId, versionNew);
      
      if (!oldVer) {
        return { success: false, message: 'Versi lama (' + versionOld + ') tidak ditemukan' };
      }
      if (!newVer) {
        return { success: false, message: 'Versi baru (' + versionNew + ') tidak ditemukan' };
      }
      
      // Konversi kedua file ke data array
      var oldData = DriveManager.convertExcelToSheetData(oldVer.file_id);
      var newData = DriveManager.convertExcelToSheetData(newVer.file_id);
      
      // Lakukan diff
      var diffResult = DiffEngine.compareData(oldData, newData);
      var diffDisplay = DiffEngine.formatDiffForDisplay(diffResult, oldData, newData);
      
      return {
        success: true,
        docId: docId,
        versionOld: versionOld,
        versionNew: versionNew,
        diff: diffDisplay,
        changeSummary: DiffEngine.generateChangeSummary(diffResult)
      };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Mendapatkan change log untuk versi tertentu
   */
  getVersionChanges: function(docId, version) {
    try {
      var changes = Database.getChangeLogs(docId, version);
      
      // Kelompokkan per sheet
      var grouped = {};
      for (var i = 0; i < changes.length; i++) {
        var sheetName = changes[i].sheet_name;
        if (!grouped[sheetName]) {
          grouped[sheetName] = [];
        }
        grouped[sheetName].push(changes[i]);
      }
      
      return {
        success: true,
        changes: changes,
        grouped: grouped,
        totalChanges: changes.length
      };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Mendapatkan URL download file
   */
  getFileDownloadUrl: function(fileId) {
    try {
      var file = DriveManager.getFile(fileId);
      if (!file) {
        return { success: false, message: 'File tidak ditemukan' };
      }
      
      return {
        success: true,
        url: file.getUrl(),
        name: file.getName()
      };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};
