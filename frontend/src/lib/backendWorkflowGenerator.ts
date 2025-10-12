import { Node, Edge } from "@xyflow/react";
import { CampaignResponse, ModuleConnection } from "./campaignApi";

interface WorkflowGenerationResult {
  nodes: Node[];
  edges: Edge[];
}

// Convert backend module configurations to frontend node format
function createNodeFromModuleConfig(
  moduleName: string,
  config: any,
  moduleNames: string[],
  connections: ModuleConnection[],
  useSmartPositioning: boolean = true
): Node {
  // Use smart positioning based on workflow hierarchy, fallback to index-based
  const position = useSmartPositioning 
    ? calculateSmartNodePosition(moduleName, moduleNames, connections)
    : calculateNodePosition(moduleNames.indexOf(moduleName), moduleNames.length);
  
  // Process config while preserving data types and structure
  const processedInputs = processConfigForFrontend(config || {}, moduleName);
  
  return {
    id: `${moduleName}-0`,
    type: "module",
    position,
    data: {
      id: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      isActive: true,
      module_name: moduleName,
      inputs: processedInputs,
    },
  };
}

// Process backend config to preserve the original data structure
function processConfigForFrontend(config: any, moduleName: string): Record<string, any> {
  // Import module definitions to understand expected input types
  const { MODULE_DEFINITIONS } = require('./moduleDefinitions');
  const moduleDefinition = MODULE_DEFINITIONS[moduleName as keyof typeof MODULE_DEFINITIONS];
  
  const processed: Record<string, any> = {};
  
  // First, process all existing config values
  for (const [key, value] of Object.entries(config)) {
    const inputDef = moduleDefinition?.inputs?.[key] as any; // Type assertion for dynamic access
    
    // If we have a definition for this input, ensure proper data type initialization
    if (inputDef) {
      if (inputDef.type === 'array') {
        // Ensure array types are properly initialized
        if (Array.isArray(value)) {
          processed[key] = [...value]; // Create a copy
        } else if (value !== null && value !== undefined) {
          processed[key] = [value]; // Convert single value to array
        } else {
          processed[key] = [];
        }
      } else if (inputDef.type === 'object') {
        // Ensure object types are properly initialized
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          const objectValue = { ...value } as Record<string, any>; // Create a copy with type assertion
          
          // Ensure array properties within objects are properly handled
          if (inputDef.properties) {
            for (const [propKey, propType] of Object.entries(inputDef.properties)) {
              if (Array.isArray(propType) && objectValue[propKey] !== undefined) {
                // This property should be an array
                if (!Array.isArray(objectValue[propKey])) {
                  // Convert to array if it's not already
                  if (typeof objectValue[propKey] === 'string') {
                    try {
                      const parsed = JSON.parse(objectValue[propKey]);
                      objectValue[propKey] = Array.isArray(parsed) ? parsed : [objectValue[propKey]];
                    } catch {
                      objectValue[propKey] = [objectValue[propKey]];
                    }
                  } else {
                    objectValue[propKey] = objectValue[propKey] ? [objectValue[propKey]] : [];
                  }
                }
              } else if (Array.isArray(propType) && objectValue[propKey] === undefined) {
                // Initialize missing array properties
                objectValue[propKey] = [];
              }
            }
          }
          
          processed[key] = objectValue;
        } else {
          processed[key] = {};
        }
      } else {
        // Preserve the original value for primitive types
        processed[key] = value;
      }
    } else {
      // For undefined inputs in schema, preserve as is
      if (Array.isArray(value)) {
        processed[key] = [...value];
      } else if (value !== null && typeof value === 'object') {
        processed[key] = { ...value };
      } else {
        processed[key] = value;
      }
    }
  }
  
  // Then, ensure all schema-defined inputs are initialized
  if (moduleDefinition?.inputs) {
    for (const [key, inputDef] of Object.entries(moduleDefinition.inputs)) {
      if (!(key in processed)) {
        const def = inputDef as any; // Type assertion for dynamic module definitions
        // Initialize missing inputs based on their type
        if (def.type === 'array') {
          processed[key] = [];
        } else if (def.type === 'object') {
          // Initialize object with proper structure based on properties definition
          const objectValue: Record<string, any> = {};
          if (def.properties) {
            for (const [propKey, propType] of Object.entries(def.properties)) {
              if (Array.isArray(propType)) {
                // This property should be an array
                objectValue[propKey] = [];
              } else if (propType === 'object') {
                objectValue[propKey] = {};
              } else {
                // Primitive type, leave empty for now
                objectValue[propKey] = "";
              }
            }
          }
          processed[key] = objectValue;
        } else if (def.default !== undefined) {
          processed[key] = def.default;
        }
      }
    }
  }
  
  return processed;
}

