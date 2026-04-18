package com.medihub.ai;

import com.medihub.model.Doctor;

public class DoctorRecommendation {
    private Doctor doctor;
    private double score;
    private String reasoning;
    private double confidence;

    public Doctor getDoctor() {
        return doctor;
    }
    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }
    public double getScore() {
        return score;
    }
    public void setScore(double score) {
        this.score = score;
    }
    public String getReasoning() {
        return reasoning;
    }
    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }
    public double getConfidence() {
        return confidence;
    }
    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }
}
