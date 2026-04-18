package com.medihub.controller;

import com.medihub.dto.DoctorDTO;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import com.medihub.model.Doctor;
import com.medihub.model.User;
import com.medihub.repository.DoctorRepository;
import com.medihub.service.CurrentUserService;
import com.medihub.service.DoctorService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/doctors", "/api/doctor", "/doctors", "/doctor"})
@CrossOrigin(origins = "*")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<DoctorDTO>> getAllDoctors(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String search) {
        List<DoctorDTO> doctors = doctorService.getAllDoctors();

        if (specialty != null && !specialty.isBlank()) {
            doctors = doctors.stream()
                .filter(d -> d.getSpecialization() != null && specialty.equalsIgnoreCase(d.getSpecialization()))
                .toList();
        }

        if (search != null && !search.isBlank()) {
            doctors = doctors.stream()
                .filter(d -> d.getName() != null && d.getName().toLowerCase().contains(search.toLowerCase()))
                .toList();
        }

        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/specializations")
    public ResponseEntity<List<String>> getSpecializations() {
        return ResponseEntity.ok(doctorRepository.findAllSpecializations());
    }

    @PostMapping("/{doctorId}/rate")
    public ResponseEntity<?> rateDoctor(
            @PathVariable Long doctorId,
            @RequestBody Map<String, Object> payload) {
        
        if (payload == null || !payload.containsKey("rating")) {
             return ResponseEntity.badRequest().body(Map.of("message", "Rating is required"));
        }

        Optional<Doctor> doctorOpt = doctorRepository.findById(doctorId);
        if (doctorOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Doctor not found"));
        }
        
        Doctor doctor = doctorOpt.get();
        double newRatingVal;
        try {
             newRatingVal = Double.parseDouble(String.valueOf(payload.get("rating")));
        } catch (NumberFormatException e) {
             return ResponseEntity.badRequest().body(Map.of("message", "Invalid rating format"));
        }
        
        if (newRatingVal < 0 || newRatingVal > 5) {
             return ResponseEntity.badRequest().body(Map.of("message", "Rating must be between 0 and 5"));
        }

        BigDecimal currentRating = doctor.getRating() != null ? doctor.getRating() : BigDecimal.ZERO;
        int totalRatings = doctor.getTotalRatings() != null ? doctor.getTotalRatings() : 0;
        int totalReviews = doctor.getTotalReviews() != null ? doctor.getTotalReviews() : 0;
        
        double currentTotal = currentRating.doubleValue() * totalRatings;
        double newTotal = currentTotal + newRatingVal;
        int newTotalRatings = totalRatings + 1;
        
        double average = newTotal / newTotalRatings;
        
        BigDecimal newRating = BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP);
        
        doctor.setRating(newRating);
        doctor.setTotalRatings(newTotalRatings);
        doctor.setTotalReviews(totalReviews + 1);
        
        doctorRepository.save(doctor);
        
        return ResponseEntity.ok(Map.of(
            "message", "Rating submitted successfully",
            "newRating", newRating,
            "totalRatings", newTotalRatings
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyDoctorProfile(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        Optional<Doctor> doctorOpt = doctorRepository.findByUserId(userOpt.get().getId());
        if (doctorOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Doctor profile not found"));
        }

        Doctor doctor = doctorOpt.get();
        return ResponseEntity.ok(Map.of(
            "id", doctor.getId(),
            "specialization", doctor.getSpecialization(),
            "license", doctor.getLicenseNumber() != null ? doctor.getLicenseNumber() : "",
            "name", doctor.getUser() != null ? doctor.getUser().getName() : "",
            "yearsOfExperience", doctor.getYearsOfExperience() != null ? doctor.getYearsOfExperience() : 0,
            "rating", doctor.getRating() != null ? doctor.getRating() : 0.0
        ));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyDoctorProfile(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> payload) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        Optional<Doctor> doctorOpt = doctorRepository.findByUserId(userOpt.get().getId());
        if (doctorOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Doctor profile not found"));
        }

        Doctor doctor = doctorOpt.get();
        if (payload.containsKey("specialization")) {
            String specialization = String.valueOf(payload.get("specialization"));
            if (specialization != null && !specialization.isBlank()) {
                doctor.setSpecialization(specialization.trim());
            }
        }
        if (payload.containsKey("license")) {
            String license = String.valueOf(payload.get("license"));
            if (license != null && !license.isBlank()) {
                doctor.setLicenseNumber(license.trim());
            }
        }

        if (payload.containsKey("yearsOfExperience")) {
            try {
                String expStr = String.valueOf(payload.get("yearsOfExperience"));
                int years = Integer.parseInt(expStr);
                doctor.setYearsOfExperience(years);
            } catch (NumberFormatException e) {
                // Ignore invalid format
            }
        }

        Doctor saved = doctorRepository.save(doctor);

        return ResponseEntity.ok(Map.of(
            "id", saved.getId(),
            "specialization", saved.getSpecialization(),
            "license", saved.getLicenseNumber() != null ? saved.getLicenseNumber() : "",
            "yearsOfExperience", saved.getYearsOfExperience() != null ? saved.getYearsOfExperience() : 0,
            "rating", saved.getRating() != null ? saved.getRating() : 0.0
        ));
    }
}
