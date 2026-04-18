package com.medihub.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patients")
public class Patient {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    private BigDecimal height; // in cm

    private BigDecimal weight; // in kg

    @Column(name = "bmi")
    private BigDecimal bmi;

    private String allergies;

    @Column(name = "medical_history", columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(name = "current_medications", columnDefinition = "TEXT")
    private String currentMedications;

    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone")
    private String emergencyContactPhone;

    @Column(name = "insurance_provider")
    private String insuranceProvider;

    @Column(name = "insurance_number")
    private String insuranceNumber;

    @Column(name = "insurance_valid_until")
    private LocalDate insuranceValidUntil;

    @Column(name = "primary_physician")
    private String primaryPhysician;

    private String occupation;

    private String maritalStatus;

    @Column(name = "is_smoker")
    private Boolean isSmoker = false;

    @Column(name = "is_alcoholic")
    private Boolean isAlcoholic = false;

    @Column(name = "has_drug_allergy")
    private Boolean hasDrugAllergy = false;

    @Column(name = "has_food_allergy")
    private Boolean hasFoodAllergy = false;

    @Column(name = "has_latex_allergy")
    private Boolean hasLatexAllergy = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateBMI();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateBMI();
    }

    private void calculateBMI() {
        if (height != null && height.compareTo(BigDecimal.ZERO) > 0 && 
            weight != null && weight.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightInMeters = height.divide(new BigDecimal("100"), 2, BigDecimal.ROUND_HALF_UP);
            BigDecimal heightSquared = heightInMeters.multiply(heightInMeters);
            this.bmi = weight.divide(heightSquared, 2, BigDecimal.ROUND_HALF_UP);
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
    
    public BigDecimal getHeight() { return height; }
    public void setHeight(BigDecimal height) { this.height = height; }
    
    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }
    
    public BigDecimal getBmi() { return bmi; }
    public void setBmi(BigDecimal bmi) { this.bmi = bmi; }
    
    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }
    
    public String getMedicalHistory() { return medicalHistory; }
    public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }
    
    public String getCurrentMedications() { return currentMedications; }
    public void setCurrentMedications(String currentMedications) { this.currentMedications = currentMedications; }
    
    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
    
    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }
    
    public String getInsuranceProvider() { return insuranceProvider; }
    public void setInsuranceProvider(String insuranceProvider) { this.insuranceProvider = insuranceProvider; }
    
    public String getInsuranceNumber() { return insuranceNumber; }
    public void setInsuranceNumber(String insuranceNumber) { this.insuranceNumber = insuranceNumber; }
    
    public LocalDate getInsuranceValidUntil() { return insuranceValidUntil; }
    public void setInsuranceValidUntil(LocalDate insuranceValidUntil) { this.insuranceValidUntil = insuranceValidUntil; }
    
    public String getPrimaryPhysician() { return primaryPhysician; }
    public void setPrimaryPhysician(String primaryPhysician) { this.primaryPhysician = primaryPhysician; }
    
    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }

    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }
    
    public Boolean getIsSmoker() { return isSmoker; }
    public void setIsSmoker(Boolean isSmoker) { this.isSmoker = isSmoker; }
    
    public Boolean getIsAlcoholic() { return isAlcoholic; }
    public void setIsAlcoholic(Boolean isAlcoholic) { this.isAlcoholic = isAlcoholic; }
    
    public Boolean getHasDrugAllergy() { return hasDrugAllergy; }
    public void setHasDrugAllergy(Boolean hasDrugAllergy) { this.hasDrugAllergy = hasDrugAllergy; }
    
    public Boolean getHasFoodAllergy() { return hasFoodAllergy; }
    public void setHasFoodAllergy(Boolean hasFoodAllergy) { this.hasFoodAllergy = hasFoodAllergy; }
    
    public Boolean getHasLatexAllergy() { return hasLatexAllergy; }
    public void setHasLatexAllergy(Boolean hasLatexAllergy) { this.hasLatexAllergy = hasLatexAllergy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}