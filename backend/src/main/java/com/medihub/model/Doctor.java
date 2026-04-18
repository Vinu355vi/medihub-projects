package com.medihub.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "doctors")
public class Doctor {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(nullable = false)
    private String specialization;

    @ElementCollection
    @CollectionTable(name = "doctor_specializations", joinColumns = @JoinColumn(name = "doctor_id"))
    @Column(name = "specialization")
    private Set<String> specializations = new HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String qualifications;

    @Column(name = "license_number", unique = true, nullable = false)
    private String licenseNumber;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "consultation_fee", precision = 10, scale = 2)
    private BigDecimal consultationFee = BigDecimal.ZERO;

    @Column(name = "follow_up_fee", precision = 10, scale = 2)
    private BigDecimal followUpFee = BigDecimal.ZERO;

    @Column(name = "available_from")
    private LocalTime availableFrom = LocalTime.of(9, 0);

    @Column(name = "available_to")
    private LocalTime availableTo = LocalTime.of(18, 0);

    @ElementCollection
    @CollectionTable(name = "doctor_availability", joinColumns = @JoinColumn(name = "doctor_id"))
    @Column(name = "available_day")
    private Set<String> availableDays = new HashSet<>();

    @Column(name = "max_patients_per_day")
    private Integer maxPatientsPerDay = 20;

    @Column(name = "slot_duration_minutes")
    private Integer slotDurationMinutes = 30;

    @Column(name = "is_available")
    private Boolean isAvailable = true;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "total_ratings")
    private Integer totalRatings = 0;

    @Column(name = "total_reviews")
    private Integer totalReviews = 0;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "hospital_affiliation")
    private String hospitalAffiliation;

    @Column(name = "clinic_address")
    private String clinicAddress;

    @Column(name = "clinic_phone")
    private String clinicPhone;

    @Column(name = "website_url")
    private String websiteUrl;

    @ElementCollection
    @CollectionTable(name = "doctor_languages", joinColumns = @JoinColumn(name = "doctor_id"))
    @Column(name = "language")
    private Set<String> languages = new HashSet<>();

    @Column(name = "experience_details", columnDefinition = "TEXT")
    private String experienceDetails;

    @Column(name = "awards_and_recognitions", columnDefinition = "TEXT")
    private String awardsAndRecognitions;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Doctor() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    
    public Set<String> getSpecializations() { return specializations; }
    public void setSpecializations(Set<String> specializations) { this.specializations = specializations; }
    
    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }
    
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    
    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }
    
    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }
    
    public BigDecimal getFollowUpFee() { return followUpFee; }
    public void setFollowUpFee(BigDecimal followUpFee) { this.followUpFee = followUpFee; }
    
    public LocalTime getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(LocalTime availableFrom) { this.availableFrom = availableFrom; }
    
    public LocalTime getAvailableTo() { return availableTo; }
    public void setAvailableTo(LocalTime availableTo) { this.availableTo = availableTo; }
    
    public Set<String> getAvailableDays() { return availableDays; }
    public void setAvailableDays(Set<String> availableDays) { this.availableDays = availableDays; }
    
    public Integer getMaxPatientsPerDay() { return maxPatientsPerDay; }
    public void setMaxPatientsPerDay(Integer maxPatientsPerDay) { this.maxPatientsPerDay = maxPatientsPerDay; }
    
    public Integer getSlotDurationMinutes() { return slotDurationMinutes; }
    public void setSlotDurationMinutes(Integer slotDurationMinutes) { this.slotDurationMinutes = slotDurationMinutes; }
    
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    
    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }
    
    public Integer getTotalRatings() { return totalRatings; }
    public void setTotalRatings(Integer totalRatings) { this.totalRatings = totalRatings; }
    
    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }
    
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    
    public String getHospitalAffiliation() { return hospitalAffiliation; }
    public void setHospitalAffiliation(String hospitalAffiliation) { this.hospitalAffiliation = hospitalAffiliation; }
    
    public String getClinicAddress() { return clinicAddress; }
    public void setClinicAddress(String clinicAddress) { this.clinicAddress = clinicAddress; }
    
    public String getClinicPhone() { return clinicPhone; }
    public void setClinicPhone(String clinicPhone) { this.clinicPhone = clinicPhone; }
    
    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
    
    public Set<String> getLanguages() { return languages; }
    public void setLanguages(Set<String> languages) { this.languages = languages; }
    
    public String getExperienceDetails() { return experienceDetails; }
    public void setExperienceDetails(String experienceDetails) { this.experienceDetails = experienceDetails; }
    
    public String getAwardsAndRecognitions() { return awardsAndRecognitions; }
    public void setAwardsAndRecognitions(String awardsAndRecognitions) { this.awardsAndRecognitions = awardsAndRecognitions; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        initializeAvailableDays();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    private void initializeAvailableDays() {
        if (availableDays.isEmpty()) {
            availableDays.addAll(Set.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"));
        }
    }

    public void addRating(Integer newRating) {
        int total = this.totalRatings * this.rating.intValue();
        this.totalRatings++;
        total += newRating;
        this.rating = BigDecimal.valueOf(total / (double) this.totalRatings);
    }
}