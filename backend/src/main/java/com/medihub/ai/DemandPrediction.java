package com.medihub.ai;

import javax.persistence.Embeddable; // Optional: depending on usage
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class DemandPrediction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long productId;
    private String date;
    private int predictedDemand;
    private double confidence;

    public DemandPrediction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public int getPredictedDemand() { return predictedDemand; }
    public void setPredictedDemand(int predictedDemand) { this.predictedDemand = predictedDemand; }
    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
}
