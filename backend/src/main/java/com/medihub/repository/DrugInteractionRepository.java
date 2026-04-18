package com.medihub.repository;

import com.medihub.model.DrugInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DrugInteractionRepository extends JpaRepository<DrugInteraction, Long> {
    
    @Query("SELECT di FROM DrugInteraction di WHERE " +
           "(di.drug1 IN :drugNames AND di.drug2 IN :drugNames) " +
           "AND di.drug1 <> di.drug2")
    List<DrugInteraction> findInteractionsByDrugNames(@Param("drugNames") List<String> drugNames);
    
    DrugInteraction findByDrug1AndDrug2(String drug1, String drug2);
    
    @Query("SELECT di FROM DrugInteraction di WHERE " +
           "di.severity = 'SEVERE' " +
           "ORDER BY di.drug1, di.drug2")
    List<DrugInteraction> findSevereInteractions();
}