package com.medihub.ai;

import com.medihub.model.Doctor;
import com.medihub.model.Patient;
import com.medihub.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DoctorRecommender {

    private static final Map<String, Set<String>> SYMPTOM_TO_SPECIALIZATION = Map.of(
        "cardiology", Set.of("chest pain", "heart", "palpitation", "bp", "hypertension"),
        "neurology", Set.of("headache", "seizure", "migraine", "dizziness", "stroke"),
        "dermatology", Set.of("rash", "skin", "itching", "acne", "allergy"),
        "pediatrics", Set.of("child", "baby", "infant", "pediatric"),
        "orthopedics", Set.of("joint pain", "fracture", "bone", "back pain", "knee"),
        "ent", Set.of("ear", "nose", "throat", "sinus"),
        "psychiatry", Set.of("anxiety", "depression", "stress", "insomnia"),
        "general medicine", Set.of("fever", "cough", "cold", "fatigue", "pain")
    );

    @Autowired
    private DoctorRepository doctorRepository;

    public List<DoctorRecommendation> recommendDoctors(
            String symptoms, 
            Patient patient, 
            Map<String, Object> preferences) {

        String normalizedSymptoms = symptoms == null ? "" : symptoms.toLowerCase(Locale.ROOT);
        String preferredSpecialization = preferences == null ? null : asText(preferences.get("specialization"));

        List<Doctor> availableDoctors = doctorRepository.findByIsAvailable(true);

        return availableDoctors.stream()
            .map(doctor -> buildRecommendation(doctor, normalizedSymptoms, preferredSpecialization))
            .sorted(Comparator.comparingDouble(DoctorRecommendation::getScore).reversed())
            .limit(5)
            .collect(Collectors.toList());
    }

    private DoctorRecommendation buildRecommendation(Doctor doctor, String symptoms, String preferredSpecialization) {
        String specialization = doctor.getSpecialization() == null
            ? "General Medicine"
            : doctor.getSpecialization();
        String specNorm = specialization.toLowerCase(Locale.ROOT);
        double score = 0.2;
        String reasoning = "Available specialist";

        if (preferredSpecialization != null && !preferredSpecialization.isBlank()) {
            if (specNorm.contains(preferredSpecialization.toLowerCase(Locale.ROOT))) {
                score += 0.4;
                reasoning = "Matches selected specialization";
            }
        }

        for (Map.Entry<String, Set<String>> entry : SYMPTOM_TO_SPECIALIZATION.entrySet()) {
            String mappedSpec = entry.getKey();
            for (String keyword : entry.getValue()) {
                if (symptoms.contains(keyword) && specNorm.contains(mappedSpec)) {
                    score += 0.5;
                    reasoning = "Matched symptoms to specialization";
                    break;
                }
            }
        }

        double ratingBoost = doctor.getRating() != null ? Math.min(0.2, doctor.getRating().doubleValue() / 25.0) : 0;
        score += ratingBoost;
        score = Math.min(1.0, score);

        DoctorRecommendation recommendation = new DoctorRecommendation();
        recommendation.setDoctor(doctor);
        recommendation.setScore(score);
        recommendation.setConfidence(Math.min(1.0, score + 0.1));
        recommendation.setReasoning(reasoning);
        return recommendation;
    }

    private String asText(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
