// Google Drive service for KMRCL Metro Document Intelligence
// Based on working HTML implementation

import { config } from '../config/environment';

// Interfaces matching the working HTML implementation
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

    // Helper function to escape HTML (from working HTML)
    private escapeHtml(s: string): string {
        if (s === undefined || s === null) return "";
        s = String(s);
        return s.replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[c] || c);
    }

    // Load folder tree (exactly like working HTML)
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

    // Load files from folder (exactly like working HTML)
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

    // Extract file contents (based on working HTML implementation)
    async extractFileContents(fileIds: string[]): Promise<FileContent[]> {
        if (fileIds.length === 0) {
            throw new Error("Please select at least one file.");
        }

        const contents: FileContent[] = [];

        for (const fileId of fileIds) {
            try {
                console.log('Processing file:', fileId);

                const resp = await fetch(`${this.baseURL}?action=downloadBase64&fileId=${encodeURIComponent(fileId)}`);
                const data = await resp.json();

                if (!resp.ok || !data.ok) {
                    throw new Error(data.error || "Failed to download file");
                }

                const file = data.file;
                let text = "";
                const base64 = file.base64 || "";
                const fileName = file.name || `file_${fileId}`;
                const mimeType = file.mimeType || 'application/octet-stream';

                if (mimeType === "application/pdf") {
                    text = await this.extractTextFromPDFBase64(base64);
                } else if (/^image\//i.test(mimeType)) {
                    text = await this.extractTextFromImageBase64(base64);
                } else {
                    // For text-based files, decode base64
                    try {
                        text = atob(base64);
                    } catch (e) {
                        text = file.content || `[Could not decode content for ${fileName}]`;
                    }
                }

                contents.push({
                    name: fileName,
                    content: text,
                    mimeType: mimeType
                });

                console.log(`Successfully processed: ${fileName}`);
            } catch (error) {
                console.error(`Error processing file ${fileId}:`, error);
                contents.push({
                    name: `file_${fileId}`,
                    content: `[ERROR: Could not extract text from file]`,
                    mimeType: 'error'
                });
            }
        }

        return contents;
    }

    // PDF text extraction (from working HTML)
    private async extractTextFromPDFBase64(base64: string): Promise<string> {
        try {
            // Check if pdfjsLib is available
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

                return text.trim();
            } else {
                return `[PDF content - ${base64.length} bytes]`;
            }
        } catch (error) {
            console.error("PDF extraction error:", error);
            return `[PDF EXTRACTION ERROR: ${error.message}]`;
        }
    }

    // Image OCR extraction (from working HTML)
    private async extractTextFromImageBase64(base64: string): Promise<string> {
        try {
            // Check if Tesseract is available
            if (typeof window !== 'undefined' && (window as any).Tesseract) {
                const Tesseract = (window as any).Tesseract;

                const img = new Image();
                img.src = `data:image/*;base64,${base64}`;
                await img.decode();

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const MAX = 1600;
                let w = img.naturalWidth, h = img.naturalHeight;
                const scale = Math.min(1, MAX / Math.max(w, h));

                canvas.width = Math.round(w * scale);
                canvas.height = Math.round(h * scale);
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

                const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
                return text || "";
            } else {
                return `[Image content - ${base64.length} bytes]`;
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
            console.log('Uploading file to Google Drive:', file.name);

            const base64Data = await this.fileToBase64(file);

            const uploadData = {
                name: file.name,
                mimeType: file.type || 'application/octet-stream',
                data: base64Data,
                system,
                subsystem
            };

            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadData)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Upload failed');
            }

            console.log('File uploaded successfully:', result.fileId);
            return result;
        } catch (error) {
            console.error('Failed to upload file:', error);
            throw new Error(`Failed to upload ${file.name}: ${error.message}`);
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

    // Test connection (using working endpoint)
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

    // Get file icon class (from working HTML)
    getFileIconClass(mimeType: string): string {
        if (mimeType.includes('pdf')) return 'fa-file-pdf';
        if (mimeType.includes('sheet') || mimeType.includes('csv')) return 'fa-file-excel';
        if (mimeType.includes('document') || mimeType.includes('word')) return 'fa-file-word';
        if (mimeType.includes('image')) return 'fa-file-image';
        if (mimeType.includes('presentation')) return 'fa-file-powerpoint';
        if (mimeType.includes('folder')) return 'fa-folder';
        return 'fa-file';
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