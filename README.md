# FastAPI Web Application

This project is a web application built using FastAPI, designed to provide user authentication, event management, and a forum for discussions. The backend is structured into separate applications (or modules) to facilitate collaboration among developers.

## Project Structure

```
fastapi-backend
├── src
│   ├── assets  # Frontend assets (unchanged as per your request)
│   └── ...
├── backend
│   ├── apps
│   │   ├── authentication  # Handles user authentication
│   │   ├── events          # Manages events
│   │   └── forum           # Manages forum posts
│   ├── core                # Core functionalities and configurations
│   ├── main.py             # Entry point of the application
├── requirements.txt        # Project dependencies
└── README.md               # Overall project documentation
```

## Site structure
```
.
└── / (home_page)
    ├── auth
    │   ├── login
    │   └── register
    ├── events (events_list)
    │   ├── create_event
    │   └── view_event
    └── forum (posts_list)
        ├── create_post
        └── view_post
```

## Features

- **User Authentication**: Users can register and log in to the application.
- **Event Management**: Users can create, view, and manage events.
- **Forum**: Users can create and participate in forum discussions.

## Getting Started

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd fastapi-backend
   ```

2. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```
   uvicorn server.main:app --reload
   ```

## API Documentation

The API documentation can be accessed at `http://localhost:8000/docs` once the application is running.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.