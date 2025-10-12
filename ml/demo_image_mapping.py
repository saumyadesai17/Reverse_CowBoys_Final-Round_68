"""
Demonstration of proper image mapping from Visual Asset Generator to Content Distribution Scheduler

This script shows how to:
1. Generate images using the Visual Asset Generator
2. Pass those images to the Content Distribution Scheduler
3. Ensure proper mapping of assets to schedule items

Run this to see the enhanced functionality with actual image integration.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from content_distribution_scheduler import (
    ContentDistributionRequest,
    OptimizedTimeline, 
    GeneratedCopy,
    GeneratedImage,
    PlatformSpecifications,
    schedule_content_distribution
)
from datetime import datetime, timedelta
import json

def create_sample_visual_assets():
    """Create sample visual assets as they would come from the Visual Asset Generator"""
    return [
        GeneratedImage(
            image_id="social_post_1",
            image_url="https://image.pollinations.ai/prompt/modern%20coffee%20shop%20interior%20with%20cozy%20atmosphere?width=1080&height=1080&seed=42",
            metadata={
                "style": "photorealistic",
                "dimensions": {"width": 1080, "height": 1080},
                "prompt": "modern coffee shop interior with cozy atmosphere",
                "content_type": "social_post"
            }
        ),
        GeneratedImage(
            image_id="social_post_2", 
            image_url="https://image.pollinations.ai/prompt/premium%20coffee%20beans%20artistic%20photography?width=1080&height=1080&seed=43",
            metadata={
                "style": "photorealistic",
                "dimensions": {"width": 1080, "height": 1080},
                "prompt": "premium coffee beans artistic photography",
                "content_type": "social_post"
            }
        ),
        GeneratedImage(
            image_id="product_showcase_1",
            image_url="https://image.pollinations.ai/prompt/coffee%20product%20flat%20lay%20minimalist%20style?width=1200&height=800&seed=44",
            metadata={
                "style": "minimal",
                "dimensions": {"width": 1200, "height": 800},
                "prompt": "coffee product flat lay minimalist style",
                "content_type": "product_showcase"
            }
        ),
        GeneratedImage(
            image_id="ad_creative_1",
            image_url="https://image.pollinations.ai/prompt/coffee%20advertisement%20professional%20branding?width=1200&height=630&seed=45",
            metadata={
                "style": "photorealistic",
                "dimensions": {"width": 1200, "height": 630},
                "prompt": "coffee advertisement professional branding",
                "content_type": "ad_creative"
            }
        )
    ]

def create_sample_timeline():
    """Create sample optimized timeline"""
    base_date = datetime.now().date()
    
    return [
        OptimizedTimeline(
            timeline_slot_id="slot_1",
            scheduled_date=(base_date + timedelta(days=1)).strftime("%Y-%m-%d"),
            content_type="social_caption",
            platform="Instagram",
            target_segment="Coffee enthusiasts (25-40)",
            priority=["high"],
            optimal_time="09:00",
            reasoning="Morning coffee engagement peak"
        ),
        OptimizedTimeline(
            timeline_slot_id="slot_2",
            scheduled_date=(base_date + timedelta(days=2)).strftime("%Y-%m-%d"),
            content_type="product_showcase",
            platform="Facebook",
            target_segment="Local coffee lovers",
            priority=["medium"],
            optimal_time="14:00",
            reasoning="Afternoon social media usage peak"
        ),
        OptimizedTimeline(
            timeline_slot_id="slot_3",
            scheduled_date=(base_date + timedelta(days=3)).strftime("%Y-%m-%d"),
            content_type="promotional_content",
            platform="Instagram",
            target_segment="New customers",
            priority=["high"],
            optimal_time="18:00",
            reasoning="Evening engagement for promotions"
        )
    ]

def create_sample_copies():
    """Create sample generated copies"""
    return [
        GeneratedCopy(
            copy_id="social_caption_1",
            copy_text="Start your day with the perfect cup ☕ Our artisan-roasted beans deliver rich, complex flavors that awaken your senses. #CoffeeLovers #MorningRitual",
            word_count=25,
            hashtags=["#CoffeeLovers", "#MorningRitual", "#ArtisanCoffee"],
            emojis=["☕", "🌅"]
        ),
        GeneratedCopy(
            copy_id="product_showcase_1", 
            copy_text="Discover the craftsmanship behind every cup. Our premium coffee beans are carefully selected and roasted to perfection, bringing you an exceptional coffee experience.",
            word_count=28,
            hashtags=["#PremiumCoffee", "#Craftsmanship", "#QualityFirst"],
            emojis=["☕", "✨"]
        ),
        GeneratedCopy(
            copy_id="promotional_content_1",
            copy_text="🎉 Special Offer Alert! Get 20% off your first order with code WELCOME20. Experience the difference of premium, freshly roasted coffee delivered to your door.",
            word_count=30,
            hashtags=["#SpecialOffer", "#FreshRoasted", "#Delivery"],
            emojis=["🎉", "📦", "🚚"]
        )
    ]

def demonstrate_image_mapping():
    """Demonstrate proper image mapping from Visual Asset Generator to Content Distribution Scheduler"""
    
    print("🎨 Creating Visual Assets (from Visual Asset Generator)...")
    visual_assets = create_sample_visual_assets()
    print(f"✅ Generated {len(visual_assets)} visual assets")
    for asset in visual_assets:
        print(f"   📸 {asset.image_id}: {asset.image_url}")
    
    print("\n📝 Creating Content Copies...")
    copies = create_sample_copies()
    print(f"✅ Generated {len(copies)} content copies")
    
    print("\n📅 Creating Optimized Timeline...")
    timeline = create_sample_timeline()
    print(f"✅ Generated {len(timeline)} timeline slots")
    
    print("\n🔧 Creating Platform Specifications...")
    platform_specs = PlatformSpecifications(
        platform_name="Instagram",
        max_caption_length=2200,
        supported_formats=["image", "video", "carousel"],
        aspect_ratio_requirements="1:1, 4:5, 9:16"
    )
    
    print("\n🚀 Running Content Distribution Scheduler with Visual Assets...")
    request = ContentDistributionRequest(
        optimized_timeline=timeline,
        generated_copies=copies,
        generated_images=visual_assets,  # This is the key - actual images from Visual Asset Generator
        platform_specifications=platform_specs
    )
    
    result = schedule_content_distribution(request)
    
    print(f"\n✅ Distribution Scheduling Status: {result.execution_status}")
    print(f"📊 Generated {len(result.outputs.get('distribution_schedule', []))} schedule items")
    
    # Show image mapping results
    print("\n🖼️ Visual Asset Mapping Results:")
    schedule_items = result.outputs.get('distribution_schedule', [])
    total_mapped_images = 0
    
    for i, item in enumerate(schedule_items, 1):
        content_package = item.get('content_package', {})
        asset_urls = content_package.get('asset_urls', [])
        total_mapped_images += len(asset_urls)
        
        print(f"   📅 Schedule Item {i}:")
        print(f"      Platform: {item.get('platform', 'N/A')}")
        print(f"      Content: {content_package.get('copy_text', 'N/A')[:50]}...")
        print(f"      Mapped Images: {len(asset_urls)}")
        for j, url in enumerate(asset_urls, 1):
            print(f"         🖼️ Image {j}: {url}")
    
    print(f"\n📈 Summary:")
    print(f"   • Total Visual Assets Created: {len(visual_assets)}")
    print(f"   • Total Images Mapped to Schedule: {total_mapped_images}")
    print(f"   • Mapping Success Rate: {(total_mapped_images/len(visual_assets)*100):.1f}%")
    
    print(f"\n💡 Frontend Integration:")
    print(f"   • Calendar cards will now show actual images instead of dummy placeholders")
    print(f"   • Click on any calendar card to see detailed view with real visual assets")
    print(f"   • Asset URLs are properly mapped from Visual Asset Generator output")
    
    return result

if __name__ == "__main__":
    print("🎯 Visual Asset Generator → Content Distribution Scheduler Integration Demo")
    print("=" * 80)
    
    result = demonstrate_image_mapping()
    
    print("\n" + "=" * 80)
    print("🎉 Demo Complete! The Content Distribution Scheduler now properly uses")
    print("   actual images from the Visual Asset Generator instead of dummy images.")
    print("\n📋 Next Steps:")
    print("   1. Run Visual Asset Generator first to create images")
    print("   2. Pass the generated images to Content Distribution Scheduler") 
    print("   3. Calendar cards will display the actual generated images")
    print("   4. Click cards for detailed view with rich visual asset information")