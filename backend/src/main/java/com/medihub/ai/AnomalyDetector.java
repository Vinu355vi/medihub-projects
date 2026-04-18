package com.medihub.ai;

import com.medihub.model.LoginAttempt;
import com.medihub.repository.LoginAttemptRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AnomalyDetector {

    @Autowired
    private LoginAttemptRepository loginAttemptRepository;

    public List<Map<String, Object>> detectSuspiciousLogins() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourAgo = now.minusHours(1);
        LocalDateTime tenMinutesAgo = now.minusMinutes(10);

        List<Map<String, Object>> anomalies = new ArrayList<>();
        List<String> usernamesWithFailures = loginAttemptRepository.findUsernamesWithFailuresSince(oneHourAgo);

        for (String username : usernamesWithFailures) {
            long failedLastHour = loginAttemptRepository
                .countByUsernameAndSuccessFalseAndTimestampAfter(username, oneHourAgo);

            if (failedLastHour >= 5) {
                anomalies.add(Map.of(
                    "type", "FAILED_LOGIN_SPIKE",
                    "username", username,
                    "severity", failedLastHour >= 10 ? "HIGH" : "MEDIUM",
                    "failedAttemptsLastHour", failedLastHour,
                    "message", "Multiple failed login attempts detected"
                ));
                continue;
            }

            long failedLast10Min = loginAttemptRepository
                .countByUsernameAndSuccessFalseAndTimestampAfter(username, tenMinutesAgo);
            if (failedLast10Min >= 3) {
                anomalies.add(Map.of(
                    "type", "BRUTE_FORCE_PATTERN",
                    "username", username,
                    "severity", "MEDIUM",
                    "failedAttemptsLast10Minutes", failedLast10Min,
                    "message", "Possible brute-force login pattern"
                ));
            }
        }

        return anomalies;
    }

    public void recordAttempt(String username, boolean success, String ipAddress, String userAgent) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.setUsername(username == null ? "unknown" : username.toLowerCase());
        attempt.setSuccess(success);
        attempt.setTimestamp(LocalDateTime.now());
        attempt.setIpAddress(ipAddress);
        attempt.setUserAgent(userAgent);
        loginAttemptRepository.save(attempt);
    }
}
