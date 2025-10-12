"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { useCampaignStore } from "@/stores/campaignStore";

interface InputNodeProps extends NodeProps {
  data: {
    label: string;
    value: string;
    description: string;
  };
}

export const InputNode = memo(({ id, data }: InputNodeProps) => {
  const [value, setValue] = useState(data.value);
  const { selectedNodeId } = useCampaignStore();
  const isSelected = selectedNodeId === id;

  return (
    <div className="relative">
      <Card className={`w-64 border-2 bg-slate-800/90 backdrop-blur-sm shadow-xl transition-all duration-200 ${
        isSelected 
          ? "border-violet-500 ring-2 ring-violet-500 shadow-violet-500/20" 
          : "border-blue-500 hover:border-blue-400"
      }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-sm text-white">{data.label}</span>
          <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">Input</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`input-${id}`} className="text-xs text-slate-400">
            {data.description}
          </Label>
          <Input
            id={`input-${id}`}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
            placeholder="Enter your marketing brief..."
            className="text-xs bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
          />
        </div>
      </CardContent>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-4 h-4 bg-blue-500 border-2 border-slate-900 shadow-md"
        style={{ top: "50%" }}
      />
    </Card>
    </div>
  );
});