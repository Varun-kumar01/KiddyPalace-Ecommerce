# E-Commerce Backend

Backend API server for the E-Commerce application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your_jwt_secret_key_here
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /` - Health check
- `POST /api/auth/login` - User login (to be implemented)
- `POST /api/auth/signup` - User registration (to be implemented)

## Future Features

- User authentication with JWT
- Product management
- Order processing
- Payment integration
- Admin dashboard API
