from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from functools import wraps
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///programming_course.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    country = db.Column(db.String(50))
    experience = db.Column(db.String(20), default='beginner')
    password_hash = db.Column(db.String(255), nullable=False)
    newsletter = db.Column(db.Boolean, default=False)
    email_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(500), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class CourseProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_name = db.Column(db.String(100), nullable=False)
    lesson_number = db.Column(db.Integer, nullable=False)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'course_name', 'lesson_number'),)

class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    newsletter = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# JWT Token Management
def generate_token(user_id, email):
    payload = {
        'user_id': user_id,
        'email': email,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Token format invalid'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        current_user = User.query.filter_by(id=payload['user_id']).first()
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Email Functions
def send_email(to_email, subject, message):
    try:
        # Email configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "mmhnoopm@gmail.com"
        sender_password = "your-app-password"  # Use app password
        
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(message, 'html', 'utf-8'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, to_email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False

def send_welcome_email(email, first_name):
    subject = "مرحباً بك في دورة البرمجة!"
    message = f"""
    <h2>مرحباً {first_name}!</h2>
    <p>شكراً لانضمامك إلى دورة البرمجة!</p>
    <p>تم إنشاء حسابك بنجاح. يمكنك الآن الوصول إلى جميع الكورسات والموارد.</p>
    <p>مع تحيات فريق دورة البرمجة</p>
    """
    send_email(email, subject, message)

def send_admin_notification(notification_type, data):
    admin_email = "mmhnoopm@gmail.com"
    
    if notification_type == 'registration':
        subject = "مستخدم جديد - دورة البرمجة"
        message = f"""
        <h2>مستخدم جديد انضم إلى الموقع</h2>
        <p><strong>الاسم:</strong> {data['firstName']} {data['lastName']}</p>
        <p><strong>البريد الإلكتروني:</strong> {data['email']}</p>
        <p><strong>الهاتف:</strong> {data.get('phone', 'غير محدد')}</p>
        <p><strong>البلد:</strong> {data['country']}</p>
        <p><strong>مستوى الخبرة:</strong> {data['experience']}</p>
        <p><strong>الاشتراك في النشرة:</strong> {'نعم' if data.get('newsletter') else 'لا'}</p>
        """
    elif notification_type == 'login':
        subject = "تسجيل دخول - دورة البرمجة"
        message = f"""
        <h2>تسجيل دخول جديد</h2>
        <p><strong>المستخدم:</strong> {data['firstName']} {data['lastName']}</p>
        <p><strong>البريد الإلكتروني:</strong> {data['email']}</p>
        <p><strong>وقت تسجيل الدخول:</strong> {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        """
    elif notification_type == 'contact':
        subject = "رسالة جديدة - نموذج الاتصال"
        message = f"""
        <h2>رسالة جديدة من نموذج الاتصال</h2>
        <p><strong>الاسم:</strong> {data['firstName']} {data['lastName']}</p>
        <p><strong>البريد الإلكتروني:</strong> {data['email']}</p>
        <p><strong>الهاتف:</strong> {data.get('phone', 'غير محدد')}</p>
        <p><strong>الموضوع:</strong> {data['subject']}</p>
        <p><strong>الرسالة:</strong></p>
        <p>{data['message']}</p>
        <p><strong>الاشتراك في النشرة:</strong> {'نعم' if data.get('newsletter') else 'لا'}</p>
        """
    
    send_email(admin_email, subject, message)

# API Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['firstName', 'lastName', 'email', 'password', 'country', 'experience']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate email format
    if '@' not in data['email'] or '.' not in data['email']:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password strength
    if len(data['password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User already exists'}), 400
    
    # Create new user
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        first_name=data['firstName'],
        last_name=data['lastName'],
        email=data['email'],
        phone=data.get('phone', ''),
        country=data['country'],
        experience=data['experience'],
        password_hash=hashed_password,
        newsletter=data.get('newsletter', False)
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        # Send welcome email
        send_welcome_email(data['email'], data['firstName'])
        
        # Send admin notification
        send_admin_notification('registration', data)
        
        return jsonify({
            'success': True,
            'message': 'User created successfully',
            'userId': new_user.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Find user
    user = User.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        # Generate token
        token = generate_token(user.id, user.email)
        
        # Save session
        session = UserSession(
            user_id=user.id,
            token=token,
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=7)
        )
        db.session.add(session)
        db.session.commit()
        
        # Send admin notification
        user_data = {
            'firstName': user.first_name,
            'lastName': user.last_name,
            'email': user.email
        }
        send_admin_notification('login', user_data)
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user.id,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'email': user.email,
                'experience': user.experience
            }
        }), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({
        'success': True,
        'user': {
            'id': current_user.id,
            'firstName': current_user.first_name,
            'lastName': current_user.last_name,
            'email': current_user.email,
            'phone': current_user.phone,
            'country': current_user.country,
            'experience': current_user.experience,
            'newsletter': current_user.newsletter
        }
    })

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['first_name', 'last_name', 'email', 'phone', 'country', 'experience', 'newsletter']
    
    for field in allowed_fields:
        if field in data:
            setattr(current_user, field, data[field])
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Profile updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500

