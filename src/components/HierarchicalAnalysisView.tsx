import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HierarchicalAnalysis } from '@/types';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface HierarchicalAnalysisViewProps {
  analysis: HierarchicalAnalysis;
  documentName: string;
}

const HierarchicalAnalysisView: React.FC<HierarchicalAnalysisViewProps> = ({ 
  analysis, 
  documentName 
}) => {
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">
            Advanced Analysis: {documentName}
          </CardTitle>
          <Badge variant="outline">{analysis.key_components?.length || 0} Components</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="technical">Technical Details</TabsTrigger>
            <TabsTrigger value="components">Key Components</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="sources">Source Chunks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <p className="text-lg">{analysis.summary}</p>
            </div>
            
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="p-2 bg-muted/50 rounded-md flex">
                      <span className="font-medium mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="technical">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Technical Details</h3>
              <ul className="space-y-2">
                {analysis.technical_details?.map((detail, index) => (
                  <li key={index} className="p-3 border rounded-md">
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="components">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Key Components</h3>
              <div className="grid grid-cols-1 gap-4">
                {analysis.key_components?.map((component, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-lg">{component.name}</h4>
                      <Badge>{component.importance}</Badge>
                    </div>
                    <p className="mt-2">{component.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="specifications">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(analysis.specifications || {}).map(([key, value], index) => (
                  <div key={index} className="flex justify-between p-2 border rounded-md">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="relationships">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Relationships</h3>
              <div className="grid grid-cols-1 gap-2">
                {analysis.relationships?.map((rel, index) => (
                  <div key={index} className="flex items-center p-2 border rounded-md">
                    <div className="font-medium">{rel.from}</div>
                    <div className="mx-2 px-2 py-1 bg-muted rounded text-xs">{rel.type}</div>
                    <div className="font-medium">{rel.to}</div>
                    <div className="ml-auto text-sm text-muted-foreground">{rel.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sources">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Source Chunks</h3>
              <Accordion type="single" collapsible className="w-full">
                {analysis.source_chunks?.map((chunk, index) => (
                  <AccordionItem key={index} value={`chunk-${index}`}>
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <span>Chunk {index + 1}</span>
                        <Badge variant="outline" className="ml-2">Relevance: {(chunk.relevance * 100).toFixed(0)}%</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-2 bg-muted/30 rounded-md whitespace-pre-wrap">
                        {chunk.content}
                      </div>
                      {chunk.metadata && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {chunk.metadata.page && <span className="mr-2">Page: {chunk.metadata.page}</span>}
                          {chunk.metadata.section && <span className="mr-2">Section: {chunk.metadata.section}</span>}
                          {chunk.metadata.sheet && <span>Sheet: {chunk.metadata.sheet}</span>}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HierarchicalAnalysisView;