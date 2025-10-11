"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCampaignStore } from "@/stores/campaignStore";

interface OutputNodeProps extends NodeProps {
  data: {
    label: string;
    results: any[];
  };
}

export const OutputNode = memo(({ id, data }: OutputNodeProps) => {
  const { connectionPreview } = useCampaignStore();
  
  const handleDownload = () => {
    // Handle campaign package download
    console.log("Downloading campaign package...");
  };

  const isCompatible = connectionPreview && connectionPreview.compatibleTargets.some(
    (target: {nodeId: string, handleId: string}) => target.nodeId === id
  );

  return (
    <div className="relative">
      <Card className="w-72 border-2 border-orange-500 shadow-lg">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className={`w-4 h-4 border-2 border-white shadow-md transition-all duration-200 ${
          isCompatible ? 'animate-pulse ring-2 ring-green-400' : ''
        }`}
        style={{ 
          top: "50%",
          backgroundColor: isCompatible ? '#10b981' : '#f59e0b',
          transform: isCompatible ? 'scale(1.2)' : 'scale(1)'
        }}
      />
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-orange-500" />
          <span className="font-medium text-sm">{data.label}</span>
          <Badge variant="secondary" className="text-xs">Output</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            Campaign results will appear here
          </div>
          
          {data.results.length > 0 && (
            <div className="space-y-1">
              {data.results.map((result, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                  {result.name || `Asset ${index + 1}`}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleDownload}
          size="sm"
          className="w-full h-8"
          disabled={data.results.length === 0}
        >
          <Download className="w-3 h-3 mr-2" />
          Export Package
        </Button>
      </CardContent>
    </Card>
    </div>
  );
});