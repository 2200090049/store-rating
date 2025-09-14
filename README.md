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

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer for image handling
- **Email Service**: Nodemailer
- **Validation**: Joi or express-validator
- **Security**: Helmet, bcrypt, rate limiting

### Frontend
- **Template Engine**: EJS or React (depending on approach)
- **Styling**: CSS3, Bootstrap or Tailwind CSS
- **JavaScript**: ES6+
- **Maps Integration**: Google Maps API or OpenStreetMap

### Development Tools
- **Package Manager**: npm
- **Process Manager**: PM2 (production)
- **Code Formatting**: Prettier
- **Linting**: ESLint
- **Testing**: Jest or Mocha

## Installation and Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/store-rating
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

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

## Testing Strategy

- Unit tests for utility functions
- Integration tests for API endpoints
- Authentication and authorization testing
- Database operation testing
- File upload testing
- Error handling testing

## Deployment

### Production Environment
- **Hosting**: Heroku, DigitalOcean, or AWS
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3 or Cloudinary
- **Domain**: Custom domain with SSL certificate
- **Monitoring**: Application monitoring and logging

### Environment Setup
1. Set up production database
2. Configure environment variables
3. Set up file storage service
4. Configure email service
5. Set up domain and SSL
6. Deploy application
7. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact:
- Email: 2200090049@kluniversity.in
- GitHub: [@2200090049](https://github.com/2200090049)

## Version History

- **v1.0.0** - Initial project setup with basic requirements

---

**Note**: This README will be updated as the project develops. Please ensure to keep the `.env` file secure and never commit it to version control.
