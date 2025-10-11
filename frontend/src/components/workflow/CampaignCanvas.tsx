"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { GenericModuleNode } from "./nodes/GenericModuleNode";
import { OutputNode } from "./nodes/OutputNode";
import { InputNode } from "./nodes/InputNode";
import { useCampaignStore } from "@/stores/campaignStore";
import { Sidebar } from "./Sidebar";
import { MODULE_DEFINITIONS, CONNECTION_MATRIX } from "@/lib/moduleDefinitions";
import { Eye, EyeOff } from "lucide-react";

const nodeTypes = {
  module: GenericModuleNode,
  output: OutputNode,
  input: InputNode,
};

const initialNodes: Node[] = [
  {
    id: "input-1",
    type: "input",
    position: { x: 100, y: 100 },
    data: { 
      label: "Campaign Brief",
      value: "",
      description: "Enter your marketing brief here"
    },
  },
  {
    id: "visual-1", 
    type: "module",
    position: { x: 400, y: 150 },
    data: {
      id: "HY82394HQG",
      isActive: true,
      module_name: "visual_asset_generator",
      inputs: {
        prompt: "",
        quantity: 1,
        image_style: "photorealistic",
        dimensions: { width: 1024, height: 1024 }
      }
    },
  },
  {
    id: "audience-1", 
    type: "module",
    position: { x: 150, y: 300 },
    data: {
      id: "HY82394HGG",
      isActive: true,
      module_name: "audience_intelligence_analyzer",
      inputs: {
        product_category: "",
        geographic_location: { country: "", city: "", region: "" },
        campaign_objective: ""
      }
    },
  },
  {
    id: "copy-1", 
    type: "module",
    position: { x: 400, y: 350 },
    data: {
      id: "HY82394HGH",
      isActive: true,
      module_name: "copy_content_generator",
      inputs: {
        content_purpose: "social_caption",
        campaign_brief: "",
        tone_of_voice: "professional",
        target_audience: {}
      }
    },
  },
  {
    id: "output-1",
    type: "output", 
    position: { x: 700, y: 250 },
    data: {
      label: "Campaign Assets",
      results: []
    },
  },
];

const initialEdges: Edge[] = [];

