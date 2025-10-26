// Google Apps Script for KMRCL Metro Document Intelligence
// This script handles Google Drive integration for file management and search

// Configuration
const MAIN_FOLDER_ID = '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8'; // Your main Google Drive folder ID
const MAX_FILES_PER_REQUEST = 100;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

/**
 * Main entry point for all requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'test';
    
    switch (action) {
      case 'test':
        return handleTest(e);
      case 'listFiles':
        return handleListFiles(e);
      case 'listTree':
        return handleListTree(e);
      case 'downloadBase64':
        return handleDownloadFile(e);
      case 'search':
        return handleSearch(e);
      default:
        return createResponse({ 
          error: 'Invalid action', 
          availableActions: ['test', 'listFiles', 'listTree', 'downloadBase64', 'search']
        });
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    return createResponse({ 
      error: error.toString(),
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle test requests for connection verification
 */
function handleTest(e) {
  try {
    return createResponse({
      ok: true,
      message: 'KMRCL Google Apps Script is working!',
      timestamp: new Date().toISOString(),
      folderId: MAIN_FOLDER_ID,
      version: '2.0.0'
    });
  } catch (error) {
    console.error('Error in test:', error);
    return createResponse({ error: error.toString() });
  }
}

/**
 * Handle POST requests for file uploads
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return handleFileUpload(data);
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * List files in a specific folder
 */
