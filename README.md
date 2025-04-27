# Tribuna
![image](https://github.com/user-attachments/assets/1ff5447e-d3b9-46d9-869a-834a88d44a3a)


A web application built with FastAPI for managing university campus events, featuring user authentication, event creation, voting, registration, and forum discussions.

## Overview

Campus Event Hub is a comprehensive platform designed to help students discover, create, and participate in campus events. The application allows users to:
- Create and manage events
- Browse and search events by various criteria
- Register for events
- Vote for favorite events
- Participate in forum discussions
- Manage personal profiles

## Project Structure

```
web_project_ucu/
├── server/                    # Backend code
│   ├── apps/                  # Application modules
│   │   ├── authentication/    # User authentication functionality
│   │   ├── events/            # Event management features
│   │   └── forum/             # Forum discussion module
│   ├── core/                  # Core backend components
│   │   ├── database.py        # Database connection and models
│   │   ├── security.py        # Authentication and security utilities
│   │   └── fill_database.py   # Database seeding utilities
│   └── main.py                # FastAPI application entry point
├── src/                       # Frontend code
│   ├── assets/                # Static assets (images, fonts)
│   ├── js/                    # JavaScript files
│   │   ├── auth.js            # Authentication utilities
│   │   └── ...
│   ├── pages/                 # HTML/Jinja2 templates
│   └── styles/                # CSS files
├── static/                    # Static files served by the application
│   └── uploads/               # User-uploaded content
│       └── events/            # Event images
├── requirements.txt           # Python dependencies
└── README.md                  # Project documentation
```

## Features

### Authentication
- User registration and login
- JWT authentication
- Secure password handling
- User profile management

### Events
- Create and edit events
- Browse events with filtering and sorting options
- Search events by title, description, location, or author
- Event registration
- Event voting system
- Automatic status updates via scheduled tasks

### Forum
- Create discussion posts
- View and participate in discussions

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dark-neonus/web_project_ucu
   cd web_project_ucu
   ```

2. **Create and activate a virtual environment** (optional but recommended):
   ```bash
   python -m venv .venv
   
   # On Windows
   .venv\Scripts\activate
   
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following variables:
   ```env
    SECRET_KEY="your_secret_key_here"
    SMTP_SERVER=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USERNAME=tribuna.events.community@gmail.com
    SMTP_PASSWORD=your_password_here
    FROM_EMAIL=tribuna.events.community@gmail.com
   ```
   
   Make sure to replace the placeholder values with your actual credentials.

## Running the Application

1. **Start the server**:
   ```bash
   uvicorn server.main:app --reload
   ```

2. **Access the application**:
   Open your browser and navigate to:
   - Web Interface: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development Notes

### Database
- The application automatically creates and initializes the database on startup
- SQLite is used as the default database engine
- For first-time setup, example data is populated automatically

### Scheduled Tasks
- The application includes background schedulers for tasks like:
  - Updating event statuses based on dates
  - Background processing of registrations

### Authentication Flow
- The application uses JWT tokens for authentication
- Access tokens expire after a configured time
- Refresh tokens are used to obtain new access tokens without re-login


## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - The web framework used
- [SQLModel](https://sqlmodel.tiangolo.com/) - SQL databases in Python
- [APScheduler](https://apscheduler.readthedocs.io/) - For background tasks scheduling
- University course staff and contributors
