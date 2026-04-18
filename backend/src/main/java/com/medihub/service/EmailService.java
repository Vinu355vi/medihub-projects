// backend/src/main/java/com/medihub/service/EmailService.java
package com.medihub.service;

import com.medihub.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class EmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private TemplateEngine templateEngine;
    
    @Async
    public void sendVerificationEmail(User user) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            Context context = new Context();
            context.setVariable("name", user.getName());
            context.setVariable("verificationLink", 
                "http://localhost:3000/verify-email?token=" + user.getVerificationToken());
            
            String htmlContent = templateEngine.process("email/verification", context);
            
            helper.setTo(user.getEmail());
            helper.setSubject("Verify Your MediHub Account");
            helper.setText(htmlContent, true);
            helper.setFrom("noreply@medihub.com");
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email", e);
        }
    }
    
    @Async
    public void sendAppointmentConfirmationEmail(User user, Appointment appointment) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            Context context = new Context();
            context.setVariable("patientName", user.getName());
            context.setVariable("doctorName", appointment.getDoctor().getUser().getName());
            context.setVariable("appointmentDate", appointment.getAppointmentDate());
            context.setVariable("appointmentTime", appointment.getAppointmentTime());
            context.setVariable("clinicAddress", appointment.getDoctor().getClinicAddress());
            
            String htmlContent = templateEngine.process("email/appointment-confirmation", context);
            
            helper.setTo(user.getEmail());
            helper.setSubject("Appointment Confirmation - MediHub");
            helper.setText(htmlContent, true);
            helper.setFrom("appointments@medihub.com");
            
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send appointment confirmation email", e);
        }
    }
    
    @Async
    public void sendPrescriptionNotificationEmail(User user, Prescription prescription) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            Context context = new Context();
            context.setVariable("patientName", user.getName());
            context.setVariable("doctorName", prescription.getDoctor().getUser().getName());
            context.setVariable("issueDate", prescription.getIssueDate());
            
            String htmlContent = templateEngine.process("email/prescription-notification", context);
            
            helper.setTo(user.getEmail());
            helper.setSubject("New Prescription - MediHub");
            helper.setText(htmlContent, true);
            helper.setFrom("prescriptions@medihub.com");
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send prescription notification email", e);
        }
    }
    
    @Async
    public void sendPasswordResetEmail(User user, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            Context context = new Context();
            context.setVariable("name", user.getName());
            context.setVariable("resetLink", 
                "http://localhost:3000/reset-password?token=" + resetToken);
            
            String htmlContent = templateEngine.process("email/password-reset", context);
            
            helper.setTo(user.getEmail());
            helper.setSubject("Password Reset Request - MediHub");
            helper.setText(htmlContent, true);
            helper.setFrom("security@medihub.com");
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }
    
    @Async
    public void sendLowStockAlertEmail(PharmacyProduct product) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            Context context = new Context();
            context.setVariable("productName", product.getName());
            context.setVariable("currentStock", product.getStockQuantity());
            context.setVariable("reorderLevel", product.getReorderLevel());
            context.setVariable("sku", product.getSku());
            
            String htmlContent = templateEngine.process("email/low-stock-alert", context);
            
            // Send to inventory manager
            helper.setTo("inventory@medihub.com");
            helper.setSubject("⚠️ Low Stock Alert: " + product.getName());
            helper.setText(htmlContent, true);
            helper.setFrom("alerts@medihub.com");
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send low stock alert email", e);
        }
    }
    
    @Async
    public void sendOrderConfirmationEmail(User user, Order order) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            Context context = new Context();
            context.setVariable("customerName", user.getName());
            context.setVariable("orderNumber", order.getOrderNumber());
            context.setVariable("totalAmount", order.getTotalAmount());
            context.setVariable("orderDate", order.getCreatedAt());
            context.setVariable("shippingAddress", order.getShippingAddress());
            
            String htmlContent = templateEngine.process("email/order-confirmation", context);
            
            helper.setTo(user.getEmail());
            helper.setSubject("Order Confirmation #" + order.getOrderNumber());
            helper.setText(htmlContent, true);
            helper.setFrom("orders@medihub.com");
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send order confirmation email", e);
        }
    }
    
    @Async
    public void sendEmergencyAlert(User patient, String symptoms, String priority) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            Context context = new Context();
            context.setVariable("patientName", patient.getName());
            context.setVariable("symptoms", symptoms);
            context.setVariable("priority", priority);
            context.setVariable("timestamp", LocalDateTime.now());
            
            String htmlContent = templateEngine.process("email/emergency-alert", context);
            
            // Send to emergency contacts and admin
            helper.setTo("emergency@medihub.com");
            helper.setCc("admin@medihub.com");
            helper.setSubject("🚨 EMERGENCY: " + patient.getName() + " - " + priority + " Priority");
            helper.setText(htmlContent, true);
            helper.setFrom("emergency-alerts@medihub.com");
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send emergency alert email", e);
        }
    }

    @Async
    public void sendAppointmentReminderEmail(User user, Appointment appointment) {
        // Stub to fix compilation
    }
    
    @Async
    public void sendOrderStatusUpdateEmail(User user, Order order) {
        // Stub
    }
}
