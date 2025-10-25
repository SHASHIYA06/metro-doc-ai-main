import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Search, Zap, Map, FileSpreadsheet, FileCode, FileImage } from 'lucide-react';
import { DriveFile } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DocumentViewerProps {
  file: DriveFile;
  onAnalyze: (fileId: string) => void;
  onPreview: (fileId: string) => void;
  onNavigateToFolder?: (folderId: string) => void;
  onMapView?: (fileId: string) => void;
  onAdvancedAnalyze?: (fileId: string) => void;
  isProcessed?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  file, 
  onAnalyze, 
  onPreview,
  onNavigateToFolder,
  onMapView,
  onAdvancedAnalyze,
  isProcessed = false
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdvancedAnalyzing, setIsAdvancedAnalyzing] = useState(false);

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return 'Unknown size';
    const size = parseInt(bytes);
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileIcon = () => {
    if (file.type === 'folder') return '📁';
    if (file.mimeType?.includes('pdf')) return '📄';
    if (file.mimeType?.includes('image')) return '🖼️';
    if (file.mimeType?.includes('word') || file.mimeType?.includes('document')) return '📝';
    if (file.mimeType?.includes('sheet') || file.mimeType?.includes('excel')) return '📊';
    if (file.mimeType?.includes('presentation')) return '📈';
    if (file.mimeType?.includes('text/csv')) return '📋';
    if (file.mimeType?.includes('application/json')) return '🔍';
    if (file.mimeType?.includes('application/xml')) return '🔧';
    return '📎';
  };

  const getFileTypeIcon = () => {
    if (file.type === 'folder') return <FileText className="h-6 w-6" />;
    if (file.mimeType?.includes('pdf')) return <FileText className="h-6 w-6" />;
    if (file.mimeType?.includes('image')) return <FileImage className="h-6 w-6" />;
    if (file.mimeType?.includes('word') || file.mimeType?.includes('document')) return <FileText className="h-6 w-6" />;
    if (file.mimeType?.includes('sheet') || file.mimeType?.includes('excel')) return <FileSpreadsheet className="h-6 w-6" />;
    if (file.mimeType?.includes('text/csv')) return <FileSpreadsheet className="h-6 w-6" />;
    if (file.mimeType?.includes('application/json') || file.mimeType?.includes('application/xml')) return <FileCode className="h-6 w-6" />;
    return <FileText className="h-6 w-6" />;
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await onAnalyze(file.id);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAdvancedAnalyze = async () => {
    if (!onAdvancedAnalyze) return;
    
    setIsAdvancedAnalyzing(true);
    try {
      await onAdvancedAnalyze(file.id);
    } finally {
      setIsAdvancedAnalyzing(false);
    }
  };

  const isMapSupported = () => {
    // Check if file might contain spatial data
    return file.name.toLowerCase().includes('map') || 
           file.name.toLowerCase().includes('location') ||
           file.name.toLowerCase().includes('spatial') ||
           file.name.toLowerCase().includes('layout') ||
           file.name.toLowerCase().includes('floor') ||
           file.name.toLowerCase().includes('site') ||
           file.mimeType?.includes('image') ||
           file.mimeType?.includes('application/json');
  };

  return (
    <Card className={`h-full flex flex-col ${isProcessed ? 'border-primary/50 shadow-md' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-2 truncate">
            <CardTitle className="text-base truncate flex items-center">
              {isProcessed && <Badge variant="default" className="mr-2 bg-primary/20 text-primary text-xs">Processed</Badge>}
              {file.name}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {file.type === 'folder' ? 'Folder' : file.mimeType?.split('/').pop() || 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex items-center justify-center flex-1 mb-4">
          <div className="text-6xl">{getFileIcon()}</div>
          <div className="absolute opacity-20">{getFileTypeIcon()}</div>
        </div>
        <div className="text-sm text-muted-foreground mb-4 text-center">
          {file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}
        </div>
        {file.type === 'folder' ? (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToFolder) {
                  onNavigateToFolder(file.id);
                }
              }}
            >
              Open Folder
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(file.id);
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalyze();
                }}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-1" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex justify-between gap-2">
              {onMapView && isMapSupported() && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMapView(file.id);
                        }}
                      >
                        <Map className="h-4 w-4 mr-1" />
                        Map View
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Visualize spatial data from this document</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {onAdvancedAnalyze && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={`flex-1 ${!onMapView || !isMapSupported() ? 'w-full' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdvancedAnalyze();
                        }}
                        disabled={isAdvancedAnalyzing}
                      >
                        {isAdvancedAnalyzing ? (
                          <span className="animate-pulse">Processing...</span>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-1" />
                            Advanced
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Perform advanced RAG analysis on this document</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};