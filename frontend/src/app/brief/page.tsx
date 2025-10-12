"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Network, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  Target, 
  TrendingUp, 
  Layers,
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  CheckCircle,
  AlertCircle,
  History,
  Eye
} from "lucide-react";
import Link from "next/link";
import { gsap } from "gsap";
import { CampaignApiService, CampaignResponse } from "@/lib/campaignApi";
import { storeCampaignResponse } from "@/lib/backendWorkflowGenerator";

const exampleBriefs = [
  {
    title: "Sustainable Coffee Launch",
    brief: "Launch a social media campaign for our new sustainable coffee brand targeting Gen Z in Mumbai for World Environment Day. Focus on eco-friendly packaging and carbon-neutral delivery.",
    icon: Target,
    color: "emerald",
  },
  {
    title: "Tech Product Launch",
    brief: "Create a comprehensive campaign for launching our AI-powered fitness tracker. Target health-conscious millennials across major Indian cities with emphasis on Instagram and LinkedIn.",
    icon: Zap,
    color: "blue",
  },
  {
    title: "Fashion Brand Revival",
    brief: "Revive interest in our vintage clothing line among fashion enthusiasts. Multi-platform campaign with focus on storytelling, influencer collaborations, and user-generated content.",
    icon: TrendingUp,
    color: "violet",
  },
];

const features = [
  {
    icon: Layers,
    title: "Multi-Module Workflow",
    description: "12 AI modules working together seamlessly",
  },
  {
    icon: MessageSquare,
    title: "Smart Copy Generation",
    description: "AI-powered content for every platform",
  },
  {
    icon: ImageIcon,
    title: "Visual Assets",
    description: "Auto-generated graphics and visuals",
  },
  {
    icon: Calendar,
    title: "Timeline Planning",
    description: "Optimized campaign scheduling",
  },
];

export default function BriefPage() {
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeFeature, setActiveFeature] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const thinkingSteps = [
    "Analyzing your campaign brief...",
    "Identifying target audience segments...",
    "Selecting optimal AI modules...",
    "Designing workflow connections...",
    "Optimizing module sequence...",
    "Finalizing campaign strategy...",
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const nodes: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];
    const connections: Array<{ from: number; to: number }> = [];

    for (let i = 0; i < 30; i++) {
      nodes.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 2,
      });
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.95) {
          connections.push({ from: i, to: j });
        }
      }
    }

    let animationFrameId: number;
    
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.offsetWidth) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.offsetHeight) node.vy *= -1;
      });

      connections.forEach(({ from, to }) => {
        const nodeFrom = nodes[from];
        const nodeTo = nodes[to];
        const distance = Math.hypot(nodeTo.x - nodeFrom.x, nodeTo.y - nodeFrom.y);

        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(nodeFrom.x, nodeFrom.y);
          ctx.lineTo(nodeTo.x, nodeTo.y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${1 - distance / 150})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#8B5CF6";
        ctx.fill();
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
    // Ensure all content is visible immediately
    const allElements = document.querySelectorAll('.brief-card, .feature-item, .example-card');
    allElements.forEach(el => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.visibility = 'visible';
    });

    const animationTimeout = setTimeout(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(".brief-card",
        { x: -60, opacity: 0 },
        { x: 0, opacity: 1, duration: 1 }
      );

      return () => {
        tl.kill();
      };
    }, 100);

    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => {
      clearTimeout(animationTimeout);
      clearInterval(featureInterval);
    };
  }, []);

  const handleGenerate = async () => {
    if (!brief.trim()) return;

    setIsGenerating(true);
    setCompletedSteps([]);
    setError(null);
    let currentStep = 0;

    const thinkingInterval = setInterval(() => {
      if (currentStep < thinkingSteps.length) {
        setThinkingText(thinkingSteps[currentStep]);
        setCompletedSteps(prev => [...prev, currentStep]);
        currentStep++;
      }
    }, 800);

    try {
      // Call the backend API to generate campaign
      const campaignResponse = await CampaignApiService.createQuickCampaign(brief);
      
      // Complete all thinking steps
      clearInterval(thinkingInterval);
      setCompletedSteps([0, 1, 2, 3, 4, 5]);
      setThinkingText("Campaign workflow generated successfully!");
      
      // Store the campaign response for the canvas
      storeCampaignResponse(campaignResponse);
      
      // Wait a moment for visual feedback
      setTimeout(() => {
        setIsGenerating(false);
        // Navigate to canvas
        router.push("/canvas");
      }, 1000);
      
    } catch (error) {
      console.error("Error generating campaign:", error);
      clearInterval(thinkingInterval);
      setError("Failed to generate campaign. Please check your backend connection and try again.");
      setIsGenerating(false);
    }
  };

  const fillExample = (exampleBrief: string) => {
    setBrief(exampleBrief);
    gsap.fromTo(
      ".brief-textarea",
      { scale: 0.98 },
      { scale: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
  };

  return (
    <div
      ref={containerRef}
      className="h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex flex-col"
    >
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-30"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Background Gradient Shapes */}
      <div className="shape absolute top-20 left-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="shape absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="shape absolute top-1/2 left-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/landing" className="inline-flex items-center space-x-2 group">
            <Network className="w-7 h-7 text-violet-500 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-xl font-bold text-white">CampaignAI</span>
          </Link>
          <div className="flex items-center space-x-6 text-sm">
            <Link href="/landing" className="text-slate-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/campaigns" className="text-slate-300 hover:text-white transition-colors">
              Campaigns
            </Link>
            <Link href="/canvas" className="text-slate-300 hover:text-white transition-colors">
              Canvas
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col px-6 overflow-hidden">
        {/* Main Content Area - Two Columns */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-8 items-start py-4">
            {/* Left Column - Brief Input */}
            <div className="brief-card max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <div className="mb-6">
                <div className="inline-flex items-center space-x-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1.5 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs text-violet-300">AI-Powered Workflow Generator</span>
                </div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
                  Describe Your Campaign
                </h1>
                <p className="text-base text-slate-300">
                  Share your marketing vision, and watch AI build a complete campaign workflow in seconds.
                </p>
              </div>

              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-4 mb-4">
                <textarea
                  className="brief-textarea w-full h-48 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-sm"
                  placeholder="Example: Launch a social media campaign for our new sustainable coffee brand targeting Gen Z in Mumbai for World Environment Day. Focus on eco-friendly packaging and carbon-neutral delivery..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-slate-400">
                    {brief.length} characters
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={!brief.trim() || isGenerating}
                    className="bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 disabled:cursor-not-allowed h-9 px-4 text-sm"
                  >
                    <Zap className="w-4 h-4 mr-1.5" />
                    Generate Workflow
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </Card>

              {/* Error Display */}
              {error && (
                <Card className="bg-red-900/30 border-red-500/50 p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-red-200 font-medium mb-1">Generation Failed</h3>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* View Previous Campaigns */}
              <Link href="/campaigns">
                <Card className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 border-violet-500/30 hover:border-violet-500/60 p-4 mb-4 cursor-pointer group transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <History className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm mb-0.5">View Previous Campaigns</h3>
                        <p className="text-slate-400 text-xs">Browse your campaign history and insights</p>
                      </div>
                    </div>
                    <Eye className="w-5 h-5 text-violet-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            </div>

            {/* Right Column - Example Briefs or Thinking Process */}
            <div className="hidden lg:block max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {!isGenerating ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <p className="text-sm text-white font-semibold">Quick Examples</p>
                    </div>
                    <span className="text-xs text-violet-400 font-medium">Click to use</span>
                  </div>
                  {exampleBriefs.map((example, idx) => {
                    const IconComponent = example.icon;
                    const colorClasses = {
                      emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                      violet: "bg-violet-500/20 text-violet-400 border-violet-500/30",
                    }[example.color];

                    return (
                      <Card
                        key={idx}
                        className="example-card bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-violet-500/40 p-4 hover:border-violet-500 hover:from-slate-800/70 hover:to-slate-800/50 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300 cursor-pointer group"
                        onClick={() => fillExample(example.brief)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-xl ${colorClasses} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm mb-2 group-hover:text-violet-300 transition-colors">{example.title}</h3>
                            <p className="text-xs text-slate-400 line-clamp-3 group-hover:text-slate-300 transition-colors">{example.brief}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                // Thinking Process - Claude Style
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="relative w-5 h-5">
                      <div className="absolute inset-0 border-2 border-violet-500/20 rounded-full" />
                      <div className="absolute inset-0 border-2 border-transparent border-t-violet-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">Generating Workflow</p>
                  </div>
                  
                  {thinkingSteps.map((step, idx) => {
                    const isCompleted = completedSteps.includes(idx);
                    const isCurrent = completedSteps.length === idx;
                    
                    return (
                      <Card
                        key={idx}
                        className={`p-4 transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-slate-800/50 border-emerald-500/30' 
                            : isCurrent
                            ? 'bg-slate-800/50 border-violet-500/50'
                            : 'bg-slate-800/20 border-slate-700/30'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            isCompleted
                              ? 'bg-emerald-500/20'
                              : isCurrent
                              ? 'bg-violet-500/20'
                              : 'bg-slate-700/20'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : isCurrent ? (
                              <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                            ) : (
                              <div className="w-2 h-2 bg-slate-500 rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${
                              isCompleted || isCurrent ? 'text-white' : 'text-slate-500'
                            }`}>
                              {step}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom - Features Horizontal */}
        <div className="relative z-10 pb-4 pt-2 flex-shrink-0">
          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-900/20 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {features.map((feature, idx) => {
                  const IconComponent = feature.icon;
                  const isActive = activeFeature === idx;
                  return (
                    <div
                      key={idx}
                      className={`feature-item group relative overflow-hidden rounded-lg transition-all duration-500 ${
                        isActive 
                          ? 'bg-slate-800/40 border-slate-700' 
                          : 'bg-slate-800/20 border-slate-700/30 hover:border-slate-600/50'
                      } border p-4`}
                    >
                      <div className="relative flex items-start space-x-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                          isActive 
                            ? 'bg-violet-500/20 scale-105' 
                            : 'bg-violet-500/10 group-hover:scale-105'
                        }`}>
                          <IconComponent className={`w-6 h-6 transition-colors duration-500 ${
                            isActive ? 'text-violet-400' : 'text-violet-400/70'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-bold mb-1 transition-colors duration-500 ${
                            isActive ? 'text-slate-200' : 'text-slate-300'
                          }`}>
                            {feature.title}
                          </h3>
                          <p className={`text-xs leading-relaxed transition-colors duration-500 ${
                            isActive ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center space-x-2 mt-4">
                {features.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveFeature(idx)}
                    className={`transition-all duration-300 rounded-full ${
                      activeFeature === idx 
                        ? 'w-6 h-2 bg-violet-500/60' 
                        : 'w-2 h-2 bg-slate-700 hover:bg-slate-600'
                    }`}
                    aria-label={`View feature ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
