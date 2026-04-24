# MediHub

A modern healthcare management platform for hospitals, clinics, and healthcare providers. MediHub streamlines appointment scheduling, medical records, pharmacy inventory, user management, and analytics in a single web application.

## Screenshots

<div align="center">
  <img src=".\assists\home.png" alt="MediHub Home Page" width="800"/>
  <br/><br/>
  <img src=".\assists\Dashboard.png" alt="Doctor Dashboard" width="800"/>
</div>

## Features
- **Role-based Dashboards:** Admin, Doctor, Patient, Pharmacy Staff
- **Appointment Booking & Management**
- **Medical Records Access & Update**
- **Pharmacy Inventory Tracking & Alerts**
- **AI-powered Analytics (Anomaly Detection, Demand Prediction, Recommendations)**
- **User Management (View, Delete, Reactivate Users)**
- **Secure Authentication & Authorization**

## Technology Stack
- **Frontend:** React.js, Vite, Material-UI
- **Backend:** Java (Spring Boot), REST API
- **Database:** MySQL or PostgreSQL (via Spring Data JPA)
- **AI/ML:** Custom Java modules
- **Authentication:** JWT, Spring Security

## Project Structure
```
medihub-project/
├── backend/    # Spring Boot backend
├── frontend/   # React frontend
└── README.md
```

## Getting Started
### Prerequisites
- Node.js & pnpm (for frontend)
- Java 17+ & Maven (for backend)
- MySQL/PostgreSQL (or your preferred DB)

### Backend Setup
1. Navigate to `backend/`
2. Configure `src/main/resources/application.properties` with your DB credentials
3. Run:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the dev server:
   ```bash
   pnpm dev
   ```
4. Open [http://localhost:5174](http://localhost:5174) in your browser

## Usage
- Register/login as Admin, Doctor, Patient
- Admin can manage users, appointments, inventory, and view analytics
- Doctors manage appointments and medical records
- Patients book appointments and view records
- Pharmacy staff manage inventory and orders

## AI Features
- **Anomaly Detection:** Identifies suspicious login/activity patterns
- **Demand Prediction:** Forecasts inventory needs
- **Doctor Recommendation:** Suggests suitable doctors for patients

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is for educational/demo purposes. Please check with the project owner for licensing details.

## Contact
For questions or support, contact the project maintainer.


login 

admin

admin@example.com       admin123

