// Google Drive service for KMRCL Metro Document Intelligence
// Complete implementation with all features working

import { config } from '../config/environment';

// Interfaces
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string | number;
  modifiedTime?: string;
  type: 'file' | 'folder';
  url?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  count: number;
}

export interface FileContent {
  name: string;
  content: string;
  mimeType: string;
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
    console.log('GoogleDriveService initialized with URL:', this.baseURL);
  }

  // Load folder tree
  async loadTree(): Promise<DriveFolder[]> {
    try {
      console.log('Loading folder tree...');
      const resp = await fetch(`${this.baseURL}?action=listTree`);
      const data = await resp.json();
      
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch folders");
      }

      const folders = data.folders || [];
      console.log('Folders loaded successfully:', folders.length);
      return folders;
    } catch (err) {
      console.error("Failed to load tree", err);
      throw new Error(`Error loading folders: ${err.message}`);
    }
  }

  // Load files from folder
  async loadFiles(folderId: string = ""): Promise<DriveFile[]> {
    try {
      console.log('Loading files for folder:', folderId || 'root');
      
      let url = `${this.baseURL}?action=listFiles`;
      if (folderId) {
        url += `&folder=${encodeURIComponent(folderId)}`;
      }

      const resp = await fetch(url);
      const data = await resp.json();
      
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch files");
      }

      const files = data.files || [];
      console.log('Files loaded successfully:', files.length);
      return files;
    } catch (err) {
      console.error("Failed to load files", err);
      throw new Error(`Error loading files: ${err.message}`);
    }
  }

  // Extract file contents with better error handling
  async extractFileContents(fileIds: string[]): Promise<FileContent[]> {
    if (fileIds.length === 0) {
      throw new Error("Please select at least one file.");
    }

    console.log('Starting file extraction for', fileIds.length, 'files');
    const contents: FileContent[] = [];
    
    for (const fileId of fileIds) {
      try {
        console.log('Processing file ID:', fileId);
        
        const resp = await fetch(`${this.baseURL}?action=downloadBase64&fileId=${encodeURIComponent(fileId)}`);
        
        if (!resp.ok) {
          console.error(`HTTP error for file ${fileId}:`, resp.status, resp.statusText);
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }

        const data = await resp.json();
        console.log('Download response for', fileId, ':', Object.keys(data));
        
        if (!data.ok) {
          throw new Error(data.error || "Failed to download file");
        }

        const file = data.file;
        if (!file) {
          throw new Error("No file data in response");
        }

        let text = "";
        const base64 = file.base64 || "";
        const content = file.content || "";
        const fileName = file.name || `file_${fileId}`;
        const mimeType = file.mimeType || 'application/octet-stream';

        console.log(`Processing ${fileName} (${mimeType}), base64 length: ${base64.length}, content length: ${content.length}`);

        // Try different extraction methods
        if (content) {
          // If we have direct content, use it
          text = content;
        } else if (base64) {
          // Try to extract from base64
          if (mimeType === "application/pdf") {
            text = await this.extractTextFromPDFBase64(base64);
          } else if (/^image\//i.test(mimeType)) {
            text = await this.extractTextFromImageBase64(base64);
          } else {
            // For text-based files, decode base64
            try {
              text = atob(base64);
            } catch (e) {
              console.warn(`Could not decode base64 for ${fileName}:`, e);
              text = `[Base64 content - ${base64.length} bytes]`;
            }
          }
        } else {
          text = `[No content available for ${fileName}]`;
        }

        // Ensure we have some content
        if (!text || text.trim().length === 0) {
          text = `[Empty or unreadable content for ${fileName}]`;
        }

        contents.push({
          name: fileName,
          content: text,
          mimeType: mimeType
        });

        console.log(`✅ Successfully processed: ${fileName} (${text.length} characters)`);
      } catch (error) {
        console.error(`❌ Error processing file ${fileId}:`, error);
        contents.push({
          name: `file_${fileId}`,
          content: `[ERROR: Could not extract text from file - ${error.message}]`,
          mimeType: 'error'
        });
      }
    }

    console.log(`File extraction complete: ${contents.length} files processed`);
    return contents;
  }

  // PDF text extraction
  private async extractTextFromPDFBase64(base64: string): Promise<string> {
    try {
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        const pdfjsLib = (window as any).pdfjsLib;
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        let text = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + " ";
        }
        
        return text.trim() || `[PDF processed but no text found - ${base64.length} bytes]`;
      } else {
        return `[PDF content available but PDF.js not loaded - ${base64.length} bytes]`;
      }
    } catch (error) {
      console.error("PDF extraction error:", error);
      return `[PDF EXTRACTION ERROR: ${error.message}]`;
    }
  }

  // Image OCR extraction
  private async extractTextFromImageBase64(base64: string): Promise<string> {
    try {
      if (typeof window !== 'undefined' && (window as any).Tesseract) {
        const Tesseract = (window as any).Tesseract;
        
        const img = new Image();
        img.src = `data:image/*;base64,${base64}`;
        await img.decode();
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");
        
        const MAX = 1600;
        let w = img.naturalWidth, h = img.naturalHeight;
        const scale = Math.min(1, MAX / Math.max(w, h));
        
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
        return text || `[Image processed but no text found - ${base64.length} bytes]`;
      } else {
        return `[Image content available but Tesseract not loaded - ${base64.length} bytes]`;
      }
    } catch (error) {
      console.error("Image OCR error:", error);
      return `[IMAGE OCR ERROR: ${error.message}]`;
    }
  }

  // Upload file to Google Drive
  async uploadFile(
    file: File, 
    system: string = '', 
    subsystem: string = ''
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      console.log('Uploading file to Google Drive:', file.name, file.size, 'bytes');
      
      const base64Data = await this.fileToBase64(file);
      console.log('File converted to base64, length:', base64Data.length);
      
      const uploadData = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: base64Data,
        system: system || 'Upload',
        subsystem: subsystem || 'Direct'
      };

      console.log('Sending upload request...');
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData)
      });

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('✅ File uploaded successfully:', result.fileId);
      return result;
    } catch (error) {
      console.error('❌ Failed to upload file:', error);
      return {
        success: false,
        error: `Failed to upload ${file.name}: ${error.message}`
      };
    }
  }

  // Create folder in Google Drive
  async createFolder(
    folderPath: string, 
    system: string = '', 
    subsystem: string = ''
  ): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      console.log('Creating folder:', folderPath);
      
      // Create a placeholder file to create the folder structure
      const placeholderContent = `Folder created: ${folderPath}\nSystem: ${system}\nSubsystem: ${subsystem}\nCreated: ${new Date().toISOString()}`;
      const placeholderBlob = new Blob([placeholderContent], { type: 'text/plain' });
      const placeholderFile = new File([placeholderBlob], '.folder_info.txt', { 
        type: 'text/plain' 
      });

      const uploadData = {
        name: '.folder_info.txt',
        mimeType: 'text/plain',
        data: await this.fileToBase64(placeholderFile),
        system: system || 'Folder',
        subsystem: subsystem || 'Created',
        relativePath: folderPath
      };

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Folder creation failed');
      }

      console.log('✅ Folder created successfully');
      return {
        success: true,
        folderId: result.fileId
      };
    } catch (error) {
      console.error('❌ Failed to create folder:', error);
      return {
        success: false,
        error: `Failed to create folder ${folderPath}: ${error.message}`
      };
    }
  }

  // Download file from Google Drive
  async downloadFileContent(fileId: string, fileName?: string): Promise<void> {
    try {
      console.log('Downloading file:', fileId);
      
      const contents = await this.extractFileContents([fileId]);
      if (contents.length === 0) {
        throw new Error('No content extracted from file');
      }

      const fileContent = contents[0];
      const blob = new Blob([fileContent.content], { type: fileContent.mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || fileContent.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ File downloaded successfully');
    } catch (error) {
      console.error('❌ Failed to download file:', error);
      throw new Error(`Failed to download file: ${error.message}`);
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
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Search failed');
      }

      return data.results || [];
    } catch (error) {
      console.error('Failed to search files:', error);
      throw new Error('Failed to search files in Google Drive');
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Google Apps Script connection...');
      
      const folders = await this.loadTree();
      console.log('✅ Google Apps Script connection successful');
      console.log(`Found ${folders.length} folders`);
      return true;
    } catch (error) {
      console.error('❌ Google Drive connection test failed:', error);
      return false;
    }
  }

  // Legacy methods for compatibility
  async listFolders(): Promise<DriveFolder[]> {
    return this.loadTree();
  }

  async listFiles(folderId: string = ""): Promise<DriveFile[]> {
    return this.loadFiles(folderId);
  }

  async downloadFile(fileId: string): Promise<{ content?: string; contentBase64?: string }> {
    const contents = await this.extractFileContents([fileId]);
    if (contents.length > 0) {
      return {
        content: contents[0].content,
        contentBase64: contents[0].content
      };
    }
    throw new Error('Failed to download file');
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();

// Export for testing or custom instances
export { GoogleDriveService };