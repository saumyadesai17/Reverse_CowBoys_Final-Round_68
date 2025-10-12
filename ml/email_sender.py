"""
Email Sender Service
Standalone service for sending personalized email campaigns using AI-generated content

This service provides:
- AI-powered personalized email content generation
- SMTP email delivery with Gmail integration
- Delivery status tracking and error handling
- Campaign analytics and reporting
- Comprehensive logging and monitoring

Requirements:
- GROQ_API_KEY environment variable
- SENDER_EMAIL environment variable (Gmail)
- SENDER_PASSWORD environment variable (Gmail app password)
- SENDER_NAME environment variable (optional)
"""

import os
import smtplib
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from email.mime.text import MIMEText
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

class EmailRecipient(BaseModel):
    """Email recipient model"""
    name: str = Field(..., description="Recipient name")
    email: str = Field(..., description="Recipient email address")
    personal_description: str = Field(..., description="Personal interests and preferences")

class EmailCampaignRequest(BaseModel):
    """Email campaign request model"""
    company_name: str = Field(..., description="Company name")
    campaign_description: str = Field(..., description="Campaign description")
    recipients: List[EmailRecipient] = Field(..., description="List of email recipients")
    sender_name: Optional[str] = Field(None, description="Sender name (defaults to company name)")
    email_subject: Optional[str] = Field(None, description="Email subject (defaults to 'Special Offer from {company_name}!')")

class EmailDeliveryStatus(BaseModel):
    """Email delivery status model"""
    recipient_name: str = Field(..., description="Recipient name")
    recipient_email: str = Field(..., description="Recipient email")
    status: str = Field(..., description="Delivery status: 'sent', 'failed'")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    email_content: Optional[str] = Field(None, description="Generated email content")

class EmailCampaignResponse(BaseModel):
    """Email campaign response model"""
    campaign_summary: Dict[str, Any] = Field(..., description="Campaign summary")
    delivery_results: List[EmailDeliveryStatus] = Field(..., description="Email delivery results")
    execution_status: str = Field(..., description="Execution status: 'success', 'partial_success', 'failed'")
    timestamp: datetime = Field(default_factory=datetime.now, description="Execution timestamp")

