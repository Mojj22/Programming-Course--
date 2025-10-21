# Programming Course Website - 3D Enhanced Version

A comprehensive bilingual (Arabic/English) programming course website with 3D effects, animated backgrounds, and complete backend integration.

## 🌟 Features

### 🎨 3D Design & Effects
- **Floating 3D cards** with perspective and rotation animations
- **Animated code background** with floating programming code snippets
- **Glassmorphism effects** with backdrop blur and transparency
- **Gradient backgrounds** with smooth color transitions
- **Hover effects** with 3D transformations
- **Navigation arrows** for easy page navigation

### 🔐 Complete Authentication System
- **User registration** with comprehensive form validation
- **Email/Password login** with JWT authentication
- **Social login integration** (Google & Facebook)
- **Password reset** functionality
- **User session management**
- **Authentication state persistence**

### 📧 Email Integration
- **All notifications** sent to `mmhnoopm@gmail.com`
- **Login notifications** with user details
- **Registration notifications** with complete user data
- **Contact form notifications** with message details
- **Password reset notifications**

### 🎓 Course System
- **Individual course pages** for each programming language
- **YouTube video integration** for lessons
- **Downloadable books and resources**
- **Progress tracking** with localStorage and backend sync
- **Interactive lesson completion**

### 🌐 Bilingual Support
- **Arabic and English** language support
- **RTL/LTR** text direction switching
- **Dynamic language switching** with persistence
- **Localized content** throughout the site

### 🎯 Interactive Features
- **5-second welcome message** for logged-in users
- **Navigation arrows** on all pages
- **Real-time notifications** with smooth animations
- **Form validation** with user-friendly error messages
- **Loading states** with animated spinners

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. **Clone or download** the project files
2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Configure email settings:**
   - Open `backend/server.js`
   - Update the email configuration in the `transporter` section
   - Replace `'your-app-password'` with your platform password

4. **Start the backend server:**
   ```bash
   # Windows
   start-backend.bat
   
   # Or manually
   cd backend
   npm start
   ```

5. **Open the website:**
   - Navigate to the project folder
   - Open `index.html` in your web browser
   - Or serve it through a local server

## 📁 Project Structure

```
├── index.html              # Main homepage
├── about.html              # About page
├── courses.html            # Courses listing page
├── contact.html            # Contact page
├── login.html              # Login page
├── register.html           # Registration page
├── forgot-password.html    # Password reset page
├── style.css               # Main stylesheet with 3D effects
├── script-enhanced.js      # Enhanced JavaScript with backend integration
├── images/                 # Image assets
├── courses/                # Individual course pages
│   ├── html-course.html
│   ├── css-course.html
│   ├── javascript-course.html
│   ├── python-course.html
│   ├── react-course.html
│   ├── android-course.html
│   ├── ios-course.html
│   ├── machine-learning-course.html
│   └── ai-course.html
├── backend/                # Backend server
│   ├── server.js           # Express server with API endpoints
│   ├── package.json        # Backend dependencies
│   └── database.sqlite     # SQLite database (created automatically)
└── start-backend.bat       # Windows startup script
```

## 🔧 Backend API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/social-login` - Social media login
- `POST /api/forgot-password` - Password reset request

### User Management
- `GET /api/profile` - Get user profile (requires authentication)
- `POST /api/logout` - User logout

### Course System
- `POST /api/course-progress` - Save course progress
- `GET /api/course-progress/:courseName` - Get course progress

### Contact
- `POST /api/contact` - Submit contact form

## 🎨 3D Effects Implementation

### CSS Classes
- `.card-3d` - 3D floating card effect
- `.btn-3d` - 3D button with hover effects
- `.section-3d` - 3D section with depth
- `.nav-arrow` - Navigation arrows with 3D effects

### JavaScript Features
- **Animated code background** with floating programming snippets
- **3D hover effects** on cards and buttons
- **Parallax scrolling** for sections
- **Welcome message** with fade-in animation
- **Navigation arrows** for page navigation

## 📧 Email Configuration

The system sends emails to `mmhnoopm@gmail.com` for:
- New user registrations
- User login notifications
- Contact form submissions
- Password reset requests

To configure email sending:
1. Update the `transporter` configuration in `backend/server.js`
2. Replace the email credentials with your own
3. For Gmail, use an App Password instead of your regular password

## 🌐 Language Support

### Arabic (Default)
- RTL text direction
- Arabic content and labels
- Right-to-left navigation

### English
- LTR text direction
- English content and labels
- Left-to-right navigation

Language preference is saved in localStorage and persists across sessions.

## 🔒 Security Features

- **Password hashing** with bcrypt
- **JWT token authentication**
- **Session management**
- **Input validation**
- **SQL injection prevention**
- **CORS configuration**

## 📱 Responsive Design

The website is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🎯 User Experience Features

- **Welcome message** appears for 5 seconds for logged-in users
- **Navigation arrows** help users navigate between pages
- **Progress tracking** shows course completion status
- **Real-time notifications** provide feedback
- **Smooth animations** enhance user experience
- **Loading states** improve perceived performance

## 🔧 Customization

### Adding New Courses
1. Create a new HTML file in the `courses/` directory
2. Follow the existing course page structure
3. Add the course to `courses.html`
4. Update navigation links

### Modifying 3D Effects
1. Edit CSS classes in `style.css`
2. Adjust animation parameters
3. Modify JavaScript effects in `script-enhanced.js`

### Changing Email Recipient
1. Update the email address in `backend/server.js`
2. Modify the `sendEmail` function calls

## 🐛 Troubleshooting

### Backend Issues
- Ensure Node.js is installed
- Check if port 3000 is available
- Verify email configuration
- Check console for error messages

### Frontend Issues
- Clear browser cache
- Check browser console for JavaScript errors
- Ensure all files are in the correct directories
- Verify file paths in HTML files

## 📄 License

This project is created for educational purposes. Feel free to use and modify as needed.

## 🤝 Support

For support or questions, please contact the development team.

---

**Enjoy learning programming with our 3D enhanced course website! 🚀**
