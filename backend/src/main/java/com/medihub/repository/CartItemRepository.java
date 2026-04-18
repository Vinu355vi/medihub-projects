package com.medihub.repository;

import com.medihub.model.CartItem;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);
    Optional<CartItem> findByIdAndUserId(Long id, Long userId);
    void deleteByUserId(Long userId);
    long deleteByUpdatedAtBefore(LocalDateTime threshold);
}
