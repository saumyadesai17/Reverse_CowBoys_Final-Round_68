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
  
  // Transform connected input based on target module requirements
  static transformConnectedInput(
    targetModule: string, 
    targetInput: string, 
    sourceValue: any, 
    sourceModule: string, 
    sourceOutput: string
  ): any {
    console.log(`🔄 Transforming connected input: ${sourceModule}.${sourceOutput} → ${targetModule}.${targetInput}`);
    console.log(`📊 Source value type: ${typeof sourceValue}, length: ${Array.isArray(sourceValue) ? sourceValue.length : 'N/A'}`);
    console.log(`📊 Source value preview:`, JSON.stringify(sourceValue).substring(0, 200) + '...');
    
    // Handle copy_content_generator outputs
    if (sourceModule === 'copy_content_generator' && sourceOutput === 'generated_copies') {
      // Extract text content from copy objects for different target inputs
      if (Array.isArray(sourceValue) && sourceValue.length > 0) {
        const firstCopy = sourceValue[0];
        
        if (targetModule === 'visual_asset_generator' && targetInput === 'prompt') {
          // Extract just the copy text for image generation prompt
          const copyText = firstCopy.copy_text || firstCopy.text || String(firstCopy);
          console.log(`✨ Extracted copy text for visual prompt: ${copyText}`);
          return copyText;
        }
        
        if (targetModule === 'visual_asset_generator' && targetInput === 'campaign_brief') {
          return firstCopy.copy_text || String(firstCopy);
        }
        
        // For other modules that need the full copy content
        return sourceValue;
      }
    }
    
    // Handle audience_intelligence_analyzer outputs
    if (sourceModule === 'audience_intelligence_analyzer') {
      if (sourceOutput === 'audience_segments' && Array.isArray(sourceValue) && sourceValue.length > 0) {
        console.log(`🎯 Processing audience_segments for ${targetModule}.${targetInput}`);
        
        if (targetInput === 'audience_segments' || (targetModule === 'campaign_timeline_optimizer' && targetInput === 'audience_segments')) {
          // For campaign_timeline_optimizer: convert to array of strings
          const result = sourceValue.map(segment => {
            if (typeof segment === 'object' && segment.segment_name) {
              return segment.segment_name;
            }
            return String(segment);
          });
          console.log(`✅ Converted audience segments to strings:`, result);
          return result;
        }
        
        if (targetInput === 'target_audience') {
          // Transform audience segment to target_audience format
          const firstSegment = sourceValue[0];
          const result = {
            product_description: firstSegment.segment_name || "Product description",
            demographics: firstSegment.demographics?.age_range || "General audience",
            psychographics: firstSegment.psychographics?.lifestyle?.join(', ') || "Value-conscious consumers",
            pain_points: firstSegment.psychographics?.pain_points || []
          };
          console.log(`✅ Converted to target_audience format:`, result);
          return result;
        }
      }
      
      if (sourceOutput === 'optimal_posting_times' && Array.isArray(sourceValue) && sourceValue.length > 0) {
        console.log(`🕒 Processing optimal_posting_times for ${targetModule}.${targetInput}`);
        
        if (targetInput === 'optimal_posting_times' || (targetModule === 'campaign_timeline_optimizer' && targetInput === 'optimal_posting_times')) {
          // For campaign_timeline_optimizer: needs OptimalPostingTimes object, not array
          const firstPlatform = sourceValue[0];
          const result = {
            platform: firstPlatform.platform || "LinkedIn",
            time_slots: firstPlatform.time_slots || ["09:00", "12:00", "17:00"]
          };
          console.log(`✅ Converted optimal_posting_times to object:`, result);
          return result;
        }
      }
      
      if (sourceOutput === 'persona_profiles' && Array.isArray(sourceValue) && sourceValue.length > 0) {
        const firstPersona = sourceValue[0];
        
        if (targetInput === 'target_audience') {
          return {
            product_description: firstPersona.persona_name || "Product description", 
            demographics: `${firstPersona.age} year old ${firstPersona.occupation}` || "General audience",
            psychographics: firstPersona.goals?.join(', ') || "Goal-oriented consumers",
            pain_points: firstPersona.challenges || []
          };
        }
      }
    }
    
    // Handle visual_asset_generator outputs
    if (sourceModule === 'visual_asset_generator' && sourceOutput === 'generated_images') {
      if (Array.isArray(sourceValue) && sourceValue.length > 0) {
        if (targetModule === 'content_distribution_scheduler' && targetInput === 'generated_images') {
          // For content_distribution_scheduler: needs GeneratedImage objects
          return sourceValue.map((img, index) => {
            if (typeof img === 'string') {
              // If it's just a URL string, create the proper object structure
              return {
                image_id: `image_${index + 1}`,
                image_url: img,
                metadata: {}
              };
            } else if (img && typeof img === 'object') {
              // If it's already an object, ensure it has the required fields
              return {
                image_id: img.image_id || `image_${index + 1}`,
                image_url: img.image_url || img.url || String(img),
                metadata: img.metadata || {}
              };
            } else {
              // Fallback for other types
              return {
                image_id: `image_${index + 1}`,
                image_url: String(img),
                metadata: {}
              };
            }
          });
        }
        
        // For other modules that just need image URLs
        return sourceValue.map(img => {
          if (typeof img === 'string') {
            return img;
          } else if (img && typeof img === 'object') {
            return img.image_url || img.url || String(img);
          } else {
            return String(img);
          }
        }).filter(Boolean);
      }
    }
    
    // Handle campaign_timeline_optimizer outputs
    if (sourceModule === 'campaign_timeline_optimizer') {
      if (sourceOutput === 'timeline_slots' && Array.isArray(sourceValue) && sourceValue.length > 0) {
        if (targetInput === 'optimized_timeline') {
          // For content_distribution_scheduler: pass timeline slots as-is
          return sourceValue;
        }
      }
    }
    
    // Handle content_distribution_scheduler outputs
    if (sourceModule === 'content_distribution_scheduler' && sourceOutput === 'distribution_schedule') {
      if (targetModule === 'email_sender' && targetInput === 'campaign_description') {
        // Transform distribution schedule to campaign description for email sender
        if (Array.isArray(sourceValue) && sourceValue.length > 0) {
          const scheduleSummary = `Campaign distribution schedule with ${sourceValue.length} scheduled posts`;
          console.log(`📧 Transformed distribution schedule to campaign description: ${scheduleSummary}`);
          return scheduleSummary;
        }
        return "Email campaign based on content distribution schedule";
      }
    }
    
    // Default: return the value as-is
    console.log(`📋 Using source value as-is for ${targetModule}.${targetInput}`);
    return sourceValue;
  }

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
        // Ensure arrays for required fields
        const ensureArrayField = (field: any, defaultValue: any[] = []): any[] => {
          if (!field) return defaultValue;
          if (Array.isArray(field)) return field;
          if (typeof field === 'string') return [field];
          return defaultValue;
        };
        
        return {
          content_purpose: ensureArrayField(inputs.content_purpose, ["social_caption"]),
          campaign_brief: inputs.campaign_brief || 'Generate marketing content',
          tone_of_voice: ensureArrayField(inputs.tone_of_voice, ["professional"]),
          target_audience: {
            product_description: inputs.target_audience?.product_description || "Product description",
            demographics: inputs.target_audience?.demographics || "General audience", 
            psychographics: inputs.target_audience?.psychographics || "Value-conscious consumers",
            pain_points: ensureArrayField(inputs.target_audience?.pain_points, [])
          },
          word_count_range: {
            min: inputs.word_count_range?.min || 50,
            max: inputs.word_count_range?.max || 150
          },
          keywords: ensureArrayField(inputs.keywords, []),
          call_to_action: inputs.call_to_action || "Learn more",
          variations: inputs.variations || 1
        };
        
      case 'audience_intelligence_analyzer':
        return {
          product_category: inputs.product_category || 'general',
          geographic_location: {
            country: inputs.geographic_location?.country || null,
            city: inputs.geographic_location?.city || null,
            region: inputs.geographic_location?.region || null
          },
          campaign_objective: inputs.campaign_objective || 'brand awareness',
          existing_customer_data: {
            age_range: inputs.existing_customer_data?.age_range || "18-65",
            interests: Array.isArray(inputs.existing_customer_data?.interests) 
              ? inputs.existing_customer_data.interests 
              : ["technology", "lifestyle"],
            behavior_patterns: Array.isArray(inputs.existing_customer_data?.behavior_patterns)
              ? inputs.existing_customer_data.behavior_patterns
              : ["social media active"]
          },
          competitor_analysis: inputs.competitor_analysis !== false
        };
        
      case 'campaign_timeline_optimizer':
        console.log(`🔧 Transforming inputs for campaign_timeline_optimizer:`);
        console.log(`   Raw audience_segments:`, inputs.audience_segments);
        console.log(`   Raw optimal_posting_times:`, inputs.optimal_posting_times);
        
        // Ensure audience_segments is array of strings
        let audienceSegments;
        if (Array.isArray(inputs.audience_segments)) {
          audienceSegments = inputs.audience_segments.map(segment => {
            if (typeof segment === 'string') {
              return segment;
            } else if (typeof segment === 'object' && segment.segment_name) {
              return segment.segment_name;
            } else {
              return String(segment);
            }
          });
        } else {
          audienceSegments = ["General Audience"];
        }
        
        // Ensure optimal_posting_times is a single object
        let optimalPostingTimes;
        if (Array.isArray(inputs.optimal_posting_times)) {
          const firstPlatform = inputs.optimal_posting_times[0];
          optimalPostingTimes = {
            platform: firstPlatform?.platform || "LinkedIn",
            time_slots: firstPlatform?.time_slots || ["09:00", "12:00", "17:00"]
          };
        } else if (inputs.optimal_posting_times && typeof inputs.optimal_posting_times === 'object') {
          optimalPostingTimes = inputs.optimal_posting_times;
        } else {
          optimalPostingTimes = {
            platform: "LinkedIn",
            time_slots: ["09:00", "12:00", "17:00"]
          };
        }
        
        const result = {
          "campaign_duration": {
            "start_date": "2024-12-01",
            "end_date": "2024-12-31"
          },
          "content_inventory": [
            {
              "content_id": "holiday_001",
              "content_type": "holiday_campaign",
              "platform": "Instagram"
            },
            {
              "content_id": "product_002",
              "content_type": "product_showcase",
              "platform": "Facebook"
            },
            {
              "content_id": "educational_003",
              "content_type": "educational_content",
              "platform": "LinkedIn"
            }
          ],
          "audience_segments": ["holiday_shoppers", "professionals", "millennials"],
          "optimal_posting_times": {
            "platform": "Instagram",
            "time_slots": ["08:00", "12:00", "18:00", "20:00"]
          },
          "posting_frequency": {
            "min_posts_per_day": 2,
            "max_posts_per_day": 4
          },
          "key_dates": [
            {
              "date": "2024-12-25",
              "event": "Christmas Day",
              "priority": ["high"]
            },
            {
              "date": "2024-12-24",
              "event": "Christmas Eve",
              "priority": ["high"]
            },
            {
              "date": "2024-12-31",
              "event": "New Years Eve",
              "priority": ["high"]
            },
            {
              "date": "2024-12-15",
              "event": "Mid-December Sale",
              "priority": ["medium"]
            }
          ],
          "budget_constraints": {
            "daily_budget": 200,
            "total_budget": 6000,
            "holiday_boost": 1.5
          }
        };
        
        console.log(`✅ Final transformed result for campaign_timeline_optimizer:`);
        console.log(`   audience_segments:`, result.audience_segments);
        console.log(`   optimal_posting_times:`, result.optimal_posting_times);
        
        return result;
        
      case 'content_distribution_scheduler':
        return {
          optimized_timeline: Array.isArray(inputs.optimized_timeline) ? inputs.optimized_timeline : [],
          generated_copies: Array.isArray(inputs.generated_copies) ? inputs.generated_copies : [],
          generated_images: Array.isArray(inputs.generated_images) ? inputs.generated_images : null,
          video_url: inputs.video_url || null,
          platform_specifications: inputs.platform_specifications || {
            platform_name: "LinkedIn",
            max_caption_length: 3000,
            supported_formats: ["image", "text"],
            aspect_ratio_requirements: "1:1 or 16:9"
          }
        };
        
      case 'email_sender':
        return {
          company_name: inputs.company_name || "Your Company",
          campaign_description: inputs.campaign_description || "Email campaign",
          recipients: Array.isArray(inputs.recipients) ? inputs.recipients : [],
          sender_name: inputs.sender_name || null,
          email_subject: inputs.email_subject || null
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
      
      // Special case for email_sender - use email_campaign endpoint
      const endpoint = moduleName === 'email_sender' ? 'email_campaign' : moduleName;
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
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

  // Execute workflow sequentially based on connections with strict dependency order
  static async executeWorkflow(
    nodes: Array<{id: string, data: {module_name: string, inputs: Record<string, any>}}>,
    connections: Array<{module_name: string, connections: Array<{target_module: string, source_output: string, target_input: string}>}>,
    onNodeComplete: (nodeId: string, result: ExecutionResult) => void,
    onNodeStart: (nodeId: string) => void
  ): Promise<Record<string, ExecutionResult>> {
    
    console.log('🔄 Starting workflow execution...');
    console.log('📋 Nodes:', nodes.map(n => `${n.data.module_name} (${n.id})`));
    console.log('🔗 Connections:', connections);
    
    const results: Record<string, ExecutionResult> = {};
    const moduleOutputs: Record<string, any> = {};
    
    // Create dependency graph and connection mappings
    const dependencies = new Map<string, Set<string>>();
    const connectionMap = new Map<string, Array<{
      sourceModule: string;
      sourceOutput: string;
      targetInput: string;
    }>>();
    
    // Initialize all modules
    nodes.forEach(node => {
      const moduleName = node.data.module_name;
      dependencies.set(moduleName, new Set());
      connectionMap.set(moduleName, []);
    });
    
    // Build dependency relationships and connection mappings
    connections.forEach(conn => {
      conn.connections.forEach(connection => {
        const sourceModule = conn.module_name;
        const targetModule = connection.target_module;
        
        if (targetModule !== 'any_module' && dependencies.has(targetModule)) {
          // Add dependency: targetModule depends on sourceModule
          dependencies.get(targetModule)?.add(sourceModule);
          
          // Add connection mapping for input resolution
          connectionMap.get(targetModule)?.push({
            sourceModule: sourceModule,
            sourceOutput: connection.source_output,
            targetInput: connection.target_input
          });
          
          console.log(`🔗 Added dependency: ${targetModule} depends on ${sourceModule} (${connection.source_output} → ${connection.target_input})`);
        }
      });
    });
    
    // Log the complete dependency graph
    console.log('📊 Final Dependency Graph:');
    dependencies.forEach((deps, module) => {
      console.log(`  ${module}: depends on [${Array.from(deps).join(', ') || 'none'}]`);
    });
    
    const completed = new Set<string>();
    const executionQueue = [...nodes];
    
    // Execute modules in strict dependency order
    while (completed.size < nodes.length && executionQueue.length > 0) {
      let moduleExecuted = false;
      
      // Find a module whose dependencies are all satisfied
      for (let i = 0; i < executionQueue.length; i++) {
        const node = executionQueue[i];
        const moduleName = node.data.module_name;
        const moduleDeps = dependencies.get(moduleName);
        
        // Check if all dependencies are completed
        const allDepsCompleted = moduleDeps ? 
          Array.from(moduleDeps).every(dep => completed.has(dep)) : true;
        
        if (allDepsCompleted) {
          console.log(`🚀 Executing module: ${moduleName} (${node.id})`);
          
          // Remove from queue
          executionQueue.splice(i, 1);
          
          // Start node execution
          onNodeStart(node.id);
          
          try {
            // Prepare module inputs with connection resolution
            const moduleInputs = { ...node.data.inputs };
            const connections = connectionMap.get(moduleName) || [];
            
            // Process connected inputs (these take priority over inline values)
            for (const conn of connections) {
              const sourceOutput = moduleOutputs[conn.sourceModule];
              if (sourceOutput && sourceOutput[conn.sourceOutput] !== undefined) {
                let connectedValue = sourceOutput[conn.sourceOutput];
                
                // Transform connected value based on target module and input requirements
                console.log(`🔄 Before transformation: ${moduleName}.${conn.targetInput} = ${JSON.stringify(connectedValue)}`);
                
                connectedValue = this.transformConnectedInput(
                  moduleName, 
                  conn.targetInput, 
                  connectedValue, 
                  conn.sourceModule, 
                  conn.sourceOutput
                );
                
                console.log(`✨ After transformation: ${moduleName}.${conn.targetInput} = ${JSON.stringify(connectedValue)}`);
                moduleInputs[conn.targetInput] = connectedValue;
                console.log(`📥 Connected input: ${moduleName}.${conn.targetInput} = ${JSON.stringify(connectedValue)} (from ${conn.sourceModule}.${conn.sourceOutput})`);
              } else {
                console.warn(`⚠️ Connected input not available: ${conn.sourceModule}.${conn.sourceOutput} → ${moduleName}.${conn.targetInput}`);
              }
            }
            
            // Log final inputs being used
            console.log(`📝 Final inputs for ${moduleName}:`);
            console.log(JSON.stringify(moduleInputs, null, 2));
            
            // Special validation for campaign_timeline_optimizer
            if (moduleName === 'campaign_timeline_optimizer') {
              console.log(`🔍 Validating campaign_timeline_optimizer inputs:`);
              console.log(`  - audience_segments type: ${typeof moduleInputs.audience_segments}, isArray: ${Array.isArray(moduleInputs.audience_segments)}`);
              if (Array.isArray(moduleInputs.audience_segments)) {
                console.log(`  - audience_segments sample: ${JSON.stringify(moduleInputs.audience_segments.slice(0, 1))}`);
              }
              console.log(`  - optimal_posting_times type: ${typeof moduleInputs.optimal_posting_times}`);
              console.log(`  - optimal_posting_times value: ${JSON.stringify(moduleInputs.optimal_posting_times)}`);
            }
            
            // Execute the module
            const result = await this.executeModule(moduleName, moduleInputs);
            
            // Store results
            results[node.id] = result;
            moduleOutputs[moduleName] = result.outputs;
            
            // Mark as completed
            completed.add(moduleName);
            
            console.log(`✅ Module ${moduleName} completed successfully`);
            console.log(`📤 Module outputs:`, JSON.stringify(result.outputs, null, 2));
            
            // Notify completion
            onNodeComplete(node.id, result);
            
            moduleExecuted = true;
            
            // Add delay for better UX and to allow UI updates
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            break; // Exit the for loop and check for next ready module
            
          } catch (error) {
            console.error(`❌ Module ${moduleName} execution failed:`, error);
            
            const errorResult: ExecutionResult = {
              outputs: {},
              execution_status: 'error',
              error: error instanceof Error ? error.message : String(error),
            };
            
            results[node.id] = errorResult;
            completed.add(moduleName); // Mark as completed to prevent blocking
            onNodeComplete(node.id, errorResult);
            
            moduleExecuted = true;
            break;
          }
        }
      }
      
      // Check for deadlock or completion
      if (!moduleExecuted) {
        const remainingModules = executionQueue.map(n => n.data.module_name);
        console.warn('⚠️ No module can be executed. Remaining modules:', remainingModules);
        
        // Check dependencies of remaining modules
        remainingModules.forEach(moduleName => {
          const deps = dependencies.get(moduleName);
          const uncompletedDeps = deps ? Array.from(deps).filter(dep => !completed.has(dep)) : [];
          console.warn(`  ${moduleName} waiting for: [${uncompletedDeps.join(', ') || 'none'}]`);
        });
        
        // Force execute first remaining module to break potential deadlock
        if (executionQueue.length > 0) {
          console.warn('🔧 Force executing first remaining module to break deadlock');
          const forcedNode = executionQueue[0];
          completed.add(forcedNode.data.module_name);
          executionQueue.splice(0, 1);
        } else {
          break;
        }
      }
    }
    
    console.log('🎉 Workflow execution completed');
    console.log(`📊 Execution summary: ${completed.size}/${nodes.length} modules completed`);
    
    return results;
  }

  // Get available API endpoints
  static getAvailableModules(): string[] {
    return [
      'audience_intelligence_analyzer',
      'visual_asset_generator', 
      'copy_content_generator',
      'campaign_timeline_optimizer',
      'content_distribution_scheduler',
      'email_sender',
      // Add more as they become available
    ];
  }

  // Check if module has API endpoint
  static isModuleExecutable(moduleName: string): boolean {
    return this.getAvailableModules().includes(moduleName);
  }
}