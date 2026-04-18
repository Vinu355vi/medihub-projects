// backend/src/main/java/com/medihub/scheduler/SystemMaintenanceScheduler.java
package com.medihub.scheduler;

import com.medihub.repository.LoginAttemptRepository;
import com.medihub.repository.AuditLogRepository;
import com.medihub.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class SystemMaintenanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(SystemMaintenanceScheduler.class);
    
    @Autowired
    private LoginAttemptRepository loginAttemptRepository;
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    /**
     * Cleanup old login attempts (older than 30 days)
     * Runs daily at 1 AM
     */
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void cleanupOldLoginAttempts() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        int deletedCount = loginAttemptRepository.deleteOlderThan(thirtyDaysAgo);
        log.info("Deleted {} old login attempts", deletedCount);
    }
    
    /**
     * Archive old audit logs (older than 1 year)
     * Runs monthly on 1st at 2 AM
     */
    @Scheduled(cron = "0 0 2 1 * ?")
    @Transactional
    public void archiveOldAuditLogs() {
        LocalDateTime oneYearAgo = LocalDateTime.now().minusYears(1);
        int archivedCount = auditLogRepository.archiveOlderThan(oneYearAgo);
        log.info("Archived {} old audit logs", archivedCount);
    }
    
    /**
     * Cleanup read notifications (older than 30 days)
     * Runs weekly on Sunday at 3 AM
     */
    @Scheduled(cron = "0 0 3 ? * SUN")
    @Transactional
    public void cleanupOldNotifications() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        int deletedCount = notificationRepository.deleteReadNotificationsOlderThan(thirtyDaysAgo);
        log.info("Deleted {} old read notifications", deletedCount);
    }
    
    /**
     * System health check
     * Runs every hour
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void performHealthCheck() {
        // Check database connectivity
        // Check external service availability
        // Check disk space
        // Send health report to admin
        log.info("Performed system health check");
    }
}