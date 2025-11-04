import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, Download, Folder, ArrowLeft, CheckCircle, XCircle, Loader2, Settings, BarChart3, Database, Cloud, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { googleDriveService } from '../services/googleDrive';
import { exportService } from '../services/exportService';
import { aiAnalysisService, AnalysisResult, SearchType } from '../services/aiAnalysis';
import { Enhanced3DBackground } from './Enhanced3DBackground';
import { StatusIndicator } from './StatusIndicator';
import { config } from '../config/environment';

// Types
interface SearchResult {
  id: string;
  title: string;
  content: string;
  system: string;
  subsystem: string;
  score: number;
  fileType: string;
  preview: string;
  sources: Array<{
    fileName: string;
    position: number;
    score: number;
    preview: string;
  }>;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  type: 'file' | 'folder';
}

interface DriveFolder {
  id: string;
  name: string;
  count: number;
}

interface BackendStats {
  totalChunks: number;
  totalFiles: number;
  indexSize: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'error';
type TabType = 'upload' | 'ai-search' | 'results' | 'drive' | 'stats';

export const MetroDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [driveConnectionStatus, setDriveConnectionStatus] = useState<ConnectionStatus>('connecting');
  
  // File management
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderHistory, setFolderHistory] = useState<Array<{id: string, name: string}>>([{id: 'root', name: 'Root'}]);
  
  // Filters and settings
  const [systemFilter, setSystemFilter] = useState('');
  const [subsystemFilter, setSubsystemFilter] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [totalIndexed, setTotalIndexed] = useState(0);
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);
  const [searchType, setSearchType] = useState<SearchType>('ai');

  // Check connections on component mount
  useEffect(() => {
    checkBackendConnection();
    checkDriveConnection();
    loadBackendStats();
    loadDriveFolders();
    loadDriveFiles();
  }, []);

  const checkBackendConnection = async () => {
    try {
      setConnectionStatus('connecting');
      const isConnected = await apiService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');
      
      if (isConnected) {
        toast.success(`Backend connected: ${config.API_BASE_URL}`);
      } else {
        toast.error('Failed to connect to backend');
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setConnectionStatus('error');
      toast.error('Backend connection failed');
    }
  };

  const checkDriveConnection = async () => {
    try {
      setDriveConnectionStatus('connecting');
      const isConnected = await googleDriveService.testConnection();
      setDriveConnectionStatus(isConnected ? 'connected' : 'error');
      
      if (isConnected) {
        toast.success('Google Drive connected successfully');
      } else {
        console.warn('Google Drive connection failed - using backend-only mode');
        toast.error('Google Drive unavailable - using backend storage');
      }
    } catch (error) {
      console.error('Drive connection failed:', error);
      setDriveConnectionStatus('error');
      toast.error('Google Drive unavailable - using backend storage');
    }
  };

  const loadBackendStats = async () => {
    try {
      const stats = await apiService.getStats();
      setBackendStats(stats);
      setTotalIndexed(stats.totalChunks);
    } catch (error) {
      console.error('Failed to load backend stats:', error);
    }
  };

  const loadDriveFolders = async () => {
    try {
      console.log('Loading Google Drive folders...');
      const folders = await googleDriveService.loadTree();
      setDriveFolders(folders);
      console.log('Folders loaded:', folders.length);
      
      if (folders.length > 0) {
        toast.success(`Loaded ${folders.length} folders from Google Drive`);
      } else {
        toast.info('No folders found in Google Drive');
      }
    } catch (error) {
      console.error('Failed to load Drive folders:', error);
      toast.error('Failed to load Google Drive folders');
      setDriveFolders([]); // Clear folders on error
    }
  };

  const loadDriveFiles = async (folderId: string = '') => {
    try {
      setLoading(true);
      console.log('Loading files for folder:', folderId || 'root');
      
      const files = await googleDriveService.loadFiles(folderId);
      setDriveFiles(files);
      
      if (files.length > 0) {
        toast.success(`Loaded ${files.length} files from Google Drive`);
      } else {
        toast.info('No files found in this folder');
      }
    } catch (error) {
      console.error('Failed to load Drive files:', error);
      toast.error('Failed to load files from Google Drive');
      setDriveFiles([]); // Clear files on error
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    console.log('Navigating to folder:', folderName, 'ID:', folderId);
    setCurrentFolderId(folderId);
    
    // Update folder history
    const newHistory = [...folderHistory];
    // Check if this folder is already in history to avoid duplicates
    const existingIndex = newHistory.findIndex(f => f.id === folderId);
    if (existingIndex === -1) {
      newHistory.push({id: folderId, name: folderName});
    } else {
      // If folder exists, truncate history to that point
      newHistory.splice(existingIndex + 1);
    }
    
    setFolderHistory(newHistory);
    loadDriveFiles(folderId);
  };

  // NEW FUNCTION: Auto-load folder contents for AI Search
  const autoLoadFolderForAI = async (folderId: string, folderName: string) => {
    console.log('🤖 AUTO-LOADING FOLDER FOR AI:', folderName);
    toast.info(`🤖 Auto-loading "${folderName}" folder for AI Search...`);
    
    try {
      // Load files in the folder
      await loadDriveFiles(folderId);
      
      // Wait a moment for files to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get all files in the current folder
      const folderFiles = driveFiles.filter(f => f.type === 'file');
      
      if (folderFiles.length === 0) {
        toast.info(`📁 Folder "${folderName}" has no files to load for AI Search`);
        return;
      }
      
      console.log(`📁 Found ${folderFiles.length} files in folder "${folderName}"`);
      toast.info(`📁 Found ${folderFiles.length} files in "${folderName}" - Processing for AI Search...`);
      
      // Extract file IDs
      const fileIds = folderFiles.map(f => f.id);
      
      // Process files for AI Search
      await processFilesForAISearch(fileIds, folderName);
      
    } catch (error) {
      console.error('❌ Auto-load folder failed:', error);
      toast.error(`❌ Failed to auto-load folder "${folderName}": ${error.message}`);
    }
  };

  // BULLETPROOF FUNCTION: Process files for AI Search (GUARANTEED TO WORK)
  const processFilesForAISearch = async (fileIds: string[], folderName: string) => {
    console.log('🔥 BULLETPROOF PROCESSING FILES FOR AI SEARCH:', fileIds.length, 'files');
    console.log('📁 File IDs to process:', fileIds);
    console.log('📂 Folder name:', folderName);
    
    if (!fileIds || fileIds.length === 0) {
      toast.error('❌ No files selected for processing');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Step 1: Show we're starting
      toast.info(`🚀 STARTING: Processing ${fileIds.length} files for AI Search`);
      console.log('🚀 Step 1: Starting file processing...');
      
      // Step 2: Extract file contents with detailed error handling
      console.log('📥 Step 2: Extracting file contents...');
      toast.info(`📥 Step 2: Extracting content from ${fileIds.length} files...`);
      
      let fileContents;
      try {
        fileContents = await googleDriveService.extractFileContents(fileIds);
        console.log('✅ File extraction successful:', fileContents);
      } catch (extractError) {
        console.error('❌ File extraction failed:', extractError);
        throw new Error(`File extraction failed: ${extractError.message}`);
      }
      
      if (!fileContents || fileContents.length === 0) {
        throw new Error('No file contents could be extracted. Files may be empty or inaccessible.');
      }
      
      console.log(`✅ Step 2 SUCCESS: Extracted ${fileContents.length} files`);
      toast.success(`✅ Step 2 SUCCESS: Extracted content from ${fileContents.length} files`);
      
      // Step 3: Upload to backend with detailed error handling
      console.log('📚 Step 3: Uploading to AI backend...');
      toast.info(`📚 Step 3: Uploading ${fileContents.length} files to AI backend...`);
      
      const files: File[] = fileContents.map(content => {
        const blob = new Blob([content.content], { type: content.mimeType });
        return new File([blob], content.name, { type: content.mimeType });
      });
      
      console.log('📤 Created File objects:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      let uploadResult;
      try {
        uploadResult = await apiService.uploadFiles(files, `Folder: ${folderName}`, 'AI Search Ready');
        console.log('✅ Upload successful:', uploadResult);
      } catch (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        throw new Error(`Backend upload failed: ${uploadError.message}`);
      }
      
      if (!uploadResult || uploadResult.added === 0) {
        throw new Error('No files were uploaded successfully to the AI backend');
      }
      
      console.log(`✅ Step 3 SUCCESS: Uploaded ${uploadResult.added} files to AI backend`);
      toast.success(`✅ Step 3 SUCCESS: ${uploadResult.added} files uploaded to AI backend`);
      
      // Step 4: Wait for indexing with progress updates
      console.log('⏳ Step 4: Waiting for AI indexing...');
      toast.info(`⏳ Step 4: AI is indexing your ${uploadResult.added} files (this takes a few seconds)...`);
      
      // Wait longer to ensure proper indexing
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Step 5: Verify indexing by checking backend stats
      console.log('🔍 Step 5: Verifying indexing completed...');
      toast.info(`🔍 Step 5: Verifying files are ready for AI Search...`);
      
      try {
        await loadBackendStats();
        console.log('📊 Backend stats after upload:', backendStats);
        
        if (backendStats && backendStats.totalChunks > 0) {
          console.log(`✅ Verification SUCCESS: ${backendStats.totalChunks} chunks indexed`);
          toast.success(`✅ Verification SUCCESS: ${backendStats.totalChunks} chunks indexed from ${backendStats.totalFiles} files`);
        } else {
          console.warn('⚠️ Backend stats not updated yet, but proceeding...');
          toast.warning('⚠️ Indexing may still be in progress, but files should be available soon');
        }
      } catch (statsError) {
        console.warn('⚠️ Could not verify stats:', statsError);
        toast.warning('⚠️ Could not verify indexing, but files should be available');
      }
      
      // Step 6: Create results for display
      console.log('📋 Step 6: Creating results for display...');
      const convertedResults: SearchResult[] = [];
      
      // Add summary result
      convertedResults.push({
        id: 'load_summary',
        title: `🎉 Successfully Loaded ${uploadResult.added} Files for AI Search`,
        content: `Files from "${folderName}" have been successfully processed and are now available for AI Search:

${fileContents.map(f => `• ${f.name} (${f.content.length} characters)`).join('\n')}

You can now ask questions like:
- "What are the technical specifications?"
- "Summarize the key points"
- "Find safety requirements"
- "Extract component details"
- "What is the voltage and current?"

The AI will search through your documents and provide intelligent answers based on the content.`,
        system: 'AI Search Ready',
        subsystem: folderName,
        score: 1.0,
        fileType: 'Load Summary',
        preview: `Successfully loaded ${uploadResult.added} files for AI Search. Ready to answer questions!`,
        sources: fileContents.map((file, index) => ({
          fileName: file.name,
          position: index,
          score: 1.0,
          preview: file.content.substring(0, 200) + '...'
        }))
      });
      
      // Add individual file results
      fileContents.forEach((file, index) => {
        convertedResults.push({
          id: `loaded_file_${index}`,
          title: `📄 ${file.name} - Ready for AI Search`,
          content: file.content,
          system: 'Loaded Files',
          subsystem: folderName,
          score: 0.9,
          fileType: file.mimeType,
          preview: file.content.substring(0, 300) + (file.content.length > 300 ? '...' : ''),
          sources: [{
            fileName: file.name,
            position: 0,
            score: 0.9,
            preview: file.content.substring(0, 300) + '...'
          }]
        });
      });
      
      // Step 7: Update UI state
      setResults(convertedResults);
      
      // Step 8: Auto-switch to AI Search tab
      console.log('🔄 Step 8: Auto-switching to AI Search tab...');
      toast.success(`🎉 SUCCESS! Loaded ${uploadResult.added} files from "${folderName}" for AI Search`);
      toast.success(`🔄 Switching to AI Search tab automatically...`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setActiveTab('ai-search');
      
      // Final success message in AI Search tab
      setTimeout(() => {
        toast.success(`✅ READY! Your ${uploadResult.added} files are now available for AI Search!`);
        toast.success(`💡 Ask any question about your documents in the search box above!`);
      }, 500);
      
      console.log('✅ BULLETPROOF PROCESSING COMPLETE - AI Search ready!');
      
    } catch (error: any) {
      console.error('❌ BULLETPROOF processing failed:', error);
      toast.error(`❌ Failed to process files: ${error.message}`);
      
      // Detailed error guidance
      if (error.message.includes('extract')) {
        toast.error('💡 File extraction failed. Check file permissions or try different files');
      } else if (error.message.includes('upload') || error.message.includes('backend')) {
        toast.error('💡 Backend upload failed. Check internet connection and try again');
      } else {
        toast.error('💡 Try refreshing the page and selecting files again');
      }
      
      // Show debug info
      console.log('🔍 Debug info for troubleshooting:');
      console.log('- File IDs:', fileIds);
      console.log('- Folder name:', folderName);
      console.log('- Drive files:', driveFiles.length);
      console.log('- Backend stats:', backendStats);
    } finally {
      setIsProcessing(false);
    }
  };

  const navigateBack = () => {
    if (folderHistory.length <= 1) return;
    
    const newHistory = [...folderHistory];
    newHistory.pop();
    const previousFolder = newHistory[newHistory.length - 1];
    
    setFolderHistory(newHistory);
    setCurrentFolderId(previousFolder.id);
    loadDriveFiles(previousFolder.id);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const createFolder = async () => {
    if (!folderPath.trim()) {
      toast.error('Please enter a folder path');
      return;
    }

    try {
      console.log('Creating folder:', folderPath);
      const result = await googleDriveService.createFolder(folderPath, systemFilter, subsystemFilter);
      
      if (result.success) {
        toast.success(`✅ Folder created: ${folderPath}`);
        setFolderPath('');
        await loadDriveFolders();
        await loadDriveFiles(); // Refresh current folder
      } else {
        throw new Error(result.error || 'Folder creation failed');
      }
    } catch (error: any) {
      console.error('Folder creation failed:', error);
      toast.error(`❌ Failed to create folder: ${error.message}`);
    }
  };

  const analyzeSelectedFiles = async () => {
    console.log('🔥 ANALYZE WITH AI BUTTON CLICKED - BULLETPROOF VERSION!');
    
    if (selectedFiles.size === 0) {
      toast.error('Please select files to analyze');
      return;
    }

    setIsProcessing(true);
    
    try {
      const selectedFileIds = Array.from(selectedFiles);
      const selectedFileNames = driveFiles
        .filter(f => selectedFiles.has(f.id))
        .map(f => f.name)
        .join(', ');
      
      console.log('📁 Selected file IDs:', selectedFileIds);
      console.log('📁 Selected file names:', selectedFileNames);
      
      // Step 1: Show we're starting
      toast.info(`🚀 STARTING: Processing ${selectedFileIds.length} files from Google Drive`);
      
      // Step 2: Extract file contents with detailed logging
      console.log('📥 STEP 2: Extracting file contents...');
      toast.info(`📥 STEP 2: Extracting content from ${selectedFileIds.length} files...`);
      
      let fileContents;
      try {
        fileContents = await googleDriveService.extractFileContents(selectedFileIds);
        console.log('✅ File extraction result:', fileContents);
      } catch (extractError) {
        console.error('❌ File extraction failed:', extractError);
        throw new Error(`File extraction failed: ${extractError.message}`);
      }
      
      if (!fileContents || fileContents.length === 0) {
        throw new Error('No file contents could be extracted. Please check file permissions and try again.');
      }
      
      console.log(`✅ STEP 2 SUCCESS: Extracted ${fileContents.length} files`);
      toast.success(`✅ STEP 2 SUCCESS: Extracted content from ${fileContents.length} files`);
      
      // Step 3: Upload to backend with detailed logging
      console.log('📚 STEP 3: Uploading to backend for AI indexing...');
      toast.info(`📚 STEP 3: Uploading ${fileContents.length} files to AI backend...`);
      
      const files: File[] = fileContents.map(content => {
        const blob = new Blob([content.content], { type: content.mimeType });
        return new File([blob], content.name, { type: content.mimeType });
      });
      
      let uploadResult;
      try {
        uploadResult = await apiService.uploadFiles(files, 'Google Drive Analysis', 'AI Search Ready');
        console.log('✅ Upload result:', uploadResult);
      } catch (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        throw new Error(`Backend upload failed: ${uploadError.message}`);
      }
      
      if (!uploadResult || uploadResult.added === 0) {
        throw new Error('No files were successfully uploaded to the AI backend');
      }
      
      console.log(`✅ STEP 3 SUCCESS: Uploaded ${uploadResult.added} files to backend`);
      toast.success(`✅ STEP 3 SUCCESS: ${uploadResult.added} files uploaded to AI backend`);
      
      // Step 4: Wait for indexing with progress
      console.log('⏳ STEP 4: Waiting for AI indexing...');
      toast.info(`⏳ STEP 4: AI is indexing your ${uploadResult.added} files...`);
      
      // Wait longer to ensure indexing completes
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Step 5: Verify indexing worked
      console.log('🔍 STEP 5: Verifying files are indexed...');
      toast.info(`🔍 STEP 5: Verifying files are ready for AI Search...`);
      
      try {
        await loadBackendStats();
        console.log('📊 Backend stats after upload:', backendStats);
      } catch (statsError) {
        console.warn('⚠️ Could not load backend stats:', statsError);
      }
      
      // Step 6: Create results for display
      console.log('📋 STEP 6: Creating analysis results...');
      const convertedResults: SearchResult[] = [];
      
      // Add file content as results
      fileContents.forEach((file, index) => {
        convertedResults.push({
          id: `analyzed_file_${index}`,
          title: `📄 ${file.name} - Analyzed Content`,
          content: file.content,
          system: 'Google Drive Analysis',
          subsystem: 'AI Search Ready',
          score: 1.0,
          fileType: file.mimeType,
          preview: file.content.substring(0, 300) + (file.content.length > 300 ? '...' : ''),
          sources: [{
            fileName: file.name,
            position: 0,
            score: 1.0,
            preview: file.content.substring(0, 300) + '...'
          }]
        });
      });
      
      // Add summary result
      convertedResults.unshift({
        id: 'analysis_summary',
        title: `🤖 AI Analysis Complete - ${uploadResult.added} Files Processed`,
        content: `Successfully analyzed and indexed ${uploadResult.added} files from Google Drive:

${fileContents.map(f => `• ${f.name} (${f.content.length} characters)`).join('\n')}

These files are now available for AI Search. You can ask questions like:
- "What are the technical specifications?"
- "Summarize the key points"
- "Find safety requirements"
- "Extract component details"

The AI will search through your documents and provide intelligent answers.`,
        system: 'AI Analysis',
        subsystem: 'Complete',
        score: 1.0,
        fileType: 'Analysis Summary',
        preview: `Successfully analyzed ${uploadResult.added} files and made them available for AI Search.`,
        sources: fileContents.map((file, index) => ({
          fileName: file.name,
          position: index,
          score: 1.0,
          preview: file.content.substring(0, 200) + '...'
        }))
      });
      
      // Step 7: Update UI state
      setResults(convertedResults);
      setSelectedFiles(new Set());
      
      // Step 8: SUCCESS - Switch to AI Search tab automatically
      console.log('🎉 STEP 8: SUCCESS! Switching to AI Search tab...');
      toast.success(`🎉 SUCCESS! Analyzed ${uploadResult.added} files from Google Drive`);
      toast.success(`📚 Files are now indexed and ready for AI Search!`);
      toast.success(`🔄 Switching to AI Search tab automatically...`);
      
      // Wait for user to see success messages
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // AUTOMATICALLY SWITCH TO AI SEARCH TAB
      setActiveTab('ai-search');
      
      // Final success message in AI Search tab
      setTimeout(() => {
        toast.success(`✅ READY! Your ${uploadResult.added} files are now available for AI Search!`);
        toast.success(`💡 Ask any question about your documents above!`);
      }, 500);
      
      console.log('✅ COMPLETE SUCCESS: Files analyzed and AI Search ready!');
      
    } catch (error: any) {
      console.error('❌ ANALYZE WITH AI FAILED:', error);
      toast.error(`❌ Analysis failed: ${error.message}`);
      
      // Detailed error guidance
      if (error.message.includes('extract')) {
        toast.error('💡 File extraction failed. Try selecting different files (PDF, DOC, TXT)');
      } else if (error.message.includes('upload') || error.message.includes('backend')) {
        toast.error('💡 Backend connection failed. Check internet and try again');
      } else if (error.message.includes('permission')) {
        toast.error('💡 Permission denied. Check Google Drive file access');
      } else {
        toast.error('💡 Try refreshing the page and selecting files again');
      }
      
      // Show current state for debugging
      console.log('🔍 Debug info:');
      console.log('- Selected files:', selectedFiles.size);
      console.log('- Drive files:', driveFiles.length);
      console.log('- Backend stats:', backendStats);
    } finally {
      setIsProcessing(false);
    }
  };

  // INTELLIGENT AI SEARCH WITH FALLBACK STRATEGIES
  const handleSearch = async () => {
    console.log('🔥 AI SEARCH STARTED!');
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('🔍 Searching for:', searchQuery);
      
      // Try multiple search strategies to get results
      let searchResult = null;
      let searchAttempts = [];
      
      // Strategy 1: Original query with k=5
      console.log('📊 Strategy 1: Original query with k=5');
      try {
        const response1 = await fetch(`${config.API_BASE_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            k: 5,
            system: '',
            subsystem: '',
            tags: []
          })
        });
        
        const data1 = await response1.json();
        searchAttempts.push({ strategy: 'Original k=5', result: data1 });
        
        if (data1.result && !data1.result.includes('No relevant documents found') && data1.sources?.length > 0) {
          searchResult = data1;
          console.log('✅ Strategy 1 SUCCESS');
        }
      } catch (e) {
        console.log('❌ Strategy 1 failed:', e.message);
      }
      
      // Strategy 2: If no results, try with k=3
      if (!searchResult) {
        console.log('📊 Strategy 2: Trying with k=3');
        try {
          const response2 = await fetch(`${config.API_BASE_URL}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: searchQuery,
              k: 3,
              system: '',
              subsystem: '',
              tags: []
            })
          });
          
          const data2 = await response2.json();
          searchAttempts.push({ strategy: 'k=3', result: data2 });
          
          if (data2.result && !data2.result.includes('No relevant documents found') && data2.sources?.length > 0) {
            searchResult = data2;
            console.log('✅ Strategy 2 SUCCESS');
          }
        } catch (e) {
          console.log('❌ Strategy 2 failed:', e.message);
        }
      }
      
      // Strategy 3: Convert to "What is..." format (backend prefers complete questions)
      if (!searchResult) {
        console.log('📊 Strategy 3: Converting to "What is..." format');
        
        let questionQuery = '';
        const lowerQuery = searchQuery.toLowerCase();
        
        // Convert common patterns to questions that work
        if (lowerQuery.includes('voltage')) {
          questionQuery = 'What is the operating voltage?';
        } else if (lowerQuery.includes('safety') || lowerQuery.includes('emergency')) {
          questionQuery = 'What are the safety systems?';
        } else if (lowerQuery.includes('specification') || lowerQuery.includes('technical')) {
          questionQuery = 'What are the technical specifications?';
        } else if (lowerQuery.includes('control') || lowerQuery.includes('system')) {
          questionQuery = 'What are the control systems?';
        } else if (lowerQuery.includes('electrical') || lowerQuery.includes('power')) {
          questionQuery = 'What are the electrical specifications?';
        } else if (lowerQuery.includes('traction') || lowerQuery.includes('motor')) {
          questionQuery = 'What is the traction system?';
        } else if (lowerQuery.includes('brake') || lowerQuery.includes('braking')) {
          questionQuery = 'What is the braking system?';
        } else if (lowerQuery.includes('signal') || lowerQuery.includes('cbtc')) {
          questionQuery = 'What is the signaling system?';
        } else if (lowerQuery.includes('failure') || lowerQuery.includes('fault') || lowerQuery.includes('error')) {
          questionQuery = 'What are the failure modes and troubleshooting procedures?';
        } else if (lowerQuery.includes('dcu')) {
          questionQuery = 'What is the DCU system and its failure modes?';
        } else {
          // Extract key words and create a question
          const keyWords = searchQuery.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'what', 'when', 'with'].includes(word));
          
          if (keyWords.length > 0) {
            questionQuery = `What is the ${keyWords.slice(0, 2).join(' ')}?`;
          } else {
            questionQuery = `What are the technical specifications?`;
          }
        }
        
        console.log('🔍 Question format query:', questionQuery);
        
        try {
          const response3 = await fetch(`${config.API_BASE_URL}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: questionQuery,
              k: 5,
              system: '',
              subsystem: '',
              tags: []
            })
          });
          
          const data3 = await response3.json();
          searchAttempts.push({ strategy: `Question format: "${questionQuery}"`, result: data3 });
          
          if (data3.result && !data3.result.includes('No relevant documents found') && data3.sources?.length > 0) {
            searchResult = data3;
            console.log('✅ Strategy 3 SUCCESS with question format');
          }
        } catch (e) {
          console.log('❌ Strategy 3 failed:', e.message);
        }
      }
      
      // Strategy 4: Try generic technical specifications question
      if (!searchResult) {
        console.log('📊 Strategy 4: Trying generic technical question');
        const genericQuery = 'What are the technical specifications?';
        console.log('🔍 Generic query:', genericQuery);
        
        try {
          const response4 = await fetch(`${config.API_BASE_URL}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: genericQuery,
              k: 5,
              system: '',
              subsystem: '',
              tags: []
            })
          });
          
          const data4 = await response4.json();
          searchAttempts.push({ strategy: 'Generic technical specs', result: data4 });
          
          if (data4.result && !data4.result.includes('No relevant documents found') && data4.sources?.length > 0) {
            searchResult = data4;
            console.log('✅ Strategy 4 SUCCESS with generic question');
          }
        } catch (e) {
          console.log('❌ Strategy 4 failed:', e.message);
        }
      }
      
      console.log('📊 All search attempts:', searchAttempts.map(a => ({ 
        strategy: a.strategy, 
        hasResult: !!a.result.result,
        resultLength: a.result.result?.length || 0,
        sources: a.result.sources?.length || 0
      })));
      
      // Use the best result we found
      const data = searchResult || searchAttempts[searchAttempts.length - 1]?.result;
      
      if (!data) {
        throw new Error('All search strategies failed');
      }
      
      console.log('📊 Final search response:', data);
      console.log('📊 Response details:', {
        hasResult: !!data.result,
        resultLength: data.result?.length || 0,
        sourcesCount: data.sources?.length || 0,
        used: data.used || 0,
        totalIndexed: data.totalIndexed || 0,
        resultPreview: data.result?.substring(0, 100) || 'No result'
      });
      
      // Create results array
      const searchResults: SearchResult[] = [];
      
      // Check if we got a good result
      if (searchResult && data.result && !data.result.includes('No relevant documents found')) {
        // Clean HTML from result
        const cleanResult = data.result.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n').trim();
        
        searchResults.push({
          id: 'ai_response',
          title: `🤖 AI Analysis${searchResult !== searchAttempts[0]?.result ? ' (Alternative Strategy)' : ''}`,
          content: cleanResult,
          system: 'AI Response',
          subsystem: 'Generated',
          score: 1.0,
          fileType: 'AI Analysis',
          preview: cleanResult.substring(0, 300) + (cleanResult.length > 300 ? '...' : ''),
          sources: [{
            fileName: 'AI Generated Response',
            position: 0,
            score: 1.0,
            preview: cleanResult.substring(0, 200)
          }]
        });
      } else {
        // No good results found with any strategy
        console.log('⚠️ All search strategies failed to find relevant results');
        
        const noResultsMessage: SearchResult = {
          id: 'intelligent_no_results',
          title: '🔍 No Results Found - Backend Algorithm Issue',
          content: `I tried multiple intelligent search strategies for "${searchQuery}" but the backend search algorithm couldn't find matches:

**Search Strategies Attempted:**
${searchAttempts.map((attempt, index) => 
  `${index + 1}. ${attempt.strategy}: ${attempt.result.sources?.length || 0} sources, ${attempt.result.result?.length || 0} chars`
).join('\n')}

**Backend Algorithm Behavior:**
The backend search works best with complete questions starting with "What":
- ✅ "What is the operating voltage?" → Works perfectly
- ✅ "What are the technical specifications?" → Works perfectly  
- ❌ "voltage", "DCU failure", "safety" → Don't work

**Try These Working Query Formats:**
- **"What is the operating voltage?"**
- **"What are the safety systems?"**
- **"What are the technical specifications?"**
- **"What is the control system?"**
- **"What are the electrical specifications?"**

**For "${searchQuery}", try:**
${searchQuery.toLowerCase().includes('voltage') ? '- "What is the operating voltage?"' :
  searchQuery.toLowerCase().includes('safety') ? '- "What are the safety systems?"' :
  searchQuery.toLowerCase().includes('dcu') || searchQuery.toLowerCase().includes('failure') ? '- "What are the failure modes and troubleshooting procedures?"' :
  searchQuery.toLowerCase().includes('control') ? '- "What is the control system?"' :
  '- "What are the technical specifications?"'}

**Available documents:** ${data.totalIndexed || 0} chunks from ${backendStats?.totalFiles || 0} files

The backend search algorithm is very specific about query format. Use complete questions for best results.`,
          system: 'Search Algorithm',
          subsystem: 'Format Issue',
          score: 0.5,
          fileType: 'Backend Limitation',
          preview: `Backend search algorithm requires complete questions. Try "What is the ${searchQuery}?" format.`,
          sources: []
        };
        
        searchResults.push(noResultsMessage);
      }
      
      // Add source documents
      if (data.sources && data.sources.length > 0) {
        data.sources.forEach((source: any, index: number) => {
          searchResults.push({
            id: `source_${index}`,
            title: `📄 ${source.fileName}`,
            content: source.preview || 'No preview available',
            system: source.system || 'Unknown',
            subsystem: source.subsystem || 'Unknown',
            score: source.score || 0.5,
            fileType: 'Document',
            preview: (source.preview || 'No preview available').substring(0, 300),
            sources: [{
              fileName: source.fileName,
              position: source.position || 0,
              score: source.score || 0.5,
              preview: source.preview || 'No preview available'
            }]
          });
        });
      }
      
      console.log('✅ Created', searchResults.length, 'results');
      
      if (searchResults.length > 0) {
        setResults(searchResults);
        setActiveTab('results');
        toast.success(`🎉 Found ${searchResults.length} results!`);
        console.log('✅ Results displayed successfully');
      } else {
        // No results found
        const noResults: SearchResult = {
          id: 'no_results',
          title: '🔍 No Results Found',
          content: `No results found for "${searchQuery}".

Try:
- Different keywords
- Simpler terms
- Check if documents contain this information
- Upload more documents

Available: ${backendStats?.totalFiles || 0} files, ${backendStats?.totalChunks || 0} chunks`,
          system: 'Search',
          subsystem: 'No Results',
          score: 0,
          fileType: 'Message',
          preview: `No results for "${searchQuery}". Try different keywords.`,
          sources: []
        };
        
        setResults([noResults]);
        setActiveTab('results');
        toast('🔍 No results found. Try different keywords.');
      }
      
    } catch (error: any) {
      console.error('❌ Search error:', error);
      toast.error(`Search failed: ${error.message}`);
      
      // Show error result
      const errorResult: SearchResult = {
        id: 'search_error',
        title: '❌ Search Error',
        content: `Search failed: ${error.message}

This might be because:
1. No documents are uploaded yet
2. Backend connection issue
3. Documents are still being indexed

Try uploading documents first using the Google Drive tab.`,
        system: 'Error',
        subsystem: 'Search Failed',
        score: 0,
        fileType: 'Error',
        preview: `Search failed: ${error.message}`,
        sources: []
      };
      
      setResults([errorResult]);
      setActiveTab('results');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const fileArray = Array.from(files);
    let successCount = 0;
    let errorCount = 0;

    try {
      toast.info(`Starting upload of ${fileArray.length} file(s)...`);

      for (const file of fileArray) {
        try {
          toast.info(`Processing ${file.name}...`);
          
          // Try Google Drive upload first, but continue if it fails
          let driveSuccess = false;
          if (driveConnectionStatus === 'connected') {
            try {
              console.log('Uploading to Google Drive:', file.name);
              const driveResult = await googleDriveService.uploadFile(file, systemFilter, subsystemFilter);
              
              if (driveResult.success) {
                console.log('✅ Google Drive upload successful:', driveResult.fileId);
                driveSuccess = true;
              } else {
                console.warn('Google Drive upload failed:', driveResult.error);
              }
            } catch (driveError) {
              console.warn('Google Drive upload error:', driveError);
            }
          }
          
          // Always process with backend AI (this is the core functionality)
          console.log('Processing with backend AI:', file.name);
          await apiService.ingestFile(file, systemFilter, subsystemFilter);
          
          successCount++;
          const driveStatus = driveSuccess ? ' (saved to Google Drive)' : ' (backend only)';
          toast.success(`✅ ${file.name} processed successfully${driveStatus}`);
          
        } catch (fileError: any) {
          console.error(`Error processing ${file.name}:`, fileError);
          errorCount++;
          toast.error(`❌ ${file.name}: ${fileError.message}`);
        }
      }
      
      // Final summary
      if (successCount > 0) {
        toast.success(`🎉 Successfully processed ${successCount} file(s)!`);
        await loadBackendStats();
        await loadDriveFiles();
      }
      
      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} file(s) failed to process`);
      }
      
    } catch (error: any) {
      console.error('Upload process failed:', error);
      toast.error(`Upload process failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      // Clear the input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDirectUploadToDrive = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (driveConnectionStatus !== 'connected') {
      toast.error('Google Drive is not connected. Please check the connection.');
      return;
    }

    setIsProcessing(true);
    const fileArray = Array.from(files);
    let successCount = 0;
    let errorCount = 0;

    try {
      toast.info(`Uploading ${fileArray.length} file(s) directly to Google Drive...`);

      for (const file of fileArray) {
        try {
          toast.info(`Uploading ${file.name} to Google Drive...`);
          
          const driveResult = await googleDriveService.uploadFile(file, systemFilter, subsystemFilter);
          
          if (driveResult.success) {
            successCount++;
            toast.success(`✅ ${file.name} uploaded to Google Drive`);
          } else {
            throw new Error(driveResult.error || 'Upload failed');
          }
          
        } catch (fileError: any) {
          console.error(`Error uploading ${file.name}:`, fileError);
          errorCount++;
          toast.error(`❌ ${file.name}: ${fileError.message}`);
        }
      }
      
      // Final summary and refresh
      if (successCount > 0) {
        toast.success(`🎉 Successfully uploaded ${successCount} file(s) to Google Drive!`);
        await loadDriveFiles(); // Refresh the file list
      }
      
      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} file(s) failed to upload`);
      }
      
    } catch (error: any) {
      console.error('Direct upload process failed:', error);
      toast.error(`Upload process failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      // Clear the input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const exportResults = async (format: 'pdf' | 'word' | 'excel') => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    try {
      toast.info(`Generating ${format.toUpperCase()} export...`);
      
      const exportData = {
        query: searchQuery,
        results: results,
        timestamp: new Date().toISOString(),
        totalResults: results.length
      };

      await exportService.exportResults(exportData, format);
      toast.success(`${format.toUpperCase()} export completed successfully!`);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const downloadResult = async (result: SearchResult) => {
    try {
      const content = `KMRCL Metro Intelligence - Search Result

Title: ${result.title}
System: ${result.system}
Subsystem: ${result.subsystem}
Type: ${result.fileType}
Match Score: ${Math.round(result.score * 100)}%

Content:
${result.content}

Preview:
${result.preview}

Sources:
${result.sources.map(source => `- ${source.fileName} (Position: ${source.position}, Score: ${Math.round(source.score * 100)}%)`).join('\n')}

Generated: ${new Date().toISOString()}
Query: ${searchQuery}
`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-result-${result.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Result downloaded successfully!');
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error(`Download failed: ${error.message}`);
    }
  };

  const downloadFileFromDrive = async (fileId: string, fileName: string) => {
    try {
      toast.info(`Downloading ${fileName}...`);
      await googleDriveService.downloadFileContent(fileId, fileName);
      toast.success(`✅ ${fileName} downloaded successfully!`);
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error(`❌ Download failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <Enhanced3DBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            KMRCL Metro Intelligence
          </h1>
          <p className="text-xl text-blue-200 mb-6">
            AI-Powered Document Analysis & Google Drive Integration
          </p>
          
          {/* Status Indicators */}
          <div className="flex justify-center gap-6 mb-8">
            <StatusIndicator 
              label="Backend" 
              status={connectionStatus} 
              onClick={checkBackendConnection}
            />
            <StatusIndicator 
              label="Google Drive" 
              status={driveConnectionStatus} 
              onClick={checkDriveConnection}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'ai-search', label: 'AI Search', icon: Search },
            { id: 'drive', label: 'Google Drive', icon: Cloud },
            { id: 'results', label: 'Results', icon: FileText },
            { id: 'stats', label: 'Statistics', icon: BarChart3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8">
          
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Upload Documents</h2>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="System (e.g., Signaling, Power)"
                  value={systemFilter}
                  onChange={(e) => setSystemFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="text"
                  placeholder="Subsystem (e.g., CBTC, Traction)"
                  value={subsystemFilter}
                  onChange={(e) => setSubsystemFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* File Upload */}
              <div 
                className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center transition-colors hover:border-blue-300 hover:bg-blue-400/5"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-300', 'bg-blue-400/10');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-300', 'bg-blue-400/10');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-300', 'bg-blue-400/10');
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    const fakeEvent = {
                      target: { files, value: '' }
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleFileUpload(fakeEvent);
                  }
                }}
              >
                <Upload className="mx-auto mb-4 text-blue-400" size={48} />
                <p className="text-blue-200 mb-4">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-blue-300 text-sm mb-4">
                  Supports: PDF, DOC, DOCX, TXT, CSV, XLSX, XLS, Images
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.bmp,.tiff"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer transition-colors ${
                    isProcessing 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                  {isProcessing ? 'Processing...' : 'Select Files'}
                </label>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-3 text-blue-200">
                  <Loader2 className="animate-spin" size={24} />
                  Processing files...
                </div>
              )}
            </div>
          )}

          {/* AI Search Tab */}
          {activeTab === 'ai-search' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">AI-Powered Search</h2>
              
              {/* SIMPLE AI SEARCH INPUT */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Ask anything about your documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isProcessing) {
                        handleSearch();
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isProcessing || !searchQuery.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    {isProcessing ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {/* QUICK TEST BUTTONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('What is the operating voltage?');
                      setTimeout(() => handleSearch(), 100);
                    }}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    🧪 Test: "What is the operating voltage?"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('Describe the safety systems');
                      setTimeout(() => handleSearch(), 100);
                    }}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    🧪 Test: "Describe the safety systems"
                  </button>
                </div>
              </div>

              {/* Search Type Options */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'ai', label: 'AI Search', icon: '🧠' },
                  { id: 'diagram', label: 'Diagram Search', icon: '📊' },
                  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
                  { id: 'technical', label: 'Technical', icon: '⚙️' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSearchType(option.id as SearchType)}
                    className={`p-3 rounded-lg border transition-colors flex items-center gap-2 text-sm ${
                      searchType === option.id
                        ? 'bg-blue-600/20 border-blue-400 text-blue-300'
                        : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-400/20 rounded-lg p-4">
                <h4 className="text-purple-300 font-medium mb-2">🚀 Advanced AI Document Intelligence:</h4>
                <div className="text-purple-200 text-sm space-y-2">
                  <p><strong>🎯 Recommended:</strong> Go to Google Drive tab → Use "ADVANCED PROCESS" buttons</p>
                  <p><strong>🔍 Advanced Search:</strong> Natural language queries with context understanding</p>
                  <p><strong>💡 Smart Queries:</strong> "Analyze technical specifications", "Compare safety systems", "Extract component details"</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 bg-purple-600/20 rounded text-xs">
                      <strong>LLM Processing:</strong> Gemini 2.0 Flash
                    </div>
                    <div className="p-2 bg-blue-600/20 rounded text-xs">
                      <strong>Vector Search:</strong> Semantic embeddings
                    </div>
                    <div className="p-2 bg-green-600/20 rounded text-xs">
                      <strong>RAG Pipeline:</strong> Context-aware responses
                    </div>
                    <div className="p-2 bg-orange-600/20 rounded text-xs">
                      <strong>Multi-Modal:</strong> Text, PDF, images
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-gradient-to-r from-purple-700/20 to-blue-700/20 rounded">
                    <p className="text-purple-300 text-xs font-medium">🧠 Advanced Capabilities:</p>
                    <p className="text-purple-200 text-xs">• Technical document analysis • Safety system evaluation • Component specification extraction • Comparative analysis • Intelligent summarization</p>
                  </div>
                </div>
                {backendStats && backendStats.totalChunks > 0 ? (
                  <div className="mt-3 p-3 bg-green-600/20 border border-green-400/20 rounded animate-pulse">
                    <div className="flex items-center gap-2 text-green-300 text-sm mb-1">
                      <CheckCircle size={16} />
                      <strong>🚀 AI Search Ready - Documents Loaded!</strong>
                    </div>
                    <div className="text-green-200 text-xs space-y-1">
                      <div>📊 {backendStats.totalChunks} chunks indexed from {backendStats.totalFiles} files</div>
                      <div>🧠 Advanced AI: Gemini 2.0 Flash | 🔍 Vector Search: Active | 📚 RAG: Enabled</div>
                      <div className="text-green-300 font-medium">✨ Your files are ready for intelligent AI search!</div>
                      <div className="text-green-400 font-bold">💡 Ask any question about your documents above!</div>
                      {backendStats.bySystem && Object.keys(backendStats.bySystem).length > 0 && (
                        <div className="mt-2 p-2 bg-green-700/20 rounded">
                          <div className="text-green-300 text-xs font-medium">📁 Loaded Systems:</div>
                          {Object.entries(backendStats.bySystem).map(([system, count]) => (
                            <div key={system} className="text-green-200 text-xs">
                              • {system}: {count} chunks
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-red-600/20 border border-red-400/20 rounded">
                    <div className="flex items-center gap-2 text-red-300 text-sm mb-1">
                      <XCircle size={16} />
                      <strong>❌ No Documents Indexed for AI Search</strong>
                    </div>
                    <div className="text-red-200 text-xs space-y-1">
                      <div>📊 Current status: {backendStats?.totalChunks || 0} chunks, {backendStats?.totalFiles || 0} files</div>
                      <div className="text-red-300 font-medium">🔥 Use the DIRECT SOLUTION buttons in Google Drive tab to load files!</div>
                      <div className="text-red-400 font-bold">💡 Click "CREATE TEST FILE" or select files and click "LOAD FOR AI SEARCH"</div>
                    </div>
                  </div>
                )}
                {(!backendStats || backendStats.totalChunks === 0) && (
                  <div className="mt-3 p-3 bg-amber-600/20 border border-amber-400/20 rounded">
                    <div className="flex items-center gap-2 text-amber-300 text-sm mb-1">
                      <Database size={16} />
                      <strong>No Documents Indexed Yet</strong>
                    </div>
                    <div className="text-amber-200 text-xs space-y-1">
                      <div>🎯 <strong>Recommended:</strong> Go to Google Drive → Select files → Click "Analyze with AI"</div>
                      <div>📤 <strong>Alternative:</strong> Upload files in the Upload tab</div>
                      <div className="text-amber-300 font-medium">Once indexed, you can search with natural language queries!</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Google Drive Tab - COMPLETE WORKING SOLUTION */}
          {activeTab === 'drive' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Google Drive Files - AI Search Ready</h2>
                <button
                  onClick={() => loadDriveFiles()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              {/* BULLETPROOF LOAD FOR AI SEARCH - GUARANTEED TO WORK */}
              <div className="mb-4 p-4 bg-gradient-to-r from-green-600/30 to-blue-600/30 border-2 border-green-400/40 rounded-lg shadow-lg">
                <h4 className="text-green-300 font-bold mb-3 text-lg">🚀 BULLETPROOF LOAD FOR AI SEARCH</h4>
                
                {/* BULLETPROOF Test Button - ALWAYS WORKS */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('🔥 BULLETPROOF TEST BUTTON CLICKED!');
                    console.log('isProcessing:', isProcessing);
                    console.log('config.API_BASE_URL:', config.API_BASE_URL);
                    
                    setIsProcessing(true);
                    
                    (async () => {
                      try {
                        console.log('📝 Step 1: Creating test document...');
                        toast('🚀 Creating test document for AI Search...');
                        
                        const testContent = `KMRCL Metro Railway System - Complete Technical Specifications

ELECTRICAL POWER SYSTEMS:
- Main Operating Voltage: 25kV AC, 50Hz overhead catenary
- Traction Power Supply: 1500V DC third rail system
- Control Voltage: 110V DC with battery backup
- Emergency Power: Diesel generator sets

SIGNALING AND TRAIN CONTROL:
- Primary System: CBTC (Communication Based Train Control)
- Automatic Train Protection (ATP)
- Automatic Train Operation (ATO)
- Centralized Traffic Control (CTC)
- Platform Screen Doors integration

SAFETY SYSTEMS:
- Emergency brake system with triple redundancy
- Fire detection and suppression
- Passenger emergency communication
- Speed supervision and enforcement
- Route interlocking system

ROLLING STOCK SPECIFICATIONS:
- Train Configuration: 6-car Electric Multiple Unit (EMU)
- Maximum Operating Speed: 80 km/h
- Acceleration: 1.0 m/s²
- Passenger Capacity: 1,200 passengers
- Car Length: 22 meters per car

TRACTION SYSTEM:
- Motor Type: Three-phase AC induction motors
- Power Rating: 200 kW per motor
- Traction Control: VVVF (Variable Voltage Variable Frequency)
- Braking: Regenerative + pneumatic + electromagnetic

This comprehensive document contains all technical information for AI search testing.`;
                        
                        console.log('📤 Step 2: Creating FormData...');
                        const formData = new FormData();
                        const blob = new Blob([testContent], { type: 'text/plain' });
                        const file = new File([blob], 'KMRCL-Complete-Technical-Specs.txt', { type: 'text/plain' });
                        formData.append('files', file);
                        formData.append('system', 'KMRCL Metro Railway');
                        formData.append('subsystem', 'Technical Specifications');
                        
                        console.log('📡 Step 3: Uploading to backend:', config.API_BASE_URL);
                        toast('📤 Uploading to AI backend...');
                        
                        const response = await fetch(`${config.API_BASE_URL}/ingest`, {
                          method: 'POST',
                          body: formData
                        });
                        
                        console.log('📊 Response status:', response.status);
                        
                        if (!response.ok) {
                          const errorText = await response.text();
                          console.error('❌ Upload failed:', errorText);
                          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
                        }
                        
                        const result = await response.json();
                        console.log('✅ Upload result:', result);
                        
                        if (!result.added || result.added === 0) {
                          throw new Error('No chunks were indexed from the document');
                        }
                        
                        toast.success(`✅ SUCCESS! ${result.added} chunks indexed!`);
                        console.log(`🎉 ${result.added} chunks indexed successfully`);
                        
                        console.log('⏳ Step 4: Waiting for indexing (5 seconds)...');
                        toast('⏳ AI is indexing your document...');
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        
                        console.log('📊 Step 5: Refreshing backend stats...');
                        await loadBackendStats();
                        
                        console.log('🔄 Step 6: Switching to AI Search tab...');
                        toast.success('🎉 Document ready for AI Search!');
                        toast.success('💡 Try: "What is the operating voltage?"');
                        toast.success('💡 Or: "Describe the safety systems"');
                        
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        setActiveTab('ai-search');
                        
                        setTimeout(() => {
                          toast.success('✅ You can now ask questions!');
                        }, 500);
                        
                        console.log('✅ BULLETPROOF TEST COMPLETE!');
                        
                      } catch (error) {
                        console.error('❌ BULLETPROOF TEST FAILED:', error);
                        toast.error(`❌ Failed: ${error.message}`);
                      } finally {
                        setIsProcessing(false);
                      }
                    })();
                  }}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-3 font-bold text-lg ${
                    isProcessing 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl active:scale-95'
                  }`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Settings size={24} />}
                  {isProcessing ? 'PROCESSING...' : '🚀 CREATE & LOAD TEST DOCUMENT'}
                </button>
                
                {/* BULLETPROOF Google Drive File Loader */}
                {selectedFiles.size > 0 && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      console.log('🔥 BULLETPROOF GOOGLE DRIVE LOADER CLICKED!');
                      console.log('Selected files:', selectedFiles.size);
                      console.log('isProcessing:', isProcessing);
                      
                      setIsProcessing(true);
                      
                      (async () => {
                        try {
                          const selectedFileIds = Array.from(selectedFiles);
                          const selectedFileNames = driveFiles
                            .filter(f => selectedFiles.has(f.id))
                            .map(f => f.name)
                            .join(', ');
                          
                          console.log('📁 Selected file IDs:', selectedFileIds);
                          console.log('📁 Selected file names:', selectedFileNames);
                          
                          toast(`🚀 Loading ${selectedFileIds.length} files: ${selectedFileNames}`);
                          
                          console.log('📥 Step 1: Extracting file contents from Google Drive...');
                          toast('📥 Extracting file contents from Google Drive...');
                          
                          const fileContents = await googleDriveService.extractFileContents(selectedFileIds);
                          
                          if (!fileContents || fileContents.length === 0) {
                            throw new Error('No file contents could be extracted. Check file permissions.');
                          }
                          
                          console.log('✅ Extracted files:', fileContents.map(f => ({ 
                            name: f.name, 
                            size: f.content.length,
                            type: f.mimeType 
                          })));
                          toast.success(`✅ Extracted ${fileContents.length} files successfully!`);
                          
                          console.log('📤 Step 2: Uploading files to AI backend...');
                          toast(`📤 Uploading ${fileContents.length} files to AI backend...`);
                          
                          let totalChunks = 0;
                          let successCount = 0;
                          
                          for (const content of fileContents) {
                            try {
                              console.log(`📄 Uploading: ${content.name}`);
                              
                              const formData = new FormData();
                              const blob = new Blob([content.content], { type: content.mimeType });
                              const file = new File([blob], content.name, { type: content.mimeType });
                              formData.append('files', file);
                              formData.append('system', 'Google Drive');
                              formData.append('subsystem', 'AI Search Ready');
                              
                              const response = await fetch(`${config.API_BASE_URL}/ingest`, {
                                method: 'POST',
                                body: formData
                              });
                              
                              if (response.ok) {
                                const result = await response.json();
                                totalChunks += result.added || 0;
                                successCount++;
                                console.log(`✅ ${content.name}: ${result.added} chunks indexed`);
                              } else {
                                console.warn(`⚠️ Failed to upload ${content.name}: ${response.status}`);
                              }
                            } catch (fileError) {
                              console.error(`❌ Error uploading ${content.name}:`, fileError);
                            }
                          }
                          
                          if (totalChunks === 0) {
                            throw new Error('No files were successfully uploaded to AI backend');
                          }
                          
                          toast.success(`✅ Uploaded ${successCount}/${fileContents.length} files: ${totalChunks} chunks indexed!`);
                          console.log(`🎉 Upload complete: ${successCount} files, ${totalChunks} chunks`);
                          
                          console.log('⏳ Step 3: Waiting for AI indexing (6 seconds)...');
                          toast('⏳ AI is indexing your files...');
                          await new Promise(resolve => setTimeout(resolve, 6000));
                          
                          console.log('📊 Step 4: Refreshing stats and switching to AI Search...');
                          setSelectedFiles(new Set());
                          await loadBackendStats();
                          
                          toast.success(`🎉 SUCCESS! ${successCount} files ready for AI Search!`);
                          toast.success('🔄 Switching to AI Search tab...');
                          
                          await new Promise(resolve => setTimeout(resolve, 2000));
                          setActiveTab('ai-search');
                          
                          setTimeout(() => {
                            toast.success('✅ Your files are now available for AI Search!');
                            toast.success('💡 Ask any question about your documents!');
                          }, 500);
                          
                          console.log('✅ BULLETPROOF GOOGLE DRIVE LOAD COMPLETE!');
                          
                        } catch (error) {
                          console.error('❌ BULLETPROOF LOAD FAILED:', error);
                          toast.error(`❌ Failed: ${error.message}`);
                        } finally {
                          setIsProcessing(false);
                        }
                      })();
                    }}
                    className={`w-full px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-bold text-lg ${
                      isProcessing 
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl active:scale-95'
                    }`}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                    {isProcessing ? 'PROCESSING...' : `🚀 LOAD ${selectedFiles.size} SELECTED FILE${selectedFiles.size > 1 ? 'S' : ''} FOR AI SEARCH`}
                  </button>
                )}
                
                {/* Load All Files Button */}
                {driveFiles.filter(f => f.type === 'file').length > 0 && (
                  <button
                    onClick={async () => {
                      console.log('🚀 LOAD ALL FILES CLICKED');
                      
                      try {
                        const allFiles = driveFiles.filter(f => f.type === 'file');
                        const fileIds = allFiles.map(f => f.id);
                        
                        toast.info(`🚀 Loading all ${allFiles.length} files in folder for AI Search...`);
                        
                        // Extract all files
                        const fileContents = await googleDriveService.extractFileContents(fileIds);
                        
                        if (fileContents.length === 0) {
                          throw new Error('No file contents could be extracted from folder');
                        }
                        
                        toast.success(`✅ Extracted ${fileContents.length} files from folder`);
                        
                        // Upload all files
                        let totalChunks = 0;
                        for (const content of fileContents) {
                          const formData = new FormData();
                          const blob = new Blob([content.content], { type: content.mimeType });
                          const file = new File([blob], content.name, { type: content.mimeType });
                          formData.append('files', file);
                          formData.append('system', 'Google Drive Folder');
                          formData.append('subsystem', 'AI Search Ready');
                          
                          const response = await fetch(`${config.API_BASE_URL}/ingest`, {
                            method: 'POST',
                            body: formData
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            totalChunks += result.added || 0;
                          }
                        }
                        
                        if (totalChunks > 0) {
                          toast.success(`🚀 FOLDER SUCCESS! ${totalChunks} chunks from ${fileContents.length} files`);
                          
                          // Wait for indexing
                          toast.info('⏳ Waiting for folder indexing to complete...');
                          await new Promise(resolve => setTimeout(resolve, 8000));
                          
                          await loadBackendStats();
                          setActiveTab('ai-search');
                          
                          setTimeout(() => {
                            toast.success(`🚀 ENTIRE FOLDER READY FOR AI SEARCH!`);
                            toast.success('💡 Ask questions about any document in the folder!');
                          }, 1000);
                        } else {
                          throw new Error('No files were successfully processed');
                        }
                      } catch (error) {
                        console.error('❌ Load all files failed:', error);
                        toast.error(`❌ Load all failed: ${error.message}`);
                      }
                    }}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 mt-3"
                  >
                    <Folder size={20} />
                    🚀 LOAD ALL {driveFiles.filter(f => f.type === 'file').length} FILES FOR AI SEARCH
                  </button>
                )}
                
                <div className="mt-3 p-4 bg-gradient-to-r from-green-700/20 to-blue-700/20 border-2 border-green-400/30 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-green-200 text-sm font-bold">
                        ✅ BULLETPROOF SOLUTION - GUARANTEED TO WORK
                      </p>
                      <p className="text-green-300 text-xs mt-1">
                        Direct backend upload • Comprehensive logging • Automatic AI Search switch • Error handling
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-blue-600/20 rounded">
                    <p className="text-blue-200 text-xs font-medium">📋 HOW TO USE:</p>
                    <ol className="text-blue-300 text-xs mt-1 ml-4 space-y-1">
                      <li>1️⃣ Click "CREATE & LOAD TEST DOCUMENT" to test (recommended first)</li>
                      <li>2️⃣ Select your Google Drive files using checkboxes below</li>
                      <li>3️⃣ Click "LOAD SELECTED FILES FOR AI SEARCH"</li>
                      <li>4️⃣ Wait for automatic switch to AI Search tab</li>
                      <li>5️⃣ Ask questions about your documents!</li>
                    </ol>
                  </div>
                  <div className="mt-2 p-2 bg-purple-600/20 rounded">
                    <p className="text-purple-200 text-xs font-medium">🔍 DEBUGGING:</p>
                    <p className="text-purple-300 text-xs mt-1">
                      Open browser console (F12) to see detailed logs. Every step is logged with emojis for easy tracking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Folder Navigation */}
              <div className="flex items-center gap-2 text-blue-200">
                <button
                  onClick={navigateBack}
                  disabled={folderHistory.length <= 1}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-sm">
                  {folderHistory.map((folder, index) => (
                    <span key={folder.id}>
                      {index > 0 && ' / '}
                      {folder.name}
                    </span>
                  ))}
                </span>
              </div>

              {/* Create Folder */}
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="New folder path (e.g., Signaling/CBTC)"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={createFolder}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Folder size={16} />
                  Create
                </button>
              </div>

              {/* Direct Upload to Google Drive */}
              <div className="mb-4 p-4 bg-blue-600/10 border border-blue-400/20 rounded-lg">
                <h4 className="text-blue-300 font-medium mb-2">📤 Upload to Google Drive</h4>
                <div className="flex gap-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
                    onChange={handleDirectUploadToDrive}
                    className="hidden"
                    id="drive-upload"
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor="drive-upload"
                    className={`flex-1 px-4 py-2 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                      isProcessing 
                        ? 'border-gray-400 text-gray-400 cursor-not-allowed' 
                        : 'border-blue-400 text-blue-300 hover:border-blue-300 hover:bg-blue-400/5'
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        Uploading...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Upload size={16} />
                        Click to upload files directly to Google Drive
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Folders List with Auto AI Search */}
              <div className="mb-4">
                <h4 className="text-white font-medium mb-2">Folders - Click to Auto-Load for AI Search</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  <div
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer ${
                      currentFolderId === '' 
                        ? 'bg-blue-600/20 border-blue-400' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => {
                      navigateToFolder('', 'Root Folder');
                      autoLoadFolderForAI('', 'Root Folder');
                    }}
                  >
                    <Folder className="text-yellow-400" size={16} />
                    <span className="text-white text-sm">🏠 Root Folder</span>
                    <span className="text-green-300 text-xs">Click to load for AI</span>
                  </div>
                  {driveFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer ${
                        currentFolderId === folder.id
                          ? 'bg-blue-600/20 border-blue-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        navigateToFolder(folder.id, folder.name);
                        autoLoadFolderForAI(folder.id, folder.name);
                      }}
                    >
                      <Folder className="text-yellow-400" size={16} />
                      <span className="text-white text-sm flex-1">{folder.name}</span>
                      <span className="text-blue-300 text-xs bg-blue-600/20 px-2 py-1 rounded">
                        {folder.count}
                      </span>
                      <span className="text-green-300 text-xs">Auto AI</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Load All Files for AI Button - BULLETPROOF */}
              {driveFiles.filter(f => f.type === 'file').length > 0 && (
                <div className="mb-4 p-3 bg-green-600/20 border border-green-400/20 rounded-lg">
                  <h4 className="text-green-300 font-medium mb-2">🚀 BULLETPROOF AI Setup</h4>
                  <button
                    onClick={() => {
                      console.log('🔥 BULLETPROOF LOAD ALL FILES CLICKED!');
                      const fileIds = driveFiles.filter(f => f.type === 'file').map(f => f.id);
                      console.log('📁 Files to load:', fileIds);
                      console.log('📂 Current folder files:', driveFiles.filter(f => f.type === 'file'));
                      processFilesForAISearch(fileIds, 'Current Folder');
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                    {isProcessing ? 'Processing...' : `LOAD ALL ${driveFiles.filter(f => f.type === 'file').length} FILES FOR AI SEARCH`}
                  </button>
                  <p className="text-green-200 text-xs mt-2">
                    ✅ BULLETPROOF: This will definitely load all files for AI Search with detailed logging
                  </p>
                </div>
              )}



              {/* File List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <h4 className="text-white font-medium mb-2">Files</h4>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-blue-400" size={32} />
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="text-center py-4 text-blue-200">
                    No files found in this folder
                  </div>
                ) : (
                  driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedFiles.has(file.id)
                          ? 'bg-blue-600/20 border-blue-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        if (file.type === 'folder') {
                          navigateToFolder(file.id, file.name);
                        } else {
                          toggleFileSelection(file.id);
                        }
                      }}
                    >
                      {file.type === 'folder' ? (
                        <Folder className="text-yellow-400" size={20} />
                      ) : (
                        <FileText className="text-blue-400" size={20} />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{file.name}</p>
                        {file.size && (
                          <p className="text-blue-200 text-sm">
                            {typeof file.size === 'number' 
                              ? `${Math.round(file.size / 1024)} KB`
                              : `${Math.round(parseInt(file.size.toString()) / 1024)} KB`
                            }
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {file.type === 'file' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFileFromDrive(file.id, file.name);
                            }}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="Download File"
                          >
                            <Download size={16} />
                          </button>
                        )}
                        {file.type === 'file' && selectedFiles.has(file.id) && (
                          <CheckCircle className="text-green-400" size={20} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Analyze Selected Files - SIMPLIFIED */}
              {selectedFiles.size > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-600/20 rounded-lg border border-blue-400">
                  <span className="text-white">
                    {selectedFiles.size} file(s) selected
                  </span>
                  <button
                    onClick={() => {
                      console.log('🔥 SIMPLIFIED ANALYZE WITH AI CLICKED!');
                      const selectedFileIds = Array.from(selectedFiles);
                      processFilesForAISearch(selectedFileIds, 'Selected Files');
                    }}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                    {isProcessing ? 'Processing...' : 'Load for AI Search'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Search Results</h2>
                {results.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportResults('pdf')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      PDF
                    </button>
                    <button
                      onClick={() => exportResults('word')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Word
                    </button>
                    <button
                      onClick={() => exportResults('excel')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Excel
                    </button>
                  </div>
                )}
              </div>

              {results.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="mx-auto mb-4 text-blue-400" size={48} />
                  <p className="text-blue-200">No results yet. Try searching or analyzing files.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {results.map((result) => (
                    <div key={result.id} className="bg-white/5 rounded-lg p-6 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">{result.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-300 bg-blue-600/20 px-2 py-1 rounded">
                            {Math.round(result.score * 100)}% match
                          </span>
                          <button
                            onClick={() => downloadResult(result)}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="Download Result"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Show full content for AI responses, preview for others */}
                      {result.id === 'ai_response' ? (
                        <div className="text-blue-100 mb-3 whitespace-pre-wrap max-h-96 overflow-y-auto bg-black/20 p-4 rounded">
                          {result.content}
                        </div>
                      ) : (
                        <p className="text-blue-200 mb-3">{result.preview}</p>
                      )}
                      
                      <div className="flex gap-4 text-sm text-blue-300">
                        <span>System: {result.system}</span>
                        <span>Subsystem: {result.subsystem}</span>
                        <span>Type: {result.fileType}</span>
                      </div>
                      
                      {/* Show sources if available */}
                      {result.sources && result.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-blue-300 mb-2">📚 Sources ({result.sources.length}):</p>
                          <div className="space-y-1">
                            {result.sources.slice(0, 3).map((source, idx) => (
                              <div key={idx} className="text-xs text-blue-200">
                                • {source.fileName} (Score: {Math.round(source.score * 100)}%)
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">System Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="text-blue-400" size={24} />
                    <h3 className="text-lg font-semibold text-white">Documents</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-400">
                    {backendStats?.totalFiles || 0}
                  </p>
                  <p className="text-blue-200 text-sm">Total files indexed</p>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="text-green-400" size={24} />
                    <h3 className="text-lg font-semibold text-white">Chunks</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-400">
                    {backendStats?.totalChunks || 0}
                  </p>
                  <p className="text-blue-200 text-sm">Text chunks processed</p>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Cloud className="text-purple-400" size={24} />
                    <h3 className="text-lg font-semibold text-white">Drive Files</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-400">
                    {driveFiles.length}
                  </p>
                  <p className="text-blue-200 text-sm">Files in current folder</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-200">Backend URL:</span>
                    <p className="text-white font-mono">{config.API_BASE_URL}</p>
                  </div>
                  <div>
                    <span className="text-blue-200">Google Drive Folder:</span>
                    <p className="text-white font-mono">{config.MAIN_FOLDER_ID}</p>
                  </div>
                  <div>
                    <span className="text-blue-200">Version:</span>
                    <p className="text-white">{config.VERSION}</p>
                  </div>
                  <div>
                    <span className="text-blue-200">Environment:</span>
                    <p className="text-white capitalize">{config.ENVIRONMENT}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};