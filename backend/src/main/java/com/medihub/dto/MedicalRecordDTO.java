package com.medihub.dto;

import java.time.LocalDate;
import java.util.List;

public class MedicalRecordDTO {
    private Long recordId;
    private Long patientId;
    private LocalDate date;
    private String description;
    private List<String> files;

    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getFiles() { return files; }
    public void setFiles(List<String> files) { this.files = files; }
}

