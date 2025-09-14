# Store Rating Application

A comprehensive Node.js application for rating and reviewing stores with user authentication and data management.

## Project Overview

This application allows users to discover, rate, and review local stores. It provides a platform where users can:
- Browse and search for stores
- Leave ratings and detailed reviews
- Manage their profiles and review history
- Store owners can respond to reviews and manage their store information

## Features

### User Management
- User registration and authentication
- Profile management
- Email verification
- Password reset functionality
- Role-based access control (customers, store owners, admins)

### Store Management
- Store registration and verification
- Store profile with details (name, address, category, hours, contact)
- Store image uploads
- Business hours management
- Store search and filtering

### Rating & Review System
- 5-star rating system
- Detailed text reviews
- Review moderation
- Reply system for store owners
- Review voting (helpful/not helpful)
- Spam and abuse reporting

### Additional Features
- Geolocation-based store discovery
- Category-wise store browsing
- Search functionality with filters
- Mobile-responsive design
- Real-time notifications
- Analytics dashboard for store owners




### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/2200090049/store-rating.git
cd store-rating
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (create `.env` file as shown above)

4. Start MongoDB service

5. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

6. Access the application at `http://localhost:3000`

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### User Routes
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/reviews` - Get user's reviews

### Store Routes
- `GET /api/stores` - Get all stores (with pagination and filters)
- `GET /api/stores/:id` - Get specific store details
- `POST /api/stores` - Create new store (store owners only)
- `PUT /api/stores/:id` - Update store details
- `DELETE /api/stores/:id` - Delete store

### Review Routes
- `GET /api/stores/:id/reviews` - Get reviews for a store
- `POST /api/stores/:id/reviews` - Add review to a store
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/reply` - Store owner reply to review

## Database Schema

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (customer, store_owner, admin),
  avatar: String,
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Store Schema
```javascript
{
  name: String,
  description: String,
  category: String,
  address: Object,
  location: GeoJSON,
  phone: String,
  email: String,
  website: String,
  hours: Object,
  images: [String],
  owner: ObjectId (ref: User),
  averageRating: Number,
  totalReviews: Number,
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Review Schema
```javascript
{
  user: ObjectId (ref: User),
  store: ObjectId (ref: Store),
  rating: Number (1-5),
  title: String,
  comment: String,
  images: [String],
  helpfulVotes: Number,
  reply: {
    text: String,
    date: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Security Considerations

- Input validation and sanitization
- SQL/NoSQL injection prevention
- XSS (Cross-Site Scripting) protection
- CSRF (Cross-Site Request Forgery) protection
- Rate limiting for API endpoints
- Secure HTTP headers with Helmet
- Password hashing with bcrypt
- JWT token security and expiration
- File upload restrictions and validation
- Environment variable protection



## Contact

For questions or support, please contact:
- Email: 2200090049@kluniversity.in
- GitHub: [@2200090049](https://github.com/2200090049)


