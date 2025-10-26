// Google Drive service for KMRCL Metro Document Intelligence

import { DRIVE_ENDPOINTS, config } from '../config/environment';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  type: 'file' | 'folder';
  url?: string;
  selected?: boolean;
}

export interface DriveFolder {
  id: string;
  name: string;
  count: number;
}

export interface UploadFileData {
  name: string;
  mimeType: string;
  data: string; // base64 encoded
  system?: string;
  subsystem?: string;
  relativePath?: string;
}

export interface SearchResult {
  FileID: string;
  FileName: string;
  System: string;
  Subsystem: string;
  OCRText: string;
  Url: string;
}

class GoogleDriveService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.APP_SCRIPT_URL;
  }

  // Generic fetch wrapper with error handling for Apps Script
  private async fetchAppsScript<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`Google Drive API Error for ${url}:`, error);
      throw error;
    }
  }

  // Convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // List folders in Drive
  async listFolders(): Promise<DriveFolder[]> {
    try {
      const response = await this.fetchAppsScript<{ ok: boolean; folders: DriveFolder[] }>(
        DRIVE_ENDPOINTS.LIST_TREE
      );
      
      return response.folders || [];
    } catch (error) {
      console.error('Failed to list folders:', error);
      throw new Error('Failed to load folders from Google Drive');
    }
  }

  // List files in a specific folder
  async listFiles(folderId: string = config.MAIN_FOLDER_ID): Promise<DriveFile[]> {
    try {
      const url = `${DRIVE_ENDPOINTS.LIST_FILES}${folderId ? `&folder=${encodeURIComponent(folderId)}` : ''}`;
      const response = await this.fetchAppsScript<{ ok: boolean; files: DriveFile[] }>(url);
      
      return response.files || [];
    } catch (error) {
      console.error('Failed to list files:', error);
      throw new Error('Failed to load files from Google Drive');
    }
  }

  // Download file content as base64
  async downloadFile(fileId: string): Promise<{ content?: string; contentBase64?: string }> {
    try {
      const url = `${DRIVE_ENDPOINTS.DOWNLOAD_FILE}&fileId=${encodeURIComponent(fileId)}`;
      const response = await this.fetchAppsScript<{ 
        ok: boolean; 
        file: { base64?: string; content?: string } 
      }>(url);
      
      return {
        content: response.file.content,
        contentBase64: response.file.base64
      };
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  }

  // Upload file to Google Drive
  async uploadFile(
    file: File, 
    system: string = '', 
    subsystem: string = '', 
    relativePath: string = ''
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      const base64Data = await this.fileToBase64(file);
      
      const uploadData: UploadFileData = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: base64Data,
        system,
        subsystem,
        relativePath
      };

      const response = await this.fetchAppsScript<{ 
        success: boolean; 
        fileId?: string; 
        error?: string 
      }>(DRIVE_ENDPOINTS.UPLOAD_FILE, {
        method: 'POST',
        body: JSON.stringify(uploadData)
      });

      return response;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error(`Failed to upload ${file.name} to Google Drive`);
    }
  }

  // Upload multiple files
  async uploadFiles(
    files: File[], 
    system: string = '', 
    subsystem: string = '', 
    relativePath: string = ''
  ): Promise<Array<{ file: string; success: boolean; fileId?: string; error?: string }>> {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, system, subsystem, relativePath);
        results.push({
          file: file.name,
          success: result.success,
          fileId: result.fileId,
          error: result.error
        });
      } catch (error) {
        results.push({
          file: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  // Search files in Drive
  async searchFiles(
    keyword: string = '', 
    system: string = '', 
    subsystem: string = ''
  ): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams();
      params.append('action', 'search');
      if (keyword) params.append('keyword', keyword);
      if (system) params.append('system', system);
      if (subsystem) params.append('subsystem', subsystem);

      const url = `${this.baseURL}?${params.toString()}`;
      const response = await this.fetchAppsScript<{ 
        ok?: boolean; 
        results: SearchResult[];
        error?: string;
      }>(url);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.results || [];
    } catch (error) {
      console.error('Failed to search files:', error);
      throw new Error('Failed to search files in Google Drive');
    }
  }

  // Create folder by uploading a placeholder file
  async createFolder(
    folderPath: string, 
    system: string = '', 
    subsystem: string = ''
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create a placeholder file to create the folder structure
      const placeholderBlob = new Blob(['.'], { type: 'text/plain' });
      const placeholderFile = new File([placeholderBlob], '.folder_placeholder', { 
        type: 'text/plain' 
      });

      const result = await this.uploadFile(placeholderFile, system, subsystem, folderPath);
      return result;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw new Error(`Failed to create folder: ${folderPath}`);
    }
  }

  // Test connection to Google Apps Script
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Google Apps Script connection...');
      console.log('Apps Script URL:', this.baseURL);
      
      // First try the test endpoint
      const testUrl = `${this.baseURL}?action=test`;
      console.log('Testing URL:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('HTTP Error:', response.status, response.statusText);
        return false;
      }

      const data = await response.json();
      console.log('Test response:', data);

      if (data.ok && data.message) {
        console.log('✅ Google Apps Script connection successful');
        return true;
      } else {
        console.error('❌ Invalid response from Apps Script:', data);
        return false;
      }
    } catch (error) {
      console.error('❌ Google Drive connection test failed:', error);
      return false;
    }
  }

  // Get Drive root URL
  getDriveRootUrl(): string {
    return this.baseURL;
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();

// Export for testing or custom instances
export { GoogleDriveService };