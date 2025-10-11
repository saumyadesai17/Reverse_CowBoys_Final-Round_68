"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Zap,
  Network,
  ArrowRight,
  Play,
  Image,
  Video,
  FileText,
  Users,
  Calendar,
  Send,
  Phone,
  Search,
  MessageSquare,
  Plug,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const modules = [
  { icon: Image, name: "Visual Generator", color: "#10B981" },
  { icon: Video, name: "Video Creator", color: "#3B82F6" },
  { icon: FileText, name: "Copy Writer", color: "#8B5CF6" },
  { icon: Users, name: "Audience Intel", color: "#F59E0B" },
  { icon: Calendar, name: "Timeline Optimizer", color: "#EF4444" },
  { icon: Send, name: "Content Distributor", color: "#06B6D4" },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeModule, setActiveModule] = useState(0);

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
    // Ensure all content is visible as fallback
    const allElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-cta, .feature-card, .module-card, .campaignai-title, .pricing-card');
    allElements.forEach(el => {
      (el as HTMLElement).style.visibility = 'visible';
    });

    // Small delay to ensure DOM is ready for animations
    const animationTimeout = setTimeout(() => {
      // Hero timeline with smooth animations
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(".hero-title",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 }
      )
      .fromTo(".hero-subtitle",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        "-=0.5"
      )
      .fromTo(".hero-cta",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.4"
      );

      // ScrollTrigger animations with immediate, smooth triggers
      const featureCards = gsap.utils.toArray(".feature-card");
      featureCards.forEach((card: any, index: number) => {
        gsap.fromTo(card,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power1.out",
            scrollTrigger: {
              trigger: card,
              start: "top 95%",
              end: "top 70%",
              scrub: 0.5,
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      const moduleCards = gsap.utils.toArray(".module-card");
      moduleCards.forEach((card: any, index: number) => {
        gsap.fromTo(card,
          { scale: 0.98, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            ease: "power1.out",
            scrollTrigger: {
              trigger: card,
              start: "top 95%",
              end: "top 75%",
              scrub: 0.3,
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // CampaignAI title animation with immediate trigger
      gsap.fromTo(".campaignai-title",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power1.out",
          scrollTrigger: {
            trigger: ".campaignai-title",
            start: "top 95%",
            end: "top 75%",
            scrub: 0.4,
            toggleActions: "play none none reverse",
          },
        }
      );

      // Pricing cards with immediate smooth animation
      const pricingCards = gsap.utils.toArray(".pricing-card");
      pricingCards.forEach((card: any, index: number) => {
        gsap.fromTo(card,
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: "power1.out",
            scrollTrigger: {
              trigger: card,
              start: "top 98%",
              end: "top 80%",
              scrub: 0.4,
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      return () => {
        tl.kill();
      };
    }, 100);

    const moduleInterval = setInterval(() => {
      setActiveModule((prev) => (prev + 1) % modules.length);
    }, 2000);

    return () => {
      clearInterval(moduleInterval);
      clearTimeout(animationTimeout);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Network className="w-8 h-8 text-violet-500" />
            <span className="text-xl font-bold">CampaignAI</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="#features" className="text-slate-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#modules" className="text-slate-300 hover:text-white transition-colors">
              Modules
            </Link>
            <Link href="#pricing" className="text-slate-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-40"
          style={{ width: "100%", height: "100%" }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <div className="hero-title mb-6">
            <div className="inline-flex items-center space-x-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Autonomous Campaign Intelligence</span>
            </div>
            <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
              Transform Ideas Into
              <br />
              Complete Campaigns
            </h1>
          </div>

          <p className="hero-subtitle text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            One marketing brief. Twelve AI modules. Infinite possibilities. Build visual workflows that
            autonomously generate strategy, content, visuals, and execution plans.
          </p>

          <div className="hero-cta flex items-center justify-center space-x-4">
            <Link href="/brief">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white text-lg px-8 py-6">
                Start Building Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" className="bg-slate-700 hover:bg-slate-600 text-white text-lg px-8 py-6">
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-slate-400">campaign_workflow.canvas</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {modules.map((module, idx) => {
                  const Icon = module.icon;
                  const isActive = idx === activeModule;
                  return (
                    <div
                      key={idx}
                      className={`bg-slate-800/50 border rounded-lg p-4 transition-all duration-500 ${
                        isActive
                          ? "border-violet-500 shadow-lg shadow-violet-500/20 scale-105"
                          : "border-slate-700"
                      }`}
                    >
                      <Icon
                        className="w-6 h-6 mb-2"
                        style={{ color: isActive ? module.color : "#94a3b8" }}
                      />
                      <p className="text-xs text-slate-300">{module.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="campaignai-title text-center mb-16 opacity-0 translate-y-4">
            <h2 className="text-5xl font-bold mb-4 text-white">Why CampaignAI?</h2>
            <p className="text-xl text-slate-300">The future of marketing automation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="feature-card bg-slate-900/50 border-slate-800 p-8 hover:border-violet-500/50 transition-all duration-500 opacity-0 translate-y-4">
              <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Lightning Fast</h3>
              <p className="text-slate-300">
                Go from brief to complete campaign in minutes, not weeks. AI handles the heavy lifting while
                you focus on strategy.
              </p>
            </Card>

            <Card className="feature-card bg-slate-900/50 border-slate-800 p-8 hover:border-violet-500/50 transition-all duration-500 opacity-0 translate-y-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <Network className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Visual Workflows</h3>
              <p className="text-slate-300">
                Drag, drop, and connect AI modules on an intuitive canvas. See your campaign flow come to
                life visually.
              </p>
            </Card>

            <Card className="feature-card bg-slate-900/50 border-slate-800 p-8 hover:border-violet-500/50 transition-all duration-500 opacity-0 translate-y-4">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Autonomous AI</h3>
              <p className="text-slate-300">
                12 specialized modules work together to generate content, analyze audiences, and execute
                campaigns automatically.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section id="modules" className="modules-section py-32 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-white">12 Powerful Modules</h2>
            <p className="text-xl text-slate-300">Connect them like building blocks</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Image, name: "Visual Asset Generator", desc: "AI-powered image creation" },
              { icon: Video, name: "Video Content Generator", desc: "Script to video in minutes" },
              { icon: FileText, name: "Copy Content Generator", desc: "Compelling marketing copy" },
              { icon: Users, name: "Audience Intelligence", desc: "Deep audience insights" },
              { icon: Calendar, name: "Timeline Optimizer", desc: "Perfect campaign timing" },
              { icon: Send, name: "Content Distributor", desc: "Multi-channel publishing" },
              { icon: Phone, name: "Voice Interaction Agent", desc: "AI-powered calls" },
              { icon: Search, name: "Lead Discovery Engine", desc: "Find qualified leads" },
              { icon: MessageSquare, name: "Outreach Composer", desc: "Personalized messages" },
              { icon: Calendar, name: "Call Scheduler", desc: "Optimize call times" },
              { icon: CheckCircle, name: "Content Executor", desc: "Automated publishing" },
              { icon: Plug, name: "API Orchestrator", desc: "Connect everything" },
            ].map((module, idx) => {
              const Icon = module.icon;
              return (
                <Card
                  key={idx}
                  className="module-card bg-slate-800/50 border-slate-700 p-6 hover:border-violet-500 transition-all duration-500 cursor-pointer group opacity-0 scale-95"
                >
                  <Icon className="w-8 h-8 text-violet-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold mb-2 text-white">{module.name}</h4>
                  <p className="text-sm text-slate-300">{module.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-white">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-300">Start free, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="pricing-card bg-slate-900/50 border-slate-800 p-8 hover:shadow-xl hover:border-slate-700 transition-all duration-500 opacity-0 translate-y-4">
              <h3 className="text-2xl font-bold mb-2 text-white">Starter</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-slate-300">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />5 campaigns/month
                </li>
                <li className="flex items-center text-slate-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  All 12 modules
                </li>
                <li className="flex items-center text-slate-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Basic templates
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Start Free
              </Button>
            </Card>

            <Card className="pricing-card bg-gradient-to-br from-violet-600 to-violet-800 border-violet-500 p-8 scale-105 shadow-2xl hover:scale-110 hover:shadow-violet-500/30 transition-all duration-500 opacity-0 translate-y-4">
              <div className="bg-white text-violet-600 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Professional</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">$49</span>
                <span className="text-violet-100">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-white mr-3" />
                  Unlimited campaigns
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-white mr-3" />
                  Priority execution
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-white mr-3" />
                  Advanced analytics
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-white mr-3" />
                  API access
                </li>
              </ul>
              <Button className="w-full bg-white text-violet-600 hover:bg-slate-100">
                Get Started
              </Button>
            </Card>

            <Card className="pricing-card bg-slate-900/50 border-slate-800 p-8 hover:shadow-xl hover:border-slate-700 transition-all duration-500 opacity-0 translate-y-4">
              <h3 className="text-2xl font-bold mb-2 text-white">Enterprise</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Everything in Pro
                </li>
                <li className="flex items-center text-slate-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Custom modules
                </li>
                <li className="flex items-center text-slate-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Dedicated support
                </li>
                <li className="flex items-center text-slate-200">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  SLA guarantee
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Contact Sales
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-slate-300">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Network className="w-6 h-6 text-violet-500" />
            <span className="text-lg font-bold text-white">CampaignAI</span>
          </div>
          <p className="text-slate-300">&copy; 2025 CampaignAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}