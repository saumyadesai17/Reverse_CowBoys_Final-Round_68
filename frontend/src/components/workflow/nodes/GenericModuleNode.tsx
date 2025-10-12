"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Play, Pause, Eye, CheckCircle2, XCircle, Loader2, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCampaignStore } from "@/stores/campaignStore";
import { MODULE_DEFINITIONS } from "@/lib/moduleDefinitions";
import { WorkflowExecutionService, ExecutionResult } from "@/lib/workflowExecution";
import { OutputViewer } from "@/components/workflow/OutputViewer";

interface GenericModuleNodeProps extends NodeProps {
  data: {
    id: string;
    isActive: boolean;
    module_name: string;
    inputs: Record<string, any>;
    executionStatus?: 'idle' | 'running' | 'success' | 'error';
    executionResult?: ExecutionResult;
  };
}

// Helper function to ensure values are compatible with input types
const getSafeValue = (value: any, inputType: string): string => {
  if (value === undefined || value === null) {
    return "";
  }
  
  // For complex types (arrays/objects), return JSON representation for primitive input fields
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  
  switch (inputType) {
    case "string":
      return String(value);
    
    case "integer":
      const numValue = Number(value);
      return isNaN(numValue) ? "0" : String(numValue);
    
    case "enum":
      return String(value);
    
    case "boolean":
      return String(Boolean(value));
    
    default:
      return String(value);
  }
};

