// backend/src/main/java/com/medihub/scheduler/PharmacyInventoryScheduler.java
package com.medihub.scheduler;

import com.medihub.service.PharmacyService;
import com.medihub.ai.DemandPredictor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PharmacyInventoryScheduler {

    private static final Logger log = LoggerFactory.getLogger(PharmacyInventoryScheduler.class);
    
    @Autowired
    private PharmacyService pharmacyService;
    
    @Autowired
    private DemandPredictor demandPredictor;
    
    /**
     * Generate daily demand predictions
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void generateDailyDemandPredictions() {
        demandPredictor.predictDemandForAllProducts();
        log.info("Generated daily demand predictions");
    }
    
    /**
     * Check for low stock items and send alerts
     * Runs every 6 hours
     */
    @Scheduled(cron = "0 0 */6 * * ?")
    @Transactional
    public void checkLowStock() {
        pharmacyService.checkAndAlertLowStock();
        log.info("Checked for low stock items");
    }
    
    /**
     * Check for expiring products
     * Runs daily at 3 AM
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void checkExpiringProducts() {
        pharmacyService.checkAndAlertExpiringProducts();
        log.info("Checked for expiring products");
    }
    
    /**
     * Generate reorder suggestions
     * Runs every Monday at 9 AM
     */
    @Scheduled(cron = "0 0 9 ? * MON")
    @Transactional
    public void generateReorderSuggestions() {
        demandPredictor.generateReorderSuggestions();
        log.info("Generated reorder suggestions");
    }
    
    /**
     * Clean up old cart items
     * Runs daily at 4 AM
     */
    @Scheduled(cron = "0 0 4 * * ?")
    @Transactional
    public void cleanupOldCartItems() {
        pharmacyService.cleanupExpiredCartItems();
        log.info("Cleaned up old cart items");
    }
}

