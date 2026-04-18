package com.medihub.controller;

import com.medihub.ai.AnomalyDetector;
import com.medihub.ai.DemandPrediction;
import com.medihub.ai.DemandPredictor;
import com.medihub.ai.DoctorRecommendation;
import com.medihub.ai.DoctorRecommender;
import com.medihub.ai.TriageScorer;
import com.medihub.model.PharmacyProduct;
import com.medihub.model.Role;
import com.medihub.model.Patient;
import com.medihub.repository.PharmacyProductRepository;
import com.medihub.repository.PatientRepository;
import com.medihub.service.CurrentUserService;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.medihub.model.User;

@RestController
@RequestMapping({"/ai", "/api/ai"})
@CrossOrigin(origins = "*")
public class AIController {

    private final TriageScorer triageScorer;
    private final DoctorRecommender doctorRecommender;
    private final DemandPredictor demandPredictor;
    private final AnomalyDetector anomalyDetector;
    private final CurrentUserService currentUserService;
    private final PatientRepository patientRepository;
    private final PharmacyProductRepository pharmacyProductRepository;

    public AIController(
            TriageScorer triageScorer,
            DoctorRecommender doctorRecommender,
            DemandPredictor demandPredictor,
            AnomalyDetector anomalyDetector,
            CurrentUserService currentUserService,
            PatientRepository patientRepository,
            PharmacyProductRepository pharmacyProductRepository) {
        this.triageScorer = triageScorer;
        this.doctorRecommender = doctorRecommender;
        this.demandPredictor = demandPredictor;
        this.anomalyDetector = anomalyDetector;
        this.currentUserService = currentUserService;
        this.patientRepository = patientRepository;
        this.pharmacyProductRepository = pharmacyProductRepository;
    }

