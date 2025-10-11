// Test the transformation logic for audience_intelligence_analyzer
const fs = require('fs');
const path = require('path');

// Read the workflowExecution.ts file and extract the transformInputsForAPI function
const workflowFile = fs.readFileSync(path.join(__dirname, 'src/lib/workflowExecution.ts'), 'utf8');

// Test data that matches the failing request
const testInputs = {
  product_category: "Food & Beverage",
  geographic_location: {
    country: "India",
    city: "Mumbai",
    region: "Maharashtra"
  },
  campaign_objective: "Increase brand awareness and engagement",
  existing_customer_data: {
    age_range: "18-35",
    interests: "sustainability",
    behavior_patterns: "social media active"
  },
  competitor_analysis: true
};

// Mock transformation function (simplified version for testing)
function transformInputsForAPI(moduleName, inputs) {
  switch (moduleName) {
    case 'audience_intelligence_analyzer':
      // Ensure interests is always an array
      const ensureInterestsArray = (interests) => {
        if (!interests) return ["technology", "lifestyle"];
        if (Array.isArray(interests)) return interests;
        if (typeof interests === 'string') return [interests];
        return ["technology", "lifestyle"];
      };
      
      // Ensure behavior_patterns is always an array
      const ensureBehaviorPatternsArray = (patterns) => {
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

console.log('Original inputs:');
console.log(JSON.stringify(testInputs, null, 2));

console.log('\nTransformed inputs:');
const transformed = transformInputsForAPI('audience_intelligence_analyzer', testInputs);
console.log(JSON.stringify(transformed, null, 2));

console.log('\nChecking types:');
console.log('interests is array:', Array.isArray(transformed.existing_customer_data.interests));
console.log('behavior_patterns is array:', Array.isArray(transformed.existing_customer_data.behavior_patterns));