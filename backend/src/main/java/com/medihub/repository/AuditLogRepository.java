package com.medihub.repository;
import com.medihub.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Transactional
    @Modifying
    @Query("DELETE FROM AuditLog a WHERE a.timestamp < :timestamp")
    int archiveOlderThan(LocalDateTime timestamp);
}
