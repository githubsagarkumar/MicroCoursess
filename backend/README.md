# MicroCourses LMS

A comprehensive Learning Management System (LMS) built with React frontend and Express.js backend, featuring email-based role management, advanced course creation, admin approval workflows, and certificate generation.

## 🚀 Features

### Core Functionality
- **Email-based Role System**: Automatic role assignment based on email domains
- **Multi-role System**: Learners, Creators, and Admins with distinct permissions
- **Advanced Course Management**: Create, edit, and manage courses with rich lesson content
- **Lesson Management**: Full CRUD operations for lessons with video URLs and transcripts
- **Admin Approval Workflow**: Comprehensive course review and approval system
- **Progress Tracking**: Real-time progress monitoring for learners
- **Certificate System**: Unique serial hash certificates for course completion
- **Creator Applications**: Application system for becoming a course creator
- **Course Visibility Control**: Only admin-approved courses are visible to learners

### Enhanced Creator Features
- **Interactive Course Dashboard**: Manage courses with visual status indicators
- **Lesson Management Modal**: Add, edit, and delete lessons with rich content
- **Course Status Control**: Draft → Submit for Review → Admin Approval workflow
- **Video Content Support**: Upload video URLs with automatic transcript support
- **Course Analytics**: Track enrollment counts and course performance

### Advanced Admin Features
- **Course Review Panel**: Approve/reject courses with feedback system
- **Creator Application Management**: Review and approve creator applications
- **Dashboard Statistics**: Comprehensive system analytics and metrics
- **Admin Action Logging**: Track all admin decisions with audit trail
- **Bulk Operations**: Efficient management of multiple courses and applications

### Technical Features
- **Rate Limiting**: 60 requests per minute per user
- **Idempotency**: Support for Idempotency-Key headers on POST requests
- **Pagination**: Limit and offset-based pagination for all list endpoints
- **Error Handling**: Uniform error response format with detailed error codes
- **CORS**: Open CORS for development and testing
- **JWT Authentication**: Secure token-based authentication system
- **TypeScript Support**: Full type safety in React frontend

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database
- **JWT** authentication
- **bcryptjs** for password hashing
- **express-rate-limit** for rate limiting
- **express-validator** for input validation

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **CSS3** with modern styling

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Quick Start Commands

1. **Navigate to project directory**
   ```bash
   cd C:\Users\ASUS\OneDrive\Desktop\skillion
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Initialize database with test users**
   ```bash
   node setup.js
   ```

5. **Start backend server (Terminal 1)**
   ```bash
   node server.js
   ```

6. **Start frontend server (Terminal 2)**
   ```bash
   cd client
   npm start
   ```

### Alternative: Using npm scripts
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend  
npm run client
```

### Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Test**: http://localhost:5000/api/courses

## 🔑 Test Credentials

The setup script creates test users for all roles with email-based role assignment:

### Admin User
- **Email**: admin@admin.microcourses.com
- **Password**: admin123
- **Access**: Full admin panel, can approve creators and courses

### Creator User
- **Email**: creator@creator.microcourses.com
- **Password**: creator123
- **Access**: Can create and manage courses with lesson management

### Learner User
- **Email**: learner@learner.microcourses.com
- **Password**: learner123
- **Access**: Can enroll in courses and track progress

### 📧 Email-based Role System
- **@admin.microcourses.com** → Admin role (full system access)
- **@creator.microcourses.com** → Creator role (course creation and management)
- **@learner.microcourses.com** → Learner role (course enrollment and learning)
- **Other emails** → Learner role (default)

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Course Endpoints

#### Get All Published Courses
```http
GET /api/courses?limit=10&offset=0
```

#### Get Course by ID
```http
GET /api/courses/:id
```

