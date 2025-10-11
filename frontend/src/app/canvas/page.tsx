"use client";

import { CampaignCanvas } from "@/components/workflow/CampaignCanvas";

export default function CanvasPage() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <CampaignCanvas />
    </div>
  );
}