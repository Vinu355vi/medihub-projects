package com.medihub.repository;

import com.medihub.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.math.BigDecimal; // Added import

import org.springframework.data.domain.Pageable;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Order> findByStatus(Order.OrderStatus status);
    
    List<Order> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    Long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    List<Order> findByStatusAndCreatedAtBetween(Order.OrderStatus status, LocalDateTime startDate, LocalDateTime endDate);
    
    Order findByOrderNumber(String orderNumber);
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.paymentStatus = 'PAID' AND o.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal getTotalSales(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT oi.product.id, oi.product.name, SUM(oi.quantity), SUM(oi.quantity * oi.unitPrice) " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "WHERE o.createdAt BETWEEN :startDate AND :endDate AND o.paymentStatus = 'PAID' " +
           "GROUP BY oi.product.id, oi.product.name " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> getTopSellingProducts(@Param("startDate") LocalDateTime startDate, 
                                         @Param("endDate") LocalDateTime endDate,
                                         Pageable pageable);
    
    @Query("SELECT p.category, SUM(oi.quantity * oi.unitPrice), COUNT(DISTINCT o.id) " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "JOIN oi.product p " +
           "WHERE o.createdAt BETWEEN :startDate AND :endDate AND o.paymentStatus = 'PAID' " +
           "GROUP BY p.category")
    List<Object[]> getSalesByCategory(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);
}