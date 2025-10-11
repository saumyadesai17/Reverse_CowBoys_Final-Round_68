export const MODULE_DEFINITIONS = {
  visual_asset_generator: {
    module_name: "visual_asset_generator",
    display_name: "Visual Asset Generator",
    description: "Generates visual content using AI image models",
    category: "Creative",
    color: "#10b981",
    inputs: {
      prompt: {
        type: "string",
        required: true,
        description: "Detailed image generation prompt"
      },
      brand_guidelines: {
        type: "object",
        required: false,
        properties: {
          colors: ["string"],
          style: "string",
          logo_url: "string"
        }
      },
      quantity: {
        type: "integer",
        required: true,
        default: 1,
        min: 1,
        max: 10
      },
      dimensions: {
        type: "object",
        required: false,
        properties: {
          width: "integer",
          height: "integer"
        }
      },
      image_style: {
        type: "enum",
        values: ["photorealistic", "illustration", "minimal", "abstract"],
        required: false
      },
      negative_prompts: {
        type: "array",
        items: "string",
        required: false
      }
    },
    outputs: {
      generated_images: {
        type: "array",
        items: {
          image_url: "string",
          image_id: "string",
          metadata: "object"
        }
      },
      generation_metadata: {
        type: "object",
        properties: {
          model_used: "string",
          generation_time: "timestamp",
          prompt_tokens: "integer"
        }
      },
      execution_status: {
        type: "enum",
        values: ["success", "partial_success", "failed"]
      }
    }
  },

  video_content_generator: {
    module_name: "video_content_generator",
    display_name: "Video Content Generator",
    description: "Creates video content from scripts, images, or text",
    category: "Creative",
    color: "#8b5cf6",
    inputs: {
      content_type: {
        type: "enum",
        values: ["text_to_video", "image_sequence", "template_based"],
        required: true
      },
      script: {
        type: "string",
        required: false,
        description: "Video script or narration text"
      },
      image_inputs: {
        type: "array",
        items: "string",
        required: false,
        description: "Array of image URLs from visual_asset_generator"
      },
      duration: {
        type: "integer",
        required: true,
        description: "Video length in seconds",
        min: 5,
        max: 300
      },
      aspect_ratio: {
        type: "enum",
        values: ["16:9", "9:16", "1:1", "4:5"],
        required: true
      },
      background_music: {
        type: "object",
        required: false,
        properties: {
          music_style: "string",
          volume: "float"
        }
      },
      voiceover: {
        type: "object",
        required: false,
        properties: {
          voice_type: "string",
          language: "string"
        }
      }
    },
    outputs: {
      video_url: "string",
      video_id: "string",
      thumbnail_url: "string",
      video_metadata: {
        type: "object",
        properties: {
          duration: "integer",
          format: "string",
          file_size: "integer",
          resolution: "string"
        }
      },
      execution_status: "enum"
    }
  },

  copy_content_generator: {
    module_name: "copy_content_generator",
    display_name: "Copy Content Generator",
    description: "Generates marketing copy, captions, and written content",
    category: "Creative",
    color: "#f59e0b",
    inputs: {
      content_purpose: {
        type: "enum",
        values: ["social_caption", "ad_copy", "blog_post", "email", "product_description"],
        required: true
      },
      campaign_brief: {
        type: "string",
        required: true,
        description: "Campaign context and objectives"
      },
      tone_of_voice: {
        type: "enum",
        values: ["professional", "casual", "humorous", "inspirational", "educational"],
        required: true
      },
      target_audience: {
        type: "object",
        required: true,
        properties: {
          demographics: "string",
          psychographics: "string",
          pain_points: ["string"]
        }
      },
      word_count_range: {
        type: "object",
        properties: {
          min: "integer",
          max: "integer"
        }
      },
      keywords: {
        type: "array",
        items: "string",
        required: false
      },
      call_to_action: {
        type: "string",
        required: false
      },
      variations: {
        type: "integer",
        default: 1,
        min: 1,
        max: 5
      }
    },
    outputs: {
      generated_copies: {
        type: "array",
        items: {
          copy_text: "string",
          copy_id: "string",
          word_count: "integer",
          hashtags: ["string"],
          emojis: ["string"]
        }
      },
      seo_metadata: {
        type: "object",
        properties: {
          keyword_density: "object",
          readability_score: "float"
        }
      },
      execution_status: "enum"
    }
  },

  audience_intelligence_analyzer: {
    module_name: "audience_intelligence_analyzer",
    display_name: "Audience Intelligence Analyzer",
    description: "Analyzes and identifies target audience characteristics",
    category: "Research",
    color: "#3b82f6",
    inputs: {
      product_category: {
        type: "string",
        required: true
      },
      geographic_location: {
        type: "object",
        required: true,
        properties: {
          country: "string",
          city: "string",
          region: "string"
        }
      },
      campaign_objective: {
        type: "string",
        required: true
      },
      existing_customer_data: {
        type: "object",
        required: false,
        properties: {
          age_range: "string",
          interests: ["string"],
          behavior_patterns: ["string"]
        }
      },
      competitor_analysis: {
        type: "boolean",
        default: true
      }
    },
    outputs: {
      audience_segments: {
        type: "array",
        items: {
          segment_name: "string",
          demographics: "object",
          psychographics: "object",
          platform_preferences: ["string"],
          content_preferences: ["string"],
          estimated_reach: "integer"
        }
      },
      persona_profiles: {
        type: "array",
        items: "object"
      },
      recommended_channels: ["string"],
      optimal_posting_times: {
        type: "object",
        properties: {
          platform: "string",
          time_slots: ["string"]
        }
      },
      execution_status: "enum"
    }
  },

  campaign_timeline_optimizer: {
    module_name: "campaign_timeline_optimizer",
    display_name: "Campaign Timeline Optimizer",
    description: "Creates optimized campaign schedules and timelines",
    category: "Strategy",
    color: "#ef4444",
    inputs: {
      campaign_duration: {
        type: "object",
        required: true,
        properties: {
          start_date: "date",
          end_date: "date"
        }
      },
      content_inventory: {
        type: "array",
        items: {
          content_id: "string",
          content_type: "string",
          platform: "string"
        },
        required: true
      },
      audience_segments: {
        type: "array",
        required: true,
        description: "From audience_intelligence_analyzer output"
      },
      optimal_posting_times: {
        type: "object",
        required: true,
        description: "From audience_intelligence_analyzer output"
      },
      posting_frequency: {
        type: "object",
        properties: {
          min_posts_per_day: "integer",
          max_posts_per_day: "integer"
        }
      },
      key_dates: {
        type: "array",
        items: {
          date: "date",
          event: "string",
          priority: "enum"
        },
        required: false
      },
      budget_constraints: {
        type: "object",
        required: false
      }
    },
    outputs: {
      optimized_timeline: {
        type: "array",
        items: {
          timeline_slot_id: "string",
          scheduled_date: "datetime",
          content_type: "string",
          platform: "string",
          target_segment: "string",
          priority: "enum"
        }
      },
      timeline_visualization: {
        type: "object",
        properties: {
          gantt_data: "object",
          calendar_view: "object"
        }
      },
      performance_predictions: {
        type: "object",
        properties: {
          expected_reach: "integer",
          expected_engagement: "float",
          optimal_budget_allocation: "object"
        }
      },
      execution_status: "enum"
    }
  },

  content_distribution_scheduler: {
    module_name: "content_distribution_scheduler",
    display_name: "Content Distribution Scheduler",
    description: "Creates detailed distribution schedules (planning only)",
    category: "Scheduling",
    color: "#06b6d4",
    inputs: {
      optimized_timeline: {
        type: "array",
        required: true,
        description: "From campaign_timeline_optimizer output"
      },
      generated_copies: {
        type: "array",
        required: true,
        description: "From copy_content_generator output"
      },
      generated_images: {
        type: "array",
        required: false,
        description: "From visual_asset_generator output"
      },
      video_url: {
        type: "string",
        required: false,
        description: "From video_content_generator output"
      },
      platform_specifications: {
        type: "object",
        required: true,
        properties: {
          platform_name: "string",
          max_caption_length: "integer",
          supported_formats: ["string"],
          aspect_ratio_requirements: "string"
        }
      }
    },
    outputs: {
      distribution_schedule: {
        type: "array",
        items: {
          schedule_item_id: "string",
          scheduled_datetime: "datetime",
          platform: "string",
          content_package: {
            copy_id: "string",
            copy_text: "string",
            asset_ids: ["string"],
            asset_urls: ["string"]
          },
          posting_parameters: {
            hashtags: ["string"],
            mentions: ["string"],
            location_tag: "string"
          },
          target_segment: "string"
        }
      },
      schedule_summary: {
        type: "object",
        properties: {
          total_posts: "integer",
          posts_by_platform: "object",
          campaign_coverage: "object"
        }
      },
      execution_status: "enum"
    }
  },

  content_distribution_executor: {
    module_name: "content_distribution_executor",
    display_name: "Content Distribution Executor",
    description: "Executes distribution schedule by publishing content",
    category: "Execution",
    color: "#dc2626",
    inputs: {
      distribution_schedule: {
        type: "array",
        required: true,
        description: "From content_distribution_scheduler output"
      },
      platform_credentials: {
        type: "object",
        required: true,
        properties: {
          platform_name: "string",
          auth_token: "string",
          account_id: "string"
        }
      },
      execution_mode: {
        type: "enum",
        values: ["immediate", "scheduled", "manual_approval"],
        required: true
      },
      monitoring_enabled: {
        type: "boolean",
        default: true
      },
      rollback_on_failure: {
        type: "boolean",
        default: false
      }
    },
    outputs: {
      executed_posts: {
        type: "array",
        items: {
          schedule_item_id: "string",
          post_id: "string",
          platform: "string",
          published_datetime: "datetime",
          post_url: "string",
          status: "enum",
          engagement_metrics: {
            views: "integer",
            likes: "integer",
            comments: "integer",
            shares: "integer"
          }
        }
      },
      failed_executions: {
        type: "array",
        items: {
          schedule_item_id: "string",
          error_code: "string",
          error_message: "string",
          retry_available: "boolean",
          suggested_action: "string"
        }
      },
      execution_summary: {
        type: "object",
        properties: {
          total_scheduled: "integer",
          successfully_published: "integer",
          failed: "integer",
          pending: "integer"
        }
      },
      execution_status: "enum"
    }
  },

  outreach_call_scheduler: {
    module_name: "outreach_call_scheduler",
    display_name: "Outreach Call Scheduler",
    description: "Generates call schedules (planning only)",
    category: "Scheduling",
    color: "#7c3aed",
    inputs: {
      discovered_leads: {
        type: "array",
        required: true,
        description: "From lead_discovery_engine output"
      },
      call_window_preferences: {
        type: "object",
        required: true,
        properties: {
          timezone: "string",
          preferred_hours: ["string"],
          avoid_dates: ["date"]
        }
      },
      campaign_duration: {
        type: "object",
        properties: {
          start_date: "date",
          end_date: "date"
        }
      },
      calls_per_day: {
        type: "integer",
        required: true
      },
      prioritization_criteria: {
        type: "object",
        properties: {
          qualification_score_threshold: "float",
          priority_segments: ["string"]
        }
      }
    },
    outputs: {
      call_schedule: {
        type: "array",
        items: {
          schedule_id: "string",
          lead_id: "string",
          lead_contact_info: "object",
          scheduled_datetime: "datetime",
          call_objective: "string",
          expected_duration: "integer",
          priority_level: "enum"
        }
      },
      schedule_summary: {
        type: "object",
        properties: {
          total_calls_scheduled: "integer",
          daily_distribution: "object",
          coverage_percentage: "float",
          estimated_completion_date: "date"
        }
      },
      execution_status: "enum"
    }
  },

  voice_interaction_agent: {
    module_name: "voice_interaction_agent",
    display_name: "Voice Interaction Agent",
    description: "Executes calls and conducts conversations",
    category: "Execution",
    color: "#f97316",
    inputs: {
      call_schedule: {
        type: "array",
        required: true,
        description: "From outreach_call_scheduler output"
      },
      conversation_objective: {
        type: "enum",
        values: ["qualification", "demo_booking", "feedback_collection", "follow_up"],
        required: true
      },
      call_script: {
        type: "object",
        required: true,
        properties: {
          opening: "string",
          talking_points: ["string"],
          objection_handling: "object",
          closing: "string"
        }
      },
      voice_settings: {
        type: "object",
        properties: {
          voice_type: "string",
          speech_rate: "float",
          language: "string"
        }
      },
      max_call_duration: {
        type: "integer",
        default: 900,
        description: "Maximum duration in seconds"
      },
      auto_dial: {
        type: "boolean",
        default: false
      }
    },
    outputs: {
      call_results: {
        type: "array",
        items: {
          call_id: "string",
          schedule_id: "string",
          lead_id: "string",
          call_status: "enum",
          actual_datetime: "datetime",
          duration: "integer",
          outcome_category: "enum",
          next_action: "string",
          appointment_scheduled: "boolean"
        }
      },
      conversation_transcripts: {
        type: "array",
        items: {
          call_id: "string",
          transcript_text: "string",
          sentiment_analysis: "object",
          key_topics: ["string"]
        }
      },
      extracted_intelligence: {
        type: "array",
        items: {
          call_id: "string",
          lead_id: "string",
          budget_indication: "string",
          timeline: "string",
          pain_points: ["string"],
          decision_makers: ["string"]
        }
      },
      recording_urls: {
        type: "array",
        items: {
          call_id: "string",
          recording_url: "string"
        }
      },
      execution_summary: {
        type: "object",
        properties: {
          calls_attempted: "integer",
          calls_completed: "integer",
          callbacks_required: "integer",
          average_call_duration: "float"
        }
      },
      execution_status: "enum"
    }
  },

  lead_discovery_engine: {
    module_name: "lead_discovery_engine",
    display_name: "Lead Discovery Engine",
    description: "Discovers and qualifies potential leads",
    category: "Research",
    color: "#059669",
    inputs: {
      search_criteria: {
        type: "object",
        required: true,
        properties: {
          industry: ["string"],
          company_size: "string",
          job_titles: ["string"],
          location: "string"
        }
      },
      audience_segments: {
        type: "array",
        required: false,
        description: "From audience_intelligence_analyzer output"
      },
      data_sources: {
        type: "array",
        items: "enum",
        values: ["linkedin", "company_databases", "web_scraping", "api_integrations"],
        required: true
      },
      qualification_criteria: {
        type: "object",
        required: true,
        properties: {
          budget_range: "string",
          decision_making_authority: "boolean",
          timeline: "string"
        }
      },
      max_leads: {
        type: "integer",
        default: 100
      },
      enrichment_required: {
        type: "boolean",
        default: true
      }
    },
    outputs: {
      discovered_leads: {
        type: "array",
        items: {
          lead_id: "string",
          contact_info: {
            name: "string",
            email: "string",
            phone: "string",
            company: "string",
            job_title: "string",
            linkedin_url: "string"
          },
          qualification_score: "float",
          lead_source: "string",
          enriched_data: {
            company_size: "string",
            annual_revenue: "string",
            tech_stack: ["string"],
            recent_activities: ["string"]
          }
        }
      },
      lead_summary: {
        type: "object",
        properties: {
          total_discovered: "integer",
          qualified_count: "integer",
          average_score: "float",
          sources_breakdown: "object"
        }
      },
      execution_status: "enum"
    }
  },

  collaboration_outreach_composer: {
    module_name: "collaboration_outreach_composer",
    display_name: "Collaboration Outreach Composer",
    description: "Composes personalized outreach messages",
    category: "Research",
    color: "#84cc16",
    inputs: {
      target_profiles: {
        type: "array",
        items: {
          profile_id: "string",
          platform: "string",
          profile_url: "string",
          audience_size: "integer",
          engagement_rate: "float",
          content_categories: ["string"]
        },
        required: true
      },
      discovered_leads: {
        type: "array",
        required: false,
        description: "From lead_discovery_engine output"
      },
      campaign_brief: {
        type: "string",
        required: true
      },
      generated_copies: {
        type: "array",
        required: false,
        description: "From copy_content_generator for reference"
      },
      outreach_type: {
        type: "enum",
        values: ["collaboration", "sponsorship", "guest_post", "partnership"],
        required: true
      },
      personalization_level: {
        type: "enum",
        values: ["low", "medium", "high"],
        default: "high"
      },
      template_guidelines: {
        type: "object",
        properties: {
          max_length: "integer",
          tone: "string",
          include_offer: "boolean"
        }
      }
    },
    outputs: {
      outreach_messages: {
        type: "array",
        items: {
          message_id: "string",
          target_profile_id: "string",
          subject_line: "string",
          message_body: "string",
          platform: "string",
          personalization_tokens: "object",
          follow_up_sequence: [
            {
              sequence_number: "integer",
              wait_days: "integer",
              message_text: "string"
            }
          ]
        }
      },
      send_recommendations: {
        type: "object",
        properties: {
          optimal_send_times: ["datetime"],
          expected_response_rate: "float",
          ab_test_variants: ["object"]
        }
      },
      execution_status: "enum"
    }
  },

  external_api_orchestrator: {
    module_name: "external_api_orchestrator",
    display_name: "External API Orchestrator",
    description: "Integrates with third-party services and APIs",
    category: "Integration",
    color: "#6366f1",
    inputs: {
      api_endpoint: {
        type: "string",
        required: true
      },
      http_method: {
        type: "enum",
        values: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        required: true
      },
      request_headers: {
        type: "object",
        required: false
      },
      request_body: {
        type: "object",
        required: false,
        description: "Can accept any module output"
      },
      authentication: {
        type: "object",
        required: true,
        properties: {
          auth_type: "enum",
          credentials: "object"
        }
      },
      retry_policy: {
        type: "object",
        properties: {
          max_retries: "integer",
          backoff_strategy: "enum"
        }
      },
      response_mapping: {
        type: "object",
        description: "Maps API response to expected output format"
      }
    },
    outputs: {
      api_response: {
        type: "object",
        description: "Raw or mapped API response"
      },
      response_metadata: {
        type: "object",
        properties: {
          status_code: "integer",
          response_time: "integer",
          timestamp: "datetime",
          rate_limit_remaining: "integer"
        }
      },
      parsed_data: {
        type: "object",
        description: "Structured data extracted from response"
      },
      execution_status: "enum"
    }
  }
};

