# server/core/email.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

# Optional: Load environment variables from a .env file (for development)
from dotenv import load_dotenv
load_dotenv()

# Configure logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Email configuration with Gmail defaults
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "yourgmail@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "your_app_password")
FROM_EMAIL = os.environ.get("FROM_EMAIL", SMTP_USERNAME)

def send_email(recipient_email, subject, body, is_html=False):
    """
    Send an email to the specified recipient.

    Args:
        recipient_email (str): The recipient's email address
        subject (str): The email subject
        body (str): The email body content
        is_html (bool): Whether the body content is HTML

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = subject

        # Attach body with appropriate content type
        content_type = "html" if is_html else "plain"
        msg.attach(MIMEText(body, content_type))

        logger.debug(f"Connecting to SMTP server: {SMTP_SERVER}:{SMTP_PORT}")

        # Connect to SMTP server and send message
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Secure the connection
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email sent successfully to {recipient_email}")
        logger.debug(f"SMTP_USERNAME: {SMTP_USERNAME}")
        logger.debug(f"SMTP_SERVER: {SMTP_SERVER}, PORT: {SMTP_PORT}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False
