package com.medihub.controller;

import com.medihub.model.User;
import com.medihub.model.Role;
import com.medihub.model.Patient;
import com.medihub.model.Doctor;
import com.medihub.ai.AnomalyDetector;
import com.medihub.repository.UserRepository;
import com.medihub.repository.PatientRepository;
import com.medihub.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AnomalyDetector anomalyDetector;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpServletRequest httpRequest) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        String ipAddress = httpRequest != null ? httpRequest.getRemoteAddr() : "";
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : "";
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email and password are required"));
        }

        Optional<User> dbUser = userRepository.findByEmail(email);
        if (dbUser.isEmpty()) {
            anomalyDetector.recordAttempt(email, false, ipAddress, userAgent);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }

        User user = dbUser.get();
        if (!user.isActive()) {
            anomalyDetector.recordAttempt(email, false, ipAddress, userAgent);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Account is inactive"));
        }

        boolean passwordMatches = Objects.equals(user.getPassword(), password)
            || passwordEncoder.matches(password, user.getPassword());

        if (!passwordMatches) {
            anomalyDetector.recordAttempt(email, false, ipAddress, userAgent);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }

        anomalyDetector.recordAttempt(email, true, ipAddress, userAgent);

        // Backward compatibility: upgrade plain-text stored passwords to BCrypt after successful login.
        if (Objects.equals(user.getPassword(), password)) {
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
        }

        Role role = resolveEffectiveRole(user);
        String roleStr = role.name();

        // Create a simple token that encodes the email to persist session
        String token = "mock-token-" + Base64.getEncoder().encodeToString(email.getBytes(StandardCharsets.UTF_8));

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", Map.of(
            "id", user.getId(),
            "name", user.getName(),
            "email", email,
            "role", roleStr
        ));
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> userData) {
        String email = Objects.toString(userData.get("email"), null);
        String password = Objects.toString(userData.get("password"), null);
        String name = Objects.toString(userData.get("name"), null);
        String roleValue = Objects.toString(userData.get("role"), "PATIENT");
        String gender = Objects.toString(userData.get("gender"), null);
        String dateOfBirth = Objects.toString(userData.get("dateOfBirth"), null);

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        }
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name is required"));
        }

        // Validate role value for predictable behavior.
        Role role;
        try {
            role = Role.valueOf(roleValue.toUpperCase());
        } catch (Exception ex) {
            role = Role.PATIENT;
        }

        // `patientData` can be a nested JSON object; keep it optional and safely accepted.
        Object patientData = userData.get("patientData");
        if (patientData != null && !(patientData instanceof Map)) {
            return ResponseEntity.badRequest().body(Map.of("message", "patientData must be an object"));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
        }

        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setActive(true);
        if (gender != null && !gender.isBlank()) {
            user.setGender(gender.trim().toUpperCase());
        }
        if (dateOfBirth != null && !dateOfBirth.isBlank()) {
            try {
                user.setDateOfBirth(LocalDate.parse(dateOfBirth));
            } catch (Exception ignored) {
                // Keep null when invalid date is provided.
            }
        }
        User savedUser = userRepository.save(user);

        if (role == Role.PATIENT) {
            Patient patient = new Patient();
            patient.setUser(savedUser);
            Object patientDataObj = userData.get("patientData");
            if (patientDataObj instanceof Map) {
                Map<?, ?> patientDataMap = (Map<?, ?>) patientDataObj;
                patient.setBloodGroup(Objects.toString(patientDataMap.get("bloodGroup"), null));
                patient.setAllergies(Objects.toString(patientDataMap.get("allergies"), null));
                patient.setMedicalHistory(Objects.toString(patientDataMap.get("medicalHistory"), null));
                patient.setEmergencyContactName(Objects.toString(patientDataMap.get("emergencyContactName"), null));
                patient.setEmergencyContactPhone(Objects.toString(patientDataMap.get("emergencyContactPhone"), null));
                patient.setInsuranceProvider(Objects.toString(patientDataMap.get("insuranceProvider"), null));
                patient.setInsuranceNumber(Objects.toString(patientDataMap.get("insuranceNumber"), null));
            }
            patientRepository.save(patient);
        }

        if (role == Role.DOCTOR) {
            Object doctorDataObj = userData.get("doctorData");
            if (!(doctorDataObj instanceof Map)) {
                return ResponseEntity.badRequest().body(Map.of("message", "doctorData is required for doctor registration"));
            }
            Map<?, ?> doctorDataMap = (Map<?, ?>) doctorDataObj;
            String specialization = Objects.toString(doctorDataMap.get("specialization"), "").trim();
            String licenseNumber = Objects.toString(doctorDataMap.get("licenseNumber"), "").trim();
            if (specialization.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Doctor specialization is required"));
            }
            if (licenseNumber.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Doctor license number is required"));
            }

            Doctor doctor = new Doctor();
            doctor.setUser(savedUser);
            doctor.setSpecialization(specialization);
            doctor.setLicenseNumber(licenseNumber);
            doctorRepository.save(doctor);
        }

        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || !token.startsWith("Bearer mock-token-")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        try {
            String encodedEmail = token.substring("Bearer mock-token-".length());
            String email = new String(Base64.getDecoder().decode(encodedEmail), StandardCharsets.UTF_8);
            Optional<User> dbUser = userRepository.findByEmail(email);
            if (dbUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
            }
            User user = dbUser.get();

            Map<String, Object> me = new HashMap<>();
            me.put("id", user.getId());
            me.put("name", user.getName());
            me.put("email", email);
            me.put("role", resolveEffectiveRole(user).name());
            me.put("gender", user.getGender());
            me.put("dateOfBirth", user.getDateOfBirth());
            return ResponseEntity.ok(me);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
    }

    private Role resolveEffectiveRole(User user) {
        if (user == null) {
            return Role.PATIENT;
        }
        if (user.getRole() == Role.ADMIN) {
            return Role.ADMIN;
        }
        if (doctorRepository.findByUserId(user.getId()).isPresent()) {
            return Role.DOCTOR;
        }
        if (patientRepository.findByUserId(user.getId()).isPresent()) {
            return Role.PATIENT;
        }
        return user.getRole() != null ? user.getRole() : Role.PATIENT;
    }
}
