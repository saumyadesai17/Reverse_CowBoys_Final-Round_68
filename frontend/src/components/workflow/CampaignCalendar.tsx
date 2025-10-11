"use client";

import React, { useState } from "react";
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
  Clock
} from "lucide-react";

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

const CampaignCard = ({ campaign }: { campaign: CampaignItem }) => {
  return (
    <div className="bg-white rounded-md border border-gray-200 p-2 mb-1 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1">
          <div className="text-blue-600">
            {getTypeIcon(campaign.type)}
          </div>
          <span className="text-xs font-medium text-gray-700 truncate">
            {campaign.title}
          </span>
        </div>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`} />
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
    </div>
  );
};

export function CampaignCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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
                    <CampaignCard key={campaign.id} campaign={campaign} />
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
    </div>
  );
}