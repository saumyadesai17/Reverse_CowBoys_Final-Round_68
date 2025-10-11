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
      <div className="w-12 bg-white border-l border-gray-200 p-2 flex flex-col items-center">
        <Button
          onClick={onToggleCollapse}
          size="sm"
          variant="ghost"
          className="w-8 h-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 h-[98%] overflow-auto bg-white border-l border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Campaign Canvas</h2>
          <Button
            onClick={onToggleCollapse}
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Build your AI-powered marketing campaign workflow
        </p>
      </div>

      {/* Workflow Controls */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-medium text-sm">Workflow Controls</h3>
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
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </CardContent>
      </Card>

      {/* Available Modules */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <h3 className="font-medium text-sm">Available Modules</h3>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer group"
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
                  className="p-1 rounded"
                  style={{ backgroundColor: `${module.color}20` }}
                >
                  <module.icon 
                    className="w-4 h-4"
                    style={{ color: module.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium truncate">{module.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {module.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{module.description}</p>
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-xs"
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