package com.medihub.controller;

import com.medihub.exception.BusinessException;
import com.medihub.exception.ResourceNotFoundException;
import com.medihub.model.CartItem;
import com.medihub.model.Order;
import com.medihub.dto.OrderDTO;
import com.medihub.dto.OrderItemDTO;
import com.medihub.dto.PharmacyProductDTO;
import com.medihub.model.Role;
import com.medihub.model.User;
import com.medihub.repository.PatientRepository;
import com.medihub.service.CurrentUserService;
import com.medihub.service.PharmacyService;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pharmacy")
@CrossOrigin(origins = "*")
public class PharmacyController {

    @Autowired
    private PharmacyService pharmacyService;

    @Autowired
    private CurrentUserService currentUserService;

    @Autowired
    private PatientRepository patientRepository;

    @GetMapping("/products")
    public ResponseEntity<?> getProducts() {
        List<Map<String, Object>> products = pharmacyService.getAllProducts().stream()
            .map(this::toProductResponse)
            .collect(Collectors.toList());

        return ResponseEntity.ok(products);
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> payload) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Role role = currentUserService.resolveEffectiveRole(userOpt.get());
        if (role != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Only admin can add products"));
        }

        String name = payload.get("name") != null ? String.valueOf(payload.get("name")) : null;
        String category = payload.get("category") != null ? String.valueOf(payload.get("category")) : null;

        BigDecimal price = null;
        if (payload.get("price") != null) {
            try {
                price = new BigDecimal(String.valueOf(payload.get("price")));
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid price"));
            }
        }

        Integer stock = 0;
        if (payload.get("stock") != null) {
            try {
                stock = Integer.parseInt(String.valueOf(payload.get("stock")));
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid stock"));
            }
        }

