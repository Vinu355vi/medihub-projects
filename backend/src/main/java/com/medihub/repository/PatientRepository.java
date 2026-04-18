// backend/src/main/java/com/medihub/repository/PatientRepository.java
package com.medihub.repository;

import com.medihub.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    
    Optional<Patient> findByUserId(Long userId);
    
    List<Patient> findByBloodGroup(String bloodGroup);
    
    @Query("SELECT p FROM Patient p WHERE p.user.active = true")
    List<Patient> findActivePatients();
    
    @Query("SELECT COUNT(p) FROM Patient p WHERE p.user.createdAt >= :startDate AND p.user.createdAt <= :endDate")
    Long countNewPatients(@Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);
    
    @Query("SELECT p FROM Patient p WHERE LOWER(p.user.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.emergencyContactPhone) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Patient> searchPatients(@Param("keyword") String keyword);
    
    @Query("SELECT p.bloodGroup, COUNT(p) FROM Patient p GROUP BY p.bloodGroup")
    List<Object[]> countPatientsByBloodGroup();
}