function handleListFiles(e) {
  try {
    const folderId = e.parameter.folder || MAIN_FOLDER_ID;
    
    let query = `'${folderId}' in parents and trashed = false`;
    
    const files = [];
    let pageToken = null;
    
    do {
      const response = Drive.Files.list({
        q: query,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink)',
        pageSize: Math.min(MAX_FILES_PER_REQUEST, 1000),
        pageToken: pageToken,
        orderBy: 'name'
      });
      
      if (response.files) {
        response.files.forEach(file => {
          files.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size || '0',
            modifiedTime: file.modifiedTime,
            type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
            url: file.webViewLink
          });
        });
      }
      
      pageToken = response.nextPageToken;
    } while (pageToken && files.length < MAX_FILES_PER_REQUEST);
    
    return createResponse({ ok: true, files: files });
  } catch (error) {
    console.error('Error listing files:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * List folder tree structure
 */
function handleListTree(e) {
  try {
    const folders = [];
    
    // Get all folders recursively
    function getFolders(parentId, depth = 0) {
      if (depth > 3) return; // Limit recursion depth
      
      const query = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      
      const response = Drive.Files.list({
        q: query,
        fields: 'files(id, name)',
        pageSize: 100
      });
      
      if (response.files) {
        response.files.forEach(folder => {
          // Count files in this folder
          const fileCountQuery = `'${folder.id}' in parents and trashed = false`;
          const fileCountResponse = Drive.Files.list({
            q: fileCountQuery,
            fields: 'files(id)'
          });
          
          folders.push({
            id: folder.id,
            name: folder.name,
            count: fileCountResponse.files ? fileCountResponse.files.length : 0
          });
          
          // Recursively get subfolders
          getFolders(folder.id, depth + 1);
        });
      }
    }
    
    getFolders(MAIN_FOLDER_ID);
    
    return createResponse({ ok: true, folders: folders });
  } catch (error) {
    console.error('Error listing folders:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Download file content as base64
 */
function handleDownloadFile(e) {
  try {
    const fileId = e.parameter.fileId;
    
    if (!fileId) {
      return createResponse({ error: 'File ID is required' }, 400);
    }
    
    // Get file metadata
    const file = Drive.Files.get(fileId);
    
    if (!file) {
      return createResponse({ error: 'File not found' }, 404);
    }
    
    // Check file size
    if (file.size && parseInt(file.size) > MAX_FILE_SIZE) {
      return createResponse({ error: 'File too large' }, 413);
    }
    
    let content = '';
    let base64 = '';
    
    try {
      // Try to get file content
      const blob = DriveApp.getFileById(fileId).getBlob();
      
      if (isTextFile(file.mimeType)) {
        // For text files, return as text
        content = blob.getDataAsString();
      } else {
        // For binary files, return as base64
        base64 = Utilities.base64Encode(blob.getBytes());
      }
      
      return createResponse({
        ok: true,
        file: {
          id: fileId,
          name: file.name,
          mimeType: file.mimeType,
          content: content,
          base64: base64
        }
      });
    } catch (downloadError) {
      console.error('Error downloading file content:', downloadError);
      return createResponse({ error: 'Failed to download file content' }, 500);
    }
  } catch (error) {
    console.error('Error in handleDownloadFile:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Upload file to Google Drive
 */
function handleFileUpload(data) {
  try {
    if (!data.name || !data.data) {
      return createResponse({ error: 'File name and data are required' }, 400);
    }
    
    // Decode base64 data
    const bytes = Utilities.base64Decode(data.data);
    const blob = Utilities.newBlob(bytes, data.mimeType || 'application/octet-stream', data.name);
    
    // Determine target folder
    let targetFolderId = MAIN_FOLDER_ID;
    
    if (data.relativePath) {
      targetFolderId = createFolderPath(data.relativePath);
    }
    
    // Create file in Drive
    const file = Drive.Files.create({
      name: data.name,
      parents: [targetFolderId]
    }, blob);
    
    // Add metadata if provided
    if (data.system || data.subsystem) {
      try {
        // Store metadata in file description
        const metadata = {
          system: data.system || '',
          subsystem: data.subsystem || '',
          uploadedAt: new Date().toISOString()
        };
        
        Drive.Files.update({
          description: JSON.stringify(metadata)
        }, file.id);
      } catch (metaError) {
        console.warn('Failed to add metadata:', metaError);
      }
    }
    
    return createResponse({
      success: true,
      fileId: file.id,
      name: file.name,
      url: `https://drive.google.com/file/d/${file.id}/view`
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Search files in Drive
 */
function handleSearch(e) {
  try {
    const keyword = e.parameter.keyword || '';
    const system = e.parameter.system || '';
    const subsystem = e.parameter.subsystem || '';
    
    let query = `'${MAIN_FOLDER_ID}' in parents and trashed = false`;
    
    if (keyword) {
      query += ` and (name contains '${keyword}' or fullText contains '${keyword}')`;
    }
    
    const files = [];
    let pageToken = null;
    
    do {
      const response = Drive.Files.list({
        q: query,
        fields: 'nextPageToken, files(id, name, mimeType, description, webViewLink)',
        pageSize: 100,
        pageToken: pageToken
      });
      
      if (response.files) {
        response.files.forEach(file => {
          let metadata = {};
          try {
            if (file.description) {
              metadata = JSON.parse(file.description);
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
          
          // Filter by system/subsystem if provided
          if (system && metadata.system && !metadata.system.toLowerCase().includes(system.toLowerCase())) {
            return;
          }
          if (subsystem && metadata.subsystem && !metadata.subsystem.toLowerCase().includes(subsystem.toLowerCase())) {
            return;
          }
          
          files.push({
            FileID: file.id,
            FileName: file.name,
            System: metadata.system || 'Unknown',
            Subsystem: metadata.subsystem || 'Unknown',
            OCRText: `File: ${file.name} - ${metadata.system || ''} ${metadata.subsystem || ''}`,
            Url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`
          });
        });
      }
      
      pageToken = response.nextPageToken;
    } while (pageToken && files.length < 50);
    
    return createResponse({ ok: true, results: files });
  } catch (error) {
    console.error('Error searching files:', error);
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Create folder path recursively
 */
function createFolderPath(relativePath) {
  const pathParts = relativePath.split('/').filter(part => part.trim() !== '');
  let currentFolderId = MAIN_FOLDER_ID;
  
  for (const folderName of pathParts) {
    // Check if folder exists
    const query = `'${currentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const existing = Drive.Files.list({ q: query, fields: 'files(id)' });
    
    if (existing.files && existing.files.length > 0) {
      currentFolderId = existing.files[0].id;
    } else {
      // Create new folder
      const folder = Drive.Files.create({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [currentFolderId]
      });
      currentFolderId = folder.id;
    }
  }
  
  return currentFolderId;
}

/**
 * Check if file is a text file
 */
function isTextFile(mimeType) {
  const textTypes = [
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
    'text/html'
  ];
  
  return textTypes.includes(mimeType) || mimeType.startsWith('text/');
}

/**
 * Create standardized response with proper CORS headers
 */
function createResponse(data, status = 200) {
  const response = ContentService.createTextOutput(JSON.stringify(data));
  response.setMimeType(ContentService.MimeType.JSON);
  
  // Add comprehensive CORS headers for all origins
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  return response;
}

/**
 * Test function to verify the script is working
 */
function testScript() {
  console.log('KMRCL Google Apps Script is working!');
  
  // Test listing files
  const testFiles = handleListFiles({ parameter: {} });
  console.log('Test files result:', testFiles.getContent());
  
  return 'Script test completed successfully';
}