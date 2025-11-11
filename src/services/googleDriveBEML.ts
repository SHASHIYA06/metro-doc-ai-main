/**
 * Google Drive Service for BEML Documents
 * Author: SHASHIKANT MISHRA
 * Specifically designed for BEML DOCUMENTS folder access and upload functionality
 */

import { config } from '../config/environment';

// Enhanced interfaces for BEML Documents
export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    type: 'file' | 'folder';
    size?: string | number;
    modifiedTime?: string;
    url?: string;
    webViewLink?: string;
    downloadUrl?: string;
    thumbnailLink?: string;
    parentId?: string;
    path?: string;
}

export interface DriveFolder {
    id: string;
    name: string;
    count: number;
    parentId?: string;
    path?: string;
    fullPath?: string;
}

export interface FileContent {
    name: string;
    content: string;
    mimeType: string;
    extractedText?: string;
    ocrText?: string;
}

export interface UploadResult {
    success: boolean;
    fileId?: string;
    error?: string;
    metadata?: any;
}

/**
 * Google Drive BEML Service Class
 * Designed specifically for BEML DOCUMENTS folder with enhanced functionality
 */
class GoogleDriveBEMLService {
    private baseURL: string;
    private sheetId: string;
    private bemlFolderId: string = 'BEML_DOCUMENTS';
    private isInitialized: boolean = false;
    private cache: Map<string, any> = new Map();

    constructor() {
        // Use your correct working Google Apps Script URL
        this.baseURL = 'https://script.google.com/macros/s/AKfycby6XbPuA7XDjIbInBg8-CmBv1Ig7hy5-BuKq6q4ovSJfbDxz3JdkyK08Y9pUI4S2CiZ7A/exec';
        this.sheetId = '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxI0xm8';
        
        console.log('🚀 GoogleDriveBEMLService initialized for BEML DOCUMENTS:');
        console.log('   📍 Apps Script URL:', this.baseURL);
        console.log('   📊 Sheet ID:', this.sheetId);
        console.log('   📁 Target Folder: BEML DOCUMENTS');
    }

