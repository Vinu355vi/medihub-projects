    // backend/src/main/java/com/medihub/dto/AppointmentDTO.java
    package com.medihub.dto;

    import com.medihub.model.Appointment;

    import javax.validation.constraints.NotNull;
    import java.math.BigDecimal;
    import java.time.LocalDate;
    import java.time.LocalDateTime;
    import java.time.LocalTime;

    public class AppointmentDTO {
        
        private Long id;
        
        @NotNull(message = "Patient ID is required")
        private Long patientId;
        
        private String patientName;
        
        @NotNull(message = "Doctor ID is required")
        private Long doctorId;
        
        private String doctorName;
        private String doctorSpecialization;
        
        @NotNull(message = "Appointment date is required")
        private LocalDate appointmentDate;
        
        @NotNull(message = "Appointment time is required")
        private LocalTime appointmentTime;
        
        private Appointment.AppointmentStatus status;
        
        private String symptoms;
        private String diagnosis;
        private String prescription;
        private String notes;
        private String visitReason;
        
        private BigDecimal triageScore;
        private BigDecimal triageRiskScoreSnapshot;
        private Appointment.TriagePriority triagePriority;
        private String triageUrgencySnapshot;
        private String triageReasoningSnapshot;
        
        private Appointment.PaymentStatus paymentStatus;
        private BigDecimal paymentAmount;
        
        private LocalDateTime checkInTime;
        private LocalDateTime checkOutTime;
        private Integer waitingTimeMinutes;
        private Integer consultationTimeMinutes;
        
        private String cancellationReason;
        private String cancelledBy;
        
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }

        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }

        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

        public String getDoctorSpecialization() { return doctorSpecialization; }
        public void setDoctorSpecialization(String doctorSpecialization) { this.doctorSpecialization = doctorSpecialization; }

        public LocalDate getAppointmentDate() { return appointmentDate; }
        public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

        public LocalTime getAppointmentTime() { return appointmentTime; }
        public void setAppointmentTime(LocalTime appointmentTime) { this.appointmentTime = appointmentTime; }

        public Appointment.AppointmentStatus getStatus() { return status; }
        public void setStatus(Appointment.AppointmentStatus status) { this.status = status; }

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

        public BigDecimal getTriageScore() { return triageScore; }
        public void setTriageScore(BigDecimal triageScore) { this.triageScore = triageScore; }

        public BigDecimal getTriageRiskScoreSnapshot() { return triageRiskScoreSnapshot; }
        public void setTriageRiskScoreSnapshot(BigDecimal triageRiskScoreSnapshot) { this.triageRiskScoreSnapshot = triageRiskScoreSnapshot; }

        public Appointment.TriagePriority getTriagePriority() { return triagePriority; }
        public void setTriagePriority(Appointment.TriagePriority triagePriority) { this.triagePriority = triagePriority; }

        public String getTriageUrgencySnapshot() { return triageUrgencySnapshot; }
        public void setTriageUrgencySnapshot(String triageUrgencySnapshot) { this.triageUrgencySnapshot = triageUrgencySnapshot; }

        public String getTriageReasoningSnapshot() { return triageReasoningSnapshot; }
        public void setTriageReasoningSnapshot(String triageReasoningSnapshot) { this.triageReasoningSnapshot = triageReasoningSnapshot; }

        public Appointment.PaymentStatus getPaymentStatus() { return paymentStatus; }
        public void setPaymentStatus(Appointment.PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

        public BigDecimal getPaymentAmount() { return paymentAmount; }
        public void setPaymentAmount(BigDecimal paymentAmount) { this.paymentAmount = paymentAmount; }

        public LocalDateTime getCheckInTime() { return checkInTime; }
        public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }

        public LocalDateTime getCheckOutTime() { return checkOutTime; }
        public void setCheckOutTime(LocalDateTime checkOutTime) { this.checkOutTime = checkOutTime; }

        public Integer getWaitingTimeMinutes() { return waitingTimeMinutes; }
        public void setWaitingTimeMinutes(Integer waitingTimeMinutes) { this.waitingTimeMinutes = waitingTimeMinutes; }

        public Integer getConsultationTimeMinutes() { return consultationTimeMinutes; }
        public void setConsultationTimeMinutes(Integer consultationTimeMinutes) { this.consultationTimeMinutes = consultationTimeMinutes; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

        public String getCancellationReason() { return cancellationReason; }
        public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

        public String getCancelledBy() { return cancelledBy; }
        public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }
    }
