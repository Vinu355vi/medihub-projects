package com.medihub.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments",
    indexes = {
        @Index(name = "idx_appointment_date", columnList = "appointment_date"),
        @Index(name = "idx_appointment_status", columnList = "status"),
        @Index(name = "idx_doctor_appointment", columnList = "doctor_id, appointment_date")
    })
public class Appointment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Column(name = "appointment_end_time")
    private LocalTime appointmentEndTime;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String prescription;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "visit_reason")
    private String visitReason;

    @Column(name = "vital_signs", columnDefinition = "JSON")
    private String vitalSigns; // Store as JSON

    @Column(name = "triage_score", precision = 3, scale = 2)
    private BigDecimal triageScore;

    @Column(name = "triage_risk_score_snapshot", precision = 3, scale = 2)
    private BigDecimal triageRiskScoreSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "triage_priority", length = 20)
    private TriagePriority triagePriority;

    @Column(name = "triage_urgency_snapshot")
    private String triageUrgencySnapshot;

    @Column(name = "triage_reasoning_snapshot", columnDefinition = "TEXT")
    private String triageReasoningSnapshot;

    @Column(name = "is_follow_up")
    private Boolean isFollowUp = false;

    @Column(name = "follow_up_to")
    private Long followUpTo;

    @Column(name = "payment_status")
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "payment_amount", precision = 10, scale = 2)
    private BigDecimal paymentAmount;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    @Column(name = "waiting_time_minutes")
    private Integer waitingTimeMinutes;

    @Column(name = "consultation_time_minutes")
    private Integer consultationTimeMinutes;

    @Column(name = "patient_feedback", columnDefinition = "TEXT")
    private String patientFeedback;

    @Column(name = "patient_rating")
    private Integer patientRating;

    @Column(name = "doctor_notes", columnDefinition = "TEXT")
    private String doctorNotes;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(name = "cancelled_by")
    private String cancelledBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (appointmentEndTime == null && appointmentTime != null) {
            appointmentEndTime = appointmentTime.plusMinutes(30); // Default 30 min slot
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum AppointmentStatus {
        SCHEDULED,
        CONFIRMED,
        CHECKED_IN,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        NO_SHOW,
        RESCHEDULED
    }

    public enum TriagePriority {
        CRITICAL,
        URGENT,
        SEMI_URGENT,
        ROUTINE
    }

    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED,
        REFUNDED,
        PARTIALLY_PAID
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    
    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }
    
    public LocalTime getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(LocalTime appointmentTime) { this.appointmentTime = appointmentTime; }
    
    public LocalTime getAppointmentEndTime() { return appointmentEndTime; }
    public void setAppointmentEndTime(LocalTime appointmentEndTime) { this.appointmentEndTime = appointmentEndTime; }
    
    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }
    
    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
    
    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
    
    public String getPrescription() { return prescription; }
    public void setPrescription(String prescription) { this.prescription = prescription; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public String getVisitReason() { return visitReason; }
    public void setVisitReason(String visitReason) { this.visitReason = visitReason; }
    
    public String getVitalSigns() { return vitalSigns; }
    public void setVitalSigns(String vitalSigns) { this.vitalSigns = vitalSigns; }
    
    public BigDecimal getTriageScore() { return triageScore; }
    public void setTriageScore(BigDecimal triageScore) { this.triageScore = triageScore; }

    public BigDecimal getTriageRiskScoreSnapshot() { return triageRiskScoreSnapshot; }
    public void setTriageRiskScoreSnapshot(BigDecimal triageRiskScoreSnapshot) { this.triageRiskScoreSnapshot = triageRiskScoreSnapshot; }
    
    public TriagePriority getTriagePriority() { return triagePriority; }
    public void setTriagePriority(TriagePriority triagePriority) { this.triagePriority = triagePriority; }

    public String getTriageUrgencySnapshot() { return triageUrgencySnapshot; }
    public void setTriageUrgencySnapshot(String triageUrgencySnapshot) { this.triageUrgencySnapshot = triageUrgencySnapshot; }

    public String getTriageReasoningSnapshot() { return triageReasoningSnapshot; }
    public void setTriageReasoningSnapshot(String triageReasoningSnapshot) { this.triageReasoningSnapshot = triageReasoningSnapshot; }
    
    public Boolean getIsFollowUp() { return isFollowUp; }
    public void setIsFollowUp(Boolean isFollowUp) { this.isFollowUp = isFollowUp; }
    
    public Long getFollowUpTo() { return followUpTo; }
    public void setFollowUpTo(Long followUpTo) { this.followUpTo = followUpTo; }
    
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    
    public BigDecimal getPaymentAmount() { return paymentAmount; }
    public void setPaymentAmount(BigDecimal paymentAmount) { this.paymentAmount = paymentAmount; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    
    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }
    
    public LocalDateTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalDateTime checkOutTime) { this.checkOutTime = checkOutTime; }
    
    public Integer getWaitingTimeMinutes() { return waitingTimeMinutes; }
    public void setWaitingTimeMinutes(Integer waitingTimeMinutes) { this.waitingTimeMinutes = waitingTimeMinutes; }
    
    public Integer getConsultationTimeMinutes() { return consultationTimeMinutes; }
    public void setConsultationTimeMinutes(Integer consultationTimeMinutes) { this.consultationTimeMinutes = consultationTimeMinutes; }
    
    public String getPatientFeedback() { return patientFeedback; }
    public void setPatientFeedback(String patientFeedback) { this.patientFeedback = patientFeedback; }
    
    public Integer getPatientRating() { return patientRating; }
    public void setPatientRating(Integer patientRating) { this.patientRating = patientRating; }
    
    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }
    
    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
    
    public String getCancelledBy() { return cancelledBy; }
    public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
