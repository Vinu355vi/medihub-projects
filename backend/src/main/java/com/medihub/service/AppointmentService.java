// backend/src/main/java/com/medihub/service/AppointmentService.java
package com.medihub.service;

import com.medihub.model.*;
import com.medihub.repository.*;
import com.medihub.exception.*;
import com.medihub.dto.AppointmentDTO;
import com.medihub.dto.BookingRequestDTO;
import com.medihub.ai.TriageScorer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AppointmentService {
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private DoctorRepository doctorRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TriageScorer triageScorer;
    
    @Autowired
    private NotificationService notificationService;
    
    @Transactional
    public AppointmentDTO bookAppointment(BookingRequestDTO bookingRequest) {
        if (bookingRequest.getAppointmentDate() == null || bookingRequest.getAppointmentTime() == null) {
            throw new BusinessException("Appointment date and time are required");
        }

        // Validate patient
        Patient patient = patientRepository.findById(bookingRequest.getPatientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        
        // Validate doctor
        Doctor doctor = doctorRepository.findById(bookingRequest.getDoctorId())
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        
        // Check doctor availability
        if (!doctor.getIsAvailable()) {
            throw new BusinessException("Doctor is not available for appointments");
        }
        
        // Check if doctor works on requested day
        String dayOfWeek = bookingRequest.getAppointmentDate().getDayOfWeek().toString();
        if (!worksOnDay(doctor, dayOfWeek)) {
            throw new BusinessException("Doctor is not available on " + dayOfWeek);
        }
        
        // Check appointment time within doctor's working hours
        if (bookingRequest.getAppointmentTime().isBefore(doctor.getAvailableFrom()) ||
            bookingRequest.getAppointmentTime().isAfter(doctor.getAvailableTo())) {
            throw new BusinessException("Appointment time must be between " + 
                doctor.getAvailableFrom() + " and " + doctor.getAvailableTo());
        }
        
        // Check slot availability
        if (!isSlotAvailable(doctor.getId(), bookingRequest.getAppointmentDate(), 
                           bookingRequest.getAppointmentTime())) {
            throw new BusinessException("Time slot is not available");
        }
        
        // Check daily appointment limit
        long dailyAppointments = appointmentRepository.countDoctorAppointmentsForDate(
            doctor.getId(), bookingRequest.getAppointmentDate());
        if (dailyAppointments >= doctor.getMaxPatientsPerDay()) {
            throw new BusinessException("Doctor has reached maximum appointments for the day");
        }
        
        // Create appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(bookingRequest.getAppointmentDate());
        appointment.setAppointmentTime(bookingRequest.getAppointmentTime());
        appointment.setSymptoms(bookingRequest.getSymptoms());
        appointment.setVisitReason(bookingRequest.getVisitReason());
        
        // Calculate triage score
        calculateTriageScore(appointment);
        
        // Set payment amount
        appointment.setPaymentAmount(doctor.getConsultationFee());
        
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Send notifications
        notificationService.sendAppointmentBookingNotification(savedAppointment);
        
        return convertToDTO(savedAppointment);
    }
    
    private boolean isSlotAvailable(Long doctorId, LocalDate date, LocalTime time) {
        List<Appointment> existingAppointments = appointmentRepository
            .findDoctorAppointmentsAtTime(doctorId, date, time, time.plusMinutes(29));
        
        return existingAppointments.isEmpty();
    }
    
    private void calculateTriageScore(Appointment appointment) {
        int score = triageScorer.calculateTriageScore(appointment);
        appointment.setTriageScore(java.math.BigDecimal.valueOf(score));
        appointment.setTriageRiskScoreSnapshot(java.math.BigDecimal.valueOf(score));
        String urgency = triageScorer.determineUrgencyLevel(score);
        appointment.setTriageUrgencySnapshot(urgency);
        appointment.setTriageReasoningSnapshot(urgency.equals("Critical")
            ? "AI triage detected critical symptoms requiring immediate attention"
            : urgency.equals("Urgent")
                ? "AI triage detected elevated risk and urgent follow-up requirement"
                : "AI triage indicates routine priority based on provided symptoms");
        try {
            appointment.setTriagePriority(Appointment.TriagePriority.valueOf(triageScorer.determinePriority(score)));
        } catch (IllegalArgumentException e) {
            appointment.setTriagePriority(Appointment.TriagePriority.ROUTINE);
        }
    }

    public Map<String, Object> buildSlotConflictResponse(BookingRequestDTO bookingRequest) {
        Patient patient = patientRepository.findById(bookingRequest.getPatientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        Doctor doctor = doctorRepository.findById(bookingRequest.getDoctorId())
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        Integer patientAge = null;
        if (patient.getUser() != null && patient.getUser().getDateOfBirth() != null) {
            patientAge = (int) ChronoUnit.YEARS.between(patient.getUser().getDateOfBirth(), LocalDate.now());
        }

        int triageScore = triageScorer.calculateScore(
            bookingRequest.getSymptoms(),
            patientAge,
            patient.getMedicalHistory()
        );
        String urgency = triageScorer.determineUrgencyLevel(triageScore);
        double priorityWeight = Math.max(0.1, Math.min(1.0, triageScore / 10.0));

        List<Map<String, Object>> recommendedSlots = new ArrayList<>();
        for (int dayOffset = 0; dayOffset <= 5 && recommendedSlots.size() < 5; dayOffset++) {
            LocalDate candidateDate = bookingRequest.getAppointmentDate().plusDays(dayOffset);
            List<LocalTime> available = getAvailableSlots(doctor.getId(), candidateDate);
            for (LocalTime slot : available) {
                if (dayOffset == 0 && bookingRequest.getAppointmentTime() != null && slot.equals(bookingRequest.getAppointmentTime())) {
                    continue;
                }
                recommendedSlots.add(Map.of(
                    "date", candidateDate.toString(),
                    "time", slot.toString(),
                    "doctorId", doctor.getId(),
                    "doctorName", doctor.getUser() != null ? doctor.getUser().getName() : "Doctor",
                    "priorityWeight", priorityWeight
                ));
                if (recommendedSlots.size() >= 5) break;
            }
        }

        return Map.of(
            "message", "Requested slot is not available",
            "requestedSlot", Map.of(
                "date", bookingRequest.getAppointmentDate() != null ? bookingRequest.getAppointmentDate().toString() : null,
                "time", bookingRequest.getAppointmentTime() != null ? bookingRequest.getAppointmentTime().toString() : null,
                "doctorId", doctor.getId(),
                "doctorName", doctor.getUser() != null ? doctor.getUser().getName() : "Doctor"
            ),
            "triage", Map.of(
                "riskScore", triageScore,
                "urgencyLevel", urgency,
                "priorityWeight", priorityWeight
            ),
            "recommendedSlots", recommendedSlots
        );
    }
    
    @Transactional
    public AppointmentDTO confirmAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        
        if (appointment.getStatus() != Appointment.AppointmentStatus.SCHEDULED) {
            throw new BusinessException("Appointment cannot be confirmed in current status");
        }
        
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        notificationService.sendAppointmentConfirmationNotification(updatedAppointment);
        
        return convertToDTO(updatedAppointment);
    }
    
    @Transactional
    public AppointmentDTO cancelAppointment(Long appointmentId, String reason, String cancelledBy) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        
        if (appointment.getStatus() == Appointment.AppointmentStatus.CANCELLED ||
            appointment.getStatus() == Appointment.AppointmentStatus.COMPLETED) {
            throw new BusinessException("Appointment cannot be cancelled in current status");
        }
        
        // Check cancellation policy (can't cancel within 24 hours)
        LocalDateTime appointmentDateTime = LocalDateTime.of(
            appointment.getAppointmentDate(), appointment.getAppointmentTime());
        
        if (LocalDateTime.now().plusHours(24).isAfter(appointmentDateTime)) {
            throw new BusinessException("Appointments can only be cancelled at least 24 hours in advance");
        }
        
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        appointment.setCancelledBy(cancelledBy);
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        notificationService.sendAppointmentCancellationNotification(updatedAppointment);
        
        // Process refund if paid
        if (appointment.getPaymentStatus() == Appointment.PaymentStatus.PAID) {
            processRefund(appointment);
        }
        
        return convertToDTO(updatedAppointment);
    }
    
    @Transactional
    public AppointmentDTO rescheduleAppointment(Long appointmentId, LocalDate newDate, LocalTime newTime) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        
        if (appointment.getStatus() == Appointment.AppointmentStatus.CANCELLED ||
            appointment.getStatus() == Appointment.AppointmentStatus.COMPLETED) {
            throw new BusinessException("Appointment cannot be rescheduled in current status");
        }
        
        // Check new slot availability
        if (!isSlotAvailable(appointment.getDoctor().getId(), newDate, newTime)) {
            throw new BusinessException("New time slot is not available");
        }
        
        LocalDate oldDate = appointment.getAppointmentDate();
        LocalTime oldTime = appointment.getAppointmentTime();
        
        appointment.setAppointmentDate(newDate);
        appointment.setAppointmentTime(newTime);
        appointment.setStatus(Appointment.AppointmentStatus.RESCHEDULED);
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        notificationService.sendAppointmentRescheduleNotification(
            updatedAppointment, oldDate, oldTime);
        
        return convertToDTO(updatedAppointment);
    }
    
    @Transactional
    public AppointmentDTO checkInAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        
        if (appointment.getStatus() != Appointment.AppointmentStatus.CONFIRMED) {
            throw new BusinessException("Only confirmed appointments can be checked in");
        }
        
        appointment.setStatus(Appointment.AppointmentStatus.CHECKED_IN);
        appointment.setCheckInTime(LocalDateTime.now());
        
        // Calculate waiting time
        if (appointment.getAppointmentTime() != null) {
            long waitingMinutes = ChronoUnit.MINUTES.between(
                LocalTime.from(appointment.getCheckInTime()),
                appointment.getAppointmentTime()
            );
            appointment.setWaitingTimeMinutes(Math.max(0, (int) waitingMinutes));
        }
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        notificationService.sendAppointmentCheckInNotification(updatedAppointment);
        
        return convertToDTO(updatedAppointment);
    }
    
    @Transactional
    public AppointmentDTO completeAppointment(Long appointmentId, String diagnosis, 
                                             String prescription, String notes) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        
        if (appointment.getStatus() != Appointment.AppointmentStatus.IN_PROGRESS) {
            throw new BusinessException("Only appointments in progress can be completed");
        }
        
        appointment.setStatus(Appointment.AppointmentStatus.COMPLETED);
        appointment.setDiagnosis(diagnosis);
        appointment.setPrescription(prescription);
        appointment.setNotes(notes);
        appointment.setCheckOutTime(LocalDateTime.now());
        
        // Calculate consultation time
        if (appointment.getCheckInTime() != null) {
            long consultationMinutes = ChronoUnit.MINUTES.between(
                appointment.getCheckInTime(),
                appointment.getCheckOutTime()
            );
            appointment.setConsultationTimeMinutes((int) consultationMinutes);
        }
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        notificationService.sendAppointmentCompletionNotification(updatedAppointment);
        
        return convertToDTO(updatedAppointment);
    }
    
    public List<AppointmentDTO> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientId(patientId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public List<AppointmentDTO> getDoctorAppointments(Long doctorId, LocalDate date) {
        return appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public List<LocalTime> getAvailableSlots(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        if (!worksOnDay(doctor, date.getDayOfWeek().toString())) {
            return new ArrayList<>();
        }
        
        List<LocalTime> availableSlots = new ArrayList<>();
        LocalTime currentTime = doctor.getAvailableFrom();
        LocalTime endTime = doctor.getAvailableTo();
        
        while (currentTime.isBefore(endTime)) {
            LocalTime slotEnd = currentTime.plusMinutes(doctor.getSlotDurationMinutes());
            
            if (slotEnd.isAfter(endTime)) {
                break;
            }
            
            if (isSlotAvailable(doctorId, date, currentTime)) {
                availableSlots.add(currentTime);
            }
            
            currentTime = currentTime.plusMinutes(doctor.getSlotDurationMinutes());
        }
        
        return availableSlots;
    }

    private boolean worksOnDay(Doctor doctor, String dayOfWeek) {
        if (doctor == null || doctor.getAvailableDays() == null || doctor.getAvailableDays().isEmpty()) {
            return true;
        }

        final String expected = normalizeDay(dayOfWeek);
        return doctor.getAvailableDays().stream()
            .filter(Objects::nonNull)
            .map(this::normalizeDay)
            .anyMatch(expected::equals);
    }

    private String normalizeDay(String dayValue) {
        return String.valueOf(dayValue)
            .trim()
            .replace('-', '_')
            .replace(' ', '_')
            .toUpperCase(Locale.ROOT);
    }
    
    public AppointmentDTO getAppointmentById(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        return convertToDTO(appointment);
    }
    
    public List<AppointmentDTO> getUpcomingAppointments(Long patientId) {
        LocalDate today = LocalDate.now();
        return appointmentRepository.findByPatientId(patientId)
            .stream()
            .filter(a -> a.getAppointmentDate().isAfter(today) || 
                        (a.getAppointmentDate().equals(today) && 
                         a.getAppointmentTime().isAfter(LocalTime.now())))
            .filter(a -> a.getStatus() == Appointment.AppointmentStatus.SCHEDULED ||
                        a.getStatus() == Appointment.AppointmentStatus.CONFIRMED)
            .sorted((a1, a2) -> {
                int dateCompare = a1.getAppointmentDate().compareTo(a2.getAppointmentDate());
                if (dateCompare != 0) return dateCompare;
                return a1.getAppointmentTime().compareTo(a2.getAppointmentTime());
            })
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public List<AppointmentDTO> getAppointmentHistory(Long patientId) {
        return appointmentRepository.findPatientAppointmentHistory(patientId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public Double getAverageWaitingTime(LocalDate startDate, LocalDate endDate) {
        return appointmentRepository.findAverageWaitingTime(startDate, endDate);
    }
    
    private void processRefund(Appointment appointment) {
        // Implement refund logic with payment gateway
        appointment.setPaymentStatus(Appointment.PaymentStatus.REFUNDED);
        appointmentRepository.save(appointment);
    }
    
    public List<AppointmentDTO> getDoctorSchedule(Long doctorId, LocalDate date) {
        return appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date)
            .stream()
            .map(this::convertToDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    private AppointmentDTO convertToDTO(Appointment appointment) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setId(appointment.getId());
        dto.setPatientId(appointment.getPatient().getId());
        dto.setDoctorId(appointment.getDoctor().getId());
        dto.setAppointmentDate(appointment.getAppointmentDate());
        dto.setAppointmentTime(appointment.getAppointmentTime());
        dto.setStatus(appointment.getStatus());
        dto.setSymptoms(appointment.getSymptoms());
        dto.setDiagnosis(appointment.getDiagnosis());
        dto.setPrescription(appointment.getPrescription());
        dto.setNotes(appointment.getNotes());
        dto.setTriageScore(appointment.getTriageScore());
        dto.setTriageRiskScoreSnapshot(appointment.getTriageRiskScoreSnapshot());
        dto.setTriagePriority(appointment.getTriagePriority());
        dto.setTriageUrgencySnapshot(appointment.getTriageUrgencySnapshot());
        dto.setTriageReasoningSnapshot(appointment.getTriageReasoningSnapshot());
        dto.setPaymentStatus(appointment.getPaymentStatus());
        dto.setPaymentAmount(appointment.getPaymentAmount());
        dto.setCheckInTime(appointment.getCheckInTime());
        dto.setCheckOutTime(appointment.getCheckOutTime());
        dto.setWaitingTimeMinutes(appointment.getWaitingTimeMinutes());
        dto.setConsultationTimeMinutes(appointment.getConsultationTimeMinutes());
        dto.setCreatedAt(appointment.getCreatedAt());
        
        // Add doctor info
        if (appointment.getDoctor() != null) {
            dto.setDoctorName(appointment.getDoctor().getUser().getName());
            dto.setDoctorSpecialization(appointment.getDoctor().getSpecialization());
        }
        
        // Add patient info
        if (appointment.getPatient() != null) {
            dto.setPatientName(appointment.getPatient().getUser().getName());
        }
        
        return dto;
    }
}
