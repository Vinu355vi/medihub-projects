// backend/src/main/java/com/medihub/repository/DoctorRepository.java
package com.medihub.repository;

import com.medihub.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    
    Optional<Doctor> findByUserId(Long userId);
    
    List<Doctor> findBySpecialization(String specialization);
    
    List<Doctor> findByIsAvailable(Boolean isAvailable);
    
    @Query("SELECT d FROM Doctor d WHERE d.isAvailable = true AND d.rating >= :minRating")
    List<Doctor> findAvailableDoctorsWithMinRating(@Param("minRating") Double minRating);
    
    @Query("SELECT DISTINCT d.specialization FROM Doctor d WHERE d.isAvailable = true")
    List<String> findAllSpecializations();
    
    @Query("SELECT d FROM Doctor d WHERE d.isAvailable = true " +
           "AND LOWER(d.specialization) LIKE LOWER(CONCAT('%', :specialization, '%')) " +
           "AND d.consultationFee BETWEEN :minFee AND :maxFee")
    List<Doctor> searchDoctors(@Param("specialization") String specialization,
                               @Param("minFee") Double minFee,
                               @Param("maxFee") Double maxFee);
    
    @Query("SELECT d FROM Doctor d WHERE d.id IN " +
           "(SELECT a.doctor.id FROM Appointment a WHERE a.appointmentDate = :date " +
           "AND a.appointmentTime = :time AND a.status IN ('SCHEDULED', 'CONFIRMED'))")
    List<Doctor> findDoctorsWithAppointmentAt(@Param("date") LocalDate date,
                                              @Param("time") LocalTime time);
    
    @Query("SELECT d, COUNT(a) as appointmentCount FROM Doctor d " +
           "LEFT JOIN Appointment a ON d.id = a.doctor.id " +
           "AND a.appointmentDate = :date " +
           "WHERE d.isAvailable = true " +
           "GROUP BY d.id " +
           "ORDER BY appointmentCount ASC")
    List<Object[]> findDoctorsWithLeastAppointments(@Param("date") LocalDate date);
}



