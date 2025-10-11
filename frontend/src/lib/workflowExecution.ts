// Workflow Execution API Service

export interface ExecutionResult {
  outputs: Record<string, any>;
  execution_status: string;
  generation_metadata?: any;
  error?: string;
}

export interface ModuleExecutionRequest {
  module_name: string;
  inputs: Record<string, any>;
}

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class WorkflowExecutionService {
  
  // Transform module configuration to API request format
  static transformInputsForAPI(moduleName: string, inputs: Record<string, any>): Record<string, any> {
    switch (moduleName) {
      case 'visual_asset_generator':
        // Ensure colors is always an array
        const ensureColorsArray = (colors: any): string[] => {
          if (!colors) return ["blue", "white"];
          if (Array.isArray(colors)) return colors;
          if (typeof colors === 'string') return [colors];
          return ["blue", "white"];
        };
        
        // Ensure image_style is always an array
        const ensureImageStyleArray = (style: any): string[] => {
          if (!style) return ["photorealistic"];
          if (Array.isArray(style)) return style;
          if (typeof style === 'string') return [style];
          return ["photorealistic"];
        };
        
        // Ensure negative_prompts is always an array
        const ensureNegativePromptsArray = (prompts: any): string[] => {
          if (!prompts) return ["blurry", "low quality"];
          if (Array.isArray(prompts)) return prompts;
          if (typeof prompts === 'string') return [prompts];
          return ["blurry", "low quality"];
        };
        
        return {
          prompt: inputs.prompt || 'Generate a marketing visual',
          brand_guidelines: inputs.brand_guidelines ? {
            colors: ensureColorsArray(inputs.brand_guidelines.colors),
            style: inputs.brand_guidelines.style || "modern",
            logo_url: inputs.brand_guidelines.logo_url || null
          } : {
            colors: ["blue", "white"],
            style: "modern", 
            logo_url: null
          },
          quantity: inputs.quantity || 1,
          dimensions: inputs.dimensions ? {
            width: inputs.dimensions.width || 1080,
            height: inputs.dimensions.height || 1080
          } : {
            width: 1080,
            height: 1080
          },
          image_style: ensureImageStyleArray(inputs.image_style),
          negative_prompts: ensureNegativePromptsArray(inputs.negative_prompts)
        };
        
      case 'copy_content_generator':
        // Ensure keywords is always an array
        const ensureKeywordsArray = (keywords: any): string[] => {
          if (!keywords) return [];
          if (Array.isArray(keywords)) return keywords;
          if (typeof keywords === 'string') return [keywords];
          return [];
        };
        
        // Ensure pain_points is always an array
        const ensurePainPointsArray = (painPoints: any): string[] => {
          if (!painPoints) return [];
          if (Array.isArray(painPoints)) return painPoints;
          if (typeof painPoints === 'string') return [painPoints];
          return [];
        };
        
        return {
          content_purpose: Array.isArray(inputs.content_purpose) ? inputs.content_purpose : [inputs.content_purpose || "social_caption"],
          campaign_brief: inputs.campaign_brief || 'Generate marketing content',
          tone_of_voice: Array.isArray(inputs.tone_of_voice) ? inputs.tone_of_voice : [inputs.tone_of_voice || "professional"],
          target_audience: inputs.target_audience ? {
            product_description: inputs.target_audience.product_description || "Product description",
            demographics: inputs.target_audience.demographics || "General audience",
            psychographics: inputs.target_audience.psychographics || "Value-conscious consumers",
            pain_points: ensurePainPointsArray(inputs.target_audience.pain_points)
          } : {
            product_description: "Product description",
            demographics: "General audience",
            psychographics: "Value-conscious consumers",
            pain_points: []
          },
          word_count_range: inputs.word_count_range || {
            min: 50,
            max: 150
          },
          keywords: ensureKeywordsArray(inputs.keywords),
          call_to_action: inputs.call_to_action || "Learn more",
          variations: inputs.variations || 1
        };
        
      case 'audience_intelligence_analyzer':
        // Ensure interests is always an array
        const ensureInterestsArray = (interests: any): string[] => {
          if (!interests) return ["technology", "lifestyle"];
          if (Array.isArray(interests)) return interests;
          if (typeof interests === 'string') return [interests];
          return ["technology", "lifestyle"];
        };
        
        // Ensure behavior_patterns is always an array
        const ensureBehaviorPatternsArray = (patterns: any): string[] => {
          if (!patterns) return ["social media active"];
          if (Array.isArray(patterns)) return patterns;
          if (typeof patterns === 'string') return [patterns];
          return ["social media active"];
        };
        
        return {
          product_category: inputs.product_category || 'general',
          geographic_location: inputs.geographic_location || 'global',
          campaign_objective: inputs.campaign_objective || 'brand awareness',
          existing_customer_data: inputs.existing_customer_data ? {
            age_range: inputs.existing_customer_data.age_range || "18-65",
            interests: ensureInterestsArray(inputs.existing_customer_data.interests),
            behavior_patterns: ensureBehaviorPatternsArray(inputs.existing_customer_data.behavior_patterns)
          } : {
            age_range: "18-65",
            interests: ["technology", "lifestyle"],
            behavior_patterns: ["social media active"]
          },
          competitor_analysis: inputs.competitor_analysis !== false
        };
        
      default:
        return inputs;
    }
  }
  
  // Execute a single module
  static async executeModule(moduleName: string, inputs: Record<string, any>): Promise<ExecutionResult> {
    try {
      console.log(`🚀 Executing module: ${moduleName}`, inputs);
      
      // Transform inputs to match API expectations
      const transformedInputs = this.transformInputsForAPI(moduleName, inputs);
      console.log(`📝 Transformed inputs for ${moduleName}:`, transformedInputs);
      
      const response = await fetch(`${API_BASE_URL}/${moduleName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedInputs),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error (${response.status}):`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Module ${moduleName} executed successfully`, result);
      
      return {
        outputs: result.outputs || result,
        execution_status: result.execution_status || 'success',
        generation_metadata: result.generation_metadata,
      };
    } catch (error) {
      console.error(`❌ Error executing module ${moduleName}:`, error);
      
      return {
        outputs: {},
        execution_status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Execute workflow sequentially based on connections
  static async executeWorkflow(
    nodes: Array<{id: string, data: {module_name: string, inputs: Record<string, any>}}>,
    connections: Array<{module_name: string, connections: Array<{target_module: string, source_output: string, target_input: string}>}>,
    onNodeComplete: (nodeId: string, result: ExecutionResult) => void,
    onNodeStart: (nodeId: string) => void
  ): Promise<Record<string, ExecutionResult>> {
    
    const results: Record<string, ExecutionResult> = {};
    const moduleOutputs: Record<string, any> = {};
    
    // Create dependency graph
    const dependencies = new Map<string, string[]>();
    const dependents = new Map<string, string[]>();
    
    // Initialize all modules
    nodes.forEach(node => {
      const moduleName = node.data.module_name;
      dependencies.set(moduleName, []);
      dependents.set(moduleName, []);
    });
    
    // Build dependency relationships
    connections.forEach(conn => {
      conn.connections.forEach(connection => {
        const sourceModule = conn.module_name;
        const targetModule = connection.target_module;
        
        if (targetModule !== 'any_module' && dependencies.has(targetModule)) {
          dependencies.get(targetModule)?.push(sourceModule);
          dependents.get(sourceModule)?.push(targetModule);
        }
      });
    });
    
    // Find modules with no dependencies (starting modules)
    const readyModules = Array.from(dependencies.entries())
      .filter(([_, deps]) => deps.length === 0)
      .map(([module, _]) => module);
    
    const completed = new Set<string>();
    const processing = new Set<string>();
    
    // Execute modules in dependency order
    while (completed.size < nodes.length) {
      const currentBatch = readyModules.filter(module => 
        !completed.has(module) && !processing.has(module)
      );
      
      if (currentBatch.length === 0) {
        // Find next ready modules
        for (const [module, deps] of dependencies.entries()) {
          if (!completed.has(module) && !processing.has(module)) {
            const allDepsCompleted = deps.every(dep => completed.has(dep));
            if (allDepsCompleted) {
              readyModules.push(module);
            }
          }
        }
        
        if (readyModules.filter(m => !completed.has(m) && !processing.has(m)).length === 0) {
          console.warn('⚠️ Circular dependency or missing modules detected');
          break;
        }
        continue;
      }
      
      // Execute batch in parallel
      await Promise.all(currentBatch.map(async (moduleName) => {
        processing.add(moduleName);
        
        const node = nodes.find(n => n.data.module_name === moduleName);
        if (!node) return;
        
        onNodeStart(node.id);
        
        // Prepare inputs by merging stored inputs with outputs from dependencies
        const moduleInputs = { ...node.data.inputs };
        
        // Also check for incoming connections from other modules
        connections.forEach(conn => {
          conn.connections.forEach(connection => {
            if (connection.target_module === moduleName) {
              const sourceOutput = moduleOutputs[conn.module_name]?.[connection.source_output];
              if (sourceOutput !== undefined) {
                moduleInputs[connection.target_input] = sourceOutput;
              }
            }
          });
        });
        
        try {
          const result = await this.executeModule(moduleName, moduleInputs);
          results[node.id] = result;
          moduleOutputs[moduleName] = result.outputs;
          
          onNodeComplete(node.id, result);
          completed.add(moduleName);
        } catch (error) {
          const errorResult: ExecutionResult = {
            outputs: {},
            execution_status: 'error',
            error: error instanceof Error ? error.message : String(error),
          };
          
          results[node.id] = errorResult;
          onNodeComplete(node.id, errorResult);
          completed.add(moduleName); // Mark as completed even if failed
        }
        
        processing.delete(moduleName);
      }));
    }
    
    return results;
  }

  // Get available API endpoints
  static getAvailableModules(): string[] {
    return [
      'audience_intelligence_analyzer',
      'visual_asset_generator',
      'copy_content_generator',
      // Add more as they become available
    ];
  }

  // Check if module has API endpoint
  static isModuleExecutable(moduleName: string): boolean {
    return this.getAvailableModules().includes(moduleName);
  }
}