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
import { MODULE_DEFINITIONS } from "@/lib/moduleDefinitions";

interface GenericModuleNodeProps extends NodeProps {
  data: {
    id: string;
    isActive: boolean;
    module_name: string;
    inputs: Record<string, any>;
  };
}

export const GenericModuleNode = memo(({ id, data }: GenericModuleNodeProps) => {
  const { selectedNodeId, updateModule, connectionPreview } = useCampaignStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputs, setInputs] = useState(data.inputs || {});

  const moduleDefinition = MODULE_DEFINITIONS[data.module_name as keyof typeof MODULE_DEFINITIONS];
  const isSelected = selectedNodeId === id;

  if (!moduleDefinition) {
    return (
      <Card className="w-80 border-red-500">
        <CardContent className="p-4">
          <div className="text-red-600">Unknown module: {data.module_name}</div>
        </CardContent>
      </Card>
    );
  }

  const updateInput = (key: string, value: any) => {
    const newInputs = { ...inputs, [key]: value };
    setInputs(newInputs);
    updateModule(id, { ...data, inputs: newInputs });
  };

  const renderInputField = (inputKey: string, inputDef: any) => {
    const value = inputs[inputKey] || inputDef.default || "";

    switch (inputDef.type) {
      case "string":
        return (
          <Input
            key={inputKey}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInput(inputKey, e.target.value)}
            placeholder={inputDef.description || `Enter ${inputKey}`}
            className="text-xs"
          />
        );
      
      case "integer":
        return (
          <Input
            key={inputKey}
            type="number"
            min={inputDef.min}
            max={inputDef.max}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInput(inputKey, parseInt(e.target.value) || 0)}
            className="text-xs"
          />
        );
      
      case "enum":
        return (
          <Select 
            key={inputKey}
            value={value} 
            onValueChange={(selectedValue: string) => updateInput(inputKey, selectedValue)}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder={`Select ${inputKey}`} />
            </SelectTrigger>
            <SelectContent>
              {inputDef.values?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option.replace(/_/g, " ").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "boolean":
        return (
          <Select 
            key={inputKey}
            value={value?.toString()} 
            onValueChange={(selectedValue: string) => updateInput(inputKey, selectedValue === "true")}
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            key={inputKey}
            value={typeof value === "object" ? JSON.stringify(value) : value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              try {
                updateInput(inputKey, JSON.parse(e.target.value));
              } catch {
                updateInput(inputKey, e.target.value);
              }
            }}
            placeholder={`Enter ${inputKey} (JSON)`}
            className="text-xs"
          />
        );
    }
  };

  // Generate input handles
  const inputKeys = Object.keys(moduleDefinition.inputs);
  const outputKeys = Object.keys(moduleDefinition.outputs);

  // Check if this node has compatible handles during connection preview
  const isConnectionTarget = connectionPreview && connectionPreview.compatibleTargets.some(
    target => target.nodeId === id
  );
  const compatibleHandles = connectionPreview?.compatibleTargets
    .filter(target => target.nodeId === id)
    .map(target => target.handleId) || [];

  return (
    <div className="relative">
      <Card 
        className={`w-80 ${isSelected ? "ring-2 ring-blue-500" : ""} ${data.isActive ? `border-[${moduleDefinition.color}]` : ""}`}
        style={{ borderColor: data.isActive ? moduleDefinition.color : undefined }}
      >
        {/* Input Handles */}
        {inputKeys.map((key, index) => {
          const isCompatible = compatibleHandles.includes(key);
          return (
            <Handle
              key={key}
              type="target"
              position={Position.Left}
              id={key}
              className={`w-4 h-4 border-2 border-white shadow-md transition-all duration-200 ${
                isCompatible ? 'animate-pulse ring-2 ring-green-400' : ''
              }`}
              style={{ 
                top: 70 + (index * 24),
                backgroundColor: isCompatible ? '#10b981' : moduleDefinition.color,
                transform: isCompatible ? 'scale(1.2)' : 'scale(1)'
              }}
            />
          );
        })}
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: moduleDefinition.color }}
              />
              <span className="font-medium text-sm">ID: {data.id}</span>
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
          <div>
            <h3 className="font-medium text-sm">{moduleDefinition.display_name}</h3>
            <p className="text-xs text-gray-600">{moduleDefinition.description}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ color: moduleDefinition.color }}
            >
              {moduleDefinition.category}
            </Badge>
          </div>

          {isExpanded && (
            <div className="space-y-3 pt-3 border-t max-h-64 overflow-y-auto">
              {inputKeys.map((inputKey) => {
                const inputDef = (moduleDefinition.inputs as any)[inputKey];
                return (
                  <div key={inputKey} className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      {inputKey.replace(/_/g, " ")}
                      {inputDef?.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    {renderInputField(inputKey, inputDef)}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Output Handles */}
        {outputKeys.map((key, index) => (
          <Handle
            key={key}
            type="source"
            position={Position.Right}
            id={key}
            className="w-4 h-4 border-2 border-white shadow-md"
            style={{ 
              top: 70 + (index * 24),
              backgroundColor: moduleDefinition.color
            }}
          />
        ))}
      </Card>
      
      {/* Handle Labels */}
      {(isSelected || isConnectionTarget) && (
        <>
          <div className="absolute left-[-120px] text-xs text-gray-600" style={{ top: 55 }}>
            {inputKeys.map((key, index) => {
              const isCompatible = compatibleHandles.includes(key);
              return (
                <div 
                  key={key} 
                  className={`px-2 py-1 rounded shadow border text-right mb-1 transition-all duration-200 ${
                    isCompatible ? 'bg-green-100 border-green-400 text-green-800 font-semibold animate-pulse' : 'bg-white'
                  }`}
                  style={{ marginBottom: index < inputKeys.length - 1 ? '19px' : '0px' }}
                >
                  {key.replace(/_/g, " ")}
                </div>
              );
            })}
          </div>
          <div className="absolute right-[-120px] text-xs text-gray-600" style={{ top: 55 }}>
            {outputKeys.map((key, index) => (
              <div 
                key={key} 
                className="bg-white px-2 py-1 rounded shadow border"
                style={{ marginBottom: index < outputKeys.length - 1 ? '19px' : '0px' }}
              >
                {key.replace(/_/g, " ")}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});