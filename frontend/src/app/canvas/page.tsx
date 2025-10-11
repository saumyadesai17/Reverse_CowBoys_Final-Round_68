"use client";

import { CampaignCanvas } from "@/components/workflow/CampaignCanvas";
import { useState, useEffect } from "react";
import { Node, Edge } from "@xyflow/react";
import { 
  generateWorkflowFromCampaignResponse, 
  getStoredCampaignResponse,
  clearStoredCampaignResponse 
} from "@/lib/backendWorkflowGenerator";
import { generateWorkflowFromBrief } from "@/lib/workflowGenerator";
import { testNodeSpacing } from "@/lib/nodeSpacingTest";

export default function CanvasPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get campaign response from backend generator first
    const campaignResponse = getStoredCampaignResponse();
    
    if (campaignResponse) {
      // Generate workflow from backend response
      const { nodes: generatedNodes, edges: generatedEdges } = generateWorkflowFromCampaignResponse(campaignResponse);
      setNodes(generatedNodes);
      setEdges(generatedEdges);
      
      // Test node spacing in development
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 Testing node spacing for generated workflow...");
        testNodeSpacing();
      }
      
      // Clear stored response
      clearStoredCampaignResponse();
    } else {
      // Fallback: check for legacy campaign brief
      const brief = sessionStorage.getItem("campaignBrief");
      
      if (brief) {
        // Generate workflow from brief using fallback method
        const { nodes: generatedNodes, edges: generatedEdges } = generateWorkflowFromBrief(brief);
        setNodes(generatedNodes);
        setEdges(generatedEdges);
        
        // Clear the brief from sessionStorage
        sessionStorage.removeItem("campaignBrief");
      }
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <CampaignCanvas initialNodes={nodes} initialEdges={edges} />
    </div>
  );
}