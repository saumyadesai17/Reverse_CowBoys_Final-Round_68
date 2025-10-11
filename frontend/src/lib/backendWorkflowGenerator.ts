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
  
  // Convert array values to single values for enum fields
  const processedInputs = processConfigForFrontend(config || {});
  
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

// Process backend config to make it compatible with frontend components
function processConfigForFrontend(config: any): Record<string, any> {
  const processed: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(config)) {
    if (Array.isArray(value)) {
      // For arrays, take the first value if it's a simple array of strings/numbers
      // This handles cases like ["photorealistic", "illustration"] -> "photorealistic"
      if (value.length > 0 && (typeof value[0] === 'string' || typeof value[0] === 'number')) {
        processed[key] = value[0];
      } else {
        // Keep complex arrays as is
        processed[key] = value;
      }
    } else if (value !== null && typeof value === 'object') {
      // Recursively process nested objects
      processed[key] = processConfigForFrontend(value);
    } else {
      // Keep primitive values as is
      processed[key] = value;
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