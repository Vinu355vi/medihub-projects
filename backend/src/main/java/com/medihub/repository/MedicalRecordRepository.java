package com.medihub.repository;

import com.medihub.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    
    List<MedicalRecord> findByPatientId(Long patientId);
    
    List<MedicalRecord> findByPatientIdAndRecordType(Long patientId, MedicalRecord.RecordType recordType);
    
    List<MedicalRecord> findByPatientIdAndRecordDateBetween(Long patientId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT mr FROM MedicalRecord mr WHERE mr.patient.id = :patientId " +
           "ORDER BY mr.recordDate DESC, mr.createdAt DESC")
    List<MedicalRecord> findPatientRecordsSorted(@Param("patientId") Long patientId);
    
    @Query("SELECT COUNT(mr), mr.recordType FROM MedicalRecord mr " +
           "WHERE mr.patient.id = :patientId " +
           "GROUP BY mr.recordType")
    List<Object[]> countRecordsByType(@Param("patientId") Long patientId);
}