package com.medihub.repository;

import com.medihub.ai.DemandPrediction; // Import from ai package
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DemandPredictionRepository extends JpaRepository<DemandPrediction, Long> {
}