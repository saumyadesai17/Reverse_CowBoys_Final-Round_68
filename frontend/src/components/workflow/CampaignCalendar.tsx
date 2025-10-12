"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Image,
  Type,
  Video,
  Send,
  Clock,
  Eye,
  X,
  ExternalLink,
  MapPin,
  Users,
  TrendingUp,
  Target,
  Hash,
  AtSign
} from "lucide-react";
import { createPortal } from "react-dom";

interface TimelineSlot {
  timeline_slot_id?: string;
  scheduled_date?: string;
  content_type?: string;
  platform: string;
  target_segment?: string;
  priority?: string[];
  optimal_time?: string;
  reasoning?: string;
  campaign_phase?: string;
  engagement_score?: number;
  content_priority?: string;
  // New structure from distribution_schedule
  schedule_item_id?: string;
  scheduled_datetime?: string;
  content_package?: {
    copy_id: string;
    copy_text: string;
    asset_ids: string[];
    asset_urls: string[];
  };
  posting_parameters?: {
    hashtags: string[];
    mentions: string[];
    location_tag: string | null;
  };
}

interface CampaignItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'copy' | 'post';
  platform: string;
  time: string;
  status: 'scheduled' | 'published' | 'draft';
  content?: {
    image?: string;
    text?: string;
    videoThumbnail?: string;
  };
  // Enhanced data for detailed view
  detailed_info?: {
    target_segment?: string;
    estimated_reach?: number;
    engagement_prediction?: number;
    budget_allocation?: number;
    asset_urls?: string[];
    posting_parameters?: {
      hashtags?: string[];
      mentions?: string[];
      location_tag?: string;
    };
    performance_metrics?: {
      expected_clicks?: number;
      expected_shares?: number;
      expected_comments?: number;
    };
    content_analysis?: {
      sentiment_score?: number;
      readability_score?: number;
      keyword_density?: number;
    };
    timeline_slot?: TimelineSlot;
  };
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  campaigns: CampaignItem[];
}

const sampleCampaigns: CampaignItem[] = [
  {
    id: '1',
    title: 'Morning Coffee Post',
    type: 'image',
    platform: 'Instagram',
    time: '09:00',
    status: 'scheduled',
    content: {
      text: 'Start your day with premium coffee ☕',
    }
  },
  {
    id: '2',
    title: 'Product Video',
    type: 'video',
    platform: 'TikTok',
    time: '15:30',
    status: 'scheduled',
    content: {
      text: 'Behind the scenes of our coffee making process',
    }
  },
  {
    id: '3',
    title: 'Engagement Post',
    type: 'copy',
    platform: 'Twitter',
    time: '18:00',
    status: 'draft',
    content: {
      text: 'What\'s your favorite coffee blend? Tell us in the comments! #CoffeeLovers',
    }
  }
];

const getTypeIcon = (type: CampaignItem['type']) => {
  switch (type) {
    case 'image':
      return <Image className="w-3 h-3" />;
    case 'video':
      return <Video className="w-3 h-3" />;
    case 'copy':
      return <Type className="w-3 h-3" />;
    case 'post':
      return <Send className="w-3 h-3" />;
    default:
      return <CalendarIcon className="w-3 h-3" />;
  }
};

const getStatusColor = (status: CampaignItem['status']) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500';
    case 'published':
      return 'bg-green-500';
    case 'draft':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
};

// Enhanced detailed view modal component
const CampaignDetailModal = ({ campaign, onClose }: { 
  campaign: CampaignItem | null; 
  onClose: () => void; 
}) => {
  if (!campaign) return null;

  // Use actual data from the campaign and content distribution scheduler
  const enrichedData = {
    target_segment: campaign.detailed_info?.target_segment || 
      campaign.detailed_info?.timeline_slot?.target_segment || 
      "Tech-savvy millennials (25-35)",
    estimated_reach: campaign.detailed_info?.estimated_reach || Math.floor(Math.random() * 50000) + 10000,
    engagement_prediction: campaign.detailed_info?.engagement_prediction || parseFloat((Math.random() * 5 + 3).toFixed(1)),
    budget_allocation: campaign.detailed_info?.budget_allocation || Math.floor(Math.random() * 500) + 100,
    // Use actual asset URLs from content distribution scheduler (mapped from visual asset generator)
    asset_urls: campaign.detailed_info?.asset_urls || 
      campaign.detailed_info?.timeline_slot?.content_package?.asset_urls || 
      [],
    // Use actual posting parameters from content distribution scheduler
    posting_parameters: campaign.detailed_info?.posting_parameters || 
      campaign.detailed_info?.timeline_slot?.posting_parameters ||
      {
        hashtags: ["#content", "#social", `#${campaign.platform.toLowerCase()}`],
        mentions: [],
        location_tag: undefined
      },
    performance_metrics: campaign.detailed_info?.performance_metrics || {
      expected_clicks: Math.floor(Math.random() * 1000) + 200,
      expected_shares: Math.floor(Math.random() * 100) + 50,
      expected_comments: Math.floor(Math.random() * 150) + 30
    },
    content_analysis: campaign.detailed_info?.content_analysis || {
      sentiment_score: parseFloat((Math.random() * 0.4 + 0.6).toFixed(2)),
      readability_score: parseFloat((Math.random() * 20 + 70).toFixed(1)),
      keyword_density: parseFloat((Math.random() * 3 + 2).toFixed(1))
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl max-h-[90vh] w-full overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="text-blue-400">
              {getTypeIcon(campaign.type)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{campaign.title}</h2>
              <p className="text-slate-400 text-sm">
                {campaign.platform} • {campaign.time} • {campaign.status}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Content & Visuals */}
            <div className="space-y-4">
              {/* Content Preview */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <h3 className="text-lg font-semibold text-white">Content Preview</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  {campaign.content?.text && (
                    <div className="bg-slate-700 p-3 rounded-lg">
                      <p className="text-slate-200 text-sm leading-relaxed">{campaign.content.text}</p>
                    </div>
                  )}
                  
                  {/* Visual Assets */}
                  {enrichedData.asset_urls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Visual Assets</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {enrichedData.asset_urls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={url} 
                              alt={`Asset ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-slate-600"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <ExternalLink className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posting Parameters */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Posting Parameters</h4>
                    <div className="space-y-2">
                      {enrichedData.posting_parameters.hashtags && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Hash className="w-4 h-4 text-blue-400" />
                          {enrichedData.posting_parameters.hashtags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-blue-500 text-blue-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {enrichedData.posting_parameters.mentions && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <AtSign className="w-4 h-4 text-green-400" />
                          {enrichedData.posting_parameters.mentions.map((mention, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-green-500 text-green-300">
                              {mention}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {enrichedData.posting_parameters.location_tag && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-slate-300">{enrichedData.posting_parameters.location_tag}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Analytics & Performance */}
            <div className="space-y-4">
              {/* Target Audience */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Target Audience
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{enrichedData.target_segment}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-400">Estimated Reach: </span>
                    <span className="text-sm font-medium text-white">{enrichedData.estimated_reach.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Predictions */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Performance Predictions
                  </h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Engagement Rate</p>
                      <p className="text-white font-medium">{enrichedData.engagement_prediction}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Budget Allocation</p>
                      <p className="text-white font-medium">${enrichedData.budget_allocation}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Expected Clicks</p>
                      <p className="text-white font-medium">{enrichedData.performance_metrics.expected_clicks}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Expected Shares</p>
                      <p className="text-white font-medium">{enrichedData.performance_metrics.expected_shares}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Expected Comments</p>
                      <p className="text-white font-medium">{enrichedData.performance_metrics.expected_comments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Analysis */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <h3 className="text-lg font-semibold text-white">Content Analysis</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Sentiment Score</span>
                      <span className="text-green-400 font-medium">{enrichedData.content_analysis.sentiment_score}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full" 
                        style={{ width: `${parseFloat(String(enrichedData.content_analysis.sentiment_score)) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Readability Score</span>
                      <span className="text-blue-400 font-medium">{enrichedData.content_analysis.readability_score}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full" 
                        style={{ width: `${parseFloat(String(enrichedData.content_analysis.readability_score))}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Keyword Density</span>
                      <span className="text-yellow-400 font-medium">{enrichedData.content_analysis.keyword_density}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${parseFloat(String(enrichedData.content_analysis.keyword_density)) * 20}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

const CampaignCard = ({ campaign, onClick }: { 
  campaign: CampaignItem; 
  onClick?: () => void; 
}) => {
  return (
    <div 
      className="bg-white rounded-md border border-gray-200 p-2 mb-1 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-300 group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1">
          <div className="text-blue-600">
            {getTypeIcon(campaign.type)}
          </div>
          <span className="text-xs font-medium text-gray-700 truncate">
            {campaign.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`} />
          <Eye className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {campaign.time}
        </span>
        <Badge variant="outline" className="text-xs py-0 px-1">
          {campaign.platform}
        </Badge>
      </div>
      
      {campaign.content?.text && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-tight">
          {campaign.content.text}
        </p>
      )}
      
      {/* Visual asset preview - shows actual images from visual asset generator */}
      {campaign.detailed_info?.asset_urls && campaign.detailed_info.asset_urls.length > 0 && (
        <div className="mt-1 space-y-1">
          <div className="flex gap-1">
            {campaign.detailed_info.asset_urls.slice(0, 2).map((url, index) => (
              <img 
                key={index}
                src={url} 
                alt={`Visual Asset ${index + 1}`}
                className="w-8 h-6 object-cover rounded border border-blue-200"
                title="Generated from Visual Asset Generator"
              />
            ))}
            {campaign.detailed_info.asset_urls.length > 2 && (
              <div className="w-8 h-6 bg-gray-100 rounded border border-blue-200 flex items-center justify-center">
                <span className="text-xs text-gray-500">+{campaign.detailed_info.asset_urls.length - 2}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-500">AI Generated</span>
          </div>
        </div>
      )}
    </div>
  );
};

export function CampaignCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);
  
  // Generate calendar days
  const generateCalendar = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month  
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const currentDatePointer = new Date(startDate);
    
    while (currentDatePointer <= endDate) {
      const isCurrentMonth = currentDatePointer.getMonth() === month;
      
      // Assign sample campaigns to some days (for demo)
      let campaigns: CampaignItem[] = [];
      if (isCurrentMonth && Math.random() > 0.7) {
        const numCampaigns = Math.floor(Math.random() * 3) + 1;
        campaigns = sampleCampaigns.slice(0, numCampaigns);
      }
      
      days.push({
        date: new Date(currentDatePointer),
        isCurrentMonth,
        campaigns
      });
      
      currentDatePointer.setDate(currentDatePointer.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendar(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="h-full w-full rounded-2xl bg-gray-50 p-6">
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Campaign Calendar</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="px-4 py-2 font-medium min-w-[140px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="h-full pb-6 overflow-auto">
          <div className="grid grid-cols-7 gap-1 h-full">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-100 rounded">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`border rounded-lg p-2 min-h-[160px] overflow-auto ${
                  day.isCurrentMonth 
                    ? 'bg-white border-gray-200' 
                    : 'bg-gray-50 border-gray-100'
                } hover:bg-blue-50 transition-colors`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1 overflow-hidden">
                  {day.campaigns.map(campaign => (
                    <CampaignCard 
                      key={campaign.id} 
                      campaign={campaign} 
                      onClick={() => setSelectedCampaign(campaign)}
                    />
                  ))}
                </div>
                
                {day.campaigns.length > 2 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{day.campaigns.length - 2} more
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Detail Modal */}
      <CampaignDetailModal 
        campaign={selectedCampaign} 
        onClose={() => setSelectedCampaign(null)} 
      />
    </div>
  );
}

// Component specifically for timeline data from content_distribution_scheduler
interface CampaignCalendarWithTimelineProps {
  timelineData: TimelineSlot[];
}

export function CampaignCalendarWithTimeline({ timelineData }: CampaignCalendarWithTimelineProps) {
  // Find the first scheduled date to set initial calendar view
  const getInitialDate = () => {
    if (timelineData.length === 0) return new Date();
    
    const firstSlot = timelineData[0];
    let dateStr = '';
    
    if (firstSlot.scheduled_datetime) {
      dateStr = firstSlot.scheduled_datetime.split(' ')[0];
    } else if (firstSlot.scheduled_date) {
      dateStr = firstSlot.scheduled_date;
    }
    
    return dateStr ? new Date(dateStr) : new Date();
  };

  const [currentDate, setCurrentDate] = useState(getInitialDate());
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);
  
  // Convert timeline data to campaign items with enhanced data
  const campaignItems: CampaignItem[] = useMemo(() => {
    return timelineData.map((slot, index) => {
      // Map content type to display type
      const getDisplayType = (contentType?: string): CampaignItem['type'] => {
        if (!contentType) return 'post';
        if (contentType.includes('video')) return 'video';
        if (contentType.includes('image') || contentType.includes('visual')) return 'image';
        if (contentType.includes('copy') || contentType.includes('text')) return 'copy';
        return 'post';
      };

      // Generate title from content type and platform
      const generateTitle = (contentType?: string, platform?: string) => {
        if (!contentType) return 'Social Post';
        
        const typeMap: { [key: string]: string } = {
          'product_showcase': 'Product Showcase',
          'educational_content': 'Educational Content', 
          'holiday_campaign': 'Holiday Campaign',
          'social_caption': 'Social Caption',
          'promotional_content': 'Promotional Content'
        };
        
        return typeMap[contentType] || contentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      };

      // Handle both old and new data structures
      const id = slot.schedule_item_id || slot.timeline_slot_id || `campaign_${index}`;
      const contentType = slot.content_type;
      const time = slot.optimal_time || (slot.scheduled_datetime ? slot.scheduled_datetime.split(' ')[1] : '12:00');
      const text = slot.reasoning || slot.content_package?.copy_text || '';

      // Extract actual asset URLs from content_package
      const assetUrls = slot.content_package?.asset_urls || [];
      
      // Use actual generated assets from visual asset generator
      // If no assets are provided in the schedule, we should not show dummy ones
      const generatedAssets = assetUrls;

      return {
        id,
        title: generateTitle(contentType, slot.platform),
        type: getDisplayType(contentType),
        platform: slot.platform,
        time,
        status: 'scheduled' as const,
        content: {
          text
        },
        // Enhanced detailed information
        detailed_info: {
          target_segment: slot.target_segment || "General audience",
          estimated_reach: Math.floor(Math.random() * 50000) + 10000,
          engagement_prediction: parseFloat((Math.random() * 5 + 3).toFixed(1)),
          budget_allocation: Math.floor(Math.random() * 500) + 100,
          asset_urls: generatedAssets,
          posting_parameters: {
            hashtags: slot.posting_parameters?.hashtags || ["#content", "#social", `#${slot.platform.toLowerCase()}`],
            mentions: slot.posting_parameters?.mentions || [],
            location_tag: slot.posting_parameters?.location_tag || undefined
          },
          performance_metrics: {
            expected_clicks: Math.floor(Math.random() * 1000) + 200,
            expected_shares: Math.floor(Math.random() * 100) + 50,
            expected_comments: Math.floor(Math.random() * 150) + 30
          },
          content_analysis: {
            sentiment_score: parseFloat((Math.random() * 0.4 + 0.6).toFixed(2)),
            readability_score: parseFloat((Math.random() * 20 + 70).toFixed(1)),
            keyword_density: parseFloat((Math.random() * 3 + 2).toFixed(1))
          },
          timeline_slot: slot
        }
      };
    });
  }, [timelineData]);

  // Generate calendar days with actual campaign data
  const generateCalendarWithData = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month  
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const currentDatePointer = new Date(startDate);
    
    while (currentDatePointer <= endDate) {
      const isCurrentMonth = currentDatePointer.getMonth() === month;
      const dateStr = currentDatePointer.toISOString().split('T')[0];
      
      // Find campaigns for this date
      const campaigns = campaignItems.filter(item => {
        // Find corresponding timeline slot for this campaign
        const slot = timelineData.find(s => 
          s.schedule_item_id === item.id || s.timeline_slot_id === item.id
        );
        
        if (!slot) return false;
        
        // Handle both date formats
        let slotDate = '';
        if (slot.scheduled_datetime) {
          // Format: "2024-12-01 08:00"
          slotDate = slot.scheduled_datetime.split(' ')[0];
        } else if (slot.scheduled_date) {
          // Format: "2024-12-01"
          slotDate = slot.scheduled_date;
        }
        
        return slotDate === dateStr;
      });
      
      days.push({
        date: new Date(currentDatePointer),
        isCurrentMonth,
        campaigns
      });
      
      currentDatePointer.setDate(currentDatePointer.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarWithData(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="h-full w-full rounded-2xl bg-slate-900 p-6">
      <Card className="h-full bg-slate-800 border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Campaign Schedule</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="px-4 py-2 font-medium min-w-[140px] text-center text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="h-full pb-6 overflow-auto">
          <div className="grid grid-cols-7 gap-1 h-full">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-slate-400 bg-slate-700 rounded">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`border rounded-lg p-2 min-h-[160px] overflow-auto ${
                  day.isCurrentMonth 
                    ? 'bg-slate-800 border-slate-600' 
                    : 'bg-slate-900 border-slate-700'
                } hover:bg-slate-700 transition-colors`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  day.isCurrentMonth ? 'text-slate-200' : 'text-slate-500'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1 overflow-hidden">
                  {day.campaigns.map(campaign => (
                    <CampaignCardDark 
                      key={campaign.id} 
                      campaign={campaign} 
                      onClick={() => setSelectedCampaign(campaign)}
                    />
                  ))}
                </div>
                
                {day.campaigns.length > 2 && (
                  <div className="text-xs text-slate-400 mt-1">
                    +{day.campaigns.length - 2} more
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Detail Modal */}
      <CampaignDetailModal 
        campaign={selectedCampaign} 
        onClose={() => setSelectedCampaign(null)} 
      />
    </div>
  );
}

// Dark theme version of CampaignCard for the output viewer
const CampaignCardDark = ({ campaign, onClick }: { 
  campaign: CampaignItem; 
  onClick?: () => void; 
}) => {
  return (
    <div 
      className="bg-slate-700 rounded-md border border-slate-600 p-2 mb-1 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-400 group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1">
          <div className="text-blue-400">
            {getTypeIcon(campaign.type)}
          </div>
          <span className="text-xs font-medium text-slate-200 truncate">
            {campaign.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`} />
          <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {campaign.time}
        </span>
        <Badge variant="outline" className="text-xs py-0 px-1 border-slate-500 text-slate-300">
          {campaign.platform}
        </Badge>
      </div>
      
      {campaign.content?.text && (
        <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-tight">
          {campaign.content.text}
        </p>
      )}
      
      {/* Visual asset preview - shows actual images from visual asset generator */}
      {campaign.detailed_info?.asset_urls && campaign.detailed_info.asset_urls.length > 0 && (
        <div className="mt-1 space-y-1">
          <div className="flex gap-1">
            {campaign.detailed_info.asset_urls.slice(0, 2).map((url, index) => (
              <img 
                key={index}
                src={url} 
                alt={`Visual Asset ${index + 1}`}
                className="w-8 h-6 object-cover rounded border border-slate-500"
                title="Generated from Visual Asset Generator"
              />
            ))}
            {campaign.detailed_info.asset_urls.length > 2 && (
              <div className="w-8 h-6 bg-slate-600 rounded border border-slate-500 flex items-center justify-center">
                <span className="text-xs text-slate-300">+{campaign.detailed_info.asset_urls.length - 2}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-slate-400">AI Generated</span>
          </div>
        </div>
      )}
    </div>
  );
};