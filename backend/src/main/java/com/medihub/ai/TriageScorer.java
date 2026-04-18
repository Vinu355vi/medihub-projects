package com.medihub.ai;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.Locale;
import java.util.Set;

import com.medihub.model.Appointment;

@Component
public class TriageScorer {

    private static final Set<String> CRITICAL_KEYWORDS = Set.of(
        "chest pain", "stroke", "seizure", "unconscious", "bleeding", "heart attack", "difficulty breathing"
    );

    private static final Set<String> URGENT_KEYWORDS = Set.of(
        "high fever", "severe pain", "vomiting", "infection", "fracture", "asthma", "shortness of breath"
    );

    private static final Set<String> MODERATE_KEYWORDS = Set.of(
        "pain", "headache", "dizziness", "cough", "fatigue", "rash", "nausea"
    );

    public int calculateTriageScore(Appointment appointment) {
        String symptoms = appointment != null ? appointment.getSymptoms() : null;
        return calculateScore(symptoms, (Integer) null, null);
    }

    public int calculateScore(String symptoms, String age, String history) {
        Integer parsedAge = null;
        try {
            if (age != null && !age.isBlank()) {
                parsedAge = Integer.parseInt(age.trim());
            }
        } catch (NumberFormatException ignored) {
            parsedAge = null;
        }
        return calculateScore(symptoms, parsedAge, history);
    }

    public int calculateScore(String symptoms, Integer patientAge, String history) {
        String s = symptoms == null ? "" : symptoms.toLowerCase(Locale.ROOT);
        String h = history == null ? "" : history.toLowerCase(Locale.ROOT);

        int score = 1;

        for (String keyword : CRITICAL_KEYWORDS) {
            if (s.contains(keyword)) score += 5;
        }
        for (String keyword : URGENT_KEYWORDS) {
            if (s.contains(keyword)) score += 3;
        }
        for (String keyword : MODERATE_KEYWORDS) {
            if (s.contains(keyword)) score += 1;
        }

        if (patientAge != null) {
            if (patientAge >= 75) score += 3;
            else if (patientAge >= 60) score += 2;
            else if (patientAge <= 10) score += 1;
        }

        if (h.contains("diabetes") || h.contains("hypertension") || h.contains("cardiac")) {
            score += 1;
        }

        return Math.max(1, Math.min(10, score));
    }

    public int calculateScore(Map<String, Object> data) {
        String symptoms = data != null ? String.valueOf(data.getOrDefault("symptoms", "")) : "";
        Integer age = null;
        if (data != null && data.get("patientAge") != null) {
            try {
                age = Integer.parseInt(String.valueOf(data.get("patientAge")));
            } catch (NumberFormatException ignored) {
                age = null;
            }
        }
        String history = data != null ? String.valueOf(data.getOrDefault("history", "")) : "";
        return calculateScore(symptoms, age, history);
    }

    public String determinePriority(int score) {
        if (score >= 9) return "CRITICAL";
        if (score >= 6) return "URGENT";
        if (score >= 4) return "SEMI_URGENT";
        return "ROUTINE";
    }

    public String determineUrgencyLevel(int score) {
        if (score >= 9) return "Critical";
        if (score >= 6) return "Urgent";
        return "Routine";
    }
}
