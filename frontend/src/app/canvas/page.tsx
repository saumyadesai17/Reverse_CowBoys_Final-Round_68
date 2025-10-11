"use client";

import { CampaignCanvas } from "@/components/workflow/CampaignCanvas";
import { useState, useEffect } from "react";
import { Node, Edge } from "@xyflow/react";
import { generateWorkflowFromBrief } from "@/lib/workflowGenerator";

export default function CanvasPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    // Get the campaign brief from sessionStorage
    const brief = sessionStorage.getItem("campaignBrief");
    
    if (brief) {
      // Generate workflow from brief
      const { nodes: generatedNodes, edges: generatedEdges } = generateWorkflowFromBrief(brief);
      setNodes(generatedNodes);
      setEdges(generatedEdges);
      
      // Clear the brief from sessionStorage
      sessionStorage.removeItem("campaignBrief");
    }
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden">
      <CampaignCanvas initialNodes={nodes} initialEdges={edges} />
    </div>
  );
}