        PharmacyProductDTO created = pharmacyService.createProduct(name, category, price, stock);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "product", toProductResponse(created)
        ));
    }

    @DeleteMapping("/products/{productId}")
    public ResponseEntity<?> deleteProduct(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long productId) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Role role = currentUserService.resolveEffectiveRole(userOpt.get());
        if (role != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Only admin can delete products"));
        }

        pharmacyService.deleteProduct(productId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Product deleted"));
    }

    @GetMapping("/cart")
    public ResponseEntity<?> getCart(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        Role role = currentUserService.resolveEffectiveRole(userOpt.get());
        if (role != Role.PATIENT) {
            return ResponseEntity.status(403).body(Map.of("message", "Only patients can access cart"));
        }

        List<CartItem> items = pharmacyService.getCartItems(userOpt.get().getId());
        List<Map<String, Object>> rows = items.stream().map((item) -> {
            BigDecimal price = item.getProduct().getSellingPrice() != null
                ? item.getProduct().getSellingPrice()
                : item.getProduct().getPrice();
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));

            Map<String, Object> row = new HashMap<>();
            row.put("id", item.getId());
            row.put("productId", item.getProduct().getId());
            row.put("name", item.getProduct().getName());
            row.put("category", item.getProduct().getCategory());
            row.put("price", price);
            row.put("stock", item.getProduct().getAvailableQuantity());
            row.put("quantity", item.getQuantity());
            row.put("subtotal", subtotal);
            return row;
        }).collect(Collectors.toList());

        BigDecimal total = rows.stream()
            .map(r -> (BigDecimal) r.get("subtotal"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseEntity.ok(Map.of(
            "items", rows,
            "itemCount", rows.size(),
            "total", total
        ));
    }

    @PostMapping("/cart/items")
    public ResponseEntity<?> addCartItem(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> payload) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Role role = currentUserService.resolveEffectiveRole(userOpt.get());
        if (role != Role.PATIENT) {
            // Allow ADMIN to add items for testing purposes, or strictly enforce PATIENT
            // return ResponseEntity.status(403).body(Map.of("message", "Only patients can add cart items"));
        }

        try {
            Long productId = Long.parseLong(String.valueOf(payload.get("productId")));
            Integer quantity = Integer.parseInt(String.valueOf(payload.getOrDefault("quantity", 1)));
            
            // If the user is admin, they might be testing, but CartItem requires a user.
            // So we use the current user's ID.
            CartItem item = pharmacyService.addToCart(userOpt.get().getId(), productId, quantity);
            return ResponseEntity.ok(Map.of("success", true, "cartItemId", item.getId()));
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(404).body(Map.of("message", ex.getMessage()));
        } catch (BusinessException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid cart payload: " + ex.getMessage()));
        }
    }

    @PutMapping("/cart/items/{cartItemId}")
    public ResponseEntity<?> updateCartItem(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long cartItemId,
            @RequestBody Map<String, Object> payload) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Role role = currentUserService.resolveEffectiveRole(userOpt.get());
        if (role != Role.PATIENT) {
            return ResponseEntity.status(403).body(Map.of("message", "Only patients can update cart items"));
        }

        try {
            Integer quantity = Integer.parseInt(String.valueOf(payload.get("quantity")));
            CartItem item = pharmacyService.updateCartItem(userOpt.get().getId(), cartItemId, quantity);
            return ResponseEntity.ok(Map.of("success", true, "cartItemId", item.getId()));
        } catch (BusinessException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid cart payload"));
        }
    }

    @DeleteMapping("/cart/items/{cartItemId}")
    public ResponseEntity<?> removeCartItem(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long cartItemId) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Role role = currentUserService.resolveEffectiveRole(userOpt.get());
        if (role != Role.PATIENT) {
            return ResponseEntity.status(403).body(Map.of("message", "Only patients can remove cart items"));
        }

        pharmacyService.removeCartItem(userOpt.get().getId(), cartItemId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/cart/clear")
    public ResponseEntity<?> clearCart(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Role role = currentUserService.resolveEffectiveRole(userOpt.get());
        if (role != Role.PATIENT) {
            return ResponseEntity.status(403).body(Map.of("message", "Only patients can clear cart"));
        }

        pharmacyService.clearCart(userOpt.get().getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        User user = userOpt.get();
        Role role = currentUserService.resolveEffectiveRole(user);
        List<OrderDTO> orders;

        if (role == Role.PATIENT) {
            Optional<com.medihub.model.Patient> patientOpt = patientRepository.findByUserId(user.getId());
            if (patientOpt.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            orders = pharmacyService.getPatientOrders(patientOpt.get().getId());
        } else if (role == Role.DOCTOR) {
            return ResponseEntity.status(403).body(Map.of("message", "Doctors do not have pharmacy order access"));
        } else {
            orders = pharmacyService.getAllOrders(null, null, null);
        }

        List<Map<String, Object>> response = orders.stream()
            .map(order -> {
                Map<String, Object> row = new HashMap<>();
                row.put("orderId", order.getId());
                row.put("id", order.getOrderNumber() != null ? order.getOrderNumber() : order.getId());
                row.put("patient", order.getPatientName() != null ? order.getPatientName() : "Unknown Patient");
                row.put("items", order.getItems() == null
                    ? "-"
                    : order.getItems().stream().map(OrderItemDTO::getProductName).collect(Collectors.joining(", ")));
                row.put("itemDetails", order.getItems());
                row.put("total", order.getTotalAmount());
                row.put("status", order.getStatus() != null ? order.getStatus().name() : "PENDING");
                row.put("createdAt", order.getCreatedAt());
                return row;
            })
            .sorted((a, b) -> {
                LocalDateTime aDate = (LocalDateTime) a.get("createdAt");
                LocalDateTime bDate = (LocalDateTime) b.get("createdAt");
                if (aDate == null && bDate == null) return 0;
                if (aDate == null) return 1;
                if (bDate == null) return -1;
                return bDate.compareTo(aDate);
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/orders")
    public ResponseEntity<?> checkoutCart(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Role role = currentUserService.resolveEffectiveRole(userOpt.get());
        if (role != Role.PATIENT) {
            return ResponseEntity.status(403).body(Map.of("message", "Only patients can place orders"));
        }

        OrderDTO order = pharmacyService.checkoutCart(userOpt.get().getId());
        return ResponseEntity.ok(Map.of("success", true, "order", order));
    }

    @PostMapping("/order")
    public ResponseEntity<?> legacyCheckoutCart(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return checkoutCart(authorization);
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long orderId,
            @RequestBody Map<String, String> payload) {
        Optional<User> userOpt = currentUserService.resolveUser(authorization);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Role role = currentUserService.resolveEffectiveRole(userOpt.get());
        if (role != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Only admin can update order status"));
        }

        String rawStatus = payload.get("status");
        if (rawStatus == null || rawStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "status is required"));
        }

        OrderDTO existing = pharmacyService.getOrderById(orderId);
        if (existing.getStatus() != Order.OrderStatus.PENDING) {
            return ResponseEntity.status(409).body(Map.of("message", "Order status is final and cannot be edited"));
        }

        try {
            Order.OrderStatus nextStatus = Order.OrderStatus.valueOf(rawStatus.toUpperCase());
            if (nextStatus != Order.OrderStatus.DELIVERED && nextStatus != Order.OrderStatus.CANCELLED) {
                return ResponseEntity.badRequest().body(Map.of("message", "Only DELIVERED or CANCELLED are allowed"));
            }
            OrderDTO updated = pharmacyService.updateOrderStatus(orderId, nextStatus);
            return ResponseEntity.ok(Map.of("success", true, "order", updated));
        } catch (BusinessException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value"));
        }
    }

    private Map<String, Object> toProductResponse(PharmacyProductDTO product) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", product.getId());
        row.put("name", product.getName());
        row.put("genericName", product.getGenericName());
        row.put("category", product.getCategory());
        row.put("price", product.getSellingPrice() != null ? product.getSellingPrice() : product.getPrice());
        row.put("stock", product.getAvailableQuantity() != null ? product.getAvailableQuantity() : product.getStockQuantity());
        return row;
    }
}
