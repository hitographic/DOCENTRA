/**
 * ============================================================
 *  DOCENTRA - Document Control System
 *  DiffEngine.gs - Mesin Perbandingan Excel (GitHub-style Diff)
 * ============================================================
 */

var DiffEngine = {
  
  /**
   * Bandingkan dua file Excel dan hasilkan diff
   * @param {string} oldFileId - ID file versi lama di Drive
   * @param {string} newFileId - ID file versi baru di Drive
   * @returns {Object} Hasil perbandingan lengkap
   */
  compareFiles: function(oldFileId, newFileId) {
    // Konversi kedua file ke data array
    var oldData = DriveManager.convertExcelToSheetData(oldFileId);
    var newData = DriveManager.convertExcelToSheetData(newFileId);
    
    return this.compareData(oldData, newData);
  },
  
  /**
   * Bandingkan dua set data spreadsheet
   * @param {Object} oldData - Data sheet lama { sheetName: [[{address, value, formula}]] }
   * @param {Object} newData - Data sheet baru
   * @returns {Object} Hasil diff lengkap
   */
  compareData: function(oldData, newData) {
    var result = {
      summary: {
        totalChanges: 0,
        cellsModified: 0,
        cellsAdded: 0,
        cellsRemoved: 0,
        sheetsAdded: [],
        sheetsRemoved: [],
        sheetsModified: []
      },
      sheets: {},
      changes: [] // Flat array untuk CHANGE_LOG
    };
    
    var allSheetNames = this.getAllSheetNames_(oldData, newData);
    
    for (var i = 0; i < allSheetNames.length; i++) {
      var sheetName = allSheetNames[i];
      var oldSheet = oldData[sheetName] || [];
      var newSheet = newData[sheetName] || [];
      
      // Cek sheet baru/dihapus
      if (!oldData.hasOwnProperty(sheetName)) {
        result.summary.sheetsAdded.push(sheetName);
        result.sheets[sheetName] = {
          status: 'added',
          changes: this.getSheetAsAdditions_(newSheet, sheetName)
        };
        result.summary.totalChanges += result.sheets[sheetName].changes.length;
        result.summary.cellsAdded += result.sheets[sheetName].changes.length;
        result.changes = result.changes.concat(result.sheets[sheetName].changes);
        continue;
      }
      
      if (!newData.hasOwnProperty(sheetName)) {
        result.summary.sheetsRemoved.push(sheetName);
        result.sheets[sheetName] = {
          status: 'removed',
          changes: this.getSheetAsRemovals_(oldSheet, sheetName)
        };
        result.summary.totalChanges += result.sheets[sheetName].changes.length;
        result.summary.cellsRemoved += result.sheets[sheetName].changes.length;
        result.changes = result.changes.concat(result.sheets[sheetName].changes);
        continue;
      }
      
      // Bandingkan cell per cell
      var sheetDiff = this.compareSheets_(oldSheet, newSheet, sheetName);
      
      if (sheetDiff.length > 0) {
        result.summary.sheetsModified.push(sheetName);
        result.sheets[sheetName] = {
          status: 'modified',
          changes: sheetDiff
        };
        
        for (var j = 0; j < sheetDiff.length; j++) {
          result.summary.totalChanges++;
          switch (sheetDiff[j].change_type) {
            case 'Modified': result.summary.cellsModified++; break;
            case 'Added': result.summary.cellsAdded++; break;
            case 'Removed': result.summary.cellsRemoved++; break;
          }
        }
        
        result.changes = result.changes.concat(sheetDiff);
      } else {
        result.sheets[sheetName] = {
          status: 'unchanged',
          changes: []
        };
      }
    }
    
    return result;
  },
  
  /**
   * Bandingkan dua sheets cell per cell
   */
  compareSheets_: function(oldSheet, newSheet, sheetName) {
    var changes = [];
    var oldMap = this.sheetToMap_(oldSheet);
    var newMap = this.sheetToMap_(newSheet);
    
    // Cek semua cell di old dan new
    var allAddresses = {};
    
    for (var addr in oldMap) {
      allAddresses[addr] = true;
    }
    for (var addr in newMap) {
      allAddresses[addr] = true;
    }
    
    for (var address in allAddresses) {
      var oldCell = oldMap[address];
      var newCell = newMap[address];
      
      var oldValue = oldCell ? oldCell.value : '';
      var newValue = newCell ? newCell.value : '';
      var oldFormula = oldCell ? oldCell.formula : '';
      var newFormula = newCell ? newCell.formula : '';
      
      // Normalisasi - abaikan cell kosong yang sama
      if (this.isEmpty_(oldValue) && this.isEmpty_(newValue) && 
          this.isEmpty_(oldFormula) && this.isEmpty_(newFormula)) {
        continue;
      }
      
      // Tentukan display value (prioritaskan formula)
      var oldDisplay = oldFormula || oldValue;
      var newDisplay = newFormula || newValue;
      
      if (oldDisplay === newDisplay) continue;
      
      // Tentukan tipe perubahan
      var changeType = 'Modified';
      if (this.isEmpty_(oldDisplay) && !this.isEmpty_(newDisplay)) {
        changeType = 'Added';
      } else if (!this.isEmpty_(oldDisplay) && this.isEmpty_(newDisplay)) {
        changeType = 'Removed';
      }
      
      changes.push({
        sheet_name: sheetName,
        cell_address: address,
        old_value: oldDisplay,
        new_value: newDisplay,
        change_type: changeType,
        row: this.getRowFromAddress_(address),
        col: this.getColFromAddress_(address)
      });
    }
    
    // Sort by row then column
    changes.sort(function(a, b) {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
    
    return changes;
  },
  
  /**
   * Konversi sheet data ke map {address: cell}
   */
  sheetToMap_: function(sheetData) {
    var map = {};
    for (var r = 0; r < sheetData.length; r++) {
      for (var c = 0; c < sheetData[r].length; c++) {
        var cell = sheetData[r][c];
        if (cell && cell.address) {
          map[cell.address] = cell;
        }
      }
    }
    return map;
  },
  
  /**
   * Mendapatkan semua nama sheet dari kedua set data
   */
  getAllSheetNames_: function(oldData, newData) {
    var names = {};
    for (var name in oldData) names[name] = true;
    for (var name in newData) names[name] = true;
    return Object.keys(names);
  },
  
  /**
   * Tandai semua cell di sheet sebagai penambahan
   */
  getSheetAsAdditions_: function(sheetData, sheetName) {
    var changes = [];
    for (var r = 0; r < sheetData.length; r++) {
      for (var c = 0; c < sheetData[r].length; c++) {
        var cell = sheetData[r][c];
        var value = cell.formula || cell.value;
        if (!this.isEmpty_(value)) {
          changes.push({
            sheet_name: sheetName,
            cell_address: cell.address,
            old_value: '',
            new_value: value,
            change_type: 'Added',
            row: cell.row,
            col: cell.col
          });
        }
      }
    }
    return changes;
  },
  
  /**
   * Tandai semua cell di sheet sebagai penghapusan
   */
  getSheetAsRemovals_: function(sheetData, sheetName) {
    var changes = [];
    for (var r = 0; r < sheetData.length; r++) {
      for (var c = 0; c < sheetData[r].length; c++) {
        var cell = sheetData[r][c];
        var value = cell.formula || cell.value;
        if (!this.isEmpty_(value)) {
          changes.push({
            sheet_name: sheetName,
            cell_address: cell.address,
            old_value: value,
            new_value: '',
            change_type: 'Removed',
            row: cell.row,
            col: cell.col
          });
        }
      }
    }
    return changes;
  },
  
  /**
   * Cek apakah value kosong
   */
  isEmpty_: function(value) {
    return value === null || value === undefined || value.toString().trim() === '';
  },
  
  /**
   * Extract row number dari cell address (e.g., "B12" -> 12)
   */
  getRowFromAddress_: function(address) {
    var match = address.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  },
  
  /**
   * Extract column string dari cell address (e.g., "B12" -> "B")
   */
  getColFromAddress_: function(address) {
    var match = address.match(/[A-Z]+/);
    if (!match) return 0;
    var col = match[0];
    var num = 0;
    for (var i = 0; i < col.length; i++) {
      num = num * 26 + (col.charCodeAt(i) - 64);
    }
    return num;
  },
  
  /**
   * Format hasil diff untuk tampilan HTML
   * Mengelompokkan per sheet dengan context
   */
  formatDiffForDisplay: function(diffResult) {
    var display = {
      summary: diffResult.summary,
      sheetDiffs: []
    };
    
    for (var sheetName in diffResult.sheets) {
      var sheetInfo = diffResult.sheets[sheetName];
      
      if (sheetInfo.changes.length === 0 && sheetInfo.status === 'unchanged') {
        continue;
      }
      
      var sheetDiff = {
        name: sheetName,
        status: sheetInfo.status,
        changeCount: sheetInfo.changes.length,
        rows: []
      };
      
      for (var i = 0; i < sheetInfo.changes.length; i++) {
        var change = sheetInfo.changes[i];
        sheetDiff.rows.push({
          cell: change.cell_address,
          oldValue: change.old_value,
          newValue: change.new_value,
          type: change.change_type
        });
      }
      
      display.sheetDiffs.push(sheetDiff);
    }
    
    return display;
  },
  
  /**
   * Generate ringkasan perubahan dalam teks
   */
  generateChangeSummary: function(diffResult) {
    var parts = [];
    var s = diffResult.summary;
    
    parts.push(s.totalChanges + ' perubahan total');
    
    if (s.cellsModified > 0) parts.push(s.cellsModified + ' cell dimodifikasi');
    if (s.cellsAdded > 0) parts.push(s.cellsAdded + ' cell ditambahkan');
    if (s.cellsRemoved > 0) parts.push(s.cellsRemoved + ' cell dihapus');
    if (s.sheetsAdded.length > 0) parts.push('Sheet baru: ' + s.sheetsAdded.join(', '));
    if (s.sheetsRemoved.length > 0) parts.push('Sheet dihapus: ' + s.sheetsRemoved.join(', '));
    
    return parts.join('; ');
  }
};
