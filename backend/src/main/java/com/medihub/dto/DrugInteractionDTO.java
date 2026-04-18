package com.medihub.dto;

public class DrugInteractionDTO {
    
    private Long drug1Id;
    private String drug1Name;
    private Long drug2Id;
    private String drug2Name;
    private String interactionType; // SEVERE, MODERATE, MINOR
    private String description;
    private String recommendation;
    private String severity;

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public Long getDrug1Id() { return drug1Id; }
    public void setDrug1Id(Long drug1Id) { this.drug1Id = drug1Id; }
    public String getDrug1Name() { return drug1Name; }
    public void setDrug1Name(String drug1Name) { this.drug1Name = drug1Name; }
    public Long getDrug2Id() { return drug2Id; }
    public void setDrug2Id(Long drug2Id) { this.drug2Id = drug2Id; }
    public String getDrug2Name() { return drug2Name; }
    public void setDrug2Name(String drug2Name) { this.drug2Name = drug2Name; }
    public String getInteractionType() { return interactionType; }
    public void setInteractionType(String interactionType) { this.interactionType = interactionType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
}