@app.route('/api/logout', methods=['POST'])
@token_required
def logout(current_user):
    # Delete user sessions
    UserSession.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.get_json()
    
    if not data.get('currentPassword') or not data.get('newPassword'):
        return jsonify({'error': 'Current password and new password are required'}), 400
    
    if len(data['newPassword']) < 8:
        return jsonify({'error': 'New password must be at least 8 characters long'}), 400
    
    # Verify current password
    if not check_password_hash(current_user.password_hash, data['currentPassword']):
        return jsonify({'error': 'Invalid current password'}), 400
    
    # Update password
    current_user.password_hash = generate_password_hash(data['newPassword'])
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Password changed successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change password'}), 500

@app.route('/api/delete-account', methods=['DELETE'])
@token_required
def delete_account(current_user):
    try:
        # Delete related data
        UserSession.query.filter_by(user_id=current_user.id).delete()
        CourseProgress.query.filter_by(user_id=current_user.id).delete()
        
        # Delete user
        db.session.delete(current_user)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Account deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete account'}), 500

@app.route('/api/course-progress', methods=['GET'])
@token_required
def get_course_progress(current_user):
    progress_data = db.session.query(
        CourseProgress.course_name,
        db.func.count(CourseProgress.id).label('total_lessons'),
        db.func.sum(db.case([(CourseProgress.completed == True, 1)], else_=0)).label('completed_lessons')
    ).filter_by(user_id=current_user.id).group_by(CourseProgress.course_name).all()
    
    progress = []
    for item in progress_data:
        progress_percentage = (item.completed_lessons / item.total_lessons * 100) if item.total_lessons > 0 else 0
        progress.append({
            'course_name': item.course_name,
            'total_lessons': item.total_lessons,
            'completed_lessons': item.completed_lessons,
            'progress_percentage': round(progress_percentage, 2)
        })
    
    return jsonify({'success': True, 'progress': progress})

@app.route('/api/course-progress', methods=['POST'])
@token_required
def save_course_progress(current_user):
    data = request.get_json()
    
    if not data.get('courseName') or not data.get('lessonNumber'):
        return jsonify({'error': 'Course name and lesson number are required'}), 400
    
    # Save or update progress
    progress = CourseProgress.query.filter_by(
        user_id=current_user.id,
        course_name=data['courseName'],
        lesson_number=data['lessonNumber']
    ).first()
    
    if progress:
        progress.completed = True
        progress.completed_at = datetime.datetime.utcnow()
    else:
        progress = CourseProgress(
            user_id=current_user.id,
            course_name=data['courseName'],
            lesson_number=data['lessonNumber'],
            completed=True,
            completed_at=datetime.datetime.utcnow()
        )
        db.session.add(progress)
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Progress saved successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to save progress'}), 500

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['firstName', 'lastName', 'email', 'subject', 'message']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate email format
    if '@' not in data['email'] or '.' not in data['email']:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Save contact message
    contact_message = ContactMessage(
        first_name=data['firstName'],
        last_name=data['lastName'],
        email=data['email'],
        phone=data.get('phone', ''),
        subject=data['subject'],
        message=data['message'],
        newsletter=data.get('newsletter', False)
    )
    
    try:
        db.session.add(contact_message)
        db.session.commit()
        
        # Send admin notification
        send_admin_notification('contact', data)
        
        return jsonify({'success': True, 'message': 'Message sent successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to send message'}), 500

# Initialize database
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
