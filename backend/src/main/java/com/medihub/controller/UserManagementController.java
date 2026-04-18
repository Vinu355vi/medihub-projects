package com.medihub.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.dao.DataIntegrityViolationException;
import com.medihub.dto.UserManagementDTO;
import com.medihub.model.Role;
import com.medihub.model.User;
import com.medihub.repository.UserRepository;

import com.medihub.repository.PatientRepository;
import com.medihub.model.Patient;
import com.medihub.repository.DoctorRepository;
import com.medihub.model.Doctor;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserManagementController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> payload) {
        if (userRepository.existsByEmail(payload.get("email"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is already in use"));
        }

        User user = new User();
        user.setName(payload.get("name"));
        user.setEmail(payload.get("email"));
        user.setPassword(passwordEncoder.encode(payload.get("password")));
        try {
             user.setRole(Role.valueOf(payload.getOrDefault("role", "PATIENT")));
        } catch (IllegalArgumentException e) {
             user.setRole(Role.PATIENT);
        }
        user.setActive(true);
        
        user = userRepository.save(user);

        if (user.getRole() == Role.PATIENT) {
            Patient patient = new Patient();
            patient.setUser(user);
            patientRepository.save(patient);
        } else if (user.getRole() == Role.DOCTOR) {
            Doctor doctor = new Doctor();
            doctor.setUser(user);
            doctor.setSpecialization("General"); // Default
            doctor.setIsAvailable(true);
            doctor.setLicenseNumber("TEMP-" + user.getId()); 
            doctorRepository.save(doctor);
        }

        return ResponseEntity.ok(Map.of("message", "User created successfully", "userId", user.getId()));
    }

    // Seed admin user for testing
    @PostMapping("/seed")
    public ResponseEntity<?> seedUsers() {
        List<User> users = new ArrayList<>();
        if (!userRepository.existsByEmail("admin@example.com")) {
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@example.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            users.add(userRepository.save(admin));
        }
        return ResponseEntity.ok(Map.of("message", "Seeded admin user", "users", users));
    }

    @GetMapping
    public ResponseEntity<List<UserManagementDTO>> getUsers(@RequestParam(required = false) String role, @RequestParam(required = false) String search) {
        List<User> userList;
        if (role != null) {
            userList = userRepository.findByRole(Role.valueOf(role.toUpperCase()));
        } else if (search != null && !search.isEmpty()) {
            userList = userRepository.searchByKeyword(search);
        } else {
            userList = userRepository.findAll();
        }
        List<UserManagementDTO> users = new ArrayList<>();
        for (User user : userList) {
            UserManagementDTO dto = new UserManagementDTO();
            dto.setId(user.getId());
            dto.setName(user.getName());
            dto.setEmail(user.getEmail());
            dto.setRole(user.getRole());
            dto.setStatus(user.isActive() ? "active" : "inactive");
            users.add(dto);
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        UserManagementDTO dto = new UserManagementDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setStatus(user.isActive() ? "active" : "inactive");
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<User> userOpt = userRepository.findById(id);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        if (body.containsKey("name")) user.setName((String) body.get("name"));
        if (body.containsKey("email")) user.setEmail((String) body.get("email"));
        if (body.containsKey("phone")) user.setPhone((String) body.get("phone"));
        if (body.containsKey("address")) user.setAddress((String) body.get("address"));
        if (body.containsKey("role")) user.setRole(Role.valueOf((String) body.get("role")));
        if (body.containsKey("status")) user.setActive("active".equalsIgnoreCase((String) body.get("status")));
        userRepository.save(user);
        UserManagementDTO dto = new UserManagementDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setStatus(user.isActive() ? "active" : "inactive");
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());
        return ResponseEntity.ok(Map.of("message", "User updated", "user", dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            User user = userOpt.get();
            if (user.isActive()) {
                user.setActive(false);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "User set to inactive"));
            }

            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "User permanently deleted"));
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(409).body(Map.of(
                "error", "Cannot permanently delete user with linked records",
                "details", ex.getMostSpecificCause() != null
                    ? ex.getMostSpecificCause().getMessage()
                    : ex.getMessage()
            ));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to delete user",
                "details", ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName()
            ));
        }
    }

}
