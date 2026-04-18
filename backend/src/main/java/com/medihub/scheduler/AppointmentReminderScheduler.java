// backend/src/main/java/com/medihub/scheduler/AppointmentReminderScheduler.java
package com.medihub.scheduler;

import com.medihub.model.Appointment;
import com.medihub.repository.AppointmentRepository;
import com.medihub.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class AppointmentReminderScheduler {
    
    private static final Logger log = LoggerFactory.getLogger(AppointmentReminderScheduler.class);

    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * Send reminders for appointments scheduled for tomorrow
     * Runs daily at 6 PM
     */
    @Scheduled(cron = "0 0 18 * * ?")
    @Transactional
    public void sendTomorrowAppointmentReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        
        List<Appointment> tomorrowAppointments = appointmentRepository
            .findByAppointmentDateAndStatusIn(
                tomorrow,
                List.of(Appointment.AppointmentStatus.SCHEDULED, 
                       Appointment.AppointmentStatus.CONFIRMED)
            );
        
        for (Appointment appointment : tomorrowAppointments) {
            notificationService.sendAppointmentReminder(appointment);
        }
        
        log.info("Sent reminders for {} appointments scheduled for {}", 
                 tomorrowAppointments.size(), tomorrow);
    }
    
    /**
     * Send reminders for appointments starting in 2 hours
     * Runs every 30 minutes
     */
    @Scheduled(cron = "0 */30 * * * ?")
    @Transactional
    public void sendTwoHourReminders() {
        LocalDateTime start = LocalDateTime.now().plusHours(1).plusMinutes(50);
        LocalDateTime end = LocalDateTime.now().plusHours(2).plusMinutes(10);
        
        List<Appointment> upcomingAppointments = appointmentRepository
            .findAppointmentsStartingBetween(
                start.toLocalDate(), start.toLocalTime(),
                end.toLocalDate(), end.toLocalTime()
            );
        
        for (Appointment appointment : upcomingAppointments) {
            notificationService.sendTwoHourReminder(appointment);
        }
        
        log.info("Sent 2-hour reminders for {} appointments", upcomingAppointments.size());
    }
    
    /**
     * Mark no-show appointments
     * Runs every hour
     */
    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void markNoShowAppointments() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        List<Appointment> missedAppointments = appointmentRepository
            .findMissedAppointments(oneHourAgo.toLocalDate(), oneHourAgo.toLocalTime());
        
        for (Appointment appointment : missedAppointments) {
            appointment.setStatus(Appointment.AppointmentStatus.NO_SHOW);
            appointmentRepository.save(appointment);
            
            notificationService.sendNoShowNotification(appointment);
        }
        
        log.info("Marked {} appointments as no-show", missedAppointments.size());
    }
    
    /**
     * Auto-complete appointments that have exceeded consultation time
     * Runs every 15 minutes
     */
    @Scheduled(cron = "0 */15 * * * ?")
    @Transactional
    public void autoCompleteOldAppointments() {
        LocalDateTime threeHoursAgo = LocalDateTime.now().minusHours(3);
        
        List<Appointment> oldAppointments = appointmentRepository
            .findOldInProgressAppointments(threeHoursAgo.toLocalDate(), threeHoursAgo.toLocalTime());
        
        for (Appointment appointment : oldAppointments) {
            appointment.setStatus(Appointment.AppointmentStatus.COMPLETED);
            appointment.setCheckOutTime(LocalDateTime.now());
            appointmentRepository.save(appointment);
            
            log.info("Auto-completed appointment {}", appointment.getId());
        }
    }
}

