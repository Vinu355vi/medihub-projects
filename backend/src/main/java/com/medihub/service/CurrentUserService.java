package com.medihub.service;

import com.medihub.model.User;
import com.medihub.model.Role;
import com.medihub.repository.DoctorRepository;
import com.medihub.repository.PatientRepository;
import com.medihub.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private static final String TOKEN_PREFIX = "Bearer mock-token-";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    public Optional<User> resolveUser(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(TOKEN_PREFIX)) {
            return Optional.empty();
        }

        try {
            String encodedEmail = authorizationHeader.substring(TOKEN_PREFIX.length());
            String email = new String(Base64.getDecoder().decode(encodedEmail), StandardCharsets.UTF_8);
            return userRepository.findByEmail(email);
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    public Role resolveEffectiveRole(User user) {
        if (user == null) {
            return Role.PATIENT;
        }
        if (user.getRole() == Role.ADMIN) {
            return Role.ADMIN;
        }
        if (doctorRepository.findByUserId(user.getId()).isPresent()) {
            return Role.DOCTOR;
        }
        if (patientRepository.findByUserId(user.getId()).isPresent()) {
            return Role.PATIENT;
        }
        return user.getRole() != null ? user.getRole() : Role.PATIENT;
    }
}
