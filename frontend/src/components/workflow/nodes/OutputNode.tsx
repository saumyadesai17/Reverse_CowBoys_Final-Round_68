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
    results: unknown[];
  };
}

const OutputNodeComponent = ({ id, data }: OutputNodeProps) => {
  const { connectionPreview, selectedNodeId } = useCampaignStore();
  const isSelected = selectedNodeId === id;
  
  const handleDownload = () => {
    // Handle campaign package download
    console.log("Downloading campaign package...");
  };

  const isCompatible = connectionPreview && connectionPreview.compatibleTargets.some(
    (target: {nodeId: string, handleId: string}) => target.nodeId === id
  );

  return (
    <div className="relative">
      <Card className={`w-72 border-2 bg-slate-800/90 backdrop-blur-sm shadow-xl transition-all duration-200 ${
        isSelected 
          ? "border-violet-500 ring-2 ring-violet-500 shadow-violet-500/20" 
          : "border-orange-500 hover:border-orange-400"
      }`}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className={`w-4 h-4 border-2 border-slate-900 shadow-md transition-all duration-200 ${
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
          <CheckCircle className="w-4 h-4 text-orange-400" />
          <span className="font-medium text-sm text-white">{data.label}</span>
          <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">Output</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="text-xs text-slate-400">
            Campaign results will appear here
          </div>
          
          {data.results.length > 0 && (
            <div className="space-y-1">
              {data.results.map((result, index) => {
                const resultObj = result as { name?: string };
                return (
                  <div key={index} className="p-2 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-200">
                    {resultObj.name || `Asset ${index + 1}`}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button
          onClick={handleDownload}
          size="sm"
          className="w-full h-8 bg-orange-600 hover:bg-orange-700 text-white"
          disabled={data.results.length === 0}
        >
          <Download className="w-3 h-3 mr-2" />
          Export Package
        </Button>
      </CardContent>
    </Card>
    </div>
  );
};

OutputNodeComponent.displayName = 'OutputNode';

export const OutputNode = memo(OutputNodeComponent);