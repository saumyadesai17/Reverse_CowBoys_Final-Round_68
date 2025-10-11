"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface InputNodeProps extends NodeProps {
  data: {
    label: string;
    value: string;
    description: string;
  };
}

export const InputNode = memo(({ id, data }: InputNodeProps) => {
  const [value, setValue] = useState(data.value);

  return (
    <Card className="w-64 border-2 border-blue-500 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-sm">{data.label}</span>
          <Badge variant="secondary" className="text-xs">Input</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`input-${id}`} className="text-xs text-gray-600">
            {data.description}
          </Label>
          <Input
            id={`input-${id}`}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
            placeholder="Enter your marketing brief..."
            className="text-xs"
          />
        </div>
      </CardContent>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-4 h-4 bg-blue-500 border-2 border-white shadow-md"
        style={{ top: "50%" }}
      />
    </Card>
  );
});