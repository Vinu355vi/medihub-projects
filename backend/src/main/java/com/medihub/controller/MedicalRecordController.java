package com.medihub.controller;

import com.medihub.dto.MedicalRecordDTO;
import com.medihub.model.Appointment;
import com.medihub.model.Doctor;
import com.medihub.model.MedicalRecord;
import com.medihub.model.Patient;
import com.medihub.model.Role;
import com.medihub.model.User;
import com.medihub.repository.AppointmentRepository;
import com.medihub.repository.DoctorRepository;
import com.medihub.repository.MedicalRecordRepository;
import com.medihub.repository.PatientRepository;
import com.medihub.repository.UserRepository;
import com.medihub.service.CurrentUserService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/medical-records")
@CrossOrigin(origins = "*")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<MedicalRecordDTO>> getAllRecords(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        User user = userOpt.get();
        List<MedicalRecord> records;

        if (user.getRole() == Role.ADMIN) {
            records = medicalRecordRepository.findAll();
        } else if (user.getRole() == Role.DOCTOR) {
            Optional<Doctor> doctorOpt = doctorRepository.findByUserId(user.getId());
            if (doctorOpt.isPresent()) {
                List<Appointment> doctorAppointments = appointmentRepository.findByDoctorId(doctorOpt.get().getId());
                Set<Long> patientIds = doctorAppointments.stream()
                    .map(app -> app.getPatient().getId())
                    .collect(Collectors.toSet());
                records = new ArrayList<>();
                for (Long patientId : patientIds) {
                    records.addAll(medicalRecordRepository.findPatientRecordsSorted(patientId));
                }
            } else {
                records = List.of();
            }
        } else {
            Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
            if (patientOpt.isPresent()) {
                records = medicalRecordRepository.findPatientRecordsSorted(patientOpt.get().getId());
            } else {
                records = List.of();
            }
        }

        List<MedicalRecordDTO> response = records.stream()
            .sorted(Comparator.comparing(MedicalRecord::getRecordDate, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(MedicalRecord::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toDto)
            .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{patientId}")
    public ResponseEntity<List<MedicalRecordDTO>> getRecords(
            @PathVariable Long patientId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        User user = userOpt.get();
        if (user.getRole() == Role.PATIENT) {
            Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
            if (patientOpt.isEmpty() || !patientOpt.get().getId().equals(patientId)) {
                return ResponseEntity.ok(List.of());
            }
        }

        List<MedicalRecordDTO> records = medicalRecordRepository.findPatientRecordsSorted(patientId)
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());

        return ResponseEntity.ok(records);
    }

    @PostMapping
    public ResponseEntity<?> addRecord(@RequestBody MedicalRecordDTO dto) {
        MedicalRecord record = new MedicalRecord();

        if (dto.getPatientId() != null) {
            Optional<Patient> patientOpt = patientRepository.findById(dto.getPatientId());
            if (patientOpt.isEmpty()) {
                // Try finding by User ID if Patient ID not found
                patientOpt = patientRepository.findByUserId(dto.getPatientId());
            }
            
            if (patientOpt.isPresent()) {
                record.setPatient(patientOpt.get());
            } else {
                Optional<User> userOpt = userRepository.findById(dto.getPatientId());
                if (userOpt.isPresent()) {
                    Patient patient = new Patient();
                    patient.setUser(userOpt.get());
                    patient = patientRepository.save(patient);
                    record.setPatient(patient);
                } else {
                    return ResponseEntity.badRequest().body("Invalid Patient ID or User ID.");
                }
            }
        } else {
            return ResponseEntity.badRequest().body("Patient ID is required");
        }

        record.setRecordDate(dto.getDate() != null ? dto.getDate() : LocalDate.now());
        record.setDescription(dto.getDescription());

        if (dto.getFiles() != null && !dto.getFiles().isEmpty()) {
            record.setAttachmentUrl(dto.getFiles().get(0));
        }

        MedicalRecord saved = medicalRecordRepository.save(record);
        return ResponseEntity.ok(toDto(saved));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    public ResponseEntity<?> updateRecord(@PathVariable Long id, @RequestBody MedicalRecordDTO dto) {
        Optional<MedicalRecord> recordOpt = medicalRecordRepository.findById(id);
        if (recordOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        MedicalRecord record = recordOpt.get();
        if (dto.getDescription() != null) record.setDescription(dto.getDescription());
        if (dto.getDate() != null) record.setRecordDate(dto.getDate());
        
        if (dto.getFiles() != null && !dto.getFiles().isEmpty()) {
            record.setAttachmentUrl(dto.getFiles().get(0));
        }

        MedicalRecord saved = medicalRecordRepository.save(record);
        return ResponseEntity.ok(toDto(saved));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecord(@PathVariable Long id) {
        if (!medicalRecordRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        medicalRecordRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private MedicalRecordDTO toDto(MedicalRecord record) {
        MedicalRecordDTO dto = new MedicalRecordDTO();
        dto.setRecordId(record.getId());
        dto.setPatientId(record.getPatient() != null ? record.getPatient().getId() : null);
        dto.setDate(record.getRecordDate());
        dto.setDescription(record.getDescription());

        List<String> files = new ArrayList<>();
        if (record.getAttachmentUrl() != null && !record.getAttachmentUrl().isBlank()) {
            files.add(record.getAttachmentUrl());
        }
        dto.setFiles(files);

        return dto;
    }
}
