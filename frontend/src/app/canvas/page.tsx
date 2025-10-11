"use client";

import { CampaignCanvas } from "@/components/workflow/CampaignCanvas";
import { useState, useEffect, useRef } from "react";
import { Node, Edge } from "@xyflow/react";
import { 
  generateWorkflowFromCampaignResponse, 
  getStoredCampaignResponse,
  clearStoredCampaignResponse 
} from "@/lib/backendWorkflowGenerator";
import { generateWorkflowFromBrief } from "@/lib/workflowGenerator";
import { Network, Sparkles, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CanvasPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Animated background
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];
    const connections: Array<{ from: number; to: number }> = [];

    for (let i = 0; i < 40; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
      });
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.96) {
          connections.push({ from: i, to: j });
        }
      }
    }

    let animationFrameId: number;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });

      connections.forEach(({ from, to }) => {
        const nodeFrom = nodes[from];
        const nodeTo = nodes[to];
        const distance = Math.hypot(nodeTo.x - nodeFrom.x, nodeTo.y - nodeFrom.y);

        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(nodeFrom.x, nodeFrom.y);
          ctx.lineTo(nodeTo.x, nodeTo.y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - distance / 150)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#8B5CF6";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#8B5CF6";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    // Try to get campaign response from backend generator first
    const campaignResponse = getStoredCampaignResponse();
    
    if (campaignResponse) {
      // Generate workflow from backend response
      const { nodes: generatedNodes, edges: generatedEdges } = generateWorkflowFromCampaignResponse(campaignResponse);
      setNodes(generatedNodes);
      setEdges(generatedEdges);
      
      
      // Clear stored response
      clearStoredCampaignResponse();
      setIsLoading(false);
    } else {
      // Fallback: check for legacy campaign brief
      const brief = sessionStorage.getItem("campaignBrief");
      
      if (brief) {
        // Simulate loading with brief
        setTimeout(() => {
          // Generate workflow from brief using fallback method
          const { nodes: generatedNodes, edges: generatedEdges } = generateWorkflowFromBrief(brief);
          setNodes(generatedNodes);
          setEdges(generatedEdges);
          
          // Clear the brief from sessionStorage
          sessionStorage.removeItem("campaignBrief");
          setIsLoading(false);
        }, 1500);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
      />

      {/* Top Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/landing" className="flex items-center space-x-2 group">
              <Network className="w-7 h-7 text-violet-500 group-hover:text-violet-400 transition-colors" />
              <span className="text-xl font-bold text-white">CampaignAI</span>
            </Link>
            <div className="h-6 w-px bg-slate-700"></div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <span className="text-sm text-slate-300 font-medium">Campaign Workflow Canvas</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/brief">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Brief
              </Button>
            </Link>
            <Link href="/landing">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-6"></div>
              <Sparkles className="w-8 h-8 text-violet-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Generating Your Workflow</h3>
            <p className="text-slate-400">Creating AI-powered campaign modules...</p>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="h-full w-full pt-[57px] relative">
        <CampaignCanvas initialNodes={nodes} initialEdges={edges} />
      </div>
    </div>
  );
}