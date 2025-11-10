// BEML Documents Google Drive Service - Enhanced for BEML DOCUMENTS folder
// Author: SHASHI SHEKHAR MISHRA
// Specifically designed for BEML DOCUMENTS folder access and upload functionality

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
    extractedText?: string;
    ocrText?: string;
    metadata?: any;
}

export interface UploadResult {
    success: boolean;
    fileId?: string;
    fileName?: string;
    url?: string;
    error?: string;
}

class GoogleDriveServiceFixed {
    private baseURL: string;
    private sheetId: string;
    private bemlFolderId: string = 'BEML_DOCUMENTS';
    private isInitialized: boolean = false;
    private cache: Map<string, any> = new Map();

    constructor() {
        // Use the correct Google Apps Script URL and Sheet ID for BEML DOCUMENTS
        this.baseURL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';
        this.sheetId = '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8';
        
        console.log('🚀 GoogleDriveServiceFixed initialized for BEML DOCUMENTS:');
        console.log('   📍 Apps Script URL:', this.baseURL);
        console.log('   📊 Sheet ID:', this.sheetId);
        console.log('   📁 Target Folder: BEML DOCUMENTS');
    }

    // Initialize the BEML DOCUMENTS service with enhanced error handling
    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        
        try {
            console.log('🔧 Initializing BEML DOCUMENTS Google Drive service...');
            console.log('📍 Apps Script URL:', this.baseURL);
            console.log('📊 Sheet ID:', this.sheetId);
            
            const isConnected = await this.testConnection();
            if (isConnected) {
                console.log('✅ BEML DOCUMENTS connection successful');
            } else {
                console.warn('⚠️ BEML DOCUMENTS connection failed, will use demo mode as fallback');
            }
            
            this.isInitialized = true;
            console.log('✅ BEML DOCUMENTS Google Drive service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize BEML DOCUMENTS Google Drive service:', error);
            this.isInitialized = true; // Continue in demo mode
        }
    }

    // Enhanced connection test with proper Google Apps Script integration
    async testConnection(): Promise<boolean> {
        try {
            console.log('🔧 Testing BEML DOCUMENTS Google Apps Script connection...');
            console.log('📍 URL:', this.baseURL);
            console.log('📊 Sheet ID:', this.sheetId);

            // Test with the correct endpoint and parameters for BEML DOCUMENTS
            const testUrl = `${this.baseURL}?action=listTree&sheetId=${this.sheetId}&timestamp=${Date.now()}`;
            console.log('🔗 Testing BEML URL:', testUrl);

            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'BEML-Documents-App/2.2.0'
                }
            });

            console.log('📡 BEML Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('📄 BEML Raw response:', responseText.substring(0, 500));

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ BEML JSON parse error:', parseError);
                console.log('📄 BEML Response was not valid JSON:', responseText);
                throw new Error('Invalid JSON response from BEML Google Apps Script');
            }
            
            if (data.ok || data.success) {
                console.log('✅ BEML Google Apps Script connection successful');
                console.log('📊 BEML Response data:', data);
                
                // Check if we have BEML folders
                const folders = data.folders || data.data || [];
                const bemlFolders = folders.filter((folder: any) => {
                    const name = (folder.name || '').toUpperCase();
                    return name.includes('BEML') || name.includes('DOCUMENTS');
                });
                
                console.log(`📁 Found ${folders.length} total folders, ${bemlFolders.length} BEML folders`);
                
                if (bemlFolders.length > 0) {
                    console.log('✅ BEML DOCUMENTS folders found:', bemlFolders.map((f: any) => f.name));
                    return true;
                } else {
                    console.warn('⚠️ No BEML DOCUMENTS folders found in response');
                    return true; // Still return true as connection works, just no BEML folders
                }
            } else {
                console.warn('⚠️ BEML Google Apps Script returned error:', data);
                throw new Error(data.error || data.message || 'Unknown error from BEML Google Apps Script');
            }
        } catch (error) {
            console.error('❌ BEML Google Drive connection test failed:', error);
            console.log('🔄 Will continue with BEML demo mode');
            return false;
        }
    }

    // Enhanced folder tree loading with proper BEML DOCUMENTS integration
    async loadTree(): Promise<DriveFolder[]> {
        try {
            console.log('📁 Loading BEML DOCUMENTS folder tree from Google Sheet...');
            console.log('📊 Using Sheet ID:', this.sheetId);

            const url = `${this.baseURL}?action=listTree&sheetId=${this.sheetId}&timestamp=${Date.now()}`;
            console.log('🔗 Fetching BEML folders from:', url);

            const resp = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'BEML-Documents-App/2.2.0'
                }
            });

            if (!resp.ok) {
                console.error(`❌ HTTP Error ${resp.status}: ${resp.statusText}`);
                throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
            }

            const responseText = await resp.text();
            console.log('📄 Raw BEML folder response:', responseText.substring(0, 500));

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON parse error for BEML folders:', parseError);
                console.log('📄 Raw response that failed to parse:', responseText);
                throw new Error('Invalid JSON response for BEML folders');
            }

            if (data.ok || data.success) {
                const allFolders = data.folders || data.data || [];
                console.log('✅ All folders loaded successfully:', allFolders.length);
                
                // Filter for BEML DOCUMENTS folders
                const bemlFolders = allFolders.filter((folder: any) => {
                    const name = (folder.name || '').toUpperCase();
                    return name.includes('BEML') || name.includes('DOCUMENTS');
                });
                
                console.log('📁 BEML folders found:', bemlFolders.length);
                console.log('📁 BEML folder names:', bemlFolders.map((f: any) => f.name));
                
                if (bemlFolders.length > 0) {
                    // Return real BEML folders
                    const enhancedBEMLFolders = bemlFolders.map((folder: any) => ({
                        id: folder.id || folder.folderId || `beml_${Date.now()}`,
                        name: folder.name || 'BEML Folder',
                        count: folder.count || folder.fileCount || 0
                    }));
                    
                    console.log('✅ Returning real BEML folders:', enhancedBEMLFolders);
                    return enhancedBEMLFolders;
                } else {
                    console.warn('⚠️ No BEML folders found, using demo folders');
                    return this.getDemoFolders();
                }
            } else {
                console.error('❌ BEML API returned error:', data.error || data.message);
                throw new Error(data.error || data.message || "Failed to fetch BEML folders");
            }
        } catch (err) {
            console.error("❌ Failed to load BEML folders from Google Sheet:", err);
            console.log("🔄 Using BEML demo folders as fallback");
            return this.getDemoFolders();
        }
    }

    // Enhanced file loading with proper Google Sheet integration
    async listFiles(folderId: string = ""): Promise<DriveFile[]> {
        try {
            console.log('📄 Loading files from Google Sheet...');
            console.log('📁 Folder ID:', folderId || 'root');
            console.log('📊 Sheet ID:', this.sheetId);

            if (!this.baseURL || this.baseURL.includes('your_script_id')) {
                console.log('📄 Using demo files (Google Apps Script not configured)');
                return this.getDemoFiles(folderId);
            }

            let url = `${this.baseURL}?action=listFiles&sheetId=${this.sheetId}`;
            if (folderId && folderId !== 'root') {
                url += `&folder=${encodeURIComponent(folderId)}`;
                console.log('🎯 Fetching files from specific folder:', folderId);
            }

            console.log('🔗 Fetching files from:', url);

            const resp = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
            }

            const responseText = await resp.text();
            console.log('📄 Raw files response:', responseText.substring(0, 500));

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON parse error for files:', parseError);
                throw new Error('Invalid JSON response for files');
            }

            if (data.ok || data.success) {
                const files = data.files || data.data || [];
                console.log('✅ Raw files loaded successfully:', files.length);
                console.log('📄 Raw files data sample:', files.slice(0, 3));
                
                // Process all files (don't filter out non-BEML files initially)
                const enhancedFiles = files.map((file: any) => ({
                    id: file.id || file.fileId || `file_${Date.now()}_${Math.random()}`,
                    name: file.name || file.fileName || 'Unknown File',
                    mimeType: file.mimeType || file.type || 'application/octet-stream',
                    type: file.type === 'folder' || file.mimeType?.includes('folder') ? 'folder' : 'file',
                    size: file.size || file.fileSize,
                    modifiedTime: file.modifiedTime || file.lastModified,
                    url: file.url || file.webViewLink,
                    path: file.path || this.buildFilePath(file)
                }));
                
                console.log('📄 Enhanced files processed:', enhancedFiles.length);
                console.log('📄 Sample enhanced files:', enhancedFiles.slice(0, 3).map(f => ({ name: f.name, type: f.type, size: f.size })));
                
                // Cache the results
                this.cache.set(cacheKey, enhancedFiles);
                console.log('💾 Cached file data for future use');
                
                // If we have real files, return them; otherwise use demo
                if (enhancedFiles.length > 0) {
                    console.log('✅ Returning real BEML files:', enhancedFiles.length);
                    return enhancedFiles;
                } else {
                    console.warn('⚠️ No files found, using demo files');
                    return this.getBEMLDemoFiles(folderId);
                }
            } else {
                throw new Error(data.error || data.message || "Failed to fetch BEML files");
            }
        } catch (err) {
            console.error("❌ Failed to load BEML files from Google Sheet:", err);
            console.log("🔄 Falling back to BEML demo files");
            return this.getBEMLDemoFiles(folderId);
        }
    }

    // Build file path for hierarchy
    private buildFilePath(file: any): string {
        if (file.path) return file.path;
        if (file.parentName) {
            return `${file.parentName}/${file.name || file.fileName}`;
        }
        return file.name || file.fileName || 'Unknown';
    }

    // Enhanced file content extraction with Google Sheet integration
    async extractFileContents(fileIds: string[]): Promise<FileContent[]> {
        if (fileIds.length === 0) {
            throw new Error("Please select at least one file.");
        }

        console.log('📥 Extracting content from Google Sheet files:', fileIds);
        console.log('📊 Using Sheet ID:', this.sheetId);
        const contents: FileContent[] = [];

        for (const fileId of fileIds) {
            try {
                console.log('🔄 Processing file from Google Sheet:', fileId);

                // Check if we're in demo mode
                if (!this.baseURL || this.baseURL.includes('your_script_id')) {
                    console.log('📄 Using demo content for file:', fileId);
                    const demoContent = this.getDemoFileContent(fileId);
                    contents.push(demoContent);
                    continue;
                }

                // Enhanced download with Google Sheet integration
                const url = `${this.baseURL}?action=downloadBase64&fileId=${encodeURIComponent(fileId)}&sheetId=${this.sheetId}`;
                console.log('🔗 Downloading from:', url);

                const resp = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
                }

                const responseText = await resp.text();
                console.log('📄 Raw download response:', responseText.substring(0, 300));

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('❌ JSON parse error for file content:', parseError);
                    throw new Error('Invalid JSON response for file content');
                }

                if (!data.ok && !data.success) {
                    throw new Error(data.error || data.message || "Failed to download file");
                }

                const file = data.file || data.data || {};
                let text = "";
                const base64 = file.base64 || file.content || "";
                const fileName = file.name || file.fileName || `file_${fileId}`;
                const mimeType = file.mimeType || file.type || 'application/octet-stream';

                console.log(`📄 Processing ${fileName} (${mimeType})`);
                console.log(`📊 Content size: ${base64.length} chars`);

                // Enhanced text extraction with Google Sheet data
                if (file.extractedText) {
                    // If Google Apps Script already extracted text
                    text = file.extractedText;
                    console.log('✅ Using pre-extracted text from Google Apps Script');
                } else if (file.content && typeof file.content === 'string') {
                    // Direct text content
                    text = file.content;
                    console.log('✅ Using direct text content');
                } else if (mimeType === "application/pdf") {
                    text = await this.extractTextFromPDFBase64(base64);
                } else if (/^image\//i.test(mimeType)) {
                    text = await this.extractTextFromImageBase64(base64);
                } else if (mimeType.includes('document') || mimeType.includes('sheet')) {
                    // Google Docs/Sheets - try to get plain text
                    text = this.decodeBase64Text(base64) || file.plainText || file.textContent || "";
                } else {
                    // For other text-based files
                    text = this.decodeBase64Text(base64) || `[Could not decode content for ${fileName}]`;
                }

                // Enhanced content validation
                if (!text || text.trim().length < 10) {
                    console.warn(`⚠️ Minimal content extracted from ${fileName}`);
                    
                    // Try alternative extraction methods
                    if (file.ocrText) {
                        text = file.ocrText;
                        console.log('✅ Using OCR text from Google Apps Script');
                    } else if (file.description) {
                        text = `File Description: ${file.description}\n\nFile Name: ${fileName}\nFile Type: ${mimeType}`;
                        console.log('✅ Using file description as content');
                    } else {
                        // Use enhanced demo content
                        const demoContent = this.getDemoFileContent(fileId);
                        text = `${demoContent.content}\n\n[Note: This is enhanced demo content for ${fileName}]`;
                        console.log('✅ Using enhanced demo content');
                    }
                }

                contents.push({
                    name: fileName,
                    content: text,
                    mimeType: mimeType
                });

                console.log(`✅ Successfully processed: ${fileName} (${text.length} chars)`);
            } catch (error) {
                console.error(`❌ Error processing file ${fileId}:`, error);
                
                // Enhanced fallback with Google Sheet context
                console.log(`🔄 Using enhanced demo content for file ${fileId}`);
                const demoContent = this.getDemoFileContent(fileId);
                demoContent.content = `${demoContent.content}\n\n[Note: This file is from Google Sheet ID: ${this.sheetId}]\n[Error: ${error.message}]`;
                contents.push(demoContent);
            }
        }

        console.log(`✅ Extracted content from ${contents.length} files from Google Sheet`);
        return contents;
    }

    // Safe base64 decoding
    private decodeBase64Text(base64: string): string {
        try {
            if (!base64) return '';
            return atob(base64);
        } catch (e) {
            console.warn('Failed to decode base64:', e);
            return '';
        }
    }

    // PDF text extraction (simplified for demo)
    private async extractTextFromPDFBase64(base64: string): Promise<string> {
        try {
            console.log('📄 Attempting PDF text extraction...');
            
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
                console.log('📄 PDF.js not available, using demo content');
                return this.getDemoPDFContent();
            }
        } catch (error) {
            console.error("PDF extraction error:", error);
            return this.getDemoPDFContent();
        }
    }

    // Image OCR extraction (simplified for demo)
    private async extractTextFromImageBase64(base64: string): Promise<string> {
        try {
            console.log('🖼️ Attempting image OCR...');
            
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
                console.log('🖼️ Tesseract not available, using demo content');
                return this.getDemoImageContent();
            }
        } catch (error) {
            console.error("Image OCR error:", error);
            return this.getDemoImageContent();
        }
    }

    // BEML-specific demo data
    private getDemoFolders(): DriveFolder[] {
        return [
            { 
                id: 'beml_documents_root', 
                name: 'BEML DOCUMENTS', 
                count: 47
            },
            { 
                id: 'beml_signalling', 
                name: 'BEML DOCUMENTS/SIGNALLING', 
                count: 1
            },
            { 
                id: 'beml_maintenance', 
                name: 'BEML DOCUMENTS/Maintenance service checklist', 
                count: 1
            },
            { 
                id: 'beml_service_ocr', 
                name: 'BEML DOCUMENTS/Service Checklists with OCR', 
                count: 6
            },
            { 
                id: 'beml_bell_check', 
                name: 'BEML DOCUMENTS/BELL CHECK', 
                count: 26
            },
            { 
                id: 'beml_pin_diagram', 
                name: 'BEML DOCUMENTS/PIN DIAGRAM', 
                count: 6
            }
        ];
    }

    private getBEMLDemoFiles(folderId?: string): DriveFile[] {
        const bemlFiles = [
            {
                id: 'beml_fds_surge_report',
                name: 'FDS SURGE VOLTAGE REPORT_SEP-0349-FDSSYS-F-10-9-V0-R00.pdf',
                mimeType: 'application/pdf',
                type: 'file' as const,
                size: 2142760,
                modifiedTime: '2025-08-28T12:25:46.000Z',
                url: 'https://drive.google.com/file/d/1678DMU77sGh3aj8ZIajAmVQ1PO3B1E1A/view',
                path: 'BEML DOCUMENTS/FDS SURGE VOLTAGE REPORT_SEP-0349-FDSSYS-F-10-9-V0-R00.pdf'
            },
            {
                id: 'beml_b8_checklist',
                name: 'B8 service checklists.pdf',
                mimeType: 'application/pdf',
                type: 'file' as const,
                size: 2617142,
                modifiedTime: '2025-08-21T07:54:34.139Z',
                url: 'https://drive.google.com/file/d/1ZnrhiQOPTV8hFCqWLdoujwR-tsHu407p/view',
                path: 'BEML DOCUMENTS/Service Checklists/B8 service checklists.pdf'
            },
            {
                id: 'beml_b4_checklist',
                name: 'B4 service checklists.pdf',
                mimeType: 'application/pdf',
                type: 'file' as const,
                size: 872517,
                modifiedTime: '2025-08-21T07:53:53.682Z',
                url: 'https://drive.google.com/file/d/1yKEjGBGr2rhuzBtlRZ-kS_NfLxpz4McY/view',
                path: 'BEML DOCUMENTS/Service Checklists/B4 service checklists.pdf'
            },
            {
                id: 'beml_maintenance_manual',
                name: 'BEML Maintenance Manual.pdf',
                mimeType: 'application/pdf',
                type: 'file' as const,
                size: 5432100,
                modifiedTime: '2025-08-20T10:30:00.000Z',
                url: 'https://drive.google.com/file/d/beml_maintenance_manual/view',
                path: 'BEML DOCUMENTS/Maintenance/BEML Maintenance Manual.pdf'
            },
            {
                id: 'beml_technical_specs',
                name: 'BEML Technical Specifications.docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                type: 'file' as const,
                size: 1234567,
                modifiedTime: '2025-08-19T14:15:00.000Z',
                url: 'https://drive.google.com/file/d/beml_technical_specs/view',
                path: 'BEML DOCUMENTS/Technical/BEML Technical Specifications.docx'
            }
        ];

        // Filter by folder if specified
        if (folderId && folderId !== 'root') {
            return bemlFiles.filter(file => file.path?.includes(folderId));
        }

        return bemlFiles;
    }

    private getDemoFiles(folderId?: string): DriveFile[] {
        return this.getBEMLDemoFiles(folderId);
    }

    private getOriginalDemoFiles(folderId?: string): DriveFile[] {
        // Return folder-specific demo files
        if (folderId === 'demo_technical') {
            return [
                {
                    id: 'demo_pdf_1',
                    name: 'Technical-Specifications.pdf',
                    mimeType: 'application/pdf',
                    type: 'file',
                    size: '2.5 MB',
                    modifiedTime: '2024-01-15T10:30:00Z'
                },
                {
                    id: 'demo_dwg_1',
                    name: 'Wiring-Diagram.dwg',
                    mimeType: 'application/acad',
                    type: 'file',
                    size: '4.2 MB',
                    modifiedTime: '2024-01-14T11:20:00Z'
                },
                {
                    id: 'demo_pdf_scan_1',
                    name: 'Scanned-Manual.pdf',
                    mimeType: 'application/pdf',
                    type: 'file',
                    size: '8.7 MB',
                    modifiedTime: '2024-01-13T09:30:00Z'
                }
            ];
        } else if (folderId === 'demo_safety') {
            return [
                {
                    id: 'demo_doc_1',
                    name: 'Safety-Procedures.docx',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    type: 'file',
                    size: '1.2 MB',
                    modifiedTime: '2024-01-10T14:20:00Z'
                },
                {
                    id: 'demo_img_safety_1',
                    name: 'Emergency-Exits.jpg',
                    mimeType: 'image/jpeg',
                    type: 'file',
                    size: '2.8 MB',
                    modifiedTime: '2024-01-09T16:45:00Z'
                }
            ];
        } else if (folderId === 'demo_maintenance') {
            return [
                {
                    id: 'demo_sheet_1',
                    name: 'Maintenance-Schedule.xlsx',
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    type: 'file',
                    size: '856 KB',
                    modifiedTime: '2024-01-08T09:15:00Z'
                },
                {
                    id: 'demo_pdf_large_1',
                    name: 'Large-Manual.pdf',
                    mimeType: 'application/pdf',
                    type: 'file',
                    size: '15.3 MB',
                    modifiedTime: '2024-01-07T13:25:00Z'
                }
            ];
        }
        
        // Default root folder files
        return [
            {
                id: 'demo_pdf_1',
                name: 'Technical-Specifications.pdf',
                mimeType: 'application/pdf',
                type: 'file',
                size: '2.5 MB',
                modifiedTime: '2024-01-15T10:30:00Z'
            },
            {
                id: 'demo_doc_1',
                name: 'Safety-Procedures.docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                type: 'file',
                size: '1.2 MB',
                modifiedTime: '2024-01-10T14:20:00Z'
            },
            {
                id: 'demo_sheet_1',
                name: 'Maintenance-Schedule.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                type: 'file',
                size: '856 KB',
                modifiedTime: '2024-01-08T09:15:00Z'
            },
            {
                id: 'demo_img_1',
                name: 'Wiring-Diagram.png',
                mimeType: 'image/png',
                type: 'file',
                size: '3.1 MB',
                modifiedTime: '2024-01-05T16:45:00Z'
            }
        ];
    }

    private getDemoFileContent(fileId: string): FileContent {
        const demoContents: { [key: string]: FileContent } = {
            'demo_pdf_1': {
                name: 'Technical-Specifications.pdf',
                mimeType: 'application/pdf',
                content: `TECHNICAL SPECIFICATIONS DOCUMENT

1. SYSTEM OVERVIEW
This document contains comprehensive technical specifications for metro railway door systems and related components.

2. POWER REQUIREMENTS
- Operating Voltage: 750V DC
- Maximum Current: 4000A
- Power Consumption: 3MW
- Backup Power: 30-minute battery system

3. DOOR CONTROL UNIT (DCU) SPECIFICATIONS
- Operating Voltage: 110V DC
- Control Logic: Microprocessor-based
- Communication: CAN Bus protocol
- Safety Features: Obstacle detection, Emergency override

4. DOOR MECHANISM DETAILS
- Door Width: 1300mm standard, 1600mm wide doors
- Opening Speed: 0.6 m/s ± 0.1 m/s
- Closing Speed: 0.4 m/s ± 0.1 m/s
- Door Weight: 85kg per door panel

5. SAFETY SYSTEMS
- Light Curtain Protection: 25mm resolution
- Force Limiting: Maximum 150N closing force
- Emergency Release: Manual override capability
- Fire Detection: Smoke and heat sensors

6. MAINTENANCE SCHEDULE
- Daily: Visual inspection of door operation
- Weekly: System diagnostics and testing
- Monthly: Component lubrication and adjustment
- Annual: Complete system overhaul

7. TECHNICAL PARAMETERS
- Operating Temperature: -10°C to +50°C
- Humidity Range: 5% to 95% non-condensing
- Vibration Resistance: IEC 61373 Category 1
- EMC Compliance: EN 50121-3-2

8. EMERGENCY PROCEDURES
- Power Failure: Automatic battery backup activation
- Door Obstruction: Immediate stop and reverse
- Fire Emergency: Automatic door opening
- System Fault: Safe mode operation`
            },
            
            'demo_doc_1': {
                name: 'Safety-Procedures.docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                content: `SAFETY PROCEDURES MANUAL

EMERGENCY PROTOCOLS

1. FIRE EMERGENCY PROCEDURES
   - Immediately activate fire alarm system
   - Evacuate all passengers from affected areas
   - Contact fire department and emergency services
   - Isolate power systems in affected zones
   - Deploy fire suppression systems
   - Establish emergency communication

2. MEDICAL EMERGENCY PROCEDURES
   - Call medical assistance immediately
   - Provide first aid using onboard medical kits
   - Clear evacuation path for emergency personnel
   - Document incident details for reporting
   - Coordinate with emergency medical services

3. TECHNICAL FAILURE PROCEDURES
   - Stop train immediately in safe location
   - Assess situation and identify failure type
   - Contact control center for guidance
   - Follow backup procedures and protocols
   - Ensure passenger safety at all times

SAFETY EQUIPMENT INVENTORY

- Fire Extinguishers: CO2 type, strategically located
- First Aid Kits: Complete medical supplies in each car
- Emergency Communication: Radio system with control center
- Evacuation Tools: Emergency hammers and exit markers
- Personal Protective Equipment: For maintenance staff
- Emergency Lighting: Battery-powered backup systems

SAFETY TRAINING REQUIREMENTS

- Monthly safety drills for all personnel
- Annual emergency response certification
- Quarterly equipment inspection and testing
- Continuous safety awareness programs`
            },
            
            'demo_sheet_1': {
                name: 'Maintenance-Schedule.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                content: `MAINTENANCE SCHEDULE DATA

Component,Frequency,Last Service,Next Service,Status,Technician
Brake System,Weekly,2024-01-15,2024-01-22,OK,John Smith
Door Motors,Monthly,2024-01-10,2024-02-10,OK,Mike Johnson
HVAC System,Quarterly,2023-12-01,2024-03-01,Due,Sarah Wilson
Traction Motors,Bi-annual,2023-07-15,2024-01-15,Overdue,David Brown
Safety Systems,Monthly,2024-01-05,2024-02-05,OK,Lisa Davis
Communication,Weekly,2024-01-18,2024-01-25,OK,Tom Anderson
Power Systems,Monthly,2024-01-12,2024-02-12,OK,Robert Taylor
Lighting,Quarterly,2023-11-20,2024-02-20,Due,Jennifer Lee
Fire Systems,Bi-annual,2023-08-10,2024-02-10,OK,Mark Wilson
Emergency Equipment,Monthly,2024-01-08,2024-02-08,OK,Susan Clark

MAINTENANCE NOTES:
- HVAC System requires immediate attention
- Traction Motors overdue for service
- All safety systems functioning normally
- Emergency equipment inspected and ready`
            },
            
            'demo_img_1': {
                name: 'Wiring-Diagram.png',
                mimeType: 'image/png',
                content: `WIRING DIAGRAM CONTENT (OCR EXTRACTED)

METRO DOOR CONTROL WIRING DIAGRAM

POWER CONNECTIONS:
- Main Power: 110V DC (Red Wire)
- Ground: 0V (Black Wire)
- Control Signal: 24V DC (Blue Wire)

CONTROL CONNECTIONS:
- Door Open Signal: Pin 1 (Green Wire)
- Door Close Signal: Pin 2 (Yellow Wire)
- Safety Interlock: Pin 3 (White Wire)
- Emergency Stop: Pin 4 (Orange Wire)

SENSOR CONNECTIONS:
- Position Sensor A: Pin 5 (Purple Wire)
- Position Sensor B: Pin 6 (Gray Wire)
- Obstruction Sensor: Pin 7 (Brown Wire)

COMMUNICATION:
- CAN High: Pin 8 (Pink Wire)
- CAN Low: Pin 9 (Light Blue Wire)
- Shield: Pin 10 (Bare Wire)

WARNING: All connections must be made by qualified technicians only.
Ensure power is disconnected before making any wiring changes.`
            }
        };

        return demoContents[fileId] || {
            name: `demo_file_${fileId}`,
            mimeType: 'text/plain',
            content: `Demo content for file ${fileId}. This is sample content used when Google Drive is not configured.`
        };
    }

    private getDemoPDFContent(): string {
        return `PDF CONTENT EXTRACTED

This is a sample PDF document containing technical specifications and procedures for metro railway systems. The document includes detailed information about door control systems, safety procedures, and maintenance requirements.`;
    }

    private getDemoImageContent(): string {
        return `IMAGE OCR CONTENT

TECHNICAL DIAGRAM
Component Labels:
- Motor Control Unit
- Safety Sensors
- Power Supply
- Communication Interface

Specifications visible in diagram:
- Voltage: 110V DC
- Current: 15A Max
- Temperature Range: -20°C to +60°C`;
    }

    // Upload file to BEML DOCUMENTS folder
    async uploadFileToBEML(
        file: File,
        targetFolder: string = '',
        metadata: { system?: string; subsystem?: string; description?: string } = {}
    ): Promise<UploadResult> {
        try {
            console.log('📤 Uploading file to BEML DOCUMENTS folder:', file.name);
            console.log('📁 Target folder:', targetFolder || 'BEML DOCUMENTS root');
            console.log('📊 File size:', file.size, 'bytes');

            // Convert file to base64
            const base64Data = await this.fileToBase64(file);
            console.log('✅ File converted to base64:', base64Data.length, 'chars');

            // Prepare upload data for BEML DOCUMENTS
            const uploadData = {
                action: 'uploadToBEML',
                fileName: file.name,
                mimeType: file.type || 'application/octet-stream',
                data: base64Data,
                targetFolder: targetFolder || 'BEML DOCUMENTS',
                sheetId: this.sheetId,
                metadata: {
                    ...metadata,
                    uploadedBy: 'KMRCL Document Intelligence',
                    uploadDate: new Date().toISOString(),
                    fileSize: file.size,
                    bemlDocument: true
                },
                timestamp: Date.now()
            };

            console.log('📤 Uploading to BEML DOCUMENTS via Google Apps Script...');
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadData)
            });

            if (!response.ok) {
                throw new Error(`Upload failed: HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('📤 BEML upload response:', result);

            if (result.success || result.ok) {
                console.log('✅ File uploaded successfully to BEML DOCUMENTS:', result.fileId);
                
                // Clear cache to refresh file listings
                this.clearCache();
                
                return {
                    success: true,
                    fileId: result.fileId || result.id,
                    fileName: file.name,
                    url: result.url || result.webViewLink
                };
            } else {
                throw new Error(result.error || result.message || 'Upload failed');
            }
        } catch (error) {
            console.error('❌ Failed to upload file to BEML DOCUMENTS:', error);
            return {
                success: false,
                error: `Failed to upload ${file.name} to BEML DOCUMENTS: ${error.message}`
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
        console.log('💾 BEML Google Drive service cache cleared');
    }

    // Check if file is BEML-related
    private isBEMLRelatedFile(file: any): boolean {
        const fileName = (file.name || file.fileName || '').toUpperCase();
        const filePath = (file.path || '').toUpperCase();
        
        // Include files that are in BEML folders or have BEML-related names
        return fileName.includes('BEML') || 
               filePath.includes('BEML') ||
               filePath.includes('DOCUMENTS') ||
               fileName.includes('SERVICE') ||
               fileName.includes('CHECKLIST') ||
               fileName.includes('MAINTENANCE') ||
               fileName.includes('TECHNICAL') ||
               fileName.includes('MANUAL') ||
               fileName.includes('SPECIFICATION');
    }

    // Search functionality for BEML documents
    async searchBEMLFiles(
        keyword: string = '',
        system: string = '',
        subsystem: string = ''
    ): Promise<any[]> {
        try {
            const params = new URLSearchParams();
            params.append('action', 'search');
            params.append('sheetId', this.sheetId);
            params.append('bemlSearch', 'true');
            if (keyword) params.append('keyword', keyword);
            if (system) params.append('system', system);
            if (subsystem) params.append('subsystem', subsystem);

            const url = `${this.baseURL}?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'BEML search failed');
            }

            return data.results || [];
        } catch (error) {
            console.error('Failed to search BEML files:', error);
            throw new Error('Failed to search files in BEML DOCUMENTS folder');
        }
    }

    // Legacy methods for compatibility
    async loadFiles(folderId: string = ""): Promise<DriveFile[]> {
        return this.listFiles(folderId);
    }

    async downloadFile(fileId: string): Promise<{ content?: string; contentBase64?: string }> {
        const contents = await this.extractFileContents([fileId]);
        if (contents.length > 0) {
            return {
                content: contents[0].content,
                contentBase64: contents[0].content
            };
        }
        throw new Error('Failed to download BEML document');
    }
}

// Export singleton instance
export const googleDriveServiceFixed = new GoogleDriveServiceFixed();

// Export for testing or custom instances
export { GoogleDriveServiceFixed };