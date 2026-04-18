package com.medihub.repository;
import com.medihub.model.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    List<LoginAttempt> findByTimestampAfter(LocalDateTime timestamp);

    List<LoginAttempt> findByUsernameAndTimestampAfter(String username, LocalDateTime timestamp);

    long countByUsernameAndSuccessFalseAndTimestampAfter(String username, LocalDateTime timestamp);

    @Query("SELECT DISTINCT l.username FROM LoginAttempt l WHERE l.success = false AND l.timestamp >= :timestamp")
    List<String> findUsernamesWithFailuresSince(@Param("timestamp") LocalDateTime timestamp);

    @Transactional
    @Modifying
    @Query("DELETE FROM LoginAttempt l WHERE l.timestamp < :timestamp")
    int deleteOlderThan(@Param("timestamp") LocalDateTime timestamp);
}
