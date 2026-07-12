# TransitOps-Smart-Transport-Operations-Platform
Odoo Hackathon 2026 submission for TransitOps – Smart Transport Operations Platform. Built to optimize transport operations using the Odoo framework.
# 🚍 TransitOps
### Smart Fleet & Transportation Management Platform

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Frontend-38BDF8?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-blue)

---

# Overview

**TransitOps** is a modern Fleet Management System built to help transportation organizations efficiently manage vehicles, drivers, trips, maintenance, and operational analytics from a single dashboard.

The platform enables fleet managers to monitor vehicle utilization, assign drivers, manage trips, reduce downtime, and improve operational efficiency using real-time insights.

Designed for hackathons while following scalable enterprise architecture.

---

# Problem Statement

Transportation organizations often manage:

- Hundreds of vehicles
- Multiple drivers
- Daily trip assignments
- Maintenance schedules
- Vehicle availability
- Fleet utilization

Traditional spreadsheets and manual tracking result in:

- Poor vehicle utilization
- Delayed maintenance
- Driver management issues
- Trip scheduling conflicts
- Lack of operational visibility

TransitOps provides a centralized digital platform to solve these problems.

---

# Features

## Authentication

- Secure Login
- Protected Routes
- User Session Management

---

## Dashboard

- Fleet KPIs
- Active Vehicles
- Available Vehicles
- Vehicles Under Maintenance
- Active Trips
- Pending Trips
- Driver Overview
- Fleet Utilization
- Dashboard Filters
- Analytics Ready

---

## Vehicle Management

- Create Vehicle
- Edit Vehicle
- Delete Vehicle
- Vehicle Details
- Vehicle Status Tracking
- Odometer Management
- Load Capacity
- Region Management

---

## Driver Management

- Driver Profiles
- License Tracking
- License Expiry Alerts
- Safety Score
- Driver Status
- Driver Regions
- Driver History
- Recent Trips

---

## Trip Management

- Create Trips
- Assign Vehicles
- Assign Drivers
- Track Trip Status
- Origin & Destination
- Pending Trips
- Active Trips
- Completed Trips

---

## Maintenance

- Vehicle Maintenance Records
- Maintenance Status
- Downtime Tracking
- Service Scheduling

---

## Filters

- Vehicle Type
- Vehicle Status
- Region
- Driver Status
- License Category

---

# Tech Stack

## Frontend

- React
- React Router
- Axios
- Tailwind CSS

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Authentication

- JWT
- bcrypt

---

# Folder Structure

```
TransitOps
│
├── client
│   ├── src
│   │   ├── components
│   │   │   ├── common
│   │   │   ├── layout
│   │   │   └── dashboard
│   │   │
│   │   ├── context
│   │   │
│   │   ├── pages
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   │
│   │   │   ├── vehicles
│   │   │   ├── drivers
│   │   │   ├── trips
│   │   │   └── maintenance
│   │   │
│   │   ├── services
│   │   ├── hooks
│   │   ├── utils
│   │   └── App.jsx
│   │
│   └── package.json
│
├── server
│   ├── controllers
│   ├── routes
│   ├── middleware
│   ├── models
│   ├── services
│   ├── config
│   ├── app.js
│   └── server.js
│
└── README.md
```

---

# Setup Instructions

## Clone Repository

```bash
git clone https://github.com/your-username/transitops.git

cd transitops
```

---

# Client Setup

```bash
cd client

npm install

npm run dev
```

Runs on

```
http://localhost:5173
```

---

# Server Setup

```bash
cd server

npm install

npm run dev
```

Runs on

```
http://localhost:5000
```

---

# Database Setup

Install MongoDB locally or use MongoDB Atlas.

Create a database named:

```
transitops
```

---

# Environment Variables

## Client

Create

```
client/.env
```

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Server

Create

```
server/.env
```

```env
PORT=5000

MONGODB_URI=mongodb://localhost:27017/transitops

JWT_SECRET=your_jwt_secret

JWT_EXPIRES_IN=7d
```

---

# Core Business Rules

## Vehicles

- Registration number must be unique.
- Vehicle cannot be assigned if under maintenance.
- Odometer cannot decrease.
- Load capacity cannot be negative.

---

## Drivers

- License number must be unique.
- Expired licenses cannot be assigned to trips.
- Safety score ranges from **0–100**.
- Contact number is mandatory.

---

## Trips

- A driver can only have one active trip at a time.
- A vehicle can only have one active trip at a time.
- Completed trips cannot be edited.
- Pending trips can be reassigned.

---

## Maintenance

- Vehicles under maintenance are unavailable for trips.
- Maintenance completion updates vehicle availability automatically.

---

# Demo Workflow

### 1. Login

↓

### 2. Open Dashboard

↓

### 3. View Fleet KPIs

↓

### 4. Add Vehicle

↓

### 5. Register Driver

↓

### 6. Assign Vehicle + Driver

↓

### 7. Create Trip

↓

### 8. Monitor Dashboard

↓

### 9. Complete Trip

↓

### 10. Schedule Maintenance (if required)

---

# API Modules

## Authentication

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/profile
```

---

## Dashboard

```
GET /api/dashboard
```

---

## Vehicles

```
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
```

---

## Drivers

```
GET    /api/drivers
GET    /api/drivers/:id
POST   /api/drivers
PUT    /api/drivers/:id
DELETE /api/drivers/:id
```

---

## Trips

```
GET    /api/trips
GET    /api/trips/:id
POST   /api/trips
PUT    /api/trips/:id
DELETE /api/trips/:id
```

---

## Maintenance

```
GET    /api/maintenance
POST   /api/maintenance
PUT    /api/maintenance/:id
DELETE /api/maintenance/:id
```

---

# Future Improvements

- Live GPS Vehicle Tracking
- Route Optimization
- Fuel Consumption Analytics
- AI-Based Predictive Maintenance
- Driver Performance Dashboard
- Mobile Application
- Push Notifications
- QR Code Vehicle Inspection
- IoT Integration
- Geofencing
- Automatic Trip Scheduling
- Document Management
- Multi-Organization Support
- Role-Based Access Control (RBAC)
- Export Reports (PDF/Excel)
- Email & SMS Notifications
- Real-Time Analytics
- Interactive Maps
- Dark Mode
- Offline Support

---

# Why TransitOps?

- Clean and modular architecture
- Scalable full-stack MERN application
- Enterprise-inspired dashboard
- Responsive UI with Tailwind CSS
- RESTful API design
- Easy to extend with analytics and real-time tracking
- Demonstrates practical CRUD, authentication, and fleet management workflows

---

# Team

**TransitOps Team**

- Full-Stack Development
- UI/UX Design
- Fleet Management Solution

---

## License

This project is licensed under the **MIT License**.

---

⭐ If you found this project useful, consider giving it a star on GitHub!