#### Create Course (Creator/Admin only)
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Introduction to React",
  "description": "Learn the basics of React development",
  "thumbnail_url": "https://example.com/image.jpg"
}
```

#### Update Course (Creator/Admin only)
```http
PUT /api/courses/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Course Title",
  "description": "Updated description",
  "status": "published"
}
```

### Lesson Endpoints

#### Get Lessons for Course
```http
GET /api/lessons/course/:courseId
```

#### Create Lesson (Creator/Admin only)
```http
POST /api/lessons
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_id": 1,
  "title": "Lesson 1: Introduction",
  "content": "This is the lesson content...",
  "video_url": "https://example.com/video.mp4",
  "transcript": "Auto-generated transcript...",
  "order_index": 1,
  "duration": 30
}
```

### Enrollment Endpoints

#### Enroll in Course
```http
POST /api/enrollments
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_id": 1
}
```

#### Get User's Enrollments
```http
GET /api/enrollments/my-enrollments?limit=10&offset=0
Authorization: Bearer <token>
```

### Progress Endpoints

#### Mark Lesson as Completed
```http
POST /api/progress/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "lesson_id": 1
}
```

#### Get Course Progress
```http
GET /api/progress/course/:courseId
Authorization: Bearer <token>
```

### Certificate Endpoints

#### Generate Certificate
```http
POST /api/certificates/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_id": 1
}
```

#### Get User's Certificates
```http
GET /api/certificates/my-certificates?limit=10&offset=0
Authorization: Bearer <token>
```

#### Verify Certificate
```http
GET /api/certificates/verify/:serialHash
```

### Admin Endpoints

#### Get Creator Applications
```http
GET /api/admin/applications?limit=10&offset=0&status=pending
Authorization: Bearer <token>
```

#### Review Creator Application
```http
PUT /api/admin/applications/:applicationId/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved"
}
```

#### Get Courses for Review
```http
GET /api/admin/courses?limit=10&offset=0&status=draft
Authorization: Bearer <token>
```

#### Review Course
```http
PUT /api/admin/courses/:courseId/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "published"
}
```

## 🔒 Security Features

### Rate Limiting
- **Limit**: 60 requests per minute per user
- **Response**: 429 status with error message when exceeded

### Idempotency
- **Header**: `Idempotency-Key` on POST requests
- **Behavior**: Returns cached response for duplicate requests

### Error Format
All errors follow a consistent format:
```json
{
  "error": {
    "code": "FIELD_REQUIRED",
    "field": "email",
    "message": "Email is required"
  }
}
```

## 📱 Frontend Pages

### Learner Pages
- **/** - Home page with feature overview
- **/courses** - Browse all published courses
- **/courses/:id** - Course detail and enrollment
- **/learn/:lessonId** - Lesson learning interface
- **/progress** - Personal progress tracking

### Creator Pages
- **/creator/apply** - Apply to become a creator
- **/creator/dashboard** - Manage courses and content

### Admin Pages
- **/admin/review/courses** - Review and approve courses
- **/admin/review/applications** - Review creator applications

## 🗄 Database Schema

### Users Table
- `id` (Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `name`
- `role` (learner, creator, admin)
- `creator_status` (pending, approved, rejected)
- `created_at`, `updated_at`

### Courses Table
- `id` (Primary Key)
- `title`
- `description`
- `creator_id` (Foreign Key)
- `status` (draft, published, rejected)
- `thumbnail_url`
- `created_at`, `updated_at`

### Lessons Table
- `id` (Primary Key)
- `course_id` (Foreign Key)
- `title`
- `content`
- `video_url`
- `transcript`
- `order_index` (Unique per course)
- `duration`
- `created_at`, `updated_at`

### Enrollments Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `course_id` (Foreign Key)
- `enrolled_at`
- Unique constraint on (user_id, course_id)

### Progress Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `lesson_id` (Foreign Key)
- `completed_at`
- Unique constraint on (user_id, lesson_id)

### Certificates Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `course_id` (Foreign Key)
- `serial_hash` (Unique)
- `issued_at`

## 🚀 Deployment

### Production Build
```bash
# Build React frontend
npm run build

# Start production server
npm start
```

### Environment Variables
Create a `.env` file in the root directory:
```
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
NODE_ENV=production
```

## 🧪 Testing the System

### Complete User Journey

1. **Email-based Role Registration**
   - Use `@admin.microcourses.com` for admin access
   - Use `@creator.microcourses.com` for creator access
   - Use `@learner.microcourses.com` for learner access
   - Other emails default to learner role

2. **Creator Workflow**
   - Login as creator (`creator@creator.microcourses.com`)
   - Go to `/creator/dashboard`
   - Create new course with title, description, and thumbnail
   - Add lessons with video URLs, content, and transcripts
   - Submit course for admin review

3. **Admin Review Process**
   - Login as admin (`admin@admin.microcourses.com`)
   - Go to `/admin/review/courses`
   - Review submitted courses
   - Approve or reject with feedback
   - Approved courses become visible to learners

4. **Learner Experience**
   - Login as learner (`learner@learner.microcourses.com`)
   - Browse approved courses at `/courses`
   - Enroll in courses
   - Complete lessons and track progress
   - Generate certificates upon completion

### Key Features to Test

- **Email-based Role Assignment**: Register with different email domains
- **Course Creation**: Create courses with multiple lessons
- **Admin Approval**: Review and approve/reject courses
- **Progress Tracking**: Complete lessons and track progress
- **Certificate Generation**: Earn certificates for completed courses
- **Lesson Management**: Add, edit, and delete lessons
- **Course Visibility**: Only approved courses show to learners

## 📝 API Response Examples

### Successful Course Creation
```json
{
  "message": "Course created successfully",
  "course": {
    "id": 1,
    "title": "Introduction to React",
    "description": "Learn React basics",
    "creator_id": 2,
    "thumbnail_url": "https://example.com/image.jpg",
    "status": "draft"
  }
}
```

### Paginated Course List
```json
{
  "items": [
    {
      "id": 1,
      "title": "React Basics",
      "description": "Learn React fundamentals",
      "creator_name": "John Doe",
      "lesson_count": 5,
      "enrollment_count": 25
    }
  ],
  "total": 1,
  "next_offset": null
}
```

### Error Response
```json
{
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many requests, please try again later"
  }
}
```

## 🔧 Troubleshooting

### Common Issues

**Port 5000 is already in use:**
```bash
# Find and kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**React compilation errors:**
```bash
cd client
npm install
npm start
```

**Database issues:**
```bash
# Reset database
del database.sqlite
node setup.js
```

**TypeScript errors:**
- Ensure all imports are correct
- Check for unused variables
- Verify type definitions

### Development Tips

- **Backend**: Runs on port 5000 with auto-restart via nodemon
- **Frontend**: Runs on port 3000 with hot reload
- **Database**: SQLite file created automatically
- **Logs**: Check console for detailed error messages

## 🎯 Project Structure

```
microcourses-lms/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── config/        # Configuration files
├── routes/                # Express.js routes
├── middleware/            # Custom middleware
├── config/               # Database configuration
├── server.js             # Main server file
├── setup.js              # Database initialization
└── package.json          # Dependencies
```

## 🚀 Deployment

### Production Build
```bash
# Build React frontend
cd client
npm run build
cd ..

# Start production server
npm start
```

### Environment Variables
Create a `.env` file in the root directory:
```
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please contact the development team or create an issue in the repository.
