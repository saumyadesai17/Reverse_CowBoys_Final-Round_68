import os, csv, smtplib
from email.mime.text import MIMEText
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def send_campaign_emails(company_name: str, campaign_description: str, csv_file):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")
    sender_name = os.getenv("SENDER_NAME", company_name)

    if not sender_email or not sender_password:
        raise ValueError("❌ Missing SENDER_EMAIL or SENDER_PASSWORD in environment variables.")

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender_email, sender_password)

        reader = csv.DictReader(csv_file)
        for row in reader:
            name, email, personal_desc = row["Name"], row["Email"], row["Personal Description"]

            prompt = f"""
            You are an expert advertising copywriter for {company_name}.
            Write a personalized, friendly, and persuasive marketing email for a campaign.
            
            Campaign Description:
            {campaign_description}

            Recipient Details:
            Name: {name}
            Interests and Preferences: {personal_desc}

            Guidelines:
            - Keep it under 100 words.
            - Make it conversational and emotionally engaging.
            - Highlight how this offer or campaign benefits the recipient personally.
            - End with a warm closing from {company_name}.
            """

            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}]
            )

            email_text = response.choices[0].message.content.strip()

            msg = MIMEText(email_text, "plain")
            msg["Subject"] = f"Special Offer from {company_name}!"
            msg["From"] = f"{sender_name} <{sender_email}>"
            msg["To"] = email

            server.send_message(msg)
            print(f"✅ Sent email to {name} ({email})")


# Example usage
if __name__ == "__main__":
    with open("sample_marketing.csv", "r", encoding="utf-8") as f:
        send_campaign_emails(
            company_name="AIgenius Labs",
            campaign_description="We’re launching an AI productivity suite that helps professionals automate 60% of their daily tasks.",
            csv_file=f
        )
