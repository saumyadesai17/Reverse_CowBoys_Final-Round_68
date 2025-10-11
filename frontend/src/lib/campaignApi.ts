// Campaign API Service for integrating with FastAPI backend

export interface CampaignResponse {
  campaign_brief: string;
  strategy_plan: string;
  research_summary: string;
  sources: string[];
  module_configurations: Record<string, any>;
  module_connections: ModuleConnection[];
  timestamp: string;
}

export interface ModuleConnection {
  module_name: string;
  connections: Array<{
    target_module: string;
    source_output: string;
    target_input: string;
  }>;
}

export interface QuickCampaignRequest {
  brief: string;
}

// Backend API base URL - adjust this based on your FastAPI server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class CampaignApiService {
  static async createQuickCampaign(brief: string): Promise<CampaignResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/campaign/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brief }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling campaign API:', error);
      throw error;
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  static async getModuleConnections(): Promise<ModuleConnection[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/module/connections`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching module connections:', error);
      throw error;
    }
  }
}