    @PostMapping("/triage-score")
    public ResponseEntity<?> calculateTriageScore(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> request) {
        String symptoms = text(request.get("symptoms"));
        if (symptoms.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "symptoms is required"));
        }

        Integer age = parseInteger(request.get("patientAge"));
        String history = text(request.get("history"));

        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isPresent()) {
            Role role = currentUserService.resolveEffectiveRole(userOpt.get());
            if (role == Role.PATIENT) {
                Optional<Patient> patientOpt = patientRepository.findByUserId(userOpt.get().getId());
                if (patientOpt.isPresent()) {
                    List<String> missing = getMissingClinicalFields(userOpt.get(), patientOpt.get());
                    if (!missing.isEmpty()) {
                        return ResponseEntity.badRequest().body(Map.of(
                            "message", "Complete patient profile to access AI tools",
                            "missingFields", missing
                        ));
                    }
                    if (age == null && userOpt.get().getDateOfBirth() != null) {
                        age = (int) ChronoUnit.YEARS.between(userOpt.get().getDateOfBirth(), LocalDate.now());
                    }
                    if (history.isBlank()) {
                        history = text(patientOpt.get().getMedicalHistory());
                    }
                }
            }
        }

        int score = triageScorer.calculateScore(symptoms, age, history);
        String urgency = triageScorer.determineUrgencyLevel(score);
        double priorityWeight = Math.max(0.1, Math.min(1.0, score / 10.0));

        Map<String, Object> result = new HashMap<>();
        result.put("urgencyLevel", urgency);
        result.put("riskScore", score);
        result.put("recommendedAction", urgency.equals("Critical") ? "Immediate emergency care" :
            urgency.equals("Urgent") ? "Consult doctor within 24 hours" : "Routine consultation");
        result.put("estimatedWaitTime", urgency.equals("Critical") ? 0 : urgency.equals("Urgent") ? 15 : 45);
        result.put("priorityWeight", priorityWeight);

        return ResponseEntity.ok(Map.of("success", true, "triageScore", result));
    }

    @PostMapping("/doctor-recommendation")
    public ResponseEntity<?> getDoctorRecommendations(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> request) {
        String symptoms = text(request.get("symptoms"));
        Map<String, Object> preferences = new HashMap<>();
        preferences.put("specialization", text(request.get("specialization")));

        Patient patient = null;
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isPresent()) {
            Role role = currentUserService.resolveEffectiveRole(userOpt.get());
            if (role == Role.PATIENT) {
                Optional<Patient> patientOpt = patientRepository.findByUserId(userOpt.get().getId());
                if (patientOpt.isPresent()) {
                    List<String> missing = getMissingClinicalFields(userOpt.get(), patientOpt.get());
                    if (!missing.isEmpty()) {
                        return ResponseEntity.badRequest().body(Map.of(
                            "message", "Complete patient profile to access AI tools",
                            "missingFields", missing
                        ));
                    }
                    patient = patientOpt.get();
                }
            }
        }

        List<DoctorRecommendation> recommendations = doctorRecommender.recommendDoctors(symptoms, patient, preferences);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (DoctorRecommendation rec : recommendations) {
            if (rec.getDoctor() == null) continue;
            Map<String, Object> doctor = new HashMap<>();
            doctor.put("id", rec.getDoctor().getId());
            doctor.put("name", rec.getDoctor().getUser() != null ? rec.getDoctor().getUser().getName() : "Doctor");
            doctor.put("specialization", rec.getDoctor().getSpecialization());
            doctor.put("rating", rec.getDoctor().getRating());
            doctor.put("isAvailable", rec.getDoctor().getIsAvailable());

            rows.add(Map.of(
                "doctor", doctor,
                "score", rec.getScore(),
                "confidence", rec.getConfidence(),
                "reasoning", rec.getReasoning()
            ));
        }

        return ResponseEntity.ok(Map.of("success", true, "recommendations", rows));
    }

    @GetMapping("/demand-prediction/{productId}")
    public ResponseEntity<?> getDemandPrediction(@PathVariable Long productId) {
        DemandPrediction prediction = demandPredictor.predictDemandForProduct(productId);
        String restockAdvice = prediction.getPredictedDemand() >= 50
            ? "High demand expected. Restock immediately."
            : prediction.getPredictedDemand() >= 20
                ? "Moderate demand expected. Plan restock soon."
                : "Demand stable. No immediate restock required.";

        return ResponseEntity.ok(Map.of(
            "success", true,
            "productId", productId,
            "predictedDemand", prediction.getPredictedDemand(),
            "confidence", prediction.getConfidence(),
            "date", prediction.getDate(),
            "restockAdvice", restockAdvice
        ));
    }

    @GetMapping("/demand-prediction/forecast")
    public ResponseEntity<?> getDemandForecast(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "10") int limit) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Role role = currentUserService.resolveEffectiveRole(userOpt.get());
        if (role != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Only admin can access demand forecast"));
        }

        List<PharmacyProduct> products = pharmacyProductRepository.findByIsActiveTrue();
        List<Map<String, Object>> rows = products.stream()
            .map((product) -> {
                DemandPrediction prediction = demandPredictor.predictDemandForProduct(product.getId());
                int predicted7d = prediction.getPredictedDemand();
                int predicted30d = predicted7d * 4;
                int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                int restockQty = Math.max(0, predicted30d - currentStock);
                String stockoutRisk = currentStock <= (product.getReorderLevel() != null ? product.getReorderLevel() : 10)
                    ? "HIGH"
                    : currentStock < (predicted7d * 2) ? "MEDIUM" : "LOW";

                Map<String, Object> row = new HashMap<>();
                row.put("productId", product.getId());
                row.put("productName", product.getName());
                row.put("currentStock", currentStock);
                row.put("predictedDemand7d", predicted7d);
                row.put("predictedDemand30d", predicted30d);
                row.put("stockoutRisk", stockoutRisk);
                row.put("recommendedRestockQty", restockQty);
                row.put("confidence", prediction.getConfidence());
                row.put(
                    "rationale",
                    stockoutRisk.equals("HIGH")
                        ? "High risk due to low stock and expected demand"
                        : stockoutRisk.equals("MEDIUM")
                            ? "Moderate demand trend indicates planned restock"
                            : "Current stock level is sufficient for near-term demand"
                );
                return row;
            })
            .sorted(Comparator.comparingInt((Map<String, Object> row) -> ((Number) row.get("predictedDemand30d")).intValue()).reversed())
            .limit(Math.max(1, limit))
            .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "forecasts", rows));
    }

    @GetMapping("/anomaly-detection")
    public ResponseEntity<?> getAnomalyDetection() {
        List<Map<String, Object>> anomalies = anomalyDetector.detectSuspiciousLogins();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "count", anomalies.size(),
            "anomalies", anomalies
        ));
    }

    private String text(Object value) {
        if (value == null) return "";
        return String.valueOf(value).trim();
    }

    private Integer parseInteger(Object value) {
        if (value == null) return null;
        try {
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
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
}
