package com.medihub.service;

import com.medihub.model.*;
import com.medihub.repository.*;
import com.medihub.exception.*;
import com.medihub.dto.*;
import com.medihub.exception.BusinessException;
import com.medihub.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PharmacyService {
        // Returns total sales for all time
        public java.math.BigDecimal getTotalSales() {
            java.math.BigDecimal totalSales = orderRepository.getTotalSales(java.time.LocalDateTime.MIN, java.time.LocalDateTime.now());
            return totalSales != null ? totalSales : java.math.BigDecimal.ZERO;
        }
    
    @Autowired
    private PharmacyProductRepository productRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartItemRepository cartItemRepository;
    
    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private DrugInteractionRepository interactionRepository;
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private NotificationService notificationService;

    public List<CartItem> getCartItems(Long userId) {
        return cartItemRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Transactional
    public CartItem addToCart(Long userId, Long productId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BusinessException("Quantity must be at least 1");
        }

        PharmacyProduct product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!Boolean.TRUE.equals(product.getIsActive())) {
            throw new BusinessException("Product is not active");
        }

        CartItem cartItem = cartItemRepository
            .findByUserIdAndProductId(userId, productId)
            .orElseGet(CartItem::new);

        if (cartItem.getId() == null) {
            User user = new User();
            user.setId(userId);
            cartItem.setUser(user);
            cartItem.setProduct(product);
            cartItem.setQuantity(0);
        }

        int nextQuantity = cartItem.getQuantity() + quantity;
        if (product.getAvailableQuantity() != null && nextQuantity > product.getAvailableQuantity()) {
            throw new BusinessException("Requested quantity exceeds available stock for " + product.getName());
        }

        cartItem.setQuantity(nextQuantity);
        return cartItemRepository.save(cartItem);
    }

    @Transactional
    public CartItem updateCartItem(Long userId, Long cartItemId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BusinessException("Quantity must be at least 1");
        }

        CartItem cartItem = cartItemRepository.findByIdAndUserId(cartItemId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        PharmacyProduct product = cartItem.getProduct();
        if (product == null || !Boolean.TRUE.equals(product.getIsActive())) {
            throw new BusinessException("Product is not active");
        }

        if (product.getAvailableQuantity() != null && quantity > product.getAvailableQuantity()) {
            throw new BusinessException("Requested quantity exceeds available stock for " + product.getName());
        }

        cartItem.setQuantity(quantity);
        return cartItemRepository.save(cartItem);
    }

    @Transactional
    public void removeCartItem(Long userId, Long cartItemId) {
        CartItem cartItem = cartItemRepository.findByIdAndUserId(cartItemId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        cartItemRepository.delete(cartItem);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    @Transactional
    public OrderDTO checkoutCart(Long userId) {
        List<CartItem> cartItems = cartItemRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        if (cartItems.isEmpty()) {
            throw new BusinessException("Cart is empty");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        Order order = new Order();
        User orderUser = new User();
        orderUser.setId(userId);
        order.setUser(orderUser);
        order.setOrderNumber(generateOrderNumber());
        order.setStatus(Order.OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setShippingAddress("To be confirmed");

        for (CartItem cartItem : cartItems) {
            PharmacyProduct product = productRepository.findById(cartItem.getProduct().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + cartItem.getProduct().getId()));

            if (!Boolean.TRUE.equals(product.getIsActive())) {
                throw new BusinessException("Product is not active: " + product.getName());
            }

            int qty = cartItem.getQuantity() != null ? cartItem.getQuantity() : 0;
            if (qty <= 0) {
                throw new BusinessException("Invalid quantity for product: " + product.getName());
            }
            if (product.getAvailableQuantity() != null && qty > product.getAvailableQuantity()) {
                throw new BusinessException("Insufficient stock for product: " + product.getName());
            }

            BigDecimal unitPrice = product.getSellingPrice() != null ? product.getSellingPrice() : product.getPrice();
            if (unitPrice == null) {
                throw new BusinessException("Price not available for product: " + product.getName());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setQuantity(qty);
            orderItem.setUnitPrice(unitPrice);

            orderItems.add(orderItem);
            totalAmount = totalAmount.add(unitPrice.multiply(BigDecimal.valueOf(qty)));
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);

        orderItems.forEach(item -> item.setOrder(savedOrder));
        orderItemRepository.saveAll(orderItems);
        savedOrder.setItems(orderItems);

        cartItemRepository.deleteByUserId(userId);

        return convertToOrderDTO(savedOrder);
    }
    
    @Transactional
    public void deleteProduct(Long productId) {
        PharmacyProduct product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setIsActive(false);
        productRepository.save(product);
    }
    
    public List<PharmacyProductDTO> getAllProducts() {
        return productRepository.findByIsActiveTrue()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public PharmacyProductDTO createProduct(String name, String category, BigDecimal price, Integer stockQuantity) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("Product name is required");
        }
        if (category == null || category.isBlank()) {
            throw new BusinessException("Category is required");
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Price must be greater than 0");
        }
        if (stockQuantity == null || stockQuantity < 0) {
            throw new BusinessException("Stock quantity must be a non-negative number");
        }

        PharmacyProduct product = new PharmacyProduct();
        product.setName(name.trim());
        product.setGenericName(name.trim());
        product.setBrandName(name.trim());
        product.setCategory(category.trim());
        product.setPrice(price);
        product.setStockQuantity(stockQuantity);
        product.setReservedQuantity(0);
        product.setRequiresPrescription(false);
        product.setIsPrescriptionRequired(false);
        product.setIsActive(true);
        product.setIsFeatured(false);

        PharmacyProduct saved = productRepository.save(product);
        return convertToDTO(saved);
    }
    
    public PharmacyProductDTO getProductById(Long productId) {
        PharmacyProduct product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return convertToDTO(product);
    }
    
    public List<PharmacyProductDTO> searchProducts(String keyword) {
        return productRepository.searchProducts(keyword)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public List<PharmacyProductDTO> getProductsByCategory(String category) {
        return productRepository.findByCategoryAndIsActiveTrue(category)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public List<String> getAllCategories() {
        return productRepository.findAllDistinctCategories();
    }
    
    @Transactional
    public PharmacyProductDTO updateStock(Long productId, Integer quantity, String action) {
        PharmacyProduct product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        switch (action.toUpperCase()) {
            case "ADD":
                product.setStockQuantity(product.getStockQuantity() + quantity);
                break;
            case "REMOVE":
                if (product.getStockQuantity() < quantity) {
                    throw new BusinessException("Insufficient stock");
                }
                product.setStockQuantity(product.getStockQuantity() - quantity);
                break;
            case "RESERVE":
                if (product.getAvailableQuantity() < quantity) {
                    throw new BusinessException("Insufficient available stock");
                }
                product.setReservedQuantity(product.getReservedQuantity() + quantity);
                break;
            case "RELEASE":
                if (product.getReservedQuantity() < quantity) {
                    throw new BusinessException("Cannot release more than reserved quantity");
                }
                product.setReservedQuantity(product.getReservedQuantity() - quantity);
                break;
            default:
                throw new BusinessException("Invalid action");
        }
        
        PharmacyProduct updatedProduct = productRepository.save(product);
        
        // Check reorder level
        if (updatedProduct.getStockQuantity() <= updatedProduct.getReorderLevel()) {
            notificationService.sendLowStockAlert(updatedProduct);
        }
        
        return convertToDTO(updatedProduct);
    }
    
    @Transactional
    public OrderDTO createOrder(OrderRequestDTO orderRequest) {
        // Validate patient
        Patient patient = patientRepository.findById(orderRequest.getPatientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        
        // Create order
        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setPatient(patient);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING); // Fix: use standalone PaymentStatus
        order.setShippingAddress(orderRequest.getShippingAddress());
        order.setNotes(orderRequest.getNotes());
        
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        
        // Process order items
        for (OrderItemRequestDTO itemRequest : orderRequest.getItems()) {
            PharmacyProduct product = productRepository.findById(itemRequest.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemRequest.getProductId()));
            
            // Check stock availability
            if (!product.canOrderQuantity(itemRequest.getQuantity())) {
                throw new BusinessException("Insufficient stock for product: " + product.getName());
            }
            
            // Reserve stock
            updateStock(product.getId(), itemRequest.getQuantity(), "RESERVE");
            
            // Create order item
            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setUnitPrice(product.getSellingPrice());
            orderItem.setOrder(order);
            
            orderItems.add(orderItem);
            totalAmount = totalAmount.add(product.getSellingPrice()
                .multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
        }
        
        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);
        
        // Save order items
        orderItems.forEach(orderItem -> orderItem.setOrder(savedOrder));
        orderItemRepository.saveAll(orderItems);
        
        savedOrder.setItems(orderItems);
        
        // Check drug interactions
        checkDrugInteractions(orderItems);
        
        // Create payment
        PaymentDTO payment = paymentService.createPayment(savedOrder);
        savedOrder.setPaymentId(payment.getPaymentId());
        savedOrder.setPaymentStatus(PaymentStatus.PENDING); // Fix: use standalone PaymentStatus
        
        Order finalOrder = orderRepository.save(savedOrder);
        
        // Send order confirmation
        notificationService.sendOrderConfirmation(finalOrder);
        
        return convertToOrderDTO(finalOrder);
    }
    
    @Transactional
    public OrderDTO processPayment(Long orderId, PaymentRequestDTO paymentRequest) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (order.getPaymentStatus() != PaymentStatus.PENDING) { // Fix: use standalone PaymentStatus
            throw new BusinessException("Order payment already processed");
        }
        
        // Process payment
        PaymentResultDTO paymentResult = paymentService.processPayment(
            order.getPaymentId(), paymentRequest);
        
        if (paymentResult.isSuccess()) {
            order.setPaymentStatus(PaymentStatus.PAID); // Fix: use standalone PaymentStatus
            order.setPaymentMethod(paymentRequest.getPaymentMethod());
            order.setTransactionId(paymentResult.getTransactionId());
            order.setStatus(Order.OrderStatus.PROCESSING); // Fix: CONFIRMED -> PROCESSING
            
            // Update stock (convert reserved to sold)
            for (OrderItem item : order.getItems()) {
                updateStock(item.getProduct().getId(), item.getQuantity(), "REMOVE");
                updateStock(item.getProduct().getId(), item.getQuantity(), "RELEASE");
                
                // Update product sales
                item.getProduct().setTotalSold(
                    item.getProduct().getTotalSold() + item.getQuantity());
                productRepository.save(item.getProduct());
            }
            
            Order updatedOrder = orderRepository.save(order);
            
            // Send payment confirmation
            notificationService.sendPaymentConfirmation(updatedOrder);
            
            return convertToOrderDTO(updatedOrder);
        } else {
            order.setPaymentStatus(PaymentStatus.FAILED); // Fix: use standalone PaymentStatus
            orderRepository.save(order);
            
            // Release reserved stock
            for (OrderItem item : order.getItems()) {
                updateStock(item.getProduct().getId(), item.getQuantity(), "RELEASE");
            }
            
            throw new BusinessException("Payment failed: " + paymentResult.getErrorMessage());
        }
    }
    
    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (status != Order.OrderStatus.DELIVERED && status != Order.OrderStatus.CANCELLED) {
            throw new BusinessException("Only DELIVERED or CANCELLED status is allowed");
        }

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new BusinessException("Only PENDING orders can be updated");
        }
        
        order.setStatus(status);

        if (status == Order.OrderStatus.DELIVERED && order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                PharmacyProduct product = item.getProduct();
                if (product != null && item.getQuantity() != null && item.getQuantity() > 0) {
                    updateStock(product.getId(), item.getQuantity(), "REMOVE");
                }
            }
        }

        Order updatedOrder = orderRepository.save(order);
        
        // Send status update notification
        notificationService.sendOrderStatusUpdate(updatedOrder);
        
        return convertToOrderDTO(updatedOrder);
    }
    
    public List<OrderDTO> getPatientOrders(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return orderRepository.findByUserIdOrderByCreatedAtDesc(patient.getUser().getId())
            .stream()
            .map(this::convertToOrderDTO)
            .collect(Collectors.toList());
    }
    
    public OrderDTO getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return convertToOrderDTO(order);
    }
    
    public List<OrderDTO> getAllOrders(Order.OrderStatus status, LocalDateTime startDate, LocalDateTime endDate) {
        if (status != null && startDate != null && endDate != null) {
            return orderRepository.findByStatusAndCreatedAtBetween(status, startDate, endDate)
                .stream()
                .map(this::convertToOrderDTO)
                .collect(Collectors.toList());
        } else if (status != null) {
            return orderRepository.findByStatus(status)
                .stream()
                .map(this::convertToOrderDTO)
                .collect(Collectors.toList());
        } else if (startDate != null && endDate != null) {
            return orderRepository.findByCreatedAtBetween(startDate, endDate)
                .stream()
                .map(this::convertToOrderDTO)
                .collect(Collectors.toList());
        } else {
            return orderRepository.findAll()
                .stream()
                .map(this::convertToOrderDTO)
                .collect(Collectors.toList());
        }
    }
    
    public List<PharmacyProductDTO> getLowStockProducts() {
        return productRepository.findLowStockProducts()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public List<PharmacyProductDTO> getExpiringProducts(int daysThreshold) {
        LocalDateTime thresholdDate = LocalDateTime.now().plusDays(daysThreshold);
        return productRepository.findExpiringProducts(thresholdDate)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public Map<String, Object> getSalesStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> stats = new HashMap<>();
        
        // Total sales
        BigDecimal totalSales = orderRepository.getTotalSales(startDate, endDate);
        stats.put("totalSales", totalSales != null ? totalSales : BigDecimal.ZERO);
        
        // Order count
        Long orderCount = orderRepository.countByCreatedAtBetween(startDate, endDate);
        stats.put("orderCount", orderCount != null ? orderCount : 0);
        
        // Average order value
        if (orderCount != null && orderCount > 0 && totalSales != null) {
            stats.put("averageOrderValue", totalSales.divide(
                BigDecimal.valueOf(orderCount), 2, BigDecimal.ROUND_HALF_UP));
        } else {
            stats.put("averageOrderValue", BigDecimal.ZERO);
        }
        
        // Top selling products
        List<Object[]> topProducts = orderRepository.getTopSellingProducts(startDate, endDate, PageRequest.of(0, 10));
        List<Map<String, Object>> topProductsList = topProducts.stream()
            .map(obj -> {
                Map<String, Object> productMap = new HashMap<>();
                productMap.put("productId", obj[0]);
                productMap.put("productName", obj[1]);
                productMap.put("totalQuantity", obj[2]);
                productMap.put("totalRevenue", obj[3]);
                return productMap;
            })
            .collect(Collectors.toList());
        stats.put("topProducts", topProductsList);
        
        // Sales by category
        List<Object[]> salesByCategory = orderRepository.getSalesByCategory(startDate, endDate);
        List<Map<String, Object>> categoryStats = salesByCategory.stream()
            .map(obj -> {
                Map<String, Object> categoryMap = new HashMap<>();
                categoryMap.put("category", obj[0]);
                categoryMap.put("totalSales", obj[1]);
                categoryMap.put("orderCount", obj[2]);
                return categoryMap;
            })
            .collect(Collectors.toList());
        stats.put("salesByCategory", categoryStats);
        
        return stats;
    }
    
    public List<DrugInteractionDTO> checkDrugInteractions(List<OrderItem> orderItems) {
        List<String> drugNames = orderItems.stream()
            .map(item -> item.getProduct().getGenericName())
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
        
        List<DrugInteraction> interactions = interactionRepository
            .findInteractionsByDrugNames(drugNames);
        
        return interactions.stream()
            .map(this::convertToInteractionDTO)
            .collect(Collectors.toList());
    }
    
    private String generateOrderNumber() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = String.valueOf((int) (Math.random() * 1000));
        return "ORD-" + timestamp.substring(timestamp.length() - 8) + "-" + random;
    }
    
    private PharmacyProductDTO convertToDTO(PharmacyProduct product) {
        PharmacyProductDTO dto = new PharmacyProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setGenericName(product.getGenericName());
        dto.setBrandName(product.getBrandName());
        dto.setCategory(product.getCategory());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setDiscountPrice(product.getDiscountPrice());
        dto.setDiscountPercentage(product.getDiscountPercentage());
        dto.setStockQuantity(product.getStockQuantity());
        dto.setAvailableQuantity(product.getAvailableQuantity());
        dto.setImageUrl(product.getImageUrl());
        dto.setRequiresPrescription(product.getRequiresPrescription());
        dto.setRating(product.getRating());
        dto.setTotalRatings(product.getTotalRatings());
        dto.setIsInStock(product.isInStock());
        dto.setSellingPrice(product.getSellingPrice());
        return dto;
    }
    
    private OrderDTO convertToOrderDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        if (order.getUser() != null) {
            dto.setUserId(order.getUser().getId());
            dto.setPatientName(order.getUser().getName());
        }
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setTransactionId(order.getTransactionId());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setCreatedAt(order.getCreatedAt());
        
        List<OrderItemDTO> itemDTOs = order.getItems().stream()
            .map(this::convertToItemDTO)
            .collect(Collectors.toList());
        dto.setItems(itemDTOs);
        
        return dto;
    }
    
    private OrderItemDTO convertToItemDTO(OrderItem item) {
        OrderItemDTO dto = new OrderItemDTO();
        if (item.getProduct() != null) {
            dto.setProductId(item.getProduct().getId());
            dto.setProductName(item.getProduct().getName());
        } else {
            dto.setProductName(item.getProductName() != null ? item.getProductName() : "Unknown Product");
        }
        dto.setQuantity(item.getQuantity());
        BigDecimal unitPrice = item.getUnitPrice() != null
            ? item.getUnitPrice()
            : (item.getPrice() != null ? BigDecimal.valueOf(item.getPrice()) : BigDecimal.ZERO);
        dto.setUnitPrice(unitPrice);
        dto.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 0)));
        return dto;
    }
    
    private DrugInteractionDTO convertToInteractionDTO(DrugInteraction interaction) {
        DrugInteractionDTO dto = new DrugInteractionDTO();
        // Assuming interaction stores drug names as strings not full objects
        dto.setDrug1Name(interaction.getDrug1());
        dto.setDrug2Name(interaction.getDrug2());
        // dto.setInteractionType(interaction.getInteractionType()); // Method not in model
        // dto.setRecommendation(interaction.getRecommendation()); // Method not in model
        dto.setDescription(interaction.getDescription());
        dto.setSeverity(interaction.getSeverity());
        return dto;
    }

    public void checkAndAlertLowStock() {
        // Stub
    }

    public void checkAndAlertExpiringProducts() {
        // Stub
    }

    public void cleanupExpiredCartItems() {
        cartItemRepository.deleteByUpdatedAtBefore(LocalDateTime.now().minusDays(30));
    }
}
