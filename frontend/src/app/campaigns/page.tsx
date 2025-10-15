"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Network,
  ArrowLeft,
  Home,
  Calendar,
  TrendingUp,
  Eye,
  Trash2,
  Download,
  Target,
  Users,
  DollarSign,
  BarChart,
  Clock,
  CheckCircle,
  Play,
  Sparkles,
} from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  brief: string;
  status: "completed" | "active" | "draft";
  createdAt: string;
  metrics?: {
    reach?: string;
    engagement?: string;
    budget?: string;
    modulesUsed?: number;
  };
  category: string;
  color: string;
}

// Dummy campaigns data
const dummyCampaigns: Campaign[] = [
  {
    id: "camp-001",
    title: "Sustainable Coffee Launch - World Environment Day",
    brief: "Launch a social media campaign for our new sustainable coffee brand targeting Gen Z in Mumbai for World Environment Day. Focus on eco-friendly packaging and carbon-neutral delivery.",
    status: "completed",
    createdAt: "2025-10-05",
    metrics: {
      reach: "245K",
      engagement: "12.5%",
      budget: "$15K",
      modulesUsed: 8,
    },
    category: "Product Launch",
    color: "emerald",
  },
  {
    id: "camp-002",
    title: "AI Fitness Tracker - Tech Product Launch",
    brief: "Create a comprehensive campaign for launching our AI-powered fitness tracker. Target health-conscious millennials across major Indian cities with emphasis on Instagram and LinkedIn.",
    status: "completed",
    createdAt: "2025-09-28",
    metrics: {
      reach: "180K",
      engagement: "9.8%",
      budget: "$22K",
      modulesUsed: 10,
    },
    category: "Technology",
    color: "blue",
  },
  {
    id: "camp-003",
    title: "Vintage Fashion Revival Campaign",
    brief: "Revive interest in our vintage clothing line among fashion enthusiasts. Multi-platform campaign with focus on storytelling, influencer collaborations, and user-generated content.",
    status: "active",
    createdAt: "2025-10-08",
    metrics: {
      reach: "95K",
      engagement: "15.2%",
      budget: "$18K",
      modulesUsed: 9,
    },
    category: "Fashion",
    color: "violet",
  },
  {
    id: "camp-004",
    title: "Diwali Festival Sale - E-commerce Boost",
    brief: "Multi-channel Diwali campaign targeting Indian shoppers with festive offers, flash sales, and gift bundles. Focus on mobile-first experience and regional language content.",
    status: "completed",
    createdAt: "2025-09-15",
    metrics: {
      reach: "520K",
      engagement: "18.7%",
      budget: "$45K",
      modulesUsed: 12,
    },
    category: "E-commerce",
    color: "amber",
  },
  {
    id: "camp-005",
    title: "FinTech App Launch - Financial Inclusion",
    brief: "Launch campaign for new UPI-based financial literacy app targeting tier 2 and tier 3 cities. Focus on trust-building, educational content, and local partnerships.",
    status: "draft",
    createdAt: "2025-10-10",
    metrics: {
      modulesUsed: 6,
    },
    category: "FinTech",
    color: "cyan",
  },
  {
    id: "camp-006",
    title: "Wellness Retreat - Summer Campaign",
    brief: "Promote luxury wellness retreat packages for summer season. Target high-income urban professionals seeking work-life balance through Instagram, Facebook, and premium publications.",
    status: "completed",
    createdAt: "2025-08-20",
    metrics: {
      reach: "78K",
      engagement: "22.3%",
      budget: "$12K",
      modulesUsed: 7,
    },
    category: "Wellness",
    color: "pink",
  },
];

export default function CampaignsPage() {
  const [campaigns] = useState<Campaign[]>(dummyCampaigns);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesStatus = selectedStatus === "all" || campaign.status === selectedStatus;
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.brief.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        icon: CheckCircle,
        text: "Completed",
        className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
      active: {
        icon: Play,
        text: "Active",
        className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      },
      draft: {
        icon: Clock,
        text: "Draft",
        className: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.className} border flex items-center space-x-1 px-2 py-1`}>
        <IconComponent className="w-3 h-3" />
        <span className="text-xs font-medium">{config.text}</span>
      </Badge>
    );
  };

  const getCategoryColor = (color: string) => {
    const colorMap: Record<string, string> = {
      emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
      amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      pink: "bg-pink-500/10 text-pink-400 border-pink-500/30",
    };
    return colorMap[color] || colorMap.violet;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-30"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Background Gradient Shapes */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/landing" className="inline-flex items-center space-x-2 group">
            <Network className="w-7 h-7 text-violet-500 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-xl font-bold text-white">CampaignAI</span>
          </Link>
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

      {/* Main Content */}
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1.5 mb-4">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-violet-300">Campaign History</span>
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
              Previous Ad Campaigns
            </h1>
            <p className="text-slate-300">
              View, analyze, and reuse your past campaign workflows
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Total Campaigns</p>
                  <p className="text-2xl font-bold text-white">{campaigns.length}</p>
                </div>
                <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
                  <BarChart className="w-6 h-6 text-violet-400" />
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Active</p>
                  <p className="text-2xl font-bold text-white">
                    {campaigns.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Play className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {campaigns.filter((c) => c.status === "completed").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Total Reach</p>
                  <p className="text-2xl font-bold text-white">1.1M+</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {["all", "completed", "active", "draft"].map((status) => (
                <Button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  variant={selectedStatus === status ? "default" : "outline"}
                  className={`${
                    selectedStatus === status
                      ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-600"
                      : "bg-slate-900/50 hover:bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-violet-500 transition-all duration-300 group"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(campaign.status)}
                        <Badge
                          className={`${getCategoryColor(campaign.color)} border px-2 py-1`}
                        >
                          <Target className="w-3 h-3 mr-1" />
                          <span className="text-xs">{campaign.category}</span>
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-2">{campaign.brief}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  {campaign.metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                      {campaign.metrics.reach && (
                        <div className="text-center">
                          <Users className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                          <p className="text-xs text-slate-400">Reach</p>
                          <p className="text-sm font-semibold text-white">
                            {campaign.metrics.reach}
                          </p>
                        </div>
                      )}
                      {campaign.metrics.engagement && (
                        <div className="text-center">
                          <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                          <p className="text-xs text-slate-400">Engagement</p>
                          <p className="text-sm font-semibold text-white">
                            {campaign.metrics.engagement}
                          </p>
                        </div>
                      )}
                      {campaign.metrics.budget && (
                        <div className="text-center">
                          <DollarSign className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                          <p className="text-xs text-slate-400">Budget</p>
                          <p className="text-sm font-semibold text-white">
                            {campaign.metrics.budget}
                          </p>
                        </div>
                      )}
                      {campaign.metrics.modulesUsed && (
                        <div className="text-center">
                          <Sparkles className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                          <p className="text-xs text-slate-400">Modules</p>
                          <p className="text-sm font-semibold text-white">
                            {campaign.metrics.modulesUsed}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                    <div className="flex items-center text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {new Date(campaign.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-3"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-3"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-red-400 hover:bg-slate-800 h-8 px-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredCampaigns.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No campaigns found</h3>
              <p className="text-slate-400 mb-6">
                Try adjusting your filters or create a new campaign
              </p>
              <Link href="/brief">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  Create New Campaign
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