export const CONNECTION_MATRIX = {
  "audience_intelligence_analyzer.audience_segments": ["copy_content_generator.target_audience", "campaign_timeline_optimizer.audience_segments", "lead_discovery_engine.audience_segments"],
  "audience_intelligence_analyzer.optimal_posting_times": ["campaign_timeline_optimizer.optimal_posting_times"],
  "copy_content_generator.generated_copies": ["visual_asset_generator.prompt", "content_distribution_scheduler.generated_copies", "collaboration_outreach_composer.generated_copies"],
  "visual_asset_generator.generated_images": ["video_content_generator.image_inputs", "content_distribution_scheduler.generated_images"],
  "video_content_generator.video_url": ["content_distribution_scheduler.video_url"],
  "campaign_timeline_optimizer.optimized_timeline": ["content_distribution_scheduler.optimized_timeline"],
  "content_distribution_scheduler.distribution_schedule": ["content_distribution_executor.distribution_schedule"],
  "lead_discovery_engine.discovered_leads": ["outreach_call_scheduler.discovered_leads", "collaboration_outreach_composer.discovered_leads"],
  "outreach_call_scheduler.call_schedule": ["voice_interaction_agent.call_schedule"],
  "voice_interaction_agent.call_results": ["external_api_orchestrator.request_body"],
  "voice_interaction_agent.extracted_intelligence": ["external_api_orchestrator.request_body"],
  "content_distribution_executor.executed_posts": ["external_api_orchestrator.request_body"],
  "collaboration_outreach_composer.outreach_messages": ["content_distribution_executor.distribution_schedule"],
  "external_api_orchestrator.parsed_data": ["*"] // Universal connector
};

export const MODULE_CATEGORIES = {
  "Creative": ["visual_asset_generator", "video_content_generator", "copy_content_generator"],
  "Research": ["audience_intelligence_analyzer", "lead_discovery_engine", "collaboration_outreach_composer"],
  "Strategy": ["campaign_timeline_optimizer"],
  "Scheduling": ["content_distribution_scheduler", "outreach_call_scheduler"],
  "Execution": ["content_distribution_executor", "voice_interaction_agent"],
  "Integration": ["external_api_orchestrator"]
};