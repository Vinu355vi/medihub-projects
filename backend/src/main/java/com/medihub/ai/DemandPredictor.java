package com.medihub.ai;

import com.medihub.ai.DemandPrediction;
import com.medihub.model.InventoryItem;
import com.medihub.model.PharmacyProduct;
import com.medihub.repository.DemandPredictionRepository;
import com.medihub.repository.InventoryRepository;
import com.medihub.repository.PharmacyProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class DemandPredictor {

    @Autowired
    private PharmacyProductRepository pharmacyProductRepository;

    @Autowired
    private DemandPredictionRepository demandPredictionRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    public void predictDemandForAllProducts() {
        List<PharmacyProduct> products = pharmacyProductRepository.findByIsActiveTrue();
        for (PharmacyProduct product : products) {
            predictDemandForProduct(product.getId());
        }
    }
    
    public DemandPrediction predictDemandForProduct(Long productId) {
        PharmacyProduct product = pharmacyProductRepository.findById(productId).orElse(null);

        int stock;
        int reorderLevel;
        int reorderQuantity;
        int totalSold;

        if (product != null) {
            stock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            reorderLevel = product.getReorderLevel() != null ? product.getReorderLevel() : 10;
            reorderQuantity = product.getReorderQuantity() != null ? product.getReorderQuantity() : 50;
            totalSold = product.getTotalSold() != null ? product.getTotalSold() : 0;
        } else {
            InventoryItem inventoryItem = inventoryRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            stock = inventoryItem.getStock() != null ? inventoryItem.getStock() : 0;
            reorderLevel = 10;
            reorderQuantity = 40;
            totalSold = 20;
        }

        int baseDemand = Math.max(5, totalSold / 10);
        int shortagePressure = Math.max(0, reorderLevel - stock);
        int predicted = Math.max(1, baseDemand + shortagePressure + (reorderQuantity / 5));

        double confidence = stock <= reorderLevel ? 0.88 : 0.72;

        DemandPrediction prediction = new DemandPrediction();
        prediction.setProductId(productId);
        prediction.setDate(LocalDate.now().plusDays(7).toString());
        prediction.setPredictedDemand(predicted);
        prediction.setConfidence(confidence);

        return demandPredictionRepository.save(prediction);
    }

    public void generateReorderSuggestions() {
        predictDemandForAllProducts();
    }
}

