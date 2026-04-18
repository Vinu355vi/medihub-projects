package com.medihub.repository;

import com.medihub.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {
	// Counts items with stock less than or equal to 10 (low stock threshold)
	@org.springframework.data.jpa.repository.Query("SELECT COUNT(i) FROM InventoryItem i WHERE i.stock <= 10")
	Long countLowStockItems();
}

