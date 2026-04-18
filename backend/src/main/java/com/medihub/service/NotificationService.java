// backend/src/main/java/com/medihub/service/NotificationService.java
package com.medihub.service;

import com.medihub.model.*;
import com.medihub.repository.NotificationRepository;
import com.medihub.repository.UserRepository;
import com.medihub.repository.AppointmentRepository;
import com.medihub.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private EmailService emailService;

    
    @Async
    public void sendAppointmentBookingNotification(Appointment appointment) {
        // Create notification for patient
        Notification patientNotification = new Notification();
        patientNotification.setUser(appointment.getPatient().getUser());
        patientNotification.setType(Notification.NotificationType.APPOINTMENT);
        patientNotification.setTitle("Appointment Booked");
        patientNotification.setMessage(String.format(
            "Your appointment with Dr. %s is scheduled for %s at %s",
            appointment.getDoctor().getUser().getName(),
            appointment.getAppointmentDate(),
            appointment.getAppointmentTime()
        ));
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("appointmentId", appointment.getId());
        metadata.put("doctorName", appointment.getDoctor().getUser().getName());
        metadata.put("date", appointment.getAppointmentDate().toString());
        metadata.put("time", appointment.getAppointmentTime().toString());
        patientNotification.setMetadata(metadata);
        
        notificationRepository.save(patientNotification);
        
        // Email is best-effort; booking must not fail if template/mail config is missing.
        try {
            emailService.sendAppointmentConfirmationEmail(
                appointment.getPatient().getUser(),
                appointment
            );
        } catch (Exception ex) {
            log.warn("Appointment confirmation email failed for appointment {}: {}", appointment.getId(), ex.getMessage());
        }
        
        // Create notification for doctor
        Notification doctorNotification = new Notification();
        doctorNotification.setUser(appointment.getDoctor().getUser());
        doctorNotification.setType(Notification.NotificationType.APPOINTMENT);
        doctorNotification.setTitle("New Appointment");
        doctorNotification.setMessage(String.format(
            "New appointment booked with %s for %s at %s",
            appointment.getPatient().getUser().getName(),
            appointment.getAppointmentDate(),
            appointment.getAppointmentTime()
        ));
        
        notificationRepository.save(doctorNotification);
    }
    
    @Async
    public void sendAppointmentReminderNotifications() {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
        
        // Find appointments scheduled for tomorrow
        List<Appointment> tomorrowAppointments = appointmentRepository
            .findAppointmentsForDate(tomorrow.toLocalDate());
        
        for (Appointment appointment : tomorrowAppointments) {
            if (appointment.getStatus() == Appointment.AppointmentStatus.CONFIRMED) {
                // Send reminder to patient
                Notification reminder = new Notification();
                reminder.setUser(appointment.getPatient().getUser());
                reminder.setType(Notification.NotificationType.APPOINTMENT);
                reminder.setTitle("Appointment Reminder");
                reminder.setMessage(String.format(
                    "Reminder: You have an appointment tomorrow with Dr. %s at %s",
                    appointment.getDoctor().getUser().getName(),
                    appointment.getAppointmentTime()
                ));
                
                notificationRepository.save(reminder);
                
                // Send email reminder
                emailService.sendAppointmentReminderEmail(
                    appointment.getPatient().getUser(),
                    appointment
                );
            }
        }
    }

    public void sendAppointmentReminder(Appointment appointment) {
        // TODO: Implement
    }
    public void sendTwoHourReminder(Appointment appointment) {
        // TODO: Implement
    }
    public void sendNoShowNotification(Appointment appointment) {
        // TODO: Implement
    }
    public void sendAppointmentConfirmationNotification(Appointment appointment) {
        // TODO: Implement
    }
    public void sendAppointmentCancellationNotification(Appointment appointment) {
        // TODO: Implement
    }
    public void sendAppointmentRescheduleNotification(Appointment appt, LocalDate d, LocalTime t) {
        // TODO: Implement
    }
    public void sendAppointmentCheckInNotification(Appointment appointment) {
        // TODO: Implement
    }
    public void sendAppointmentCompletionNotification(Appointment appointment) {
        // TODO: Implement
    }
    public void sendOrderConfirmation(Order order) {
        // TODO: Implement
    }
    @Async
    public void sendLowStockAlert(PharmacyProduct product) {
        // Find all admin users
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        
        for (User admin : admins) {
            Notification alert = new Notification();
            alert.setUser(admin);
            alert.setType(Notification.NotificationType.ALERT);
            alert.setTitle("Low Stock Alert");
            alert.setMessage(String.format(
                "Product '%s' is running low. Current stock: %d, Reorder level: %d",
                product.getName(),
                product.getStockQuantity(),
                product.getReorderLevel()
            ));
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("productId", product.getId());
            metadata.put("productName", product.getName());
            metadata.put("currentStock", product.getStockQuantity());
            metadata.put("reorderLevel", product.getReorderLevel());
            alert.setMetadata(metadata);
            
            notificationRepository.save(alert);
        }
        
        // Send email to inventory manager
        emailService.sendLowStockAlertEmail(product);
    }
    
    @Async
    public void sendPrescriptionReadyNotification(Prescription prescription) {
        Notification notification = new Notification();
        notification.setUser(prescription.getPatient().getUser());
        notification.setType(Notification.NotificationType.PRESCRIPTION);
        notification.setTitle("New Prescription Available");
        notification.setMessage("Your doctor has issued a new prescription. You can view it in your medical records.");
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("prescriptionId", prescription.getId());
        metadata.put("doctorName", prescription.getDoctor().getUser().getName());
        metadata.put("issueDate", prescription.getIssueDate().toString());
        notification.setMetadata(metadata);
        
        notificationRepository.save(notification);
        
        // Send email notification
        emailService.sendPrescriptionNotificationEmail(
            prescription.getPatient().getUser(),
            prescription
        );
    }
    
    @Async
    public void sendOrderStatusUpdate(Order order) {
        Notification notification = new Notification();
        notification.setUser(order.getUser());
        notification.setType(Notification.NotificationType.ORDER);
        notification.setTitle("Order Status Updated");
        notification.setMessage(String.format(
            "Your order #%s is now %s",
            order.getOrderNumber(),
            order.getStatus()
        ));
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("orderId", order.getId());
        metadata.put("orderNumber", order.getOrderNumber());
        metadata.put("status", order.getStatus().toString());
        notification.setMetadata(metadata);
        
        notificationRepository.save(notification);
        
        // Send email notification for important status changes
        if (order.getStatus() == Order.OrderStatus.SHIPPED || 
            order.getStatus() == Order.OrderStatus.DELIVERED) {
            emailService.sendOrderStatusUpdateEmail(
                order.getUser(),
                order
            );
        }
    }
    
    @Async
    public void sendPaymentConfirmation(Order order) {
        Notification notification = new Notification();
        notification.setUser(order.getUser());
        notification.setType(Notification.NotificationType.PAYMENT);
        notification.setTitle("Payment Confirmed");
        notification.setMessage(String.format(
            "Payment of ₹%.2f for order #%s has been confirmed",
            order.getTotalAmount(),
            order.getOrderNumber()
        ));
        
        notificationRepository.save(notification);
    }
    
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }
    
    @Transactional
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
    
    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadNotifications(userId);
    }
}

