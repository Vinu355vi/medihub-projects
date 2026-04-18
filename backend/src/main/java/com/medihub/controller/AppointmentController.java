package com.medihub.controller;

import com.medihub.dto.AppointmentDTO;
import com.medihub.exception.BusinessException;
import com.medihub.model.Appointment;
import com.medihub.model.Doctor;
import com.medihub.model.Patient;
import com.medihub.model.Role;
import com.medihub.model.User;
import com.medihub.repository.AppointmentRepository;
import com.medihub.repository.DoctorRepository;
import com.medihub.repository.PatientRepository;
import com.medihub.service.AppointmentService;
import com.medihub.service.CurrentUserService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private CurrentUserService currentUserService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody com.medihub.dto.BookingRequestDTO request) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        User user = userOpt.get();
        Role role = currentUserService.resolveEffectiveRole(user);

        if (role == Role.PATIENT) {
            Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
            if (patientOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Patient profile not found"));
            }
            // Enforce ownership: patient can only book for themselves.
            request.setPatientId(patientOpt.get().getId());
        } else if (role != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Only patients or admins can book appointments"));
        }

        if (request.getPatientId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "patientId is required"));
        }
        if (request.getDoctorId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "doctorId is required"));
        }

        try {
            AppointmentDTO appointment = appointmentService.bookAppointment(request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "appointment", appointment
            ));
        } catch (BusinessException ex) {
            if ("Time slot is not available".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(409).body(
                    appointmentService.buildSlotConflictResponse(request)
                );
            }
            throw ex;
        }
    }

    @GetMapping("/available-slots/{doctorId}")
    public ResponseEntity<?> getAvailableSlots(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<String> slots = appointmentService.getAvailableSlots(doctorId, date)
                                    .stream().map(Object::toString).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of(
            "date", date,
            "doctorId", doctorId,
            "availableSlots", slots
        ));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingAppointments(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            Optional<User> userOpt = currentUserService.resolveUser(authorization);
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            User user = userOpt.get();
            Role role = currentUserService.resolveEffectiveRole(user);

            if (role == Role.PATIENT) {
                Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
                if (patientOpt.isEmpty()) {
                    return ResponseEntity.ok(List.of());
                }
                return ResponseEntity.ok(appointmentService.getUpcomingAppointments(patientOpt.get().getId()));
            }

            if (role == Role.DOCTOR) {
                Optional<Doctor> doctorOpt = doctorRepository.findByUserId(user.getId());
                if (doctorOpt.isEmpty()) {
                    return ResponseEntity.ok(List.of());
                }

                LocalDate today = LocalDate.now();
                LocalTime now = LocalTime.now();

                List<AppointmentDTO> upcoming = appointmentRepository.findByDoctorId(doctorOpt.get().getId())
                    .stream()
                    .filter(a -> a.getStatus() == Appointment.AppointmentStatus.SCHEDULED
                        || a.getStatus() == Appointment.AppointmentStatus.CONFIRMED)
                    .filter(a -> a.getAppointmentDate().isAfter(today)
                        || (a.getAppointmentDate().isEqual(today) && a.getAppointmentTime().isAfter(now)))
                    .sorted(Comparator.comparing(Appointment::getAppointmentDate)
                        .thenComparing(Appointment::getAppointmentTime))
                    .map(a -> appointmentService.getAppointmentById(a.getId()))
                    .collect(Collectors.toList());

                return ResponseEntity.ok(upcoming);
            }

            // Admin upcoming (all)
            LocalDate today = LocalDate.now();
            LocalTime now = LocalTime.now();
            List<AppointmentDTO> adminUpcoming = appointmentRepository.findAll()
                .stream()
                .filter(a -> a.getStatus() == Appointment.AppointmentStatus.SCHEDULED
                    || a.getStatus() == Appointment.AppointmentStatus.CONFIRMED)
                .filter(a -> a.getAppointmentDate().isAfter(today)
                    || (a.getAppointmentDate().isEqual(today) && a.getAppointmentTime().isAfter(now)))
                .sorted(Comparator.comparing(Appointment::getAppointmentDate)
                    .thenComparing(Appointment::getAppointmentTime))
                .map(a -> appointmentService.getAppointmentById(a.getId()))
                .collect(Collectors.toList());

            return ResponseEntity.ok(adminUpcoming);
        } catch (Exception ex) {
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping("/cancel/{appointmentId}")
    public ResponseEntity<?> cancelAppointment(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long appointmentId,
            @RequestBody(required = false) Map<String, String> payload,
            @RequestParam(required = false) String reason) {

        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        String cancelledBy = userOpt.map(User::getName).orElse("Unknown");
        String cancellationReason = reason;
        if (payload != null && payload.get("reason") != null && !payload.get("reason").isBlank()) {
            cancellationReason = payload.get("reason");
        }

        appointmentService.cancelAppointment(appointmentId, cancellationReason, cancelledBy);
        return ResponseEntity.ok(Map.of("success", true, "message", "Appointment cancelled"));
    }

    @GetMapping("/doctor/schedule")
    public ResponseEntity<?> getDoctorSchedule(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            Optional<User> userOpt = currentUserService.resolveUser(authorization);
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            User user = userOpt.get();
            Role role = currentUserService.resolveEffectiveRole(user);
            if (role == Role.DOCTOR) {
                Optional<Doctor> doctorOpt = doctorRepository.findByUserId(user.getId());
                if (doctorOpt.isEmpty()) {
                    return ResponseEntity.ok(List.of());
                }
                List<AppointmentDTO> schedule = appointmentService.getDoctorSchedule(doctorOpt.get().getId(), date);
                return ResponseEntity.ok(schedule);
            }

            if (role == Role.PATIENT) {
                Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
                if (patientOpt.isEmpty()) {
                    return ResponseEntity.ok(List.of());
                }

                List<AppointmentDTO> patientSchedule = appointmentService.getPatientAppointments(patientOpt.get().getId())
                    .stream()
                    .filter(a -> date.equals(a.getAppointmentDate()))
                    .collect(Collectors.toList());

                return ResponseEntity.ok(patientSchedule);
            }

            // Admin can view all appointments for a date
            List<AppointmentDTO> adminSchedule = appointmentRepository.findAll()
                .stream()
                .filter(a -> date.equals(a.getAppointmentDate()))
                .map(a -> appointmentService.getAppointmentById(a.getId()))
                .collect(Collectors.toList());

            return ResponseEntity.ok(adminSchedule);
        } catch (Exception ex) {
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping("/confirm/{appointmentId}")
    public ResponseEntity<?> confirmAppointment(@PathVariable Long appointmentId) {
        AppointmentDTO appointment = appointmentService.confirmAppointment(appointmentId);
        return ResponseEntity.ok(Map.of("success", true, "appointment", appointment));
    }

    @PostMapping("/check-in/{appointmentId}")
    public ResponseEntity<?> checkInAppointment(@PathVariable Long appointmentId) {
        AppointmentDTO appointment = appointmentService.checkInAppointment(appointmentId);
        return ResponseEntity.ok(Map.of("success", true, "appointment", appointment));
    }

    @PostMapping("/complete/{appointmentId}")
    public ResponseEntity<?> completeAppointment(@PathVariable Long appointmentId, @RequestBody Map<String, String> details) {
        AppointmentDTO appointment = appointmentService.completeAppointment(
            appointmentId,
            details.getOrDefault("diagnosis", ""),
            details.getOrDefault("prescription", ""),
            details.getOrDefault("notes", "")
        );
        return ResponseEntity.ok(Map.of("success", true, "appointment", appointment));
    }

    @PostMapping("/reschedule/{appointmentId}")
    public ResponseEntity<?> rescheduleAppointment(
            @PathVariable Long appointmentId,
            @RequestBody Map<String, String> payload) {
        try {
            String dateValue = payload.get("date");
            String timeValue = payload.get("time");
            if (dateValue == null || dateValue.isBlank() || timeValue == null || timeValue.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "date and time are required"));
            }

            LocalDate newDate = LocalDate.parse(dateValue);
            LocalTime newTime = LocalTime.parse(timeValue);
            AppointmentDTO appointment = appointmentService.rescheduleAppointment(appointmentId, newDate, newTime);

            return ResponseEntity.ok(Map.of("success", true, "appointment", appointment));
        } catch (DateTimeParseException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid date or time format"));
        }
    }
}
