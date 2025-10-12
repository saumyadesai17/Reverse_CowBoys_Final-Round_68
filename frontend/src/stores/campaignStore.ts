import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CampaignHistory {
  id: string;
  title: string;
  brief: string;
  status: 'completed' | 'active' | 'draft';
  createdAt: string;
  metrics?: {
    reach?: string;
    engagement?: string;
    budget?: string;
    modulesUsed?: number;
  };
  category: string;
  color: string;
  workflowData?: {
    nodes: any[];
    edges: any[];
  };
}

interface CampaignState {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  
  connectionPreview: {
    sourceNode: string;
    sourceHandle: string;
    compatibleTargets: Array<{nodeId: string, handleId: string}>;
  } | null;
  setConnectionPreview: (preview: {
    sourceNode: string;
    sourceHandle: string;
    compatibleTargets: Array<{nodeId: string, handleId: string}>;
  } | null) => void;
  
  modules: Record<string, any>;
  updateModule: (id: string, data: any) => void;
  
  executionResults: Record<string, any>;
  setExecutionResult: (nodeId: string, result: any) => void;
  
  // Strategy Plan from AI Agent
  strategyPlan: string | null;
  setStrategyPlan: (plan: string | null) => void;
  
  // Campaign History
  campaignHistory: CampaignHistory[];
  addCampaign: (campaign: CampaignHistory) => void;
  updateCampaign: (id: string, updates: Partial<CampaignHistory>) => void;
  deleteCampaign: (id: string) => void;
  getCampaign: (id: string) => CampaignHistory | undefined;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      selectedNodeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      
      connectionPreview: null,
      setConnectionPreview: (preview) => set({ connectionPreview: preview }),
      
      modules: {},
      updateModule: (id, data) => 
        set((state) => ({
          modules: { ...state.modules, [id]: data }
        })),
      
      executionResults: {},
      setExecutionResult: (nodeId, result) =>
        set((state) => ({
          executionResults: { ...state.executionResults, [nodeId]: result }
        })),
      
      // Strategy Plan
      strategyPlan: null,
      setStrategyPlan: (plan) => set({ strategyPlan: plan }),
      
      // Campaign History
      campaignHistory: [],
      addCampaign: (campaign) =>
        set((state) => ({
          campaignHistory: [campaign, ...state.campaignHistory]
        })),
      updateCampaign: (id, updates) =>
        set((state) => ({
          campaignHistory: state.campaignHistory.map((campaign) =>
            campaign.id === id ? { ...campaign, ...updates } : campaign
          )
        })),
      deleteCampaign: (id) =>
        set((state) => ({
          campaignHistory: state.campaignHistory.filter((campaign) => campaign.id !== id)
        })),
      getCampaign: (id) => {
        const state = get();
        return state.campaignHistory.find((campaign) => campaign.id === id);
      },
    }),
    {
      name: 'campaign-store',
      partialize: (state) => ({ 
        campaignHistory: state.campaignHistory 
      }),
    }
  )
);