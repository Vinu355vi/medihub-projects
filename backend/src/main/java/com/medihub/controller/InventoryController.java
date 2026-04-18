package com.medihub.controller;

import com.medihub.dto.InventoryItemDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.*;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    @Autowired
    private com.medihub.repository.InventoryRepository inventoryRepository;

    @GetMapping
    public ResponseEntity<List<InventoryItemDTO>> getInventory() {
        List<com.medihub.model.InventoryItem> itemList = inventoryRepository.findAll();
        List<InventoryItemDTO> items = new ArrayList<>();
        for (com.medihub.model.InventoryItem item : itemList) {
            InventoryItemDTO dto = new InventoryItemDTO();
            dto.setId(item.getId());
            dto.setName(item.getName());
            dto.setStock(item.getStock());
            // Add other fields as needed
            items.add(dto);
        }
        return ResponseEntity.ok(items);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStock(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer stock = body.get("stock");
        Optional<com.medihub.model.InventoryItem> itemOpt = inventoryRepository.findById(id);
        if (!itemOpt.isPresent()) {
            return ResponseEntity.status(404).body(Map.of("error", "Inventory item not found"));
        }
        com.medihub.model.InventoryItem item = itemOpt.get();
        item.setStock(stock);
        inventoryRepository.save(item);
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setStock(item.getStock());
        return ResponseEntity.ok(Map.of("message", "Stock updated", "item", dto));
    }
}
