# SkillSphere – A Skill Exchange & Micro-Learning Platform

## 1. Problem Statement

Many people want to learn new skills but either cannot afford paid courses or prefer peer-to-peer learning. 
There is no structured platform that allows users to exchange skills fairly without monetary transactions.

SkillSphere solves this problem by introducing a credit-based skill exchange platform where users can teach skills and earn credits, which can then be used to learn other skills.

---

## 2. Project Overview

SkillSphere is a full-stack web application that allows users to:

- Create and manage profiles
- List skills they can teach
- Browse and request skills from others
- Schedule sessions
- Earn and spend skill credits
- Rate and review instructors

The system uses a credit-based economy instead of money.

---

## 3. Key Features

### User Management
- User Registration & Login (JWT-based authentication)
- Role-based access (User / Admin)
- Profile management

### Skill Management
- Add, update, delete skills
- Categorize skills (Programming, Music, Fitness, etc.)
- Skill levels (Beginner, Intermediate, Advanced)

### Booking System
- Request a session
- Accept/Reject requests
- Schedule sessions
- Track session status (Pending, Confirmed, Completed, Cancelled)

### Credit System
- Earn credits when teaching
- Spend credits when learning
- Transaction history

### Reviews & Ratings
- Rate instructor after session
- View average rating

### Admin Features
- Manage users
- Remove inappropriate content
- View platform statistics

---

## 4. System Scope

### In Scope
- RESTful API backend
- Authentication & authorization
- Credit transaction logic
- Session booking workflow
- Clean layered architecture

### Out of Scope (for now)
- Video calling integration
- Real-time chat
- Payment gateway integration

---

## 5. Technology Stack (Proposed)

Backend:
- Java Spring Boot / Node.js (Express) / Django (choose one)
- REST APIs
- JWT Authentication
- PostgreSQL / MySQL

Frontend:
- React.js
- Tailwind / CSS

---

## 6. Software Engineering Practices

- Layered architecture (Controller → Service → Repository)
- SOLID Principles
- DTO pattern
- Dependency Injection
- Factory Pattern (User roles creation)
- Strategy Pattern (Credit calculation logic)
- Observer Pattern (Notification system)
- Proper exception handling
- Git version control with regular commits

---

## 7. Future Enhancements

- AI-based skill recommendation system
- Real-time chat
- Leaderboard system
- Gamification badges