// Position nodes in a logical flow layout with generous spacing
function calculateNodePosition(index: number, total: number): { x: number; y: number } {
  const startX = 150;
  const startY = 150;
  const horizontalSpacing = 500;  // Increased from 350 to prevent horizontal overlap
  const verticalSpacing = 400;   // Increased from 200 to prevent vertical overlap
  
  // Arrange in a grid-like pattern with fewer nodes per row for better spacing
  const nodesPerRow = Math.min(3, Math.ceil(Math.sqrt(total))); // Adaptive grid based on total nodes
  const row = Math.floor(index / nodesPerRow);
  const col = index % nodesPerRow;
  
  return {
    x: startX + col * horizontalSpacing,
    y: startY + row * verticalSpacing,
  };
}

// Advanced positioning based on workflow hierarchy
function calculateSmartNodePosition(
  moduleName: string, 
  moduleNames: string[], 
  connections: ModuleConnection[]
): { x: number; y: number } {
  // Define workflow layers based on typical flow
  const layerDefinitions = {
    input: ["audience_intelligence_analyzer"],
    processing: [
      "copy_content_generator", 
      "visual_asset_generator", 
      "video_content_generator",
      "campaign_timeline_optimizer",
      "lead_discovery_engine"
    ],
    distribution: [
      "content_distribution_scheduler",
      "outreach_call_scheduler",
      "collaboration_outreach_composer"
    ],
    execution: [
      "content_distribution_executor",
      "voice_interaction_agent"
    ],
    integration: ["external_api_orchestrator"]
  };
  
  const startX = 150;
  const startY = 150;
  const layerSpacing = 600; // Horizontal distance between layers
  const nodeSpacing = 350;  // Vertical spacing within a layer
  
  // Determine which layer the module belongs to
  let layer = 0;
  let positionInLayer = 0;
  
  for (const [layerName, modules] of Object.entries(layerDefinitions)) {
    const moduleIndex = modules.indexOf(moduleName);
    if (moduleIndex !== -1) {
      positionInLayer = moduleIndex;
      break;
    }
    layer++;
  }
  
  // If module not found in predefined layers, use fallback positioning
  if (layer >= Object.keys(layerDefinitions).length) {
    const fallbackIndex = moduleNames.indexOf(moduleName);
    return calculateNodePosition(fallbackIndex, moduleNames.length);
  }
  
  return {
    x: startX + layer * layerSpacing,
    y: startY + positionInLayer * nodeSpacing,
  };
}

// Convert backend module connections to frontend edge format
function createEdgesFromConnections(connections: ModuleConnection[]): Edge[] {
  const edges: Edge[] = [];
  
  connections.forEach((moduleConnection, moduleIndex) => {
    moduleConnection.connections.forEach((connection, connectionIndex) => {
      const edgeId = `e-${moduleConnection.module_name}-${connection.target_module}-${connectionIndex}`;
      
      // Skip the universal "any_module" connection as it's not a real connection
      if (connection.target_module === "any_module") {
        return;
      }
      
      edges.push({
        id: edgeId,
        source: `${moduleConnection.module_name}-0`,
        target: `${connection.target_module}-0`,
        sourceHandle: connection.source_output,
        targetHandle: connection.target_input,
        type: "smoothstep",
        animated: false,
        style: { 
          stroke: "#94a3b8", 
          strokeWidth: 2 
        },
      });
    });
  });
  
  return edges;
}

// Generate workflow from backend campaign response
export function generateWorkflowFromCampaignResponse(
  campaignResponse: CampaignResponse
): WorkflowGenerationResult {
  const { module_configurations, module_connections } = campaignResponse;
  
  // Create nodes from module configurations
  const moduleNames = Object.keys(module_configurations);
  const nodes: Node[] = moduleNames.map((moduleName) => {
    const config = module_configurations[moduleName];
    return createNodeFromModuleConfig(moduleName, config, moduleNames, module_connections);
  });
  
  // Create edges from module connections
  const edges = createEdgesFromConnections(module_connections);
  
  return { nodes, edges };
}

// Fallback function to ensure compatibility with existing code
export function generateWorkflowFromBrief(brief: string): WorkflowGenerationResult {
  // This is a fallback for when the backend API is not available
  // You can keep the existing logic here or return empty workflow
  console.warn("Using fallback workflow generation. Consider using backend API instead.");
  
  return {
    nodes: [],
    edges: [],
  };
}

// Store campaign response globally for the canvas to access
let storedCampaignResponse: CampaignResponse | null = null;

export function storeCampaignResponse(response: CampaignResponse) {
  storedCampaignResponse = response;
  // Also store in sessionStorage as backup
  sessionStorage.setItem("campaignResponse", JSON.stringify(response));
}

export function getStoredCampaignResponse(): CampaignResponse | null {
  if (storedCampaignResponse) {
    return storedCampaignResponse;
  }
  
  // Try to get from sessionStorage
  const stored = sessionStorage.getItem("campaignResponse");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error("Error parsing stored campaign response:", error);
    }
  }
  
  return null;
}

export function clearStoredCampaignResponse() {
  storedCampaignResponse = null;
  sessionStorage.removeItem("campaignResponse");
  sessionStorage.removeItem("campaignBrief");
}