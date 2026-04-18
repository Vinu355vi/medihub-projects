package com.medihub.service;

import com.medihub.model.Doctor;
import com.medihub.repository.DoctorRepository;
import com.medihub.dto.DoctorDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    public List<DoctorDTO> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private DoctorDTO convertToDTO(Doctor doctor) {
        DoctorDTO dto = new DoctorDTO();
        dto.setId(doctor.getId());
        if (doctor.getUser() != null) {
            dto.setName(doctor.getUser().getName());
            dto.setImage(doctor.getUser().getProfileImageUrl());
        }
        dto.setSpecialization(doctor.getSpecialization());
        dto.setExperience(doctor.getYearsOfExperience());
        dto.setRating(doctor.getRating() != null ? doctor.getRating().doubleValue() : 0.0);
        dto.setLocation(doctor.getClinicAddress());
        dto.setAvailability("Available"); // Logic can be improved
        return dto;
    }
}
