"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Image as ImageIcon, 
  FileText, 
  Copy, 
  Download,
  ExternalLink,
  Eye
} from "lucide-react";
import { ExecutionResult } from "@/lib/workflowExecution";
import { CampaignCalendarWithTimeline } from "./CampaignCalendar";

interface OutputViewerProps {
  moduleName: string;
  result: ExecutionResult;
  onClose: () => void;
}

export function OutputViewer({ moduleName, result, onClose }: OutputViewerProps) {
  const [activeTab, setActiveTab] = useState<string>("outputs");
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Handle Escape key and set initial focus
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    // Try to focus close button for accessibility
    closeBtnRef.current?.focus();

    // Prevent background scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const renderVisualAssetOutput = (outputs: any) => {
    if (outputs.generated_images && Array.isArray(outputs.generated_images)) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Generated Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outputs.generated_images.map((img: any, index: number) => (
              <Card key={index} className="bg-slate-800 border-slate-700 p-4">
                <div className="space-y-3">
                  {img.image_url && (
                    <div className="relative group">
                      <img 
                        src={img.image_url} 
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/300/200';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button 
                          size="sm"
                          onClick={() => window.open(img.image_url, '_blank')}
                          className="bg-white/20 hover:bg-white/30 text-white"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Full
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="text-sm space-y-1">
                    {img.image_id && (
                      <p className="text-slate-400">
                        <span className="font-medium">ID:</span> {img.image_id}
                      </p>
                    )}
                    {img.metadata && (
                      <div className="text-slate-300">
                        <p className="font-medium">Metadata:</p>
                        <pre className="text-xs bg-slate-900 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(img.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCopyContentOutput = (outputs: any) => {
    if (outputs.generated_copies && Array.isArray(outputs.generated_copies)) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Generated Content</h3>
          <div className="space-y-4">
            {outputs.generated_copies.map((copy: any, index: number) => (
              <Card key={index} className="bg-slate-800 border-slate-700 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">Copy {index + 1}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(copy.copy_text)}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  
                  {copy.copy_text && (
                    <div className="bg-slate-900 p-3 rounded-lg">
                      <p className="text-slate-200 whitespace-pre-wrap">{copy.copy_text}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {copy.word_count && (
                      <p className="text-slate-400">
                        <span className="font-medium">Word Count:</span> {copy.word_count}
                      </p>
                    )}
                    {copy.copy_id && (
                      <p className="text-slate-400">
                        <span className="font-medium">ID:</span> {copy.copy_id}
                      </p>
                    )}
                  </div>
                  
                  {copy.hashtags && copy.hashtags.length > 0 && (
                    <div>
                      <p className="text-slate-400 font-medium mb-2">Hashtags:</p>
                      <div className="flex flex-wrap gap-2">
                        {copy.hashtags.map((tag: string, tagIndex: number) => (
                          <span 
                            key={tagIndex}
                            className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {copy.emojis && copy.emojis.length > 0 && (
                    <div>
                      <p className="text-slate-400 font-medium mb-2">Suggested Emojis:</p>
                      <div className="flex flex-wrap gap-2">
                        {copy.emojis.map((emoji: string, emojiIndex: number) => (
                          <span 
                            key={emojiIndex}
                            className="bg-yellow-600/20 text-yellow-300 px-2 py-1 rounded-full text-sm"
                          >
                            {emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderAudienceAnalysisOutput = (outputs: any) => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Audience Analysis</h3>
        
        {outputs.audience_segments && (
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h4 className="font-medium text-white mb-3">Audience Segments</h4>
            <div className="space-y-3">
              {Array.isArray(outputs.audience_segments) ? 
                outputs.audience_segments.map((segment: any, index: number) => (
                  <div key={index} className="bg-slate-900 p-3 rounded-lg">
                    <pre className="text-slate-200 text-sm whitespace-pre-wrap">
                      {JSON.stringify(segment, null, 2)}
                    </pre>
                  </div>
                )) :
                <div className="bg-slate-900 p-3 rounded-lg">
                  <pre className="text-slate-200 text-sm whitespace-pre-wrap">
                    {JSON.stringify(outputs.audience_segments, null, 2)}
                  </pre>
                </div>
              }
            </div>
          </Card>
        )}

        {outputs.persona_profiles && (
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h4 className="font-medium text-white mb-3">Persona Profiles</h4>
            <div className="bg-slate-900 p-3 rounded-lg">
              <pre className="text-slate-200 text-sm whitespace-pre-wrap">
                {JSON.stringify(outputs.persona_profiles, null, 2)}
              </pre>
            </div>
          </Card>
        )}

        {outputs.optimal_posting_times && (
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h4 className="font-medium text-white mb-3">Optimal Posting Times</h4>
            <div className="bg-slate-900 p-3 rounded-lg">
              <pre className="text-slate-200 text-sm whitespace-pre-wrap">
                {JSON.stringify(outputs.optimal_posting_times, null, 2)}
              </pre>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderContentDistributionSchedulerOutput = (outputs: any) => {
    if (outputs.distribution_schedule && Array.isArray(outputs.distribution_schedule)) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Campaign Schedule Calendar</h3>
          
          {/* Visual Assets Integration Notice */}
          {(() => {
            const totalAssets = outputs.distribution_schedule?.reduce((count: number, item: any) => {
              return count + (item.content_package?.asset_urls?.length || 0);
            }, 0) || 0;
            
            const postsWithImages = outputs.distribution_schedule?.filter((item: any) => 
              item.content_package?.asset_urls?.length > 0
            ).length || 0;
            
            return (
              <Card className="bg-blue-900/20 border-blue-700 p-4">
                <div className="flex items-start gap-3">
                  <ImageIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-200">Visual Assets Integration</h4>
                    {totalAssets > 0 ? (
                      <div className="space-y-1 text-sm">
                        <p className="text-blue-300">
                          ✅ Successfully mapped {totalAssets} images from Visual Asset Generator
                        </p>
                        <p className="text-blue-400">
                          📊 {postsWithImages}/{outputs.distribution_schedule?.length} posts have visual content
                        </p>
                        <p className="text-xs text-blue-500">
                          Click on any calendar card to view the generated images and detailed information
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <p className="text-orange-300">
                          ⚠️ No visual assets mapped - run Visual Asset Generator first
                        </p>
                        <p className="text-xs text-orange-400">
                          Visual assets enhance engagement and provide rich content for your campaigns
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })()}
          
          <div className="h-[600px] w-full">
            <CampaignCalendarWithTimeline timelineData={outputs.distribution_schedule} />
          </div>
          
          {/* Schedule Summary */}
          {outputs.schedule_summary && (
            <Card className="bg-slate-800 border-slate-700 p-4">
              <h4 className="font-medium text-white mb-3">Schedule Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-400">Total Posts</p>
                  <p className="text-white font-medium">{outputs.schedule_summary.total_posts}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400">Timeline Coverage</p>
                  <p className="text-white font-medium">{outputs.schedule_summary.campaign_coverage?.timeline_coverage || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400">Platform Distribution</p>
                  <p className="text-white font-medium">{outputs.schedule_summary.campaign_coverage?.platform_distribution || 'N/A'}</p>
                </div>
              </div>
              
              {outputs.schedule_summary.posts_by_platform && (
                <div className="mt-4">
                  <p className="text-slate-400 mb-2">Posts by Platform</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(outputs.schedule_summary.posts_by_platform).map(([platform, count]) => (
                      <div key={platform} className="bg-slate-700 px-3 py-1 rounded-full text-xs">
                        <span className="text-slate-300">{platform}:</span>
                        <span className="text-white ml-1">{String(count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
          
          {/* Visual Assets Preview */}
          {(() => {
            const sampleImages = outputs.distribution_schedule
              ?.flatMap((item: any) => item.content_package?.asset_urls || [])
              .slice(0, 4) || [];
            
            if (sampleImages.length > 0) {
              return (
                <Card className="bg-slate-800 border-slate-700 p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Visual Assets Preview
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {sampleImages.map((url: string, index: number) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Generated Asset ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-slate-600"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                          AI
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Click on calendar cards to see detailed information and all associated images
                  </p>
                </Card>
              );
            }
            return null;
          })()}
        </div>
      );
    }
    return renderGenericOutput(outputs);
  };

  const renderGenericOutput = (outputs: any) => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Output Data</h3>
        <Card className="bg-slate-800 border-slate-700 p-4">
          <pre className="text-slate-200 text-sm whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(outputs, null, 2)}
          </pre>
        </Card>
      </div>
    );
  };

  const renderOutputs = () => {
    switch (moduleName) {
      case 'visual_asset_generator':
        return renderVisualAssetOutput(result.outputs) || renderGenericOutput(result.outputs);
      case 'copy_content_generator':
        return renderCopyContentOutput(result.outputs) || renderGenericOutput(result.outputs);
      case 'audience_intelligence_analyzer':
        return renderAudienceAnalysisOutput(result.outputs) || renderGenericOutput(result.outputs);
      case 'content_distribution_scheduler':
        return renderContentDistributionSchedulerOutput(result.outputs) || renderGenericOutput(result.outputs);
      default:
        return renderGenericOutput(result.outputs);
    }
  };

  const tabs = [
    { id: 'outputs', label: 'Outputs', icon: Eye },
    { id: 'metadata', label: 'Metadata', icon: FileText },
  ];

  const headingId = "output-viewer-title";

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="bg-slate-900 border border-slate-700 rounded-xl w-[98%] max-w-[98%] max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 id={headingId} className="text-xl font-bold text-white">
              {moduleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Output
            </h2>
            <p className="text-slate-400 text-sm">
              Status: <span className={`font-medium ${
                result.execution_status === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.execution_status}
              </span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            ref={closeBtnRef}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-violet-400 border-b-2 border-violet-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'outputs' && (
            <div>
              {result.execution_status === 'error' ? (
                <Card className="bg-red-900/20 border-red-500/50 p-4">
                  <h3 className="text-red-400 font-medium mb-2">Execution Error</h3>
                  <p className="text-red-300">{result.error}</p>
                </Card>
              ) : (
                renderOutputs()
              )}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Generation Metadata</h3>
              {result.generation_metadata ? (
                <Card className="bg-slate-800 border-slate-700 p-4">
                  <pre className="text-slate-200 text-sm whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(result.generation_metadata, null, 2)}
                  </pre>
                </Card>
              ) : (
                <Card className="bg-slate-800 border-slate-700 p-4">
                  <p className="text-slate-400">No metadata available</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render via portal to escape any React Flow node clipping/stacking context
  return typeof window !== "undefined" ? createPortal(modalContent, document.body) : null;
}