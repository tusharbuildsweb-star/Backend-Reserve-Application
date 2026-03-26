# RESERVE - Premium Restaurant Reservation Platform (Backend)

The backend power behind the RESERVE platform, providing a robust, secure, and real-time infrastructure for restaurant reservations, user reviews, and administrative management.

## 🚀 Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Security**: JWT Authentication, Bcrypt.js, Helmet, Express Rate Limit
- **Payments**: Razorpay Integration
- **Mailing**: SendGrid
- **File Handling**: Multer

## 🛠️ Core Features & Implementation

Based on core project requirements:

### 1. Reservation Management
- **Booking Engine**: Sophisticated logic for selecting date, time, and party size.
- **Real-Time Availability**: Capacity management system that updates in real-time to prevent overbooking.
- **Workflow**: Automated transition from Request -> Owner Approval -> User Payment -> Confirmation.
- **User Control**: Endpoints to view, modify, and cancel reservations with automated capacity release.

### 2. User Reviews
- **Feedback System**: Endpoints for leaving reviews with text comments, star ratings, and photo uploads.
- **Moderation**: Functionality for users to edit or delete their own reviews.
- **Owner Interaction**: Mechanism for restaurant owners to respond to customer feedback.

### 3. Search & Discovery
- **Advanced Querying**: Search functionality based on cuisine, price range, and location.
- **Deep Filtering**: Backend filtering logic for dietary restrictions, ambiance, and special features (outdoor seating, etc.).

### 4. Recommendation Engine
- **Personalized Logic**: A recommendation system that suggests restaurants based on:
  - User's search history.
  - Past dining experiences (completed reservations).
  - High-rated reviews given by the user.

### 5. Administrative Infrastructure
- **Global Management**: Unified API for managing restaurant listings, user profiles, and global reservation logs.
- **Owner Dashboard Support**: Specialized services for owners to manage their profiles, menus, and booking slots.

## 🏗️ Project Structure

```text
backend/
├── src/
│   ├── controllers/   # Request handling logic
│   ├── models/        # Database schemas (User, Restaurant, Reservation, etc.)
│   ├── routes/        # API endpoint definitions
│   ├── services/      # Core business logic & integrations
│   ├── middleware/    # Auth, validation, and security layers
│   └── utils/         # Helper functions
├── scripts/           # Migration and setup tools
├── uploads/           # Local storage for images
└── server.js          # Entry point
```

## 🚦 Getting Started

1.  **Environment Setup**:
    Create a `.env` file in the backend root with the following:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_uri
    JWT_SECRET=your_secret
    RAZORPAY_KEY_ID=your_key
    RAZORPAY_KEY_SECRET=your_secret
    SENDGRID_API_KEY=your_key
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Create Admin (Optional)**:
    ```bash
    npm run create-admin
    ```

## 🔑 Test Credentials

| Account Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `root@admin.com` | `Password@123` |
| **Owner** | `thiru3210@gmail.com` | `Password@123` |
| **User** | `testuser@test.com` | `Password@123` |
