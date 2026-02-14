/**
 * ============================================================
 *  DOCENTRA - Document Control System
 *  DocumentController.gs - Pengelolaan Dokumen
 * ============================================================
 */

var DocumentController = {
  
  /**
   * Buat dokumen baru
   */
  createDocument: function(data) {
    try {
      // Validasi akses
      Auth.authorize(CONFIG.ROLES.STAFF, 'membuat dokumen baru');
      
      // Validasi input
      if (!data.title || data.title.trim() === '') {
        return { success: false, message: 'Judul dokumen wajib diisi' };
      }
      if (!data.doc_number || data.doc_number.trim() === '') {
        return { success: false, message: 'Nomor dokumen wajib diisi' };
      }
      
      // Buat folder di Drive
      var folder = DriveManager.createDocumentFolder(data.doc_number);
      
      // Simpan ke database
      var docId = Database.addDocument({
        doc_number: data.doc_number,
        title: data.title,
        category: data.category || '',
        department: data.department || '',
        folder_id: folder.getId()
      });
      
      return {
        success: true,
        message: 'Dokumen berhasil dibuat',
        doc_id: docId,
        folder_id: folder.getId()
      };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Update info dokumen
   */
  updateDocument: function(docId, updates) {
    try {
      var doc = Database.getDocumentById(docId);
      if (!doc) {
        return { success: false, message: 'Dokumen tidak ditemukan' };
      }
      
      // Cek apakah bisa diedit
      if (!Auth.canEditDocument(doc)) {
        return { success: false, message: 'Dokumen Approved tidak bisa diedit langsung. Upload versi baru.' };
      }
      
      Database.updateDocument(docId, updates);
      
      return { success: true, message: 'Dokumen berhasil diupdate' };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Mendapatkan detail dokumen lengkap
   */
  getDocumentDetail: function(docId) {
    try {
      var doc = Database.getDocumentById(docId);
      if (!doc) {
        return { success: false, message: 'Dokumen tidak ditemukan' };
      }
      
      var versions = Database.getVersionHistory(docId);
      var userInfo = Auth.getUserInfo();
      
      return {
        success: true,
        document: doc,
        versions: versions,
        user: userInfo,
        canEdit: Auth.canEditDocument(doc),
        canApprove: Auth.canApprove(),
        canReview: Auth.canReview()
      };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Ubah status dokumen
   */
  changeStatus: function(docId, newStatus) {
    try {
      var doc = Database.getDocumentById(docId);
      if (!doc) {
        return { success: false, message: 'Dokumen tidak ditemukan' };
      }
      
      // Validasi transisi status
      var validTransitions = {};
      validTransitions[CONFIG.STATUS.DRAFT] = [CONFIG.STATUS.REVIEW, CONFIG.STATUS.OBSOLETE];
      validTransitions[CONFIG.STATUS.REVIEW] = [CONFIG.STATUS.APPROVED, CONFIG.STATUS.DRAFT, CONFIG.STATUS.OBSOLETE];
      validTransitions[CONFIG.STATUS.APPROVED] = [CONFIG.STATUS.OBSOLETE];
      validTransitions[CONFIG.STATUS.OBSOLETE] = [CONFIG.STATUS.DRAFT];
      
      var allowed = validTransitions[doc.status] || [];
      if (allowed.indexOf(newStatus) === -1) {
        return { 
          success: false, 
          message: 'Transisi dari ' + doc.status + ' ke ' + newStatus + ' tidak diizinkan' 
        };
      }
      
      // Cek izin berdasarkan status tujuan
      if (newStatus === CONFIG.STATUS.REVIEW) {
        Auth.authorize(CONFIG.ROLES.STAFF, 'submit untuk review');
      } else if (newStatus === CONFIG.STATUS.APPROVED) {
        Auth.authorize(CONFIG.ROLES.MANAGER, 'approve dokumen');
      } else if (newStatus === CONFIG.STATUS.OBSOLETE) {
        Auth.authorize(CONFIG.ROLES.SUPERVISOR, 'set obsolete');
      }
      
      Database.updateDocument(docId, { status: newStatus });
      
      return { success: true, message: 'Status berhasil diubah ke ' + newStatus };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Mendapatkan daftar dokumen dengan filter
   */
  getDocuments: function(filters) {
    try {
      var docs = Database.getAllDocuments();
      
      if (filters) {
        if (filters.status) {
          docs = docs.filter(function(d) { return d.status === filters.status; });
        }
        if (filters.department) {
          docs = docs.filter(function(d) { return d.department === filters.department; });
        }
        if (filters.category) {
          docs = docs.filter(function(d) { return d.category === filters.category; });
        }
        if (filters.search) {
          var q = filters.search.toLowerCase();
          docs = docs.filter(function(d) {
            return d.doc_id.toLowerCase().indexOf(q) > -1 ||
                   d.doc_number.toLowerCase().indexOf(q) > -1 ||
                   d.title.toLowerCase().indexOf(q) > -1;
          });
        }
      }
      
      return { success: true, documents: docs };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Mendapatkan dashboard stats
   */
  getDashboard: function() {
    try {
      var stats = Database.getDashboardStats();
      var userInfo = Auth.getUserInfo();
      
      return {
        success: true,
        stats: stats,
        user: userInfo,
        categories: CONFIG.CATEGORIES,
        departments: CONFIG.DEPARTMENTS
      };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};