export function CampaignCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMinimapCollapsed, setIsMinimapCollapsed] = React.useState(false);
  const { selectedNodeId, setSelectedNodeId, connectionPreview, setConnectionPreview } = useCampaignStore();

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      // Check connection compatibility
      if (sourceNode && targetNode) {
        const isCompatible = checkConnectionCompatibility(
          sourceNode, 
          params.sourceHandle!,
          targetNode, 
          params.targetHandle!
        );
        
        if (isCompatible) {
          setEdges((eds) => addEdge(params, eds));
        }
      }
    },
    [nodes, setEdges]
  );

  const checkConnectionCompatibility = (
    sourceNode: Node,
    sourceHandle: string,
    targetNode: Node, 
    targetHandle: string
  ): boolean => {
    // Check using the connection matrix
    if (sourceNode.type === "module" && targetNode.type === "module") {
      const sourceKey = `${sourceNode.data.module_name}.${sourceHandle}`;
      const targetKey = `${targetNode.data.module_name}.${targetHandle}`;
      
      const compatibleTargets = CONNECTION_MATRIX[sourceKey as keyof typeof CONNECTION_MATRIX];
      
      if (compatibleTargets) {
        return compatibleTargets.includes(targetKey) || compatibleTargets.includes("*");
      }
    }
    
    // Allow connections from input nodes to any module input
    if (sourceNode.type === "input" && targetNode.type === "module") {
      return true;
    }
    
    // Allow connections from any module output to output nodes
    if (sourceNode.type === "module" && targetNode.type === "output") {
      return true;
    }
    
    return false;
  };



  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
    const data = event.dataTransfer.getData('application/reactflow');

    if (typeof data === 'undefined' || !data || !reactFlowInstance || !reactFlowBounds) {
      return;
    }

    try {
      const dropData = JSON.parse(data);
      
      // Use cursor position or center of viewport if no cursor position
      let position;
      if (event.clientX && event.clientY) {
        position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });
      } else {
        // Center of viewport as fallback
        const viewport = reactFlowInstance.getViewport();
        position = {
          x: (reactFlowBounds.width / 2 - viewport.x) / viewport.zoom,
          y: (reactFlowBounds.height / 2 - viewport.y) / viewport.zoom,
        };
      }

      // Initialize inputs with default values from module definition
      const moduleDefinition = MODULE_DEFINITIONS[dropData.module_name as keyof typeof MODULE_DEFINITIONS];
      const initialInputs: Record<string, any> = {};
      
      if (moduleDefinition) {
        Object.entries(moduleDefinition.inputs).forEach(([key, inputDef]: [string, any]) => {
          initialInputs[key] = inputDef.default || (inputDef.type === 'integer' ? 0 : inputDef.type === 'boolean' ? false : '');
        });
      }

      const newNode = {
        id: `${dropData.module_name}-${Date.now()}`,
        type: 'module',
        position,
        data: {
          id: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          isActive: true,
          module_name: dropData.module_name,
          inputs: initialInputs
        },
      };

      setNodes((nds) => nds.concat(newNode));
    } catch (error) {
      console.error('Error parsing drop data:', error);
    }
  }, [reactFlowInstance, setNodes]);

  const getCompatibleTargets = useCallback((sourceNodeId: string, sourceHandle: string) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return [];

    const compatibleTargets: Array<{nodeId: string, handleId: string}> = [];
    
    nodes.forEach(targetNode => {
      if (targetNode.id === sourceNodeId) return; // Skip same node
      
      if (targetNode.type === "module") {
        const moduleDefinition = MODULE_DEFINITIONS[targetNode.data.module_name as keyof typeof MODULE_DEFINITIONS];
        if (moduleDefinition) {
          Object.keys(moduleDefinition.inputs).forEach(inputKey => {
            if (checkConnectionCompatibility(sourceNode, sourceHandle, targetNode, inputKey)) {
              compatibleTargets.push({ nodeId: targetNode.id, handleId: inputKey });
            }
          });
        }
      } else if (targetNode.type === "output") {
        compatibleTargets.push({ nodeId: targetNode.id, handleId: "input" });
      }
    });

    return compatibleTargets;
  }, [nodes]);

  const onConnectStart = useCallback((event: any, params: any) => {
    const compatibleTargets = getCompatibleTargets(params.nodeId, params.handleId);
    setConnectionPreview({
      sourceNode: params.nodeId,
      sourceHandle: params.handleId,
      compatibleTargets,
    });
  }, [getCompatibleTargets, setConnectionPreview]);

  const onConnectEnd = useCallback((event: any) => {
    setConnectionPreview(null);
  }, [setConnectionPreview]);

  const handleAddModule = useCallback((moduleId: string) => {
    // Get viewport center for new node placement
    let position = { x: 300, y: 200 }; // Default position
    
    if (reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      const bounds = document.querySelector('.react-flow')?.getBoundingClientRect();
      
      if (bounds) {
        position = reactFlowInstance.screenToFlowPosition({
          x: bounds.width / 2,
          y: bounds.height / 2,
        });
      }
    }

    // Initialize inputs with default values from module definition
    const moduleDefinition = MODULE_DEFINITIONS[moduleId as keyof typeof MODULE_DEFINITIONS];
    const initialInputs: Record<string, any> = {};
    
    if (moduleDefinition) {
      Object.entries(moduleDefinition.inputs).forEach(([key, inputDef]: [string, any]) => {
        initialInputs[key] = inputDef.default || (inputDef.type === 'integer' ? 0 : inputDef.type === 'boolean' ? false : '');
      });
    }

    const newNode = {
      id: `${moduleId}-${Date.now()}`,
      type: 'module' as const,
      position,
      data: {
        id: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        isActive: true,
        module_name: moduleId,
        inputs: initialInputs
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  return (
    <div className="h-screen w-full flex overflow-hidden">
      <div className="flex-1 relative h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onInit={setReactFlowInstance}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Strict}
          fitView
          className="bg-gray-50 h-full w-full"
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          {!isMinimapCollapsed && (
            <MiniMap
              className="!bg-white"
              nodeColor={(node) => {
                switch (node.type) {
                  case "input":
                    return "#3b82f6";
                  case "module":
                    if (node.data.module_name && MODULE_DEFINITIONS[node.data.module_name as keyof typeof MODULE_DEFINITIONS]) {
                      return MODULE_DEFINITIONS[node.data.module_name as keyof typeof MODULE_DEFINITIONS].color;
                    }
                    return "#6b7280"; 
                  case "output":
                    return "#f59e0b";
                  default:
                    return "#6b7280";
                }
              }}
            />
          )}
        </ReactFlow>
        
        {/* Minimap Toggle Button */}
        <button
          onClick={() => setIsMinimapCollapsed(!isMinimapCollapsed)}
          className="absolute bottom-4 right-4 bg-white border border-gray-300 rounded-md p-2 text-xs shadow-sm hover:bg-gray-50 z-10 flex items-center justify-center"
          title={isMinimapCollapsed ? 'Show Minimap' : 'Hide Minimap'}
        >
          {isMinimapCollapsed ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      </div>
      <Sidebar 
        onAddModule={handleAddModule}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
    </div>
  );
}