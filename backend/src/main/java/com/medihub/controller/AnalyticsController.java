package com.medihub.controller;

import com.medihub.dto.AnalyticsAppointmentsDTO;
import com.medihub.dto.AnalyticsHealthMetricsDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @GetMapping("/appointments")
    public ResponseEntity<AnalyticsAppointmentsDTO> getAppointmentsAnalytics(@RequestParam(required = false) String dateRange) {
        AnalyticsAppointmentsDTO dto = new AnalyticsAppointmentsDTO();
        dto.setTotal(100);
        dto.setByDoctor(Map.of("Dr. Smith", 40, "Dr. Doe", 60));
        dto.setByStatus(Map.of("SCHEDULED", 70, "COMPLETED", 30));
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/health-metrics")
    public ResponseEntity<AnalyticsHealthMetricsDTO> getHealthMetrics(@RequestParam(required = false) String dateRange) {
        AnalyticsHealthMetricsDTO dto = new AnalyticsHealthMetricsDTO();
        dto.setMetrics(List.of(Map.of("metric", "bloodPressure", "value", 120)));
        return ResponseEntity.ok(dto);
    }
}

