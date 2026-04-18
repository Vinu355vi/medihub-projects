package com.medihub.dto;

import java.util.Map;

public class AnalyticsDTO {
    private Integer total;
    private Map<String, Integer> byDoctor;
    private Map<String, Integer> byStatus;

    public Integer getTotal() { return total; }
    public void setTotal(Integer total) { this.total = total; }
    public Map<String, Integer> getByDoctor() { return byDoctor; }
    public void setByDoctor(Map<String, Integer> byDoctor) { this.byDoctor = byDoctor; }
    public Map<String, Integer> getByStatus() { return byStatus; }
    public void setByStatus(Map<String, Integer> byStatus) { this.byStatus = byStatus; }
}
