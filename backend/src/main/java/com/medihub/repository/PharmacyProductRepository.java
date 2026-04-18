// backend/src/main/java/com/medihub/repository/PharmacyProductRepository.java
package com.medihub.repository;

import com.medihub.model.PharmacyProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PharmacyProductRepository extends JpaRepository<PharmacyProduct, Long> {
    
    List<PharmacyProduct> findByIsActiveTrue();
    
    List<PharmacyProduct> findByCategoryAndIsActiveTrue(String category);
    
    @Query("SELECT p FROM PharmacyProduct p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.genericName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.brandName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<PharmacyProduct> searchProducts(@Param("keyword") String keyword);
    
    @Query("SELECT DISTINCT p.category FROM PharmacyProduct p WHERE p.isActive = true")
    List<String> findAllDistinctCategories();
    
    @Query("SELECT p FROM PharmacyProduct p WHERE p.stockQuantity <= p.reorderLevel AND p.isActive = true")
    List<PharmacyProduct> findLowStockProducts();
    
    @Query("SELECT p FROM PharmacyProduct p WHERE p.expiryDate <= :thresholdDate AND p.isActive = true")
    List<PharmacyProduct> findExpiringProducts(@Param("thresholdDate") LocalDateTime thresholdDate);
    
    @Query("SELECT p FROM PharmacyProduct p WHERE p.isFeatured = true AND p.isActive = true")
    List<PharmacyProduct> findFeaturedProducts();
    
    boolean existsBySku(String sku);
}

