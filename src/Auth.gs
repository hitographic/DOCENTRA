/**
 * ============================================================
 *  DOCENTRA - Document Control System
 *  Auth.gs - Autentikasi & Role-Based Access Control
 *  
 *  Mendukung 2 mode:
 *  1. GAS Native (google.script.run) - gunakan Session email
 *  2. API Mode (GitHub Pages) - gunakan token dari request
 * ============================================================
 */

// Variable global untuk menyimpan email dari API request
var _apiUserEmail = null;

/**
 * Set user email dari API request (dipanggil oleh doPost/doGet)
 */
function setApiUserEmail(email) {
  _apiUserEmail = email;
}

var Auth = {
  
  /**
   * Mendapatkan email user yang sedang aktif
   * Prioritas: 
   *   1. _apiUserEmail (dari API token)
   *   2. Session.getEffectiveUser() (owner script)
   *   3. Session.getActiveUser() (user yang akses)
   */
  getEmail_: function() {
    // Mode API: email di-set dari token
    if (_apiUserEmail) {
      return _apiUserEmail;
    }
    
    // Mode GAS Native: coba beberapa method
    var email = '';
    
    try {
      email = Session.getActiveUser().getEmail();
    } catch(e) {}
    
    // Fallback: getEffectiveUser (pemilik script, selalu berhasil)
    if (!email) {
      try {
        email = Session.getEffectiveUser().getEmail();
      } catch(e) {}
    }
    
    return email || '';
  },
  
  /**
   * Mendapatkan user yang sedang login
   */
  getCurrentUser: function() {
    var email = this.getEmail_();
    
    if (!email) {
      return null;
    }
    
    var user = Database.getUserByEmail(email);
    
    if (!user) {
      // Auto-register sebagai Staff jika belum terdaftar
      Database.addUser({
        email: email,
        name: email.split('@')[0],
        role: CONFIG.ROLES.STAFF,
        department: ''
      });
      user = Database.getUserByEmail(email);
    }
    
    return user;
  },
  
  /**
   * Cek apakah user memiliki role tertentu atau lebih tinggi
   */
  hasRole: function(requiredRole) {
    var user = this.getCurrentUser();
    if (!user || !user.is_active) return false;
    
    var roleHierarchy = {};
    roleHierarchy[CONFIG.ROLES.STAFF] = 1;
    roleHierarchy[CONFIG.ROLES.SUPERVISOR] = 2;
    roleHierarchy[CONFIG.ROLES.MANAGER] = 3;
    roleHierarchy[CONFIG.ROLES.ADMIN] = 4;
    
    var userLevel = roleHierarchy[user.role] || 0;
    var requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  },
  
  /**
   * Cek apakah user bisa upload (Staff ke atas)
   */
  canUpload: function() {
    return this.hasRole(CONFIG.ROLES.STAFF);
  },
  
  /**
   * Cek apakah user bisa review (Supervisor ke atas)
   */
  canReview: function() {
    return this.hasRole(CONFIG.ROLES.SUPERVISOR);
  },
  
  /**
   * Cek apakah user bisa approve (Manager ke atas)
   */
  canApprove: function() {
    return this.hasRole(CONFIG.ROLES.MANAGER);
  },
  
  /**
   * Cek apakah user admin
   */
  isAdmin: function() {
    return this.hasRole(CONFIG.ROLES.ADMIN);
  },
  
  /**
   * Cek apakah user bisa edit dokumen tertentu
   */
  canEditDocument: function(doc) {
    if (!doc) return false;
    
    // Approved documents tidak bisa diedit, harus upload versi baru
    if (doc.status === CONFIG.STATUS.APPROVED) return false;
    
    // Admin bisa edit semua
    if (this.isAdmin()) return true;
    
    // Staff dan Supervisor bisa edit Draft dan Review
    return this.canUpload();
  },
  
  /**
   * Cek apakah user bisa menghapus dokumen
   */
  canDelete: function() {
    return this.isAdmin();
  },
  
  /**
   * Mendapatkan info user untuk UI
   */
  getUserInfo: function() {
    var user = this.getCurrentUser();
    if (!user) {
      return {
        email: 'unknown',
        name: 'Unknown',
        role: 'None',
        permissions: {
          canUpload: false,
          canReview: false,
          canApprove: false,
          isAdmin: false
        }
      };
    }
    
    return {
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      permissions: {
        canUpload: this.canUpload(),
        canReview: this.canReview(),
        canApprove: this.canApprove(),
        isAdmin: this.isAdmin()
      }
    };
  },
  
  /**
   * Authorize action - throw error jika tidak diizinkan
   */
  authorize: function(requiredRole, action) {
    if (!this.hasRole(requiredRole)) {
      throw new Error('Akses ditolak: Anda tidak memiliki izin untuk ' + action + 
                       '. Diperlukan role: ' + requiredRole);
    }
    return true;
  },
  
  /**
   * Validasi API token (untuk mode GitHub Pages)
   * Token = base64(email:password)
   * Password disimpan di USERS sheet kolom ke-7 (password_hash)
   */
  validateToken: function(token) {
    try {
      if (!token) return null;
      
      var decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
      var parts = decoded.split(':');
      if (parts.length < 2) return null;
      
      var email = parts[0];
      var password = parts.slice(1).join(':'); // password bisa mengandung ':'
      
      var user = Database.getUserByEmail(email);
      if (!user || !user.is_active) return null;
      
      // Cek password hash
      var expectedHash = Database.getUserPasswordHash(email);
      var inputHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
        .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); })
        .join('');
      
      if (expectedHash !== inputHash) return null;
      
      return email;
    } catch(e) {
      Logger.log('Token validation error: ' + e.message);
      return null;
    }
  },
  
  /**
   * Register user baru (untuk API mode)
   */
  registerUser: function(email, password, name) {
    // Cek apakah user sudah ada
    var existing = Database.getUserByEmail(email);
    if (existing) {
      return { success: false, message: 'Email sudah terdaftar' };
    }
    
    // Hash password
    var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
      .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); })
      .join('');
    
    // Tambah user
    Database.addUser({
      email: email,
      name: name || email.split('@')[0],
      role: CONFIG.ROLES.STAFF,
      department: '',
      password_hash: hash
    });
    
    return { success: true, message: 'Registrasi berhasil' };
  },
  
  /**
   * Login dan dapatkan token
   */
  login: function(email, password) {
    var user = Database.getUserByEmail(email);
    if (!user || !user.is_active) {
      return { success: false, message: 'Email tidak terdaftar atau akun nonaktif' };
    }
    
    // Cek password
    var expectedHash = Database.getUserPasswordHash(email);
    
    // Jika user belum punya password (migrated from old system), set password baru
    if (!expectedHash || expectedHash === '') {
      var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
        .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); })
        .join('');
      Database.setUserPasswordHash(email, hash);
      expectedHash = hash;
    }
    
    var inputHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
      .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); })
      .join('');
    
    if (expectedHash !== inputHash) {
      return { success: false, message: 'Password salah' };
    }
    
    // Generate token
    var token = Utilities.base64Encode(email + ':' + password);
    
    return {
      success: true,
      message: 'Login berhasil',
      token: token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        permissions: {
          canUpload: true,
          canReview: ['Supervisor', 'Manager', 'Admin'].indexOf(user.role) > -1,
          canApprove: ['Manager', 'Admin'].indexOf(user.role) > -1,
          isAdmin: user.role === 'Admin'
        }
      }
    };
  }
};
