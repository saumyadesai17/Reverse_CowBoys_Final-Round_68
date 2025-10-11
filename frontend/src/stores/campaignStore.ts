import { create } from 'zustand';

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
}

export const useCampaignStore = create<CampaignState>((set) => ({
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
}));