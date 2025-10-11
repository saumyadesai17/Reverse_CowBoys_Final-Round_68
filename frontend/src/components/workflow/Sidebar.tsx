"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Image, 
  Video,
  Type, 
  Users, 
  Calendar,
  Globe,
  BarChart,
  Play,
  Settings,
  Send,
  Phone,
  Mic,
  Search,
  MessageSquare,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { MODULE_DEFINITIONS, MODULE_CATEGORIES } from "@/lib/moduleDefinitions";

const moduleIcons = {
  visual_asset_generator: Image,
  video_content_generator: Video,
  copy_content_generator: Type,
  audience_intelligence_analyzer: Users,
  campaign_timeline_optimizer: BarChart,
  content_distribution_scheduler: Calendar,
  content_distribution_executor: Send,
  outreach_call_scheduler: Phone,
  voice_interaction_agent: Mic,
  lead_discovery_engine: Search,
  collaboration_outreach_composer: MessageSquare,
  external_api_orchestrator: Zap
};

const availableModules = Object.entries(MODULE_DEFINITIONS).map(([key, module]) => ({
  id: key,
  name: module.display_name,
  icon: moduleIcons[key as keyof typeof moduleIcons] || Settings,
  description: module.description,
  category: module.category,
  color: module.color
}));

const categories = ["All", ...Object.keys(MODULE_CATEGORIES)];

interface SidebarProps {
  onAddModule?: (moduleId: string) => void;
  onRunCampaign?: () => void;
  onRunWorkflow?: () => Promise<void>;
  isExecutingWorkflow?: boolean;
  executionProgress?: { completed: number; total: number };
  nodesCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ 
  onAddModule, 
  onRunCampaign, 
  onRunWorkflow, 
  isExecutingWorkflow = false, 
  executionProgress = { completed: 0, total: 0 },
  nodesCount = 0,
  isCollapsed = false, 
  onToggleCollapse 
}: SidebarProps) {
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const filteredModules = availableModules.filter(module => 
    selectedCategory === "All" || module.category === selectedCategory
  );

  const handleRunWorkflow = () => {
    if (onRunWorkflow) {
      onRunWorkflow();
    }
  };

  const handleAddToCanvas = (moduleId: string) => {
    if (onAddModule) {
      onAddModule(moduleId);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-slate-900/90 backdrop-blur-sm border-l border-slate-800 p-2 flex flex-col items-center shadow-xl">
        <Button
          onClick={onToggleCollapse}
          size="sm"
          variant="ghost"
          className="w-8 h-8 p-0 text-slate-300 hover:text-violet-400 hover:bg-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 h-[98%] overflow-auto bg-slate-900/90 backdrop-blur-sm border-l border-slate-800 p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent shadow-xl">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Campaign Canvas</h2>
          <Button
            onClick={onToggleCollapse}
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0 text-slate-300 hover:text-violet-400 hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-slate-400">
          Build your AI-powered marketing campaign workflow
        </p>
      </div>

      {/* Workflow Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <h3 className="font-medium text-sm text-white">Workflow Controls</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            onClick={handleRunWorkflow}
            disabled={isExecutingWorkflow || nodesCount === 0}
            className="w-full"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            {isExecutingWorkflow ? `Running... (${executionProgress.completed}/${executionProgress.total})` : "Run Campaign"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </CardContent>
      </Card>

      {/* Available Modules */}
      <Card className="flex-1 bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <h3 className="font-medium text-sm text-white">Available Modules</h3>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className="p-3 border border-slate-700 bg-slate-800/30 rounded-lg hover:bg-slate-700/70 hover:border-violet-500 cursor-pointer group transition-all duration-200 shadow-sm hover:shadow-md"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/reactflow", JSON.stringify({
                  type: "module",
                  module_name: module.id
                }));
              }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="p-1.5 rounded transition-all duration-200"
                  style={{ 
                    backgroundColor: `${module.color}20`,
                  }}
                >
                  <module.icon 
                    className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                    style={{ color: module.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium truncate text-white group-hover:text-violet-300 transition-colors">{module.name}</h4>
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-slate-700 text-slate-300 border-none group-hover:bg-violet-600 group-hover:text-white transition-colors"
                    >
                      {module.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 group-hover:text-slate-300 transition-colors">{module.description}</p>
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-xs bg-slate-800 border-violet-500/50 text-violet-400 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCanvas(module.id);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add to Canvas
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Status */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Modules: {filteredModules.length}</div>
        <div>Status: {isExecutingWorkflow ? "Running" : "Ready"}</div>
      </div>
    </div>
  );
}