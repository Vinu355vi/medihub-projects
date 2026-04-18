// backend/src/main/java/com/medihub/repository/AppointmentRepository.java
package com.medihub.repository;

import com.medihub.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    List<Appointment> findByPatientId(Long patientId);
    
    List<Appointment> findByDoctorId(Long doctorId);
    
    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);
    
    List<Appointment> findByPatientIdAndStatus(Long patientId, Appointment.AppointmentStatus status);
    
    List<Appointment> findByDoctorIdAndStatus(Long doctorId, Appointment.AppointmentStatus status);
    
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND a.appointmentTime BETWEEN :startTime AND :endTime " +
           "AND a.status IN ('SCHEDULED', 'CONFIRMED')")
    List<Appointment> findDoctorAppointmentsAtTime(@Param("doctorId") Long doctorId,
                                                   @Param("date") LocalDate date,
                                                   @Param("startTime") LocalTime startTime,
                                                   @Param("endTime") LocalTime endTime);
    
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND a.status IN ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')")
    Long countDoctorAppointmentsForDate(@Param("doctorId") Long doctorId,
                                        @Param("date") LocalDate date);
    
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate " +
           "AND a.status = :status")
    List<Appointment> findAppointmentsBetweenDates(@Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate,
                                                   @Param("status") Appointment.AppointmentStatus status);
    
    @Query("SELECT a.appointmentDate, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :startDate AND :endDate " +
           "GROUP BY a.appointmentDate " +
           "ORDER BY a.appointmentDate")
    List<Object[]> countAppointmentsByDate(@Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);
    
    @Query("SELECT a.triagePriority, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate = :date " +
           "GROUP BY a.triagePriority")
    List<Object[]> countAppointmentsByTriagePriority(@Param("date") LocalDate date);
    
    @Query("SELECT a FROM Appointment a WHERE a.patient.id = :patientId " +
           "ORDER BY a.appointmentDate DESC, a.appointmentTime DESC")
    List<Appointment> findPatientAppointmentHistory(@Param("patientId") Long patientId);
    
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate >= :today " +
           "ORDER BY a.appointmentDate ASC, a.appointmentTime ASC")
    List<Appointment> findUpcomingDoctorAppointments(@Param("doctorId") Long doctorId,
                                                     @Param("today") LocalDate today);

    List<Appointment> findByAppointmentDateAndStatusIn(LocalDate date, List<Appointment.AppointmentStatus> statuses);

    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate = :date")
    List<Appointment> findAppointmentsForDate(@Param("date") LocalDate date);

    @Query("SELECT a FROM Appointment a WHERE (a.appointmentDate > :startD OR (a.appointmentDate = :startD AND a.appointmentTime >= :startT)) AND (a.appointmentDate < :endD OR (a.appointmentDate = :endD AND a.appointmentTime <= :endT))")
    List<Appointment> findAppointmentsStartingBetween(@Param("startD") LocalDate startD, @Param("startT") LocalTime startT, @Param("endD") LocalDate endD, @Param("endT") LocalTime endT);

    @Query("SELECT a FROM Appointment a WHERE a.status = 'SCHEDULED' AND (a.appointmentDate < :nowD OR (a.appointmentDate = :nowD AND a.appointmentTime < :nowT))")
    List<Appointment> findMissedAppointments(@Param("nowD") LocalDate nowD, @Param("nowT") LocalTime nowT);

    @Query("SELECT a FROM Appointment a WHERE a.status = 'IN_PROGRESS' AND (a.appointmentDate < :nowD OR (a.appointmentDate = :nowD AND a.appointmentTime < :nowT))")
    List<Appointment> findOldInProgressAppointments(@Param("nowD") LocalDate nowD, @Param("nowT") LocalTime nowT);
    
    @Query("SELECT a FROM Appointment a WHERE a.checkInTime IS NOT NULL " +
           "AND a.checkOutTime IS NULL " +
           "AND a.appointmentDate = :date")
    List<Appointment> findActiveAppointments(@Param("date") LocalDate date);
    
    @Query("SELECT AVG(a.waitingTimeMinutes) FROM Appointment a " +
           "WHERE a.waitingTimeMinutes IS NOT NULL " +
           "AND a.appointmentDate BETWEEN :startDate AND :endDate")
    Double findAverageWaitingTime(@Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate);
}