    // Initialize the service
    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        
        try {
            console.log('🔧 Initializing BEML Documents Google Drive service...');
            
            // Test connection
            const isConnected = await this.testConnection();
            
            this.isInitialized = true;
            
            if (isConnected) {
                console.log('✅ BEML Documents Google Drive service initialized successfully');
            } else {
                console.warn('⚠️ Google Drive connection failed, using demo mode');
            }
        } catch (error) {
            console.error('❌ Failed to initialize BEML Documents Google Drive service:', error);
            this.isInitialized = true; // Continue with demo mode
        }
    }

    // Test connection
    async testConnection(): Promise<boolean> {
        try {
            console.log('🔧 Testing BEML DOCUMENTS Google Apps Script connection...');
            
            const testUrl = `${this.baseURL}?action=listTree&sheetId=${this.sheetId}&timestamp=${Date.now()}`;
            console.log('🔗 Testing BEML URL:', testUrl);

            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            console.log('📡 Response status:', response.status);

            if (response.ok) {
                const responseText = await response.text();
                console.log('📄 Response preview:', responseText.substring(0, 200));
                
                try {
                    const data = JSON.parse(responseText);
                    if (data.folders && Array.isArray(data.folders)) {
                        console.log(`✅ BEML connection successful - found ${data.folders.length} folders`);
                        this.cache.set('beml_folders', data.folders);
                        return true;
                    }
                } catch (parseError) {
                    console.warn('⚠️ Response parsing issue, but connection established');
                }
                
                return true;
            } else {
                console.warn(`⚠️ Connection test failed: HTTP ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error('❌ BEML connection test failed:', error);
            return false;
        }
    }

    // Load folder tree
    async loadTree(): Promise<DriveFolder[]> {
        console.log('📁 Loading BEML folder tree...');
        
        try {
            const folders = await this.loadAllFolders();
            return folders;
        } catch (err) {
            console.error("❌ Failed to load BEML folder tree:", err);
            return this.getBEMLDemoFolders();
        }
    }

    // Load all folders
    private async loadAllFolders(): Promise<DriveFolder[]> {
        const cacheKey = `beml_folders_${this.sheetId}`;
        if (this.cache.has(cacheKey)) {
            console.log('⚡ Using cached folder data');
            return this.cache.get(cacheKey);
        }

        try {
            const url = `${this.baseURL}?action=listTree&sheetId=${this.sheetId}&timestamp=${Date.now()}`;
            
            const resp = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!resp.ok) {
                return this.getBEMLDemoFolders();
            }

            const responseText = await resp.text();
            const data = JSON.parse(responseText);

            if (data.folders && Array.isArray(data.folders)) {
                const folders = data.folders.map((folder: any) => ({
                    id: folder.id || `folder_${Date.now()}`,
                    name: folder.name || 'Unknown Folder',
                    count: folder.count || 0,
                    parentId: folder.parentId,
                    path: folder.path,
                    fullPath: folder.fullPath || folder.path || folder.name
                }));

                this.cache.set(cacheKey, folders);
                return folders;
            }
        } catch (err) {
            console.error("Failed to load folders:", err);
        }
        
        return this.getBEMLDemoFolders();
    }

    // List files
    async listFiles(folderId: string = ""): Promise<DriveFile[]> {
        console.log('📄 Loading files from BEML DOCUMENTS...');

        const cacheKey = `beml_files_${folderId || 'root'}_${this.sheetId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            let url = `${this.baseURL}?action=listFiles&sheetId=${this.sheetId}&timestamp=${Date.now()}`;
            
            if (folderId && folderId !== 'root') {
                url += `&folder=${encodeURIComponent(folderId)}`;
            }

            const resp = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!resp.ok) {
                return this.getBEMLDemoFiles();
            }

            const responseText = await resp.text();
            const data = JSON.parse(responseText);

            if (data.files && Array.isArray(data.files)) {
                const files = data.files.map((file: any) => ({
                    id: file.id || `file_${Date.now()}`,
                    name: file.name || 'Unknown File',
                    mimeType: file.mimeType || 'application/octet-stream',
                    type: file.type === 'folder' || file.mimeType?.includes('folder') ? 'folder' : 'file',
                    size: file.size,
                    modifiedTime: file.modifiedTime,
                    url: file.url
                }));

                this.cache.set(cacheKey, files);
                return files;
            }
        } catch (err) {
            console.error("Failed to load files:", err);
        }
        
        return this.getBEMLDemoFiles();
    } 
   // Extract file contents
    async extractFileContents(fileIds: string[]): Promise<FileContent[]> {
        console.log('📥 Extracting content from BEML documents:', fileIds.length);

        const contents: FileContent[] = [];

        for (const fileId of fileIds) {
            try {
                const url = `${this.baseURL}?action=downloadBase64&fileId=${encodeURIComponent(fileId)}&sheetId=${this.sheetId}&timestamp=${Date.now()}`;
                const resp = await fetch(url);

                if (resp.ok) {
                    const data = await resp.json();
                    if (data.file) {
                        contents.push({
                            name: data.file.name || `document_${fileId}`,
                            content: data.file.content || 'Content extraction in progress...',
                            mimeType: data.file.mimeType || 'text/plain'
                        });
                    }
                }
            } catch (error) {
                console.error(`Error extracting content for ${fileId}:`, error);
                contents.push({
                    name: `document_${fileId}`,
                    content: 'Content extraction failed',
                    mimeType: 'text/plain'
                });
            }
        }

        return contents;
    }

    // Upload file
    async uploadFile(file: File, system: string = '', subsystem: string = ''): Promise<UploadResult> {
        try {
            console.log('📤 Uploading file to BEML DOCUMENTS:', file.name);

            const base64Data = await this.fileToBase64(file);
            
            const uploadData = {
                action: 'uploadToBEML',
                fileName: file.name,
                mimeType: file.type || 'application/octet-stream',
                data: base64Data,
                system,
                subsystem,
                sheetId: this.sheetId,
                timestamp: Date.now()
            };

            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadData)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.clearCache();
                    return {
                        success: true,
                        fileId: result.fileId,
                        fileName: file.name
                    };
                }
            }

            throw new Error('Upload failed');
        } catch (error: any) {
            return {
                success: false,
                error: `Failed to upload ${file.name}: ${error.message}`
            };
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

    // Clear cache
    clearCache(): void {
        this.cache.clear();
        console.log('💾 BEML cache cleared');
    }

    // Get demo folders
    getBEMLDemoFolders(): DriveFolder[] {
        return [
            {
                id: 'beml_documents_root',
                name: 'BEML DOCUMENTS',
                count: 47,
                fullPath: 'BEML DOCUMENTS'
            },
            {
                id: 'beml_signalling',
                name: 'BEML DOCUMENTS/SIGNALLING',
                count: 1,
                fullPath: 'BEML DOCUMENTS/SIGNALLING'
            },
            {
                id: 'beml_maintenance',
                name: 'BEML DOCUMENTS/Maintenance service checklist',
                count: 1,
                fullPath: 'BEML DOCUMENTS/Maintenance service checklist'
            },
            {
                id: 'beml_service_ocr',
                name: 'BEML DOCUMENTS/Service Checklists with OCR',
                count: 6,
                fullPath: 'BEML DOCUMENTS/Service Checklists with OCR'
            },
            {
                id: 'beml_bell_check',
                name: 'BEML DOCUMENTS/BELL CHECK',
                count: 26,
                fullPath: 'BEML DOCUMENTS/BELL CHECK'
            },
            {
                id: 'beml_pin_diagram',
                name: 'BEML DOCUMENTS/PIN DIAGRAM',
                count: 6,
                fullPath: 'BEML DOCUMENTS/PIN DIAGRAM'
            }
        ];
    }

    // Get demo files
    getBEMLDemoFiles(): DriveFile[] {
        return [
            {
                id: 'beml_fds_report',
                name: 'FDS SURGE VOLTAGE REPORT.pdf',
                mimeType: 'application/pdf',
                type: 'file',
                size: 2142760,
                modifiedTime: '2025-08-28T12:25:46.000Z'
            },
            {
                id: 'beml_b8_checklist',
                name: 'B8 service checklists.pdf',
                mimeType: 'application/pdf',
                type: 'file',
                size: 2617142,
                modifiedTime: '2025-08-21T07:52:54.139Z'
            },
            {
                id: 'beml_maintenance_manual',
                name: 'BEML Maintenance Manual.pdf',
                mimeType: 'application/pdf',
                type: 'file',
                size: 5432100,
                modifiedTime: '2025-08-20T10:30:08.000Z'
            }
        ];
    }

    // Legacy methods for compatibility
    async listFolders(): Promise<DriveFolder[]> {
        return this.loadTree();
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
export const googleDriveBEMLService = new GoogleDriveBEMLService();

// Export for testing or custom instances
export { GoogleDriveBEMLService };

// Default export for compatibility
export default googleDriveBEMLService;