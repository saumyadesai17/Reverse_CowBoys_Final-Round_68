import { Node, Edge } from "@xyflow/react";
import { MODULE_DEFINITIONS } from "./moduleDefinitions";

interface WorkflowGenerationResult {
  nodes: Node[];
  edges: Edge[];
}

// Sample workflow templates based on campaign type
const workflowTemplates = {
  social_media: [
    "audience_intelligence_analyzer",
    "visual_asset_generator",
    "copy_content_generator",
    "content_distribution_scheduler",
  ],
  product_launch: [
    "audience_intelligence_analyzer",
    "visual_asset_generator",
    "video_content_generator",
    "copy_content_generator",
    "campaign_timeline_optimizer",
    "content_distribution_scheduler",
  ],
  brand_awareness: [
    "audience_intelligence_analyzer",
    "visual_asset_generator",
    "copy_content_generator",
    "lead_discovery_engine",
    "collaboration_outreach_composer",
  ],
  comprehensive: [
    "audience_intelligence_analyzer",
    "visual_asset_generator",
    "video_content_generator",
    "copy_content_generator",
    "campaign_timeline_optimizer",
    "content_distribution_scheduler",
  ],
};

// Detect campaign type from brief (simple keyword matching)
function detectCampaignType(brief: string): keyof typeof workflowTemplates {
  const lowerBrief = brief.toLowerCase();
  
  if (lowerBrief.includes("product launch") || lowerBrief.includes("launching")) {
    return "product_launch";
  } else if (lowerBrief.includes("social media") || lowerBrief.includes("instagram") || lowerBrief.includes("facebook")) {
    return "social_media";
  } else if (lowerBrief.includes("awareness") || lowerBrief.includes("brand") || lowerBrief.includes("influencer")) {
    return "brand_awareness";
  }
  
  return "comprehensive";
}

// Generate initial input values from brief
function generateInitialInputs(moduleName: string, brief: string): Record<string, any> {
  const moduleDefinition = MODULE_DEFINITIONS[moduleName as keyof typeof MODULE_DEFINITIONS];
  if (!moduleDefinition) return {};

  const inputs: Record<string, any> = {};

  Object.entries(moduleDefinition.inputs).forEach(([key, inputDef]: [string, any]) => {
    // Set defaults or extract from brief
    if (inputDef.default !== undefined) {
      inputs[key] = inputDef.default;
    } else if (inputDef.type === "integer") {
      inputs[key] = inputDef.default || 1;
    } else if (inputDef.type === "boolean") {
      inputs[key] = inputDef.default || false;
    } else if (inputDef.type === "string") {
      // For certain fields, try to extract from brief
      if (key === "campaign_brief" || key === "campaign_objective") {
        inputs[key] = brief.substring(0, 200);
      } else if (key === "product_category") {
        inputs[key] = extractProductCategory(brief);
      } else {
        inputs[key] = "";
      }
    } else if (inputDef.type === "object") {
      inputs[key] = {};
    } else if (inputDef.type === "array") {
      inputs[key] = [];
    } else if (inputDef.type === "enum") {
      inputs[key] = inputDef.values ? inputDef.values[0] : "";
    }
  });

  return inputs;
}

function extractProductCategory(brief: string): string {
  const categories = ["coffee", "fitness", "fashion", "tech", "food", "beauty", "lifestyle"];
  const lowerBrief = brief.toLowerCase();
  
  for (const category of categories) {
    if (lowerBrief.includes(category)) {
      return category;
    }
  }
  
  return "general";
}

// Position nodes in a logical flow layout
function calculateNodePosition(index: number, total: number): { x: number; y: number } {
  const startX = 100;
  const startY = 100;
  const horizontalSpacing = 350;
  const verticalSpacing = 200;
  
  // Arrange in a grid-like pattern
  const nodesPerRow = 3;
  const row = Math.floor(index / nodesPerRow);
  const col = index % nodesPerRow;
  
  return {
    x: startX + col * horizontalSpacing,
    y: startY + row * verticalSpacing,
  };
}

// Generate connections between modules based on typical workflow patterns
function generateConnections(moduleNames: string[]): Edge[] {
  const edges: Edge[] = [];
  
  // Simple sequential connections with some branching
  for (let i = 0; i < moduleNames.length - 1; i++) {
    const sourceModule = moduleNames[i];
    const targetModule = moduleNames[i + 1];
    
    // Create edge from source to target
    edges.push({
      id: `e-${i}`,
      source: `${sourceModule}-0`,
      target: `${targetModule}-0`,
      sourceHandle: getOutputHandle(sourceModule),
      targetHandle: getInputHandle(targetModule),
      type: "smoothstep",
      animated: false,
      style: { stroke: "#94a3b8", strokeWidth: 2 },
    });
  }
  
  // Add branching connections for specific patterns
  // For example, audience analyzer can feed into multiple modules
  if (moduleNames.includes("audience_intelligence_analyzer")) {
    const audienceIndex = moduleNames.findIndex(m => m === "audience_intelligence_analyzer");
    const visualIndex = moduleNames.findIndex(m => m === "visual_asset_generator");
    const copyIndex = moduleNames.findIndex(m => m === "copy_content_generator");
    
    if (audienceIndex !== -1 && visualIndex !== -1 && visualIndex > audienceIndex + 1) {
      edges.push({
        id: `e-audience-visual`,
        source: `audience_intelligence_analyzer-0`,
        target: `visual_asset_generator-0`,
        sourceHandle: "audience_segments",
        targetHandle: "brand_guidelines",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      });
    }
    
    if (audienceIndex !== -1 && copyIndex !== -1 && copyIndex > audienceIndex + 1) {
      edges.push({
        id: `e-audience-copy`,
        source: `audience_intelligence_analyzer-0`,
        target: `copy_content_generator-0`,
        sourceHandle: "persona_profiles",
        targetHandle: "target_audience",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      });
    }
  }
  
  return edges;
}

function getOutputHandle(moduleName: string): string {
  const moduleDefinition = MODULE_DEFINITIONS[moduleName as keyof typeof MODULE_DEFINITIONS];
  if (!moduleDefinition) return "output";
  
  // Return first output key
  const outputs = Object.keys(moduleDefinition.outputs);
  return outputs[0] || "output";
}

function getInputHandle(moduleName: string): string {
  const moduleDefinition = MODULE_DEFINITIONS[moduleName as keyof typeof MODULE_DEFINITIONS];
  if (!moduleDefinition) return "input";
  
  // Return first input key
  const inputs = Object.keys(moduleDefinition.inputs);
  return inputs[0] || "input";
}

export function generateWorkflowFromBrief(brief: string): WorkflowGenerationResult {
  // Detect campaign type
  const campaignType = detectCampaignType(brief);
  
  // Get template modules
  const moduleNames = workflowTemplates[campaignType];
  
  // Generate nodes
  const nodes: Node[] = moduleNames.map((moduleName, index) => {
    const position = calculateNodePosition(index, moduleNames.length);
    const initialInputs = generateInitialInputs(moduleName, brief);
    
    return {
      id: `${moduleName}-0`,
      type: "module",
      position,
      data: {
        id: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        isActive: true,
        module_name: moduleName,
        inputs: initialInputs,
      },
    };
  });
  
  // Generate edges
  const edges = generateConnections(moduleNames);
  
  return { nodes, edges };
}

// Get a random workflow for demo purposes
export function getRandomWorkflow(): WorkflowGenerationResult {
  const templates = Object.keys(workflowTemplates);
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return generateWorkflowFromBrief(`Sample ${randomTemplate} campaign`);
}
