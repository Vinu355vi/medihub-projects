package com.medihub.dto;

import java.util.List;

public class PharmacyOrderRequestDTO {
    private Long userId;
    private List<OrderItem> items;

    public static class OrderItem {
        private Long medicineId;
        private Integer quantity;
        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}

