# server/core/email.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import datetime
from server.apps.events.models import Event
from server.apps.authentication.models import User


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

def send_event_reminder_emails():
    """
    Send reminder emails to users registered for events that start tomorrow.
    
    This function should be run daily by a scheduler (e.g., cron job or Celery).
    """
    import datetime
    from server.apps.events.models import Event, EventRegistration
    from server.apps.authentication.models import User
    
    # Get tomorrow's date
    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    tomorrow_start = datetime.datetime.combine(tomorrow, datetime.time.min)
    tomorrow_end = datetime.datetime.combine(tomorrow, datetime.time.max)
    
    logger.info(f"Checking for events starting between {tomorrow_start} and {tomorrow_end}")
    
    try:
        # Find all events starting tomorrow
        tomorrow_events = Event.query.filter(
            Event.date_scheduled.between(tomorrow_start, tomorrow_end)
        ).all()
        
        logger.info(f"Found {len(tomorrow_events)} events starting tomorrow")
        
        # For each event, get registered users and send reminder
        for event in tomorrow_events:
            # Get all registrations for this event
            registrations = EventRegistration.query.filter_by(event_id=event.id).all()
            logger.info(f"Event '{event.title}' (ID: {event.id}) has {len(registrations)} registrations")
            
            # Get user emails and send reminders
            for registration in registrations:
                user = User.query.get(registration.user_id)
                if not user or not user.email:
                    logger.warning(f"User {registration.user_id} has no valid email")
                    continue
                
                # Format the reminder email
                subject = f"Reminder: '{event.title}' starts tomorrow!"
                
                # Create HTML email body
                html_body = f"""
                <html>
                <body>
                    <h2>Event Reminder</h2>
                    <p>Hello {user.first_name} {user.last_name},</p>
                    <p>This is a friendly reminder that you're registered for the following event happening tomorrow:</p>
                    <div style="padding: 10px; border-left: 4px solid #3498db; margin: 15px 0;">
                        <h3>{event.title}</h3>
                        <p><strong>Date:</strong> {event.date_scheduled.strftime('%A, %B %d, %Y')}</p>
                        <p><strong>Time:</strong> {event.date_scheduled.strftime('%I:%M %p')}</p>
                        <p><strong>Location:</strong> {event.location}</p>
                    </div>
                    <p>We're looking forward to seeing you there!</p>
                    <p>View event details: <a href="{os.environ.get('SITE_URL', 'https://yourdomain.com')}/events/{event.id}">Click here</a></p>
                    <p>Best regards,<br>The Community Events Team<br>Tribuna</p>
                </body>
                </html>
                """
                
                # Send the email
                success = send_email(user.email, subject, html_body, is_html=True)
                
                if success:
                    logger.info(f"Sent reminder email to {user.email} for event {event.id}")
                else:
                    logger.error(f"Failed to send reminder email to {user.email} for event {event.id}")
    
    except Exception as e:
        logger.error(f"Error sending event reminders: {str(e)}")
        # Consider sending an admin notification for critical failures