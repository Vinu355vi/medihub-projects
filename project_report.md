# MediHub Project Report

## Abstract
MediHub is a comprehensive healthcare management platform designed to streamline hospital operations, enhance patient care, and facilitate efficient communication between doctors, patients, and administrators. The system integrates appointment scheduling, medical records management, pharmacy inventory, AI-powered analytics, and user management into a unified web application. MediHub leverages modern web technologies and machine learning to provide actionable insights and automate routine tasks, improving both operational efficiency and patient outcomes.

## Technology Stack
- **Frontend:** React.js, Vite, Material-UI (MUI), JavaScript, CSS
- **Backend:** Java (Spring Boot), RESTful APIs
- **Database:** (Assumed) MySQL or PostgreSQL (via Spring Data JPA)
- **AI/ML:** Custom Java classes for anomaly detection, demand prediction, and recommendations
- **Build Tools:** Maven (backend), pnpm (frontend)
- **Authentication:** JWT, Spring Security

## How It Works
- **User Roles:** The system supports multiple roles: Admin, Doctor, Patient, and Pharmacy Staff. Each role has access to specific features and dashboards.
- **Authentication:** Users log in via secure authentication. Role-based access controls restrict features according to user type.
- **Appointment Management:** Patients can book appointments with doctors. Doctors can view, manage, and update their schedules.
- **Medical Records:** Doctors and patients can view and update medical records securely.
- **Pharmacy Inventory:** Pharmacy staff manage drug inventory, track low stock, and process orders.
- **AI Analytics:** The backend provides analytics such as anomaly detection in logins, demand prediction for inventory, and doctor recommendations using custom Java AI modules.
- **Admin Dashboard:** Admins oversee all users, appointments, inventory, and system analytics. They can view user details, delete/reactivate users, and monitor system health.

## Architecture
```
+-------------------+      REST API      +-------------------+
|    Frontend       | <----------------> |     Backend       |
|  (React + Vite)   |                    | (Spring Boot)     |
+-------------------+                    +-------------------+
        |                                      |
        v                                      v
+-------------------+                    +-------------------+
|   User Browser    |                    |   Database        |
+-------------------+                    +-------------------+
```
- **Frontend:** SPA built with React, communicates with backend via REST API.
- **Backend:** Spring Boot application exposes REST endpoints, handles business logic, security, and AI modules.
- **Database:** Stores users, appointments, medical records, inventory, etc.
- **AI Modules:** Java classes for analytics, invoked by backend controllers.

## Project Structure
```
medihub-project/
├── backend/
│   ├── src/main/java/com/medihub/
│   │   ├── ai/                # AI/ML modules
│   │   ├── config/            # Configuration (security, data seeding)
│   │   ├── controller/        # REST controllers
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── exception/         # Error handling
│   │   ├── model/             # Entity models
│   │   ├── repository/        # Data access
│   │   ├── scheduler/         # Scheduled tasks
│   │   ├── security/          # Security logic
│   │   ├── service/           # Business logic
│   ├── resources/             # Properties, templates
│   └── test/                  # Unit tests
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React context providers
│   │   ├── layouts/           # Page layouts
│   │   ├── pages/             # Main pages (dashboard, auth, etc.)
│   │   ├── services/          # API service layer
│   │   ├── styles/            # CSS
│   │   ├── tests/             # Frontend tests
│   │   ├── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── index.html             # Entry point
└── README.md
```

## Key Functions
- **User Management:** CRUD operations for users, role-based access, status management (active/inactive).
- **Appointment Scheduling:** Book, view, and manage appointments.
- **Medical Records:** Secure access and update of patient records.
- **Pharmacy Inventory:** Track stock, alert low inventory, manage orders.
- **AI Analytics:** Detect anomalies, predict demand, recommend doctors.
- **Authentication & Security:** JWT-based login, protected routes, role checks.


