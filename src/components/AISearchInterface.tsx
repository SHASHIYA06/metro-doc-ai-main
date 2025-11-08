import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

interface BackendStats {
  totalChunks: number;
  uniqueFiles: number;
  byFile: Record<string, number>;
  bySystem: Record<string, number>;
  averageChunkSize: number;
}

const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com'
};

export default function AISearchInterface() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'results' | 'upload'>('search');

  // Load backend statistics
  const loadBackendStats = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/stats`);
      const stats = await response.json();
      setBackendStats(stats);
    } catch (error) {
      console.error('Failed to load backend stats:', error);
    }
  };

  useEffect(() => {
    loadBackendStats();
  }, []);

  // Handle AI search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    
    try {
      // Check if backend has data
      if (!backendStats || backendStats.totalChunks === 0) {
        const noDataResult: SearchResult = {
          id: 'no_data',
          title: '📚 No Data Available',
          content: `No technical documents are currently loaded in the AI system.

**To get started:**
1. Use the **Upload** tab to add your technical documents
2. Or contact your administrator to load the comprehensive technical database
3. Once data is loaded, you can search for any technical information

**Example searches after data is loaded:**
- "What are the door system specifications?"
- "What are the surge protection procedures?"
- "What are the maintenance procedures?"
- "What is the DCU failure troubleshooting?"`,
          system: 'System Message',
          subsystem: 'No Data',
          score: 1.0,
          fileType: 'Information',
          preview: 'No technical documents loaded. Please upload data first.',
          sources: []
        };
        
        setResults([noDataResult]);
        setActiveTab('results');
        setIsSearching(false);
        return;
      }

      // Convert simple queries to complete questions for better results
      let finalQuery = searchQuery;
      const lowerQuery = searchQuery.toLowerCase();
      
      if (!lowerQuery.startsWith('what') && !lowerQuery.startsWith('how') && !lowerQuery.startsWith('describe')) {
        if (lowerQuery.includes('door')) {
          finalQuery = 'What are the door system specifications and procedures?';
        } else if (lowerQuery.includes('surge')) {
          finalQuery = 'What are the surge protection system details?';
        } else if (lowerQuery.includes('dcu') && lowerQuery.includes('failure')) {
          finalQuery = 'What are the DCU failure troubleshooting procedures?';
        } else if (lowerQuery.includes('maintenance')) {
          finalQuery = 'What are the maintenance procedures?';
        } else if (lowerQuery.includes('technical') || lowerQuery.includes('specification')) {
          finalQuery = 'What are the technical specifications?';
        } else {
          // Create a generic question format
          const keywords = searchQuery.split(' ').filter(word => word.length > 2);
          if (keywords.length > 0) {
            finalQuery = `What are the ${keywords.slice(0, 2).join(' ')} details?`;
          }
        }
      }

      console.log(`🔍 Searching: "${finalQuery}"`);

      // Perform the search
      const response = await fetch(`${config.API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          k: 5,
          system: '',
          subsystem: '',
          tags: []
        })
      });

      const data = await response.json();
      console.log('📊 Search response:', data);

      const searchResults: SearchResult[] = [];

      if (data.result && !data.result.includes('No relevant documents found') && data.sources?.length > 0) {
        // Success - we have results
        const cleanResult = data.result.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n').trim();
        
        searchResults.push({
          id: 'ai_response',
          title: `🤖 AI Analysis`,
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

        toast.success(`🎉 Found ${searchResults.length} results!`);
      } else {
        // No results found
        const noResultsMessage: SearchResult = {
          id: 'no_results',
          title: '🔍 No Results Found',
          content: `No results found for "${searchQuery}".

**Try these suggestions:**
- Use complete questions: "What are the door systems?"
- Use specific technical terms from your documents
- Try different keywords or phrases
- Check if the information exists in your uploaded documents

**Available Data:**
- ${backendStats?.uniqueFiles || 0} technical documents
- ${backendStats?.totalChunks || 0} searchable sections
- Systems: ${Object.keys(backendStats?.bySystem || {}).join(', ')}

**Example Working Queries:**
- "What are the door system specifications?"
- "What are the surge protection procedures?"
- "What are the maintenance procedures?"
- "What is the DCU failure troubleshooting?"`,
          system: 'Search Help',
          subsystem: 'No Results',
          score: 0.5,
          fileType: 'Help Message',
          preview: `No results for "${searchQuery}". Try different keywords or complete questions.`,
          sources: []
        };
        
        searchResults.push(noResultsMessage);
        toast('🔍 No results found. Try different keywords or complete questions.');
      }

      setResults(searchResults);
      setActiveTab('results');

    } catch (error: any) {
      console.error('❌ Search error:', error);
      toast.error(`Search failed: ${error.message}`);
      
      const errorResult: SearchResult = {
        id: 'search_error',
        title: '❌ Search Error',
        content: `Search failed: ${error.message}

**Possible causes:**
1. **Backend connection issue**: Check your internet connection
2. **Server error**: The AI backend might be temporarily unavailable
3. **No data loaded**: Technical documents may not be uploaded yet

**To fix this:**
1. Check your internet connection
2. Try searching again in a few moments
3. Use the Upload tab to add technical documents
4. Contact support if the problem persists`,
        system: 'Error Handler',
        subsystem: 'Search Error',
        score: 0,
        fileType: 'Error Message',
        preview: `Search failed: ${error.message}`,
        sources: []
      };
      
      setResults([errorResult]);
      setActiveTab('results');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileArray = Array.from(files);
    let successCount = 0;

    try {
      toast.info(`Starting upload of ${fileArray.length} file(s)...`);

      for (const file of fileArray) {
        try {
          const formData = new FormData();
          formData.append('files', file);
          formData.append('system', `User Upload - ${file.name.split('.')[0]}`);
          formData.append('subsystem', 'Additional Documents');

          const response = await fetch(`${config.API_BASE_URL}/ingest`, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const result = await response.json();
            successCount++;
            toast.success(`✅ ${file.name}: ${result.added} chunks added`);
          } else {
            toast.error(`❌ Failed to upload ${file.name}`);
          }
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          toast.error(`❌ Error uploading ${file.name}`);
        }
      }

      if (successCount > 0) {
        toast.success(`🎉 Successfully uploaded ${successCount}/${fileArray.length} files!`);
        await loadBackendStats(); // Refresh stats
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Clear the input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🤖 AI Technical Search
          </h1>
          <p className="text-blue-200 text-lg">
            Search comprehensive technical documentation with AI-powered intelligence
          </p>
          
          {/* Backend Status */}
          {backendStats && (
            <div className="mt-4 inline-flex items-center gap-4 bg-blue-800/50 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-green-400" />
                <span className="text-green-400 font-medium">
                  {backendStats.totalChunks} chunks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-400" />
                <span className="text-blue-400 font-medium">
                  {backendStats.uniqueFiles} documents
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-blue-800/50 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-blue-200 hover:text-white hover:bg-blue-700/50'
              }`}
            >
              <Search size={18} className="inline mr-2" />
              AI Search
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-blue-200 hover:text-white hover:bg-blue-700/50'
              }`}
            >
              <Upload size={18} className="inline mr-2" />
              Upload Data
            </button>
            {results.length > 0 && (
              <button
                onClick={() => setActiveTab('results')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'results'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-200 hover:text-white hover:bg-blue-700/50'
                }`}
              >
                <FileText size={18} className="inline mr-2" />
                Results ({results.length})
              </button>
            )}
          </div>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
              <div className="mb-6">
                <label className="block text-white text-lg font-medium mb-3">
                  Ask any technical question:
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g., What are the door system specifications?"
                    className="flex-1 px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    disabled={isSearching}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed font-medium text-lg flex items-center gap-2 transition-all"
                  >
                    {isSearching ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Search size={20} />
                    )}
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Example Queries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-white font-medium mb-2">💡 Example Queries:</h3>
                  <div className="space-y-2">
                    {[
                      'What are the door system specifications?',
                      'What are the surge protection procedures?',
                      'What are the maintenance procedures?',
                      'What is the DCU failure troubleshooting?'
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(example)}
                        className="block w-full text-left text-blue-200 hover:text-white hover:bg-blue-700/30 px-3 py-2 rounded text-sm transition-all"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
                
                {backendStats && (
                  <div>
                    <h3 className="text-white font-medium mb-2">📊 Available Data:</h3>
                    <div className="text-blue-200 text-sm space-y-1">
                      <div>📄 {backendStats.uniqueFiles} technical documents</div>
                      <div>🔍 {backendStats.totalChunks} searchable sections</div>
                      <div>📚 Systems: {Object.keys(backendStats.bySystem).slice(0, 3).join(', ')}</div>
                      {Object.keys(backendStats.bySystem).length > 3 && (
                        <div className="text-xs">+ {Object.keys(backendStats.bySystem).length - 3} more systems</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                📤 Upload Additional Documents
              </h2>
              
              <div className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center">
                <Upload size={48} className="mx-auto text-blue-400 mb-4" />
                <p className="text-white text-lg mb-4">
                  Add more technical documents to expand the AI knowledge base
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium cursor-pointer transition-all ${
                    isUploading
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Upload size={20} />
                  )}
                  {isUploading ? 'Uploading...' : 'Select Files'}
                </label>
                <p className="text-blue-200 text-sm mt-3">
                  Supported formats: PDF, TXT, DOC, DOCX
                </p>
              </div>

              {/* Current Data Summary */}
              {backendStats && (
                <div className="mt-6 bg-blue-800/30 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">📊 Current Database:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-blue-200">
                      <div>Documents: {backendStats.uniqueFiles}</div>
                      <div>Searchable Chunks: {backendStats.totalChunks}</div>
                    </div>
                    <div className="text-blue-200">
                      <div>Avg. Chunk Size: {backendStats.averageChunkSize} chars</div>
                      <div>Systems: {Object.keys(backendStats.bySystem).length}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && results.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                🔍 Search Results
              </h2>
              <p className="text-blue-200">
                Found {results.length} result{results.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            </div>

            <div className="space-y-6">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {result.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-blue-200">
                        <span>📁 {result.system}</span>
                        <span>📂 {result.subsystem}</span>
                        <span>⭐ {Math.round(result.score * 100)}% match</span>
                      </div>
                    </div>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {result.fileType}
                    </span>
                  </div>
                  
                  <div className="text-white whitespace-pre-wrap leading-relaxed">
                    {result.content}
                  </div>

                  {result.sources && result.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-400/30">
                      <h4 className="text-blue-200 font-medium mb-2">
                        📚 Sources ({result.sources.length}):
                      </h4>
                      {result.sources.map((source, idx) => (
                        <div key={idx} className="text-blue-200 text-sm">
                          • {source.fileName} (Score: {Math.round(source.score * 100)}%)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}