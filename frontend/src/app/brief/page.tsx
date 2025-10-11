"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Network, Sparkles, Zap, ArrowRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import { gsap } from "gsap";

const exampleBriefs = [
  {
    title: "Sustainable Coffee Launch",
    brief: "Launch a social media campaign for our new sustainable coffee brand targeting Gen Z in Mumbai for World Environment Day. Focus on eco-friendly packaging and carbon-neutral delivery.",
  },
  {
    title: "Tech Product Launch",
    brief: "Create a comprehensive campaign for launching our AI-powered fitness tracker. Target health-conscious millennials across major Indian cities with emphasis on Instagram and LinkedIn.",
  },
  {
    title: "Fashion Brand Revival",
    brief: "Revive interest in our vintage clothing line among fashion enthusiasts. Multi-platform campaign with focus on storytelling, influencer collaborations, and user-generated content.",
  },
];

export default function BriefPage() {
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let animationFrameId: number;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.offsetWidth) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.offsetHeight) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${particle.opacity})`;
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
    gsap.fromTo(
      ".brief-header",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
    );

    gsap.fromTo(
      ".brief-main",
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power2.out" }
    );

    gsap.fromTo(
      ".example-card",
      { scale: 0.95, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.4,
        ease: "power2.out",
      }
    );
  }, []);

  const handleGenerate = async () => {
    if (!brief.trim()) return;

    setIsGenerating(true);
    let currentStep = 0;

    const thinkingInterval = setInterval(() => {
      if (currentStep < thinkingSteps.length) {
        setThinkingText(thinkingSteps[currentStep]);
        currentStep++;
      }
    }, 800);

    // Simulate workflow generation (replace with actual API call)
    setTimeout(() => {
      clearInterval(thinkingInterval);
      setIsGenerating(false);
      
      // Store the brief in sessionStorage to pass to canvas
      sessionStorage.setItem("campaignBrief", brief);
      
      // Navigate to canvas
      router.push("/canvas");
    }, 5000);
  };

  const fillExample = (exampleBrief: string) => {
    setBrief(exampleBrief);
    // Animate the textarea
    gsap.fromTo(
      ".brief-textarea",
      { scale: 0.98 },
      { scale: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-30"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center space-x-2">
            <Network className="w-8 h-8 text-violet-500" />
            <span className="text-xl font-bold">CampaignAI</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/landing" className="text-slate-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/canvas" className="text-slate-300 hover:text-white transition-colors">
              Canvas
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="brief-header text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300">AI-Powered Campaign Generator</span>
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
            Describe Your Campaign
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Tell us about your marketing goals, and we'll generate a complete AI workflow tailored to your needs.
          </p>
        </div>

        {/* Main Content */}
        {!isGenerating ? (
          <div className="brief-main">
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-8 mb-8">
              <textarea
                className="brief-textarea w-full h-64 bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-lg"
                placeholder="Example: Launch a social media campaign for our new sustainable coffee brand targeting Gen Z in Mumbai for World Environment Day. Focus on eco-friendly packaging and carbon-neutral delivery..."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
              />
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-400">
                  {brief.length} characters
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!brief.trim()}
                  size="lg"
                  className="bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Generate Workflow
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </Card>

            {/* Example Briefs */}
            <div className="mt-12">
              <div className="flex items-center space-x-2 mb-6">
                <Lightbulb className="w-5 h-5 text-violet-400" />
                <h2 className="text-2xl font-semibold text-white">Need inspiration?</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {exampleBriefs.map((example, idx) => (
                  <Card
                    key={idx}
                    className="example-card bg-slate-800/30 border-slate-700 p-6 hover:border-violet-500 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer"
                    onClick={() => fillExample(example.brief)}
                  >
                    <h3 className="font-semibold text-white mb-3 flex items-center">
                      <span className="w-2 h-2 bg-violet-500 rounded-full mr-2" />
                      {example.title}
                    </h3>
                    <p className="text-sm text-slate-300 line-clamp-4">{example.brief}</p>
                    <div className="mt-4 text-xs text-violet-400 hover:text-violet-300">
                      Click to use this example →
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Thinking/Loading Animation
          <div className="brief-main flex flex-col items-center justify-center min-h-[500px]">
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-12 text-center max-w-2xl">
              <div className="mb-8">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin" />
                  <div className="absolute inset-3 border-4 border-transparent border-t-violet-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1s" }} />
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Generating Your Workflow
                </h2>
                <div className="h-8 flex items-center justify-center">
                  <p className="text-lg text-violet-300 animate-pulse">
                    {thinkingText}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-4 text-sm text-slate-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Analyzing brief</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <span>Selecting modules</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                    <span>Building workflow</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
