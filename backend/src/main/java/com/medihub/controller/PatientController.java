package com.medihub.controller;

import com.medihub.model.Appointment;
import com.medihub.model.Doctor;
import com.medihub.model.Patient;
import com.medihub.model.Role;
import com.medihub.model.User;
import com.medihub.repository.AppointmentRepository;
import com.medihub.repository.DoctorRepository;
import com.medihub.repository.InventoryRepository;
import com.medihub.repository.PatientRepository;
import com.medihub.repository.UserRepository;
import com.medihub.service.CurrentUserService;
import com.medihub.service.PharmacyService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patient")
@CrossOrigin(origins = "*")
public class PatientController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private PharmacyService pharmacyService;

    @Autowired
    private CurrentUserService currentUserService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentPatient(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        User user = userOpt.get();
        Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
        if (patientOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Patient profile not found"));
        }

        Patient patient = patientOpt.get();
        List<String> missingFields = getMissingClinicalFields(user, patient);
        Map<String, Object> response = new HashMap<>();
        response.put("id", patient.getId());
        response.put("userId", user.getId());
        response.put("name", user.getName() != null ? user.getName() : "");
        response.put("email", user.getEmail() != null ? user.getEmail() : "");
        response.put("dateOfBirth", user.getDateOfBirth());
        response.put("gender", user.getGender());
        response.put("bloodGroup", patient.getBloodGroup());
        response.put("height", patient.getHeight());
        response.put("weight", patient.getWeight());
        response.put("allergies", patient.getAllergies());
        response.put("medicalHistory", patient.getMedicalHistory());
        response.put("currentMedications", patient.getCurrentMedications());
        response.put("emergencyContactName", patient.getEmergencyContactName());
        response.put("emergencyContactPhone", patient.getEmergencyContactPhone());
        response.put("aiProfileReady", missingFields.isEmpty());
        response.put("missingFields", missingFields);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentPatient(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> payload) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        User user = userOpt.get();
        Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
        if (patientOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Patient profile not found"));
        }

        Patient patient = patientOpt.get();

        String dateOfBirth = toText(payload.get("dateOfBirth"));
        if (dateOfBirth != null && !dateOfBirth.isBlank()) {
            try {
                user.setDateOfBirth(LocalDate.parse(dateOfBirth));
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid dateOfBirth format"));
            }
        }

        String gender = toText(payload.get("gender"));
        if (gender != null && !gender.isBlank()) {
            user.setGender(gender.toUpperCase());
        }

        String bloodGroup = toText(payload.get("bloodGroup"));
        if (bloodGroup != null) {
            patient.setBloodGroup(bloodGroup);
        }

        BigDecimal height = toDecimal(payload.get("height"));
        if (height != null) {
            patient.setHeight(height);
        }

        BigDecimal weight = toDecimal(payload.get("weight"));
        if (weight != null) {
            patient.setWeight(weight);
        }

        String allergies = toText(payload.get("allergies"));
        if (allergies != null) {
            patient.setAllergies(allergies);
        }

        String medicalHistory = toText(payload.get("medicalHistory"));
        if (medicalHistory != null) {
            patient.setMedicalHistory(medicalHistory);
        }

        String currentMedications = toText(payload.get("currentMedications"));
        if (currentMedications != null) {
            patient.setCurrentMedications(currentMedications);
        }

        String emergencyContactName = toText(payload.get("emergencyContactName"));
        if (emergencyContactName != null) {
            patient.setEmergencyContactName(emergencyContactName);
        }

        String emergencyContactPhone = toText(payload.get("emergencyContactPhone"));
        if (emergencyContactPhone != null) {
            patient.setEmergencyContactPhone(emergencyContactPhone);
        }

        userRepository.save(user);
        patientRepository.save(patient);

        List<String> missingFields = getMissingClinicalFields(user, patient);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "aiProfileReady", missingFields.isEmpty(),
            "missingFields", missingFields
        ));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPatients", userRepository.countByRole(Role.PATIENT));
        stats.put("totalDoctors", userRepository.countByRole(Role.DOCTOR));
        stats.put("totalAppointments", appointmentRepository.count());
        stats.put("totalRevenue", pharmacyService.getTotalSales());
        stats.put("activeUsers", patientRepository.findActivePatients().size());
        stats.put("lowStockItems", inventoryRepository.countLowStockItems());

        // Patient dashboard-specific stats (kept together to satisfy current frontend usage)
        int upcomingAppointments = 0;
        int completedAppointments = 0;

        if (userOpt.isPresent() && currentUserService.resolveEffectiveRole(userOpt.get()) == Role.PATIENT) {
            Optional<Patient> patientOpt = patientRepository.findByUserId(userOpt.get().getId());
            if (patientOpt.isPresent()) {
                List<Appointment> patientAppointments = appointmentRepository.findByPatientId(patientOpt.get().getId());
                LocalDate today = LocalDate.now();
                LocalTime now = LocalTime.now();

                upcomingAppointments = (int) patientAppointments.stream()
                    .filter(a -> a.getStatus() == Appointment.AppointmentStatus.SCHEDULED
                        || a.getStatus() == Appointment.AppointmentStatus.CONFIRMED)
                    .filter(a -> a.getAppointmentDate().isAfter(today)
                        || (a.getAppointmentDate().isEqual(today) && a.getAppointmentTime().isAfter(now)))
                    .count();

                completedAppointments = (int) patientAppointments.stream()
                    .filter(a -> a.getStatus() == Appointment.AppointmentStatus.COMPLETED)
                    .count();
            }
        }

        stats.put("upcomingAppointments", upcomingAppointments);
        stats.put("completedAppointments", completedAppointments);
        stats.put("pendingPrescriptions", 0);
        stats.put("healthScore", 85);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/appointments/recent")
    public ResponseEntity<?> getRecentAppointments(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Appointment> scopedAppointments = resolveAppointmentsForUser(userOpt.get());

        List<Map<String, Object>> recent = scopedAppointments.stream()
            .sorted(Comparator.comparing(Appointment::getAppointmentDate).reversed()
                .thenComparing(Appointment::getAppointmentTime, Comparator.reverseOrder()))
            .limit(5)
            .map(appointment -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", appointment.getId());
                row.put("doctor", Map.of(
                    "name", appointment.getDoctor().getUser().getName()
                ));
                row.put("doctorName", appointment.getDoctor().getUser().getName());
                row.put("specialization", appointment.getDoctor().getSpecialization());
                row.put("date", appointment.getAppointmentDate().toString());
                row.put("time", appointment.getAppointmentTime().toString());
                row.put("status", appointment.getStatus().name());
                return row;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(recent);
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> getUserAppointments(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Appointment> scopedAppointments = resolveAppointmentsForUser(userOpt.get());

        List<Map<String, Object>> appointments = scopedAppointments.stream()
            .sorted(Comparator.comparing(Appointment::getAppointmentDate).reversed()
                .thenComparing(Appointment::getAppointmentTime, Comparator.reverseOrder()))
            .map(appointment -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", appointment.getId());
                row.put("doctorId", appointment.getDoctor().getId());
                row.put("patientId", appointment.getPatient().getId());
                row.put("doctorName", appointment.getDoctor().getUser().getName());
                row.put("patientName", appointment.getPatient().getUser().getName());
                row.put("specialty", appointment.getDoctor().getSpecialization());
                row.put("appointmentDate", LocalDateTime.of(appointment.getAppointmentDate(), appointment.getAppointmentTime()).toString());
                row.put("appointmentTime", LocalDateTime.of(appointment.getAppointmentDate(), appointment.getAppointmentTime()).toString());
                row.put("status", appointment.getStatus().name());
                row.put("type", appointment.getVisitReason() != null ? appointment.getVisitReason() : "Consultation");
                row.put("location", "MediHub Clinic");
                row.put("symptoms", appointment.getSymptoms() != null ? appointment.getSymptoms() : "");
                row.put("triagePriority", appointment.getTriagePriority() != null ? appointment.getTriagePriority().name() : "ROUTINE");
                row.put("diagnosis", appointment.getDiagnosis());
                row.put("prescription", appointment.getPrescription());
                return row;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(appointments);
    }

    private List<Appointment> resolveAppointmentsForUser(User user) {
        Role role = currentUserService.resolveEffectiveRole(user);

        if (role == Role.ADMIN) {
            return appointmentRepository.findAll();
        }

        if (role == Role.DOCTOR) {
            Optional<Doctor> doctorOpt = doctorRepository.findByUserId(user.getId());
            if (doctorOpt.isPresent()) {
                return appointmentRepository.findByDoctorId(doctorOpt.get().getId());
            }
            return new ArrayList<>();
        }

        Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
        if (patientOpt.isPresent()) {
            return appointmentRepository.findByPatientId(patientOpt.get().getId());
        }

        return new ArrayList<>();
    }

    private List<String> getMissingClinicalFields(User user, Patient patient) {
        List<String> missing = new ArrayList<>();
        if (user.getDateOfBirth() == null) missing.add("dateOfBirth");
        if (user.getGender() == null || user.getGender().isBlank()) missing.add("gender");
        if (patient.getBloodGroup() == null || patient.getBloodGroup().isBlank()) missing.add("bloodGroup");
        if (patient.getHeight() == null) missing.add("height");
        if (patient.getWeight() == null) missing.add("weight");
        if (patient.getAllergies() == null || patient.getAllergies().isBlank()) missing.add("allergies");
        if (patient.getMedicalHistory() == null || patient.getMedicalHistory().isBlank()) missing.add("medicalHistory");
        if (patient.getCurrentMedications() == null || patient.getCurrentMedications().isBlank()) missing.add("currentMedications");
        if (patient.getEmergencyContactName() == null || patient.getEmergencyContactName().isBlank()) missing.add("emergencyContactName");
        if (patient.getEmergencyContactPhone() == null || patient.getEmergencyContactPhone().isBlank()) missing.add("emergencyContactPhone");
        return missing;
    }

    private String toText(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }

    private BigDecimal toDecimal(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return new BigDecimal(String.valueOf(value).trim());
        } catch (Exception ignored) {
            return null;
        }
    }
}