export const GenericModuleNode = memo(({ id, data }: GenericModuleNodeProps) => {
  const { selectedNodeId, updateModule, connectionPreview, executionResults, setExecutionResult } = useCampaignStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputs, setInputs] = useState(data.inputs || {});
  const [isExecuting, setIsExecuting] = useState(false);
  const [showOutputViewer, setShowOutputViewer] = useState(false);

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

  // Get execution result from store
  const executionResult = executionResults[id];
  const executionStatus = isExecuting ? 'running' : executionResult?.execution_status;

  const handleExecute = async () => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    try {
      const result = await WorkflowExecutionService.executeModule(data.module_name, inputs);
      setExecutionResult(id, result);
    } catch (error) {
      console.error('Execution failed:', error);
      setExecutionResult(id, {
        outputs: {},
        execution_status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getExecutionStatusIcon = () => {
    switch (executionStatus) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const hasOutput = executionResult && executionResult.execution_status === 'success' && executionResult.outputs;

  // Helper function to render object key-value pairs (read-only structure, editable values)
  const renderObjectField = (inputKey: string, value: Record<string, any>) => {
    const objectEntries = Object.entries(value);
    
    return (
      <div className="space-y-3">
        {objectEntries.map(([key, val], index) => (
          <div key={`${inputKey}-${key}-${index}`} className="space-y-2">
            <Label className="text-xs text-slate-300 capitalize font-medium">
              {key.replace(/_/g, " ")}:
            </Label>
            
            {/* Check if this property should be an array based on the value */}
            {Array.isArray(val) ? (
              <div className="ml-2">
                <div className="space-y-2">
                  {val.map((item, itemIndex) => (
                    <div key={`${inputKey}-${key}-${itemIndex}`} className="flex items-center gap-2">
                      <Input
                        value={typeof item === 'object' ? JSON.stringify(item) : String(item)}
                        onChange={(e) => {
                          const newArray = [...val];
                          try {
                            newArray[itemIndex] = JSON.parse(e.target.value);
                          } catch {
                            newArray[itemIndex] = e.target.value;
                          }
                          updateInput(inputKey, { ...value, [key]: newArray });
                        }}
                        placeholder={`${key} ${itemIndex + 1}`}
                        className="flex-1 text-xs bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 focus:border-violet-500"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newArray = val.filter((_, i) => i !== itemIndex);
                          updateInput(inputKey, { ...value, [key]: newArray });
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateInput(inputKey, { ...value, [key]: [...val, ""] });
                    }}
                    className="w-full text-violet-400 hover:text-violet-300 hover:bg-violet-500/20"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add {key.replace(/_/g, " ")}
                  </Button>
                </div>
              </div>
            ) : (
              /* Regular property input */
              <Input
                value={typeof val === 'object' ? JSON.stringify(val) : String(val)}
                onChange={(e) => {
                  try {
                    const parsedValue = JSON.parse(e.target.value);
                    updateInput(inputKey, { ...value, [key]: parsedValue });
                  } catch {
                    updateInput(inputKey, { ...value, [key]: e.target.value });
                  }
                }}
                placeholder={`Enter ${key.replace(/_/g, " ")}`}
                className="text-xs bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 focus:border-violet-500"
              />
            )}
          </div>
        ))}
        {objectEntries.length === 0 && (
          <div className="text-xs text-slate-500 italic">No properties defined</div>
        )}
      </div>
    );
  };

  // Helper function to render arrays
  const renderArrayField = (inputKey: string, value: any[]) => {
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={`${inputKey}-${index}`} className="flex items-center gap-2">
            <Input
              value={typeof item === 'object' ? JSON.stringify(item) : String(item)}
              onChange={(e) => {
                const newArray = [...value];
                try {
                  newArray[index] = JSON.parse(e.target.value);
                } catch {
                  newArray[index] = e.target.value;
                }
                updateInput(inputKey, newArray);
              }}
              placeholder={`Item ${index + 1}`}
              className="flex-1 text-xs bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 focus:border-violet-500"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newArray = value.filter((_, i) => i !== index);
                updateInput(inputKey, newArray);
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <Minus className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            updateInput(inputKey, [...value, ""]);
          }}
          className="w-full text-violet-400 hover:text-violet-300 hover:bg-violet-500/20"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Item
        </Button>
      </div>
    );
  };

  const renderInputField = (inputKey: string, inputDef: any) => {
    let value = inputs[inputKey];
    
    // Handle default values
    if (value === undefined || value === null) {
      if (inputDef.type === "array") {
        value = [];
      } else if (inputDef.type === "object") {
        value = {};
      } else {
        value = inputDef.default || "";
      }
    }

    // Handle array type based on schema definition
    if (inputDef.type === "array" || Array.isArray(value)) {
      return (
        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Array Items:</Label>
          {renderArrayField(inputKey, Array.isArray(value) ? value : [])}
        </div>
      );
    }

    // Handle object type based on schema definition
    if (inputDef.type === "object" || (value && typeof value === 'object' && !Array.isArray(value))) {
      return (
        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Object Properties:</Label>
          {renderObjectField(inputKey, typeof value === 'object' && value !== null ? value : {})}
        </div>
      );
    }
    
    // Ensure value is compatible with the input type
    const safeValue = getSafeValue(value, inputDef.type);

    switch (inputDef.type) {
      case "string":
        return (
          <Input
            key={inputKey}
            value={safeValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInput(inputKey, e.target.value)}
            placeholder={inputDef.description || `Enter ${inputKey}`}
            className="text-xs bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500"
          />
        );
      
      case "integer":
        return (
          <Input
            key={inputKey}
            type="number"
            min={inputDef.min}
            max={inputDef.max}
            value={safeValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateInput(inputKey, parseInt(e.target.value) || 0)}
            className="text-xs bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500"
          />
        );
      
      case "enum":
        return (
          <Select 
            key={inputKey}
            value={safeValue} 
            onValueChange={(selectedValue: string) => updateInput(inputKey, selectedValue)}
          >
            <SelectTrigger className="text-xs bg-slate-700/50 border-slate-600 text-white focus:border-violet-500">
              <SelectValue placeholder={`Select ${inputKey}`} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {inputDef.values?.map((option: string) => (
                <SelectItem key={option} value={option} className="text-white hover:bg-slate-700 focus:bg-slate-700">
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
            value={safeValue} 
            onValueChange={(selectedValue: string) => updateInput(inputKey, selectedValue === "true")}
          >
            <SelectTrigger className="text-xs bg-slate-700/50 border-slate-600 text-white focus:border-violet-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="true" className="text-white hover:bg-slate-700 focus:bg-slate-700">Yes</SelectItem>
              <SelectItem value="false" className="text-white hover:bg-slate-700 focus:bg-slate-700">No</SelectItem>
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
            className="text-xs bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500"
          />
        );
    }
  };

  // Generate input handles
  const inputKeys = Object.keys(moduleDefinition.inputs);
  const outputKeys = Object.keys(moduleDefinition.outputs);

  // Dynamic spacing calculation for optimal UX
  const CARD_HEIGHT = 240; // Actual collapsed card height
  const HEADER_HEIGHT = 70; // ID + Title + Description area
  const FOOTER_HEIGHT = 50; // Execute button area  
  const VERTICAL_PADDING = 20; // Padding from top and bottom of content area
  
  // Calculate usable space for handles (between header and footer)
  const CONTENT_AREA_HEIGHT = CARD_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT; // ~120px
  const USABLE_HEIGHT = CONTENT_AREA_HEIGHT - (VERTICAL_PADDING * 2); // ~80px
  
  // Calculate spacing based on the maximum number of handles
  const maxHandles = Math.max(inputKeys.length, outputKeys.length, 1);
  
  // Calculate handle spacing and start position for perfect centering
  let handleSpacing: number;
  let startPosition: number;
  
  if (maxHandles === 1) {
    // Single handle: center it perfectly in the content area
    handleSpacing = 0;
    startPosition = HEADER_HEIGHT + (CONTENT_AREA_HEIGHT / 2);
  } else {
    // Multiple handles: distribute evenly in usable space
    // Space between handles
    handleSpacing = USABLE_HEIGHT / (maxHandles - 1);
    
    // Clamp spacing for readability (labels need at least 22px)
    const MIN_SPACING = 30;
    const MAX_SPACING = 45;
    
    if (handleSpacing < MIN_SPACING) {
      // Too many handles - use minimum spacing and adjust start position
      handleSpacing = MIN_SPACING;
      const totalHeight = (maxHandles - 1) * handleSpacing;
      startPosition = HEADER_HEIGHT + VERTICAL_PADDING + ((USABLE_HEIGHT - totalHeight) / 2);
    } else if (handleSpacing > MAX_SPACING) {
      // Few handles - use max spacing for better aesthetics
      handleSpacing = MAX_SPACING;
      const totalHeight = (maxHandles - 1) * handleSpacing;
      startPosition = HEADER_HEIGHT + VERTICAL_PADDING + ((USABLE_HEIGHT - totalHeight) / 2);
    } else {
      // Perfect fit - distribute evenly from top of usable area
      startPosition = HEADER_HEIGHT + VERTICAL_PADDING;
    }
  }

  // Check if this node has compatible handles during connection preview
  const isConnectionTarget = connectionPreview && connectionPreview.compatibleTargets.some(
    target => target.nodeId === id
  );
  const isConnectionSource = connectionPreview && connectionPreview.sourceNode === id;
  const isConnectionActive = connectionPreview !== null;
  
  const compatibleHandles = connectionPreview?.compatibleTargets
    .filter(target => target.nodeId === id)
    .map(target => target.handleId) || [];

  return (
    <div className="relative">
      <Card 
        className={`w-80 bg-slate-800/90 backdrop-blur-sm transition-all duration-200 ${
          isSelected 
            ? "ring-2 ring-violet-500 shadow-xl shadow-violet-500/20 border-violet-500" 
            : "border-slate-700 hover:border-slate-600"
        } ${data.isActive ? `border-2` : ""}`}
        style={{ borderColor: data.isActive && !isSelected ? moduleDefinition.color : undefined }}
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
              className={`w-4 h-4 border-2 border-slate-900 shadow-md transition-all duration-200 ${
                isCompatible ? 'animate-pulse ring-2 ring-green-400' : ''
              }`}
              style={{ 
                top: startPosition + (index * handleSpacing),
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
              <span className="font-medium text-sm text-white">ID: {data.id}</span>
              <Badge 
                variant={data.isActive ? "default" : "secondary"}
                className={data.isActive ? "bg-violet-600 text-white" : "bg-slate-700 text-slate-300"}
              >
                {data.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center ml-3 gap-1">
              {/* Execution Status Indicator */}
              {getExecutionStatusIcon()}
              
              {/* Execute Button */}
              {WorkflowExecutionService.isModuleExecutable(data.module_name) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  title={isExecuting ? "Executing..." : "Execute Module"}
                >
                  {isExecuting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-300 hover:text-violet-400 hover:bg-slate-700"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm text-white">{moduleDefinition.display_name}</h3>
            <p className="text-xs text-slate-400">{moduleDefinition.description}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className="text-xs border-slate-600"
              style={{ color: moduleDefinition.color }}
            >
              {moduleDefinition.category}
            </Badge>
            
            {/* Output View Button - Bottom Right */}
            {hasOutput && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOutputViewer(true)}
                className="ml-auto bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                title="View Generated Output"
              >
                <Eye className="w-3 h-3 mr-1" />
                Output
              </Button>
            )}
          </div>

          {isExpanded && (
            <div className="space-y-3 pt-3 border-t border-slate-700">
              {inputKeys.map((inputKey) => {
                const inputDef = (moduleDefinition.inputs as any)[inputKey];
                return (
                  <div key={inputKey} className="space-y-1">
                    <Label className="text-xs flex items-center gap-1 text-slate-300">
                      {inputKey.replace(/_/g, " ")}
                      {inputDef?.required && (
                        <span className="text-red-400">*</span>
                      )}
                    </Label>
                    {renderInputField(inputKey, inputDef)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty space to maintain card height where button was */}
          <div className="h-10"></div>
        </CardContent>

        {/* Output Handles */}
        {outputKeys.map((key, index) => (
          <Handle
            key={key}
            type="source"
            position={Position.Right}
            id={key}
            className="w-4 h-4 border-2 border-slate-900 shadow-md"
            style={{ 
              top: startPosition + (index * handleSpacing),
              backgroundColor: moduleDefinition.color
            }}
          />
        ))}
      </Card>
      
      {/* Handle Labels - Show when selected, or during ANY connection */}
      {(isSelected || isConnectionActive) && (
        <>
          {/* Input Labels - Left side, right-aligned with gap from dot */}
          {inputKeys.map((key, index) => {
            const isCompatible = compatibleHandles.includes(key);
            
            return (
              <div 
                key={key} 
                className={`absolute text-xs px-2 py-1 rounded shadow-lg border text-right transition-all duration-200 whitespace-nowrap ${
                  isCompatible 
                    ? 'bg-green-500 border-green-600 text-white font-semibold animate-pulse scale-110' 
                    : isConnectionActive
                    ? 'bg-slate-800/90 backdrop-blur-sm border-slate-700 text-slate-400'
                    : 'bg-slate-800/90 backdrop-blur-sm text-slate-200 border-slate-700'
                }`}
                style={{ 
                  top: `${startPosition + (index * handleSpacing) - 12}px`,
                  right: 'calc(100% + 12px)', // 12px gap from the card edge (dot is 8px from edge)
                }}
              >
                {key.replace(/_/g, " ")}
              </div>
            );
          })}
          {/* Output Labels - Right side, left-aligned with gap from dot */}
          {outputKeys.map((key, index) => {
            const isSourceHandle = isConnectionSource && connectionPreview?.sourceHandle === key;
            
            return (
              <div 
                key={key} 
                className={`absolute text-xs px-2 py-1 rounded shadow-lg border text-left transition-all duration-200 whitespace-nowrap ${
                  isSourceHandle
                    ? 'bg-violet-500 border-violet-600 text-white font-semibold ring-2 ring-violet-400'
                    : isConnectionActive
                    ? 'bg-slate-800/90 backdrop-blur-sm border-slate-700 text-slate-400'
                    : 'bg-slate-800/90 backdrop-blur-sm text-slate-200 border-slate-700'
                }`}
                style={{ 
                  top: `${startPosition + (index * handleSpacing) - 12}px`,
                  left: 'calc(100% + 12px)', // 12px gap from the card edge (dot is 8px from edge)
                }}
              >
                {key.replace(/_/g, " ")}
              </div>
            );
          })}
        </>
      )}
      
      {/* Output Viewer Modal */}
      {showOutputViewer && executionResult && (
        <OutputViewer
          moduleName={data.module_name}
          result={executionResult}
          onClose={() => setShowOutputViewer(false)}
        />
      )}
    </div>
  );
});