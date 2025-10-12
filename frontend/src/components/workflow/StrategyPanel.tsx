"use client";

import React, { useState } from "react";
import { Brain, ChevronDown, ChevronUp, Sparkles, Target, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StrategyPanelProps {
  strategyPlan: string;
  isCollapsed?: boolean;
}

export function StrategyPanel({ strategyPlan, isCollapsed: initialCollapsed = true }: StrategyPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  if (!strategyPlan) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-20 max-w-md">
      <Card className="bg-gradient-to-br from-violet-950/95 to-purple-950/95 backdrop-blur-xl border-violet-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Brain className="w-6 h-6 text-violet-400" />
              <Sparkles className="w-3 h-3 text-violet-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                AI Agent's Strategy
              </h3>
              <p className="text-xs text-violet-300">Thought process behind this workflow</p>
            </div>
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-violet-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-violet-400" />
          )}
        </button>

        {/* Content */}
        {!isCollapsed && (
          <div className="px-4 pb-4 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              {/* Strategy Content */}
              <div className="bg-slate-900/50 rounded-lg p-3 border border-violet-500/20">
                <div className="flex items-start gap-2 mb-2">
                  <Target className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-violet-200 font-medium mb-1">Strategic Approach</p>
                  </div>
                </div>
                <div className="markdown-content text-sm text-slate-200 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {strategyPlan}
                  </ReactMarkdown>
                </div>
              </div>

              {/* AI Insight Badge */}
              <div className="flex items-center gap-2 text-xs text-violet-300 bg-violet-500/10 rounded-lg p-2">
                <Lightbulb className="w-4 h-4 flex-shrink-0" />
                <span>
                  This workflow was intelligently designed based on your campaign brief
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        /* Markdown Content Styling */
        .markdown-content h1 {
          font-size: 1.25rem;
          font-weight: 700;
          color: rgb(226 232 240);
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: rgb(226 232 240);
          margin-top: 0.875rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content h3 {
          font-size: 1rem;
          font-weight: 600;
          color: rgb(226 232 240);
          margin-top: 0.75rem;
          margin-bottom: 0.375rem;
        }
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgb(203 213 225);
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .markdown-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        .markdown-content ul,
        .markdown-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        .markdown-content ul {
          list-style-type: disc;
        }
        .markdown-content ol {
          list-style-type: decimal;
        }
        .markdown-content li {
          margin-bottom: 0.25rem;
        }
        .markdown-content li > p {
          margin-bottom: 0.25rem;
        }
        .markdown-content strong {
          font-weight: 600;
          color: rgb(226 232 240);
        }
        .markdown-content em {
          font-style: italic;
          color: rgb(203 213 225);
        }
        .markdown-content code {
          background-color: rgba(139, 92, 246, 0.15);
          color: rgb(196 181 253);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: ui-monospace, monospace;
        }
        .markdown-content pre {
          background-color: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 0.375rem;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          overflow-x: auto;
        }
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
          color: rgb(226 232 240);
          font-size: 0.875rem;
        }
        .markdown-content blockquote {
          border-left: 3px solid rgba(139, 92, 246, 0.5);
          padding-left: 1rem;
          margin-left: 0;
          margin-bottom: 0.75rem;
          color: rgb(203 213 225);
          font-style: italic;
        }
        .markdown-content hr {
          border: none;
          border-top: 1px solid rgba(139, 92, 246, 0.3);
          margin: 1rem 0;
        }
        .markdown-content a {
          color: rgb(167 139 250);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .markdown-content a:hover {
          color: rgb(196 181 253);
        }
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0.75rem;
        }
        .markdown-content th,
        .markdown-content td {
          border: 1px solid rgba(139, 92, 246, 0.2);
          padding: 0.375rem 0.5rem;
          text-align: left;
        }
        .markdown-content th {
          background-color: rgba(139, 92, 246, 0.1);
          font-weight: 600;
          color: rgb(226 232 240);
        }
        .markdown-content td {
          background-color: rgba(15, 23, 42, 0.3);
        }
        .markdown-content :first-child {
          margin-top: 0;
        }
        .markdown-content :last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
