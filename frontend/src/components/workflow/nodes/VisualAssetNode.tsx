"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCampaignStore } from "@/stores/campaignStore";

interface VisualAssetNodeProps extends NodeProps {
  data: {
    id: string;
    isActive: boolean;
    module: {
      module_name: string;
      description: string;
      inputs: {
        prompt: string;
        quantity: number;
        image_style: string;
        dimensions: { width: number; height: number };
      };
    };
  };
}

export const VisualAssetNode = memo(({ id, data }: VisualAssetNodeProps) => {
  const { selectedNodeId, updateModule } = useCampaignStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputs, setInputs] = useState(data.module.inputs);

  const isSelected = selectedNodeId === id;

  const updateInput = (key: string, value: any) => {
    const newInputs = { ...inputs, [key]: value };
    setInputs(newInputs);
    updateModule(id, { ...data.module, inputs: newInputs });
  };

  return (
    <div className="relative">
      <Card className={`w-80 ${isSelected ? "ring-2 ring-blue-500" : ""} ${data.isActive ? "border-green-500" : ""}`}>
        {/* Input Handles */}
        <Handle
          type="target" 
          position={Position.Left}
          id="prompt"
          className="w-4 h-4 bg-blue-500 border-2 border-white shadow-md"
          style={{ top: 70 }}
        />
        <Handle
          type="target"
          position={Position.Left} 
          id="brand_guidelines"
          className="w-4 h-4 bg-purple-500 border-2 border-white shadow-md"
          style={{ top: 100 }}
        />
        <Handle
          type="target"
          position={Position.Left} 
          id="quantity"
          className="w-4 h-4 bg-orange-500 border-2 border-white shadow-md"
          style={{ top: 130 }}
        />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="font-medium">ID: {data.id}</span>
            <Badge variant={data.isActive ? "default" : "secondary"}>
              {data.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Amount</Badge>
            <span className="text-sm">$</span>
            <span className="font-medium">{inputs.quantity}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Style</Badge>
            <span className="text-sm">IN</span>
            <span className="font-medium">{inputs.image_style}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Dimensions</Badge>
            <span className="text-sm">IS</span>
            <span className="font-medium">{inputs.dimensions.width}x{inputs.dimensions.height}</span>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-xs">Prompt</Label>
              <Input
                id="prompt"
                value={inputs.prompt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInput("prompt", e.target.value)}
                placeholder="Enter image generation prompt"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={inputs.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInput("quantity", parseInt(e.target.value))}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Style</Label>
                <Select 
                  value={inputs.image_style} 
                  onValueChange={(value: string) => updateInput("image_style", value)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photorealistic">Photorealistic</SelectItem>
                    <SelectItem value="illustration">Illustration</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Width</Label>
                <Input
                  type="number"
                  value={inputs.dimensions.width}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInput("dimensions", { 
                    ...inputs.dimensions, 
                    width: parseInt(e.target.value) 
                  })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height</Label>
                <Input
                  type="number"
                  value={inputs.dimensions.height}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInput("dimensions", { 
                    ...inputs.dimensions, 
                    height: parseInt(e.target.value) 
                  })}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>

        {/* Output Handles */}
        <Handle
          type="source"
          position={Position.Right}
          id="generated_images" 
          className="w-4 h-4 bg-green-500 border-2 border-white shadow-md"
          style={{ top: 70 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="generation_metadata"
          className="w-4 h-4 bg-blue-500 border-2 border-white shadow-md"
          style={{ top: 100 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="execution_status"
          className="w-4 h-4 bg-yellow-500 border-2 border-white shadow-md"
          style={{ top: 130 }}
        />
      </Card>
      
      {/* Handle Labels */}
      <div className="absolute left-[-100px] top-16 space-y-7 text-xs text-gray-600">
        <div className="bg-white px-2 py-1 rounded shadow border">prompt</div>
        <div className="bg-white px-2 py-1 rounded shadow border">brand_guidelines</div>
        <div className="bg-white px-2 py-1 rounded shadow border">quantity</div>
      </div>
      <div className="absolute right-[-120px] top-16 space-y-7 text-xs text-gray-600">
        <div className="bg-white px-2 py-1 rounded shadow border">generated_images</div>
        <div className="bg-white px-2 py-1 rounded shadow border">generation_metadata</div>
        <div className="bg-white px-2 py-1 rounded shadow border">execution_status</div>
      </div>
    </div>
  );
});