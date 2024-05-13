# News Aggregator

This is a Node.js project that implements a RESTful API for a news aggregator application. The API allows users to register, log in, manage their news preferences, and fetch news articles based on their preferences.

## Features

- User registration and login with bcrypt for password hashing and JWT for token-based authentication.
- In-memory data store to store user information and news preferences.

- RESTful API endpoints for user registration, login, managing news preferences, and fetching news articles.
- Integration with external news APIs to fetch news articles from multiple sources.
- Async/await and Promises for handling asynchronous operations, such as fetching news data and filtering based on user preferences.
- Input validation for user registration and news preference updates.
- Error handling for invalid requests, authentication errors, and authorization errors.
- Caching mechanism to store news articles and reduce the number of calls to external news APIs.
- Mark articles as "read" or "favorite".
- Retrieve read and favorite news articles.
- Search for news articles based on keywords.
- Periodic background updates for cached news articles.

## Security

This project utilizes the Zod library for input validation and sanitization to improve security by preventing malicious or unexpected input from reaching the application's business logic. Zod schemas are defined to enforce strict validation rules for user input, such as email format, password complexity, and news preference categories. Any invalid or malformed input is rejected, and detailed error messages are provided for easier debugging.

By incorporating Zod, this project aims to mitigate security vulnerabilities like SQL injection, cross-site scripting (XSS), and other forms of malicious input.

## Prerequisites

- NPM (Node Package Manager)

## Installation

1. Clone the repository:

2. Navigate to the project directory:

3. Install dependencies:

## Usage

1. Start the server:

2. Use a tool like Postman or cURL to interact with the API endpoints.

## API Endpoints

### User Registration and Login

- `POST /register`: Register a new user.
- `POST /login`: Log in a user.

### News Preferences

- `GET /preferences`: Retrieve the news preferences for the logged-in user.
- `PUT /preferences`: Update the news preferences for the logged-in user.

### News Articles

- `GET /news`: Fetch news articles based on the logged-in user's preferences.
- `POST /news/:id/read`: Mark a news article as read.
- `POST /news/:id/favorite`: Mark a news article as a favorite.
- `GET /news/read`: Retrieve all read news articles.
- `GET /news/favorites`: Retrieve all favorite news articles.
- `GET /news/search/:keyword`: Search for news articles based on keywords.

