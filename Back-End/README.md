# Insight Backend API

A comprehensive Node.js/Express REST API for the Insight academic paper management system with SQL Server database integration, JWT authentication, and Python AI integration.

## Features

- **User Authentication**: JWT-based login/register with password hashing
- **Paper Management**: Full CRUD operations with pagination and search
- **Author Management**: Author profiles and paper associations
- **Research Fields**: Field categorization and paper filtering
- **User Interactions**: Download tracking and paper reviews
- **Statistics**: Comprehensive analytics dashboard
- **AI Integration**: Python-based recommender system and RAG chatbot
- **Error Handling**: Consistent JSON response format across all endpoints

## Project Structure

```
backend/
├── config/
│   └── database.js          # SQL Server connection pool
├── middleware/
│   ├── auth.js              # JWT authentication & authorization
│   └── errorHandler.js      # Global error handling
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── papers.js            # Paper management endpoints
│   ├── authors.js           # Author endpoints
│   ├── fields.js            # Research field endpoints
│   ├── interactions.js       # Downloads & reviews endpoints
│   ├── statistics.js        # Statistics endpoints
│   └── ai.js                # AI integration endpoints
├── server.js                # Express server setup
├── .env                     # Environment variables
└── package.json             # Dependencies
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
DB_SERVER=localhost\SQLEXPRESS
DB_USER=sa
DB_PASSWORD=InsightAdmin1225
DB_NAME=Insight
PORT=5000
JWT_SECRET=your_secret_key
NODE_ENV=development
PYTHON_RECOMMENDER_PATH=../python/recommender.py
PYTHON_CHATBOT_PATH=../python/chatbot.py
```

3. Ensure SQL Server is running and the Insight database exists with the proper schema.

## Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile (requires token)

### Papers
- `GET /api/papers` - List papers with pagination
- `GET /api/papers/:id` - Get paper details
- `GET /api/papers/search/query?q=query` - Search papers

### Authors
- `GET /api/authors` - List authors with pagination
- `GET /api/authors/:id` - Get author profile
- `GET /api/authors/:id/papers` - Get author's papers

### Fields
- `GET /api/fields` - List research fields
- `GET /api/fields/:id` - Get field details with papers

### Interactions
- `POST /api/interactions/downloads` - Record paper download
- `GET /api/interactions/downloads/user/:userId` - Get download history
- `POST /api/interactions/reviews` - Submit paper review
- `GET /api/interactions/reviews/paper/:paperId` - Get paper reviews
- `PUT /api/interactions/reviews/:id` - Update review
- `DELETE /api/interactions/reviews/:id` - Delete review

### Statistics
- `GET /api/statistics/papers` - Paper statistics
- `GET /api/statistics/downloads` - Download statistics
- `GET /api/statistics/reviews` - Review statistics
- `GET /api/statistics/searches` - Search statistics

### AI Integration
- `GET /api/ai/recommendations/:researcherId` - Get personalized recommendations
- `POST /api/ai/assistant/query` - Query AI chatbot about a paper

## Response Format

All API responses follow a consistent JSON format:

```json
{
  "success": true/false,
  "message": "Description of response",
  "data": {} or [] or null
}
```

## Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Database Schema

The backend uses the following main tables:
- `User` - User accounts
- `Researcher` - Researcher profiles
- `Admin` - Admin profiles
- `Paper` - Research papers
- `Author` - Paper authors
- `Author_Paper` - Paper-author relationships
- `Field` - Research fields
- `Download` - Paper downloads
- `Review` - Paper reviews
- `Search` - Search queries

## Python Integration

The backend integrates with Python scripts for:
- **Recommender System**: Provides personalized paper recommendations
- **RAG Chatbot**: Answers questions about paper content

Python scripts are called via `child_process` with proper error handling.

## Error Handling

All errors are caught and returned in the standard JSON format with appropriate HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Development Notes

- Use `authenticateToken` middleware for protected routes
- Use `authorizeAdmin` middleware for admin-only routes
- All database queries use parameterized inputs to prevent SQL injection
- Passwords are hashed using bcryptjs before storage
- JWT tokens expire after 24 hours

## License

MIT
