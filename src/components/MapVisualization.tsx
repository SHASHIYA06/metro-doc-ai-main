import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapAnalysis } from '@/types';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';

interface MapVisualizationProps {
  mapData: MapAnalysis;
  documentName: string;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({ mapData, documentName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState('visual');
  
  useEffect(() => {
    if (!canvasRef.current || !mapData || activeTab !== 'visual') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const width = canvas.width = 800;
    const height = canvas.height = 600;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // Calculate positions for locations
    const locations = mapData.locations || [];
    const locationPositions: Record<string, {x: number, y: number}> = {};
    
    // First pass: use provided coordinates if available
    locations.forEach((location, index) => {
      if (location.coordinates) {
        if (location.coordinates.x !== undefined && location.coordinates.y !== undefined) {
          locationPositions[location.name] = {
            x: location.coordinates.x * width,
            y: location.coordinates.y * height
          };
        } else if (location.coordinates.latitude !== undefined && location.coordinates.longitude !== undefined) {
          // Simple mercator projection
          const x = (location.coordinates.longitude + 180) / 360 * width;
          const y = (90 - location.coordinates.latitude) / 180 * height;
          locationPositions[location.name] = { x, y };
        }
      }
    });
    
    // Second pass: position remaining locations in a grid or circle
    const remainingLocations = locations.filter(loc => !locationPositions[loc.name]);
    if (remainingLocations.length > 0) {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.4;
      
      remainingLocations.forEach((location, index) => {
        const angle = (index / remainingLocations.length) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        locationPositions[location.name] = { x, y };
      });
    }
    
    // Draw locations
    Object.entries(locationPositions).forEach(([name, pos]) => {
      // Draw circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      
      // Draw label
      ctx.font = '12px Arial';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(name, pos.x, pos.y + 25);
    });
    
    // Draw relationships
    if (mapData.spatial_relationships) {
      mapData.spatial_relationships.forEach(rel => {
        const fromPos = locationPositions[rel.from];
        const toPos = locationPositions[rel.to];
        
        if (fromPos && toPos) {
          ctx.beginPath();
          ctx.moveTo(fromPos.x, fromPos.y);
          ctx.lineTo(toPos.x, toPos.y);
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw relationship type
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          
          ctx.font = '10px Arial';
          ctx.fillStyle = '#64748b';
          ctx.textAlign = 'center';
          ctx.fillText(rel.type, midX, midY - 5);
          
          if (rel.distance) {
            ctx.fillText(rel.distance, midX, midY + 10);
          }
        }
      });
    }
    
    // Draw layout information if available
    if (mapData.layout) {
      ctx.font = '14px Arial';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'left';
      ctx.fillText(`Scale: ${mapData.layout.scale || 'Not specified'}`, 20, height - 60);
      ctx.fillText(`Orientation: ${mapData.layout.orientation || 'Not specified'}`, 20, height - 40);
      ctx.fillText(`Description: ${mapData.layout.description || 'None'}`, 20, height - 20);
    }
    
  }, [mapData, activeTab]);
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">
            Spatial Analysis: {documentName}
          </CardTitle>
          <Badge variant="outline">{mapData.locations?.length || 0} Locations</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="visual" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="visual">Visual Map</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="measurements">Measurements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visual" className="h-[600px] flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={600}
              className="border border-gray-200 rounded-md"
            />
          </TabsContent>
          
          <TabsContent value="locations">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Identified Locations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mapData.locations?.map((location, index) => (
                  <Card key={index} className="p-4">
                    <h4 className="font-medium">{location.name}</h4>
                    <p className="text-sm text-muted-foreground">{location.description}</p>
                    {location.coordinates && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {location.coordinates.latitude && location.coordinates.longitude ? (
                          <p>Coordinates: {location.coordinates.latitude}, {location.coordinates.longitude}</p>
                        ) : location.coordinates.x && location.coordinates.y ? (
                          <p>Position: x={location.coordinates.x}, y={location.coordinates.y}</p>
                        ) : null}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="relationships">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Spatial Relationships</h3>
              <div className="grid grid-cols-1 gap-2">
                {mapData.spatial_relationships?.map((rel, index) => (
                  <div key={index} className="flex items-center p-2 border rounded-md">
                    <div className="font-medium">{rel.from}</div>
                    <div className="mx-2 px-2 py-1 bg-muted rounded text-xs">{rel.type}</div>
                    <div className="font-medium">{rel.to}</div>
                    {rel.distance && (
                      <Badge variant="outline" className="ml-auto">{rel.distance}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="measurements">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Measurements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mapData.measurements?.map((measurement, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{measurement.type}</h4>
                      <Badge>{measurement.value} {measurement.unit}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{measurement.description}</p>
                  </Card>
                ))}
              </div>
              
              {mapData.layout && (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium mb-2">Layout Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {mapData.layout.width && mapData.layout.height && (
                      <div className="flex justify-between p-2 border rounded-md">
                        <span>Dimensions:</span>
                        <span>{mapData.layout.width} x {mapData.layout.height}</span>
                      </div>
                    )}
                    {mapData.layout.orientation && (
                      <div className="flex justify-between p-2 border rounded-md">
                        <span>Orientation:</span>
                        <span>{mapData.layout.orientation}</span>
                      </div>
                    )}
                    {mapData.layout.scale && (
                      <div className="flex justify-between p-2 border rounded-md">
                        <span>Scale:</span>
                        <span>{mapData.layout.scale}</span>
                      </div>
                    )}
                  </div>
                  {mapData.layout.description && (
                    <div className="mt-2 p-2 border rounded-md">
                      <p className="text-sm">{mapData.layout.description}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MapVisualization;