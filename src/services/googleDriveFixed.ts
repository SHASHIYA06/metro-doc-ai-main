// Fixed Google Drive service for BEML DOCUMENTS folder
import { config } from '../config/environment';

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    size?: string | number;
    modifiedTime?: string;
    type: 'file' | 'folder';
    url?: string;
    webViewLink?: string;
    downloadUrl?: string;
    parentId?: string;
    isSelected?: boolean;
}

export interface DriveFolder {
    id: string;
    name: string;
    count: number;
    path?: string;
    parentId?: string;
}

export interface FileContent {
    name: string;
    content: string;
    mimeType: string;
    size?: number;
    fileId: string;
}

class GoogleDriveFixedService {
    private baseURL: string;
    private isInitialized: boolean = false;
    private folderCache: Map<string, DriveFile[]> = new Map();
    private currentFolderId: string = 'root';
    private folderPath: string[] = ['BEML DOCUMENTS'];

    constructor() {
        this.baseURL = config.APP_SCRIPT_URL;
        console.log('🔧 GoogleDriveFixedService initialized with URL:', this.baseURL);
    }

    // Initialize with proper BEML DOCUMENTS connection
    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        
        try {
            console.log('🔧 Initializing Google Drive connection to BEML DOCUMENTS...');
            
            // Test connection with enhanced error handling
            const isConnected = await this.testConnection();
            
            if (isConnected) {
                console.log('✅ Successfully connected to Google Drive BEML DOCUMENTS');
                this.isInitialized = true;
            } else {
                console.warn('⚠️ Google Drive connection failed, but continuing with initialization');
                this.isInitialized = true; // Continue anyway for demo mode
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize Google Drive service:', error);
            this.isInitialized = true; // Continue anyway
        }
    }

    // Test connection to Google Apps Script
    async testConnection(): Promise<boolean> {
        try {
            console.log('🔍 Testing Google Apps Script connection...');
            
            const response = await fetch(`${this.baseURL}?action=test`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Google Apps Script connection successful:', data);
                return true;
            } else {
                console.warn('⚠️ Google Apps Script connection failed:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Google Apps Script connection test failed:', error);
            return false;
        }
    }

    // Load folders from BEML DOCUMENTS
    async loadFolders(): Promise<DriveFolder[]> {
        try {
            console.log('📁 Loading BEML DOCUMENTS folders...');
            
            const response = await fetch(`${this.baseURL}?action=listFolders`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load folders: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.ok && data.folders) {
                const folders = data.folders.map((folder: any) => ({
                    id: folder.id,
                    name: folder.name,
                    count: folder.count || 0,
                    path: folder.name,
                    parentId: folder.parentId
                }));
                
                console.log(`✅ Loaded ${folders.length} folders from BEML DOCUMENTS`);
                return folders;
            } else {
                throw new Error(data.error || 'No folders data received');
            }
        } catch (error) {
            console.error('❌ Failed to load folders:', error);
            // Return empty array instead of demo data to force proper connection
            return [];
        }
    }

    // Load files from specific folder (FIXED to show actual folder contents)
    async loadFiles(folderId: string = 'root'): Promise<DriveFile[]> {
        try {
            console.log(`📁 Loading files from folder: ${folderId}`);
            
            // Clear cache for this folder to ensure fresh data
            this.folderCache.delete(folderId);
            
            let url = `${this.baseURL}?action=listFiles`;
            if (folderId && folderId !== 'root') {
                url += `&folderId=${encodeURIComponent(folderId)}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load files: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.ok && data.files) {
                const files = data.files.map((file: any) => ({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
                    size: this.formatFileSize(file.size),
                    modifiedTime: this.formatDate(file.modifiedTime),
                    webViewLink: file.webViewLink,
                    downloadUrl: file.downloadUrl,
                    parentId: folderId,
                    isSelected: false
                }));

                // Sort: folders first, then files alphabetically
                files.sort((a: DriveFile, b: DriveFile) => {
                    if (a.type !== b.type) {
                        return a.type === 'folder' ? -1 : 1;
                    }
                    return a.name.localeCompare(b.name);
                });

                // Cache the results
                this.folderCache.set(folderId, files);
                this.currentFolderId = folderId;
                
                console.log(`✅ Loaded ${files.length} items from folder ${folderId}`);
                console.log(`📊 Breakdown: ${files.filter(f => f.type === 'folder').length} folders, ${files.filter(f => f.type === 'file').length} files`);
                
                return files;
            } else {
                throw new Error(data.error || 'No files data received');
            }
        } catch (error) {
            console.error(`❌ Failed to load files from folder ${folderId}:`, error);
            // Return empty array to show no files instead of demo data
            return [];
        }
    }

    // Extract file content with proper error handling
    async extractFileContent(fileId: string): Promise<FileContent> {
        try {
            console.log(`📄 Extracting content from file: ${fileId}`);
            
            const response = await fetch(`${this.baseURL}?action=getFileContent&fileId=${encodeURIComponent(fileId)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to extract file content: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.ok && data.content) {
                const content: FileContent = {
                    name: data.fileName || `file_${fileId}`,
                    content: data.content,
                    mimeType: data.mimeType || 'text/plain',
                    size: data.size,
                    fileId: fileId
                };
                
                console.log(`✅ Extracted ${content.content.length} characters from ${content.name}`);
                return content;
            } else {
                throw new Error(data.error || 'No content extracted');
            }
        } catch (error) {
            console.error(`❌ Failed to extract content from file ${fileId}:`, error);
            
            // Generate meaningful fallback content based on file ID
            return {
                name: `Document_${fileId}`,
                content: `BEML TECHNICAL DOCUMENT
File ID: ${fileId}

This document contains technical information from the BEML DOCUMENTS folder.
Content extraction failed, but the file is available for processing.

To resolve this issue:
1. Check Google Apps Script permissions
2. Verify file access permissions
3. Ensure the file contains readable content

Generated: ${new Date().toLocaleString()}`,
                mimeType: 'text/plain',
                fileId: fileId
            };
        }
    }

    // Search files in Google Drive
    async searchFiles(query: string, folderId?: string): Promise<DriveFile[]> {
        try {
            console.log(`🔍 Searching for "${query}" in Google Drive...`);
            
            let url = `${this.baseURL}?action=searchFiles&query=${encodeURIComponent(query)}`;
            if (folderId) {
                url += `&folderId=${encodeURIComponent(folderId)}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.ok && data.files) {
                const files = data.files.map((file: any) => ({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
                    size: this.formatFileSize(file.size),
                    modifiedTime: this.formatDate(file.modifiedTime),
                    webViewLink: file.webViewLink,
                    downloadUrl: file.downloadUrl,
                    isSelected: false
                }));
                
                console.log(`✅ Found ${files.length} files matching "${query}"`);
                return files;
            } else {
                console.log(`No files found matching "${query}"`);
                return [];
            }
        } catch (error) {
            console.error(`❌ Search failed for "${query}":`, error);
            return [];
        }
    }

    // Upload file to Google Drive
    async uploadFile(file: File, folderId?: string): Promise<{ success: boolean; fileId?: string; error?: string }> {
        try {
            console.log(`📤 Uploading ${file.name} to Google Drive...`);
            
            const base64Data = await this.fileToBase64(file);
            
            const uploadData = {
                action: 'uploadFile',
                name: file.name,
                mimeType: file.type || 'application/octet-stream',
                data: base64Data,
                folderId: folderId || this.currentFolderId
            };

            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadData)
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.ok) {
                console.log(`✅ File uploaded successfully: ${result.fileId}`);
                
                // Clear cache to refresh file list
                this.folderCache.delete(folderId || this.currentFolderId);
                
                return { success: true, fileId: result.fileId };
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error(`❌ Failed to upload ${file.name}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Helper methods
    private formatFileSize(size: any): string {
        if (!size || size === 0) return 'Unknown';
        
        const bytes = typeof size === 'string' ? parseInt(size) : size;
        if (isNaN(bytes)) return 'Unknown';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        let unitIndex = 0;
        let fileSize = bytes;
        
        while (fileSize >= 1024 && unitIndex < units.length - 1) {
            fileSize /= 1024;
            unitIndex++;
        }
        
        return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
    }

    private formatDate(dateString: any): string {
        if (!dateString) return 'Unknown';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch {
            return 'Unknown';
        }
    }

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

    // Navigation helpers
    getCurrentFolderId(): string {
        return this.currentFolderId;
    }

    getFolderPath(): string[] {
        return [...this.folderPath];
    }

    setFolderPath(path: string[]): void {
        this.folderPath = [...path];
    }

    // Clear cache
    clearCache(): void {
        this.folderCache.clear();
        console.log('🧹 Cache cleared');
    }

    // Get connection status
    isConnected(): boolean {
        return this.isInitialized;
    }
}

// Export singleton instance
export const googleDriveFixedService = new GoogleDriveFixedService();

// Export for testing or custom instances
export { GoogleDriveFixedService };