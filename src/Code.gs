/**
 * ============================================================
 *  DOCENTRA - Document Control System
 *  Code.gs - Entry Point & Server Functions
 *  
 *  PT Indofood CBP Sukses Makmur Tbk
 *  Divisi Noodle - Pabrik Mi
 *  
 *  Mendukung 2 mode:
 *  1. GAS Native WebApp (google.script.run)
 *  2. API Mode via doGet/doPost (untuk GitHub Pages frontend)
 * ============================================================
 */

/**
 * Entry point: Tampilkan WebApp ATAU handle API request
 */
function doGet(e) {
  // Cek apakah ini API request
  if (e && e.parameter && e.parameter.action) {
    return handleApiRequest(e.parameter);
  }
  
  // Cek apakah sistem sudah dikonfigurasi
  if (!isSystemConfigured()) {
    return HtmlService.createHtmlOutputFromFile('SetupPage')
      .setTitle('DOCENTRA - Setup')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'dashboard';
  
  var html = HtmlService.createTemplateFromFile('Index');
  html.page = page;
  html.params = e ? e.parameter : {};
  
  return html.evaluate()
    .setTitle('DOCENTRA - Document Control System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Handle POST requests (untuk API mode - upload file, dll)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Autentikasi via token
    var token = data.token || '';
    var email = Auth.validateToken(token);
    
    // Khusus login/register tidak perlu token
    if (data.action === 'login') {
      var result = Auth.login(data.email || '', data.password || '');
      return jsonResponse(result);
    }
    
    if (data.action === 'register') {
      var result = Auth.registerUser(data.email || '', data.password || '', data.name || '');
      return jsonResponse(result);
    }
    
    // Semua action lain butuh autentikasi
    if (!email) {
      return jsonResponse({ success: false, message: 'Token tidak valid. Silakan login ulang.' });
    }
    
    // Set user context
    setApiUserEmail(email);
    
    // Route actions
    switch (data.action) {
      case 'createDocument':
        return jsonResponse(DocumentController.createDocument(data.data || {}));
      
      case 'updateDocument':
        return jsonResponse(DocumentController.updateDocument(data.docId, data.updates || {}));
      
      case 'changeStatus':
        return jsonResponse(DocumentController.changeStatus(data.docId, data.newStatus));
      
      case 'uploadInitialVersion':
        var blob1 = Utilities.newBlob(
          Utilities.base64Decode(data.fileData),
          'application/octet-stream',
          data.fileName
        );
        return jsonResponse(VersionController.uploadInitialVersion(data.docId, blob1, data.initialVersion || '1.0'));
      
      case 'uploadNewVersion':
        var blob2 = Utilities.newBlob(
          Utilities.base64Decode(data.fileData),
          'application/octet-stream',
          data.fileName
        );
        return jsonResponse(VersionController.uploadNewVersion(data.docId, blob2, data.changeSummary || ''));
      
      case 'addUser':
        if (!Auth.isAdmin()) {
          return jsonResponse({ success: false, message: 'Akses ditolak' });
        }
        return jsonResponse(Database.addUser(data.userData || {}));
      
      case 'updateUser':
        if (!Auth.isAdmin()) {
          return jsonResponse({ success: false, message: 'Akses ditolak' });
        }
        var result = Database.updateUser(data.email, data.updates || {});
        return jsonResponse({ success: result, message: result ? 'User berhasil diupdate' : 'User tidak ditemukan' });
      
      default:
        return jsonResponse({ success: false, message: 'Action tidak dikenal: ' + data.action });
    }
    
  } catch (error) {
    return jsonResponse({ success: false, message: error.message });
  }
}

/**
 * Handle API GET requests
 */
function handleApiRequest(params) {
  try {
    var action = params.action;
    var token = params.token || '';
    
    // Public actions (no auth needed)
    if (action === 'ping') {
      return jsonResponse({ success: true, message: 'DOCENTRA API is running', version: CONFIG.APP_VERSION });
    }
    
    if (action === 'getConfig') {
      return jsonResponse({
        success: true,
        categories: CONFIG.CATEGORIES,
        departments: CONFIG.DEPARTMENTS,
        statuses: CONFIG.STATUS,
        roles: CONFIG.ROLES,
        appName: CONFIG.APP_NAME,
        company: CONFIG.COMPANY,
        colors: CONFIG.COLORS
      });
    }
    
    // Login action
    if (action === 'login') {
      var result = Auth.login(params.email || '', params.password || '');
      return jsonResponse(result);
    }
    
    // Protected actions (need token)
    var email = Auth.validateToken(token);
    if (!email) {
      return jsonResponse({ success: false, message: 'Token tidak valid. Silakan login ulang.' });
    }
    
    // Set user context
    setApiUserEmail(email);
    
    switch (action) {
      case 'getDashboard':
        return jsonResponse(DocumentController.getDashboard());
      
      case 'getDocuments':
        var filters = {};
        if (params.status) filters.status = params.status;
        if (params.category) filters.category = params.category;
        if (params.department) filters.department = params.department;
        if (params.search) filters.search = params.search;
        return jsonResponse(DocumentController.getDocuments(Object.keys(filters).length > 0 ? filters : null));
      
      case 'getDocumentDetail':
        return jsonResponse(DocumentController.getDocumentDetail(params.docId));
      
      case 'compareVersions':
        return jsonResponse(VersionController.compareVersions(params.docId, params.versionOld, params.versionNew));
      
      case 'getVersionChanges':
        return jsonResponse(VersionController.getVersionChanges(params.docId, params.version));
      
      case 'getFileUrl':
        return jsonResponse(VersionController.getFileDownloadUrl(params.fileId));
      
      case 'getCurrentUser':
        return jsonResponse({ success: true, user: Auth.getUserInfo() });
      
      case 'getAllUsers':
        if (!Auth.isAdmin()) {
          return jsonResponse({ success: false, message: 'Akses ditolak' });
        }
        return jsonResponse({ success: true, users: Database.getAllUsers() });
      
      case 'searchDocuments':
        var docs = Database.searchDocuments(params.query || '');
        return jsonResponse({ success: true, documents: docs });
      
      default:
        return jsonResponse({ success: false, message: 'Action tidak dikenal: ' + action });
    }
    
  } catch (error) {
    return jsonResponse({ success: false, message: error.message });
  }
}

/**
 * JSON Response helper
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Include file HTML (untuk modularisasi template)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =============================================
//  SERVER FUNCTIONS (dipanggil dari client via google.script.run)
//  Tetap dipertahankan untuk kompatibilitas GAS native
// =============================================

function serverInitialSetup() {
  return initialSetup();
}

function serverGetDashboard() {
  return DocumentController.getDashboard();
}

function serverGetDocuments(filters) {
  return DocumentController.getDocuments(filters);
}

function serverGetDocumentDetail(docId) {
  return DocumentController.getDocumentDetail(docId);
}

function serverCreateDocument(data) {
  return DocumentController.createDocument(data);
}

function serverUpdateDocument(docId, updates) {
  return DocumentController.updateDocument(docId, updates);
}

function serverChangeStatus(docId, newStatus) {
  return DocumentController.changeStatus(docId, newStatus);
}

function serverUploadInitialVersion(docId, fileData, fileName, initialVersion) {
  var blob = Utilities.newBlob(
    Utilities.base64Decode(fileData),
    'application/octet-stream',
    fileName
  );
  return VersionController.uploadInitialVersion(docId, blob, initialVersion || '1.0');
}

function serverUploadNewVersion(docId, fileData, fileName, changeSummary) {
  var blob = Utilities.newBlob(
    Utilities.base64Decode(fileData),
    'application/octet-stream',
    fileName
  );
  return VersionController.uploadNewVersion(docId, blob, changeSummary);
}

function serverCompareVersions(docId, versionOld, versionNew) {
  return VersionController.compareVersions(docId, versionOld, versionNew);
}

function serverGetVersionChanges(docId, version) {
  return VersionController.getVersionChanges(docId, version);
}

function serverGetFileUrl(fileId) {
  return VersionController.getFileDownloadUrl(fileId);
}

function serverGetCurrentUser() {
  return Auth.getUserInfo();
}

function serverGetAllUsers() {
  if (!Auth.isAdmin()) {
    return { success: false, message: 'Akses ditolak' };
  }
  return { success: true, users: Database.getAllUsers() };
}

function serverAddUser(userData) {
  if (!Auth.isAdmin()) {
    return { success: false, message: 'Akses ditolak' };
  }
  return Database.addUser(userData);
}

function serverUpdateUser(email, updates) {
  if (!Auth.isAdmin()) {
    return { success: false, message: 'Akses ditolak' };
  }
  var result = Database.updateUser(email, updates);
  return { success: result, message: result ? 'User berhasil diupdate' : 'User tidak ditemukan' };
}

function serverSearchDocuments(query) {
  var docs = Database.searchDocuments(query);
  return { success: true, documents: docs };
}

function serverGetConfig() {
  return {
    categories: CONFIG.CATEGORIES,
    departments: CONFIG.DEPARTMENTS,
    statuses: CONFIG.STATUS,
    roles: CONFIG.ROLES,
    appName: CONFIG.APP_NAME,
    company: CONFIG.COMPANY,
    colors: CONFIG.COLORS
  };
}