def send_email_campaign(request: EmailCampaignRequest) -> EmailCampaignResponse:
    """
    Send personalized email campaign using AI-generated content
    
    This function sends personalized marketing emails to a list of recipients including:
    - AI-generated personalized email content for each recipient
    - Personalized subject lines and sender information
    - Campaign-specific messaging based on recipient interests
    - Delivery status tracking for each email
    - Comprehensive campaign summary and results
    
    Args:
        request (EmailCampaignRequest): Email campaign request with company info, 
                                      campaign description, and recipient list
    
    Returns:
        EmailCampaignResponse: Campaign results with delivery status and analytics
    
    Raises:
        ValueError: If required environment variables are missing
        Exception: If SMTP connection or email sending fails
    """
    print(f"📧 Starting email campaign for {request.company_name}")
    print(f"📝 Campaign: {request.campaign_description}")
    print(f"👥 Recipients: {len(request.recipients)}")
    
    # Initialize Groq client
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    # Get email credentials
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")
    sender_name = request.sender_name or os.getenv("SENDER_NAME", request.company_name)
    
    if not sender_email or not sender_password:
        raise ValueError("❌ Missing SENDER_EMAIL or SENDER_PASSWORD in environment variables. Please set these to send emails.")
    
    if not os.getenv("GROQ_API_KEY"):
        raise ValueError("❌ Missing GROQ_API_KEY in environment variables. Please set this to generate email content.")
    
    # Track delivery results
    delivery_results = []
    successful_sends = 0
    failed_sends = 0
    
    # Send emails using SMTP
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            
            for recipient in request.recipients:
                try:
                    # Generate personalized email content using Groq
                    prompt = f"""
                    You are an expert advertising copywriter for {request.company_name}.
                    Write a personalized, friendly, and persuasive marketing email for a campaign.
                    
                    Campaign Description:
                    {request.campaign_description}

                    Recipient Details:
                    Name: {recipient.name}
                    Interests and Preferences: {recipient.personal_description}

                    Guidelines:
                    - Keep it under 100 words.
                    - Make it conversational and emotionally engaging.
                    - Highlight how this offer or campaign benefits the recipient personally.
                    - End with a warm closing from {request.company_name}.
                    """
                    
                    response = groq_client.chat.completions.create(
                        model="llama-3.1-8b-instant",
                        messages=[{"role": "user", "content": prompt}]
                    )
                    
                    email_content = response.choices[0].message.content.strip()
                    
                    # Create email message
                    msg = MIMEText(email_content, "plain")
                    msg["Subject"] = request.email_subject or f"Special Offer from {request.company_name}!"
                    msg["From"] = f"{sender_name} <{sender_email}>"
                    msg["To"] = recipient.email
                    
                    # Send email
                    server.send_message(msg)
                    
                    # Track successful delivery
                    delivery_results.append(EmailDeliveryStatus(
                        recipient_name=recipient.name,
                        recipient_email=recipient.email,
                        status="sent",
                        error_message=None,
                        email_content=email_content
                    ))
                    
                    successful_sends += 1
                    print(f"✅ Sent email to {recipient.name} ({recipient.email})")
                    
                except Exception as e:
                    # Track failed delivery
                    delivery_results.append(EmailDeliveryStatus(
                        recipient_name=recipient.name,
                        recipient_email=recipient.email,
                        status="failed",
                        error_message=str(e),
                        email_content=None
                    ))
                    
                    failed_sends += 1
                    print(f"❌ Failed to send email to {recipient.name} ({recipient.email}): {e}")
                    continue
    
    except Exception as e:
        raise Exception(f"SMTP connection error: {str(e)}")
    
    # Determine execution status
    if successful_sends == len(request.recipients):
        execution_status = "success"
    elif successful_sends > 0:
        execution_status = "partial_success"
    else:
        execution_status = "failed"
    
    # Create campaign summary
    campaign_summary = {
        "company_name": request.company_name,
        "campaign_description": request.campaign_description,
        "total_recipients": len(request.recipients),
        "successful_sends": successful_sends,
        "failed_sends": failed_sends,
        "success_rate": round((successful_sends / len(request.recipients)) * 100, 2) if request.recipients else 0,
        "sender_name": sender_name,
        "sender_email": sender_email
    }
    
    # Create response
    response = EmailCampaignResponse(
        campaign_summary=campaign_summary,
        delivery_results=delivery_results,
        execution_status=execution_status,
        timestamp=datetime.now()
    )
    
    print(f"✅ Email campaign completed: {successful_sends}/{len(request.recipients)} emails sent successfully")
    return response

def send_single_email(
    company_name: str,
    campaign_description: str,
    recipient_name: str,
    recipient_email: str,
    personal_description: str,
    sender_name: Optional[str] = None,
    email_subject: Optional[str] = None
) -> EmailDeliveryStatus:
    """
    Send a single personalized email
    
    Convenience function for sending a single email without creating a full campaign request.
    
    Args:
        company_name (str): Company name
        campaign_description (str): Campaign description
        recipient_name (str): Recipient name
        recipient_email (str): Recipient email
        personal_description (str): Recipient's personal interests
        sender_name (Optional[str]): Sender name
        email_subject (Optional[str]): Email subject
    
    Returns:
        EmailDeliveryStatus: Delivery status for the single email
    """
    # Create single recipient
    recipient = EmailRecipient(
        name=recipient_name,
        email=recipient_email,
        personal_description=personal_description
    )
    
    # Create campaign request
    request = EmailCampaignRequest(
        company_name=company_name,
        campaign_description=campaign_description,
        recipients=[recipient],
        sender_name=sender_name,
        email_subject=email_subject
    )
    
    # Send campaign
    response = send_email_campaign(request)
    
    # Return the single delivery result
    return response.delivery_results[0] if response.delivery_results else None

# Example usage
if __name__ == "__main__":
    # Example campaign request
    example_request = EmailCampaignRequest(
        company_name="AIgenius Labs",
        campaign_description="We are launching an AI productivity suite that helps professionals automate 60% of their daily tasks.",
        recipients=[
            EmailRecipient(
                name="Test User",
                email="test@example.com",
                personal_description="interested in AI and productivity tools"
            )
        ],
        sender_name="AIgenius Labs Team",
        email_subject="Revolutionary AI Productivity Suite - Exclusive Launch Offer!"
    )
    
    try:
        result = send_email_campaign(example_request)
        print(f"Campaign Status: {result.execution_status}")
        print(f"Success Rate: {result.campaign_summary['success_rate']}%")
    except Exception as e:
        print(f"Error: {e}")
