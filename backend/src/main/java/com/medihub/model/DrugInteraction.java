package com.medihub.model;

import javax.persistence.*;

@Entity
public class DrugInteraction {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String drug1;
    private String drug2;
    private String description;
    private String severity;

    public DrugInteraction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDrug1() { return drug1; }
    public void setDrug1(String drug1) { this.drug1 = drug1; }
    public String getDrug2() { return drug2; }
    public void setDrug2(String drug2) { this.drug2 = drug2; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
}
