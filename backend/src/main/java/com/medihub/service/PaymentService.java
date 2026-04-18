package com.medihub.service;

import com.medihub.dto.PaymentDTO;
import com.medihub.dto.PaymentRequestDTO;
import com.medihub.dto.PaymentResultDTO;
import com.medihub.model.Order;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PaymentService {

    public PaymentDTO createPayment(Order order) {
        PaymentDTO payment = new PaymentDTO();
        payment.setPaymentId(UUID.randomUUID().toString());
        payment.setAmount(order.getTotalAmount());
        return payment;
    }

    public PaymentResultDTO processPayment(String paymentIds, PaymentRequestDTO request) {
        // Mock payment processing
        PaymentResultDTO result = new PaymentResultDTO();
        result.setSuccess(true);
        result.setTransactionId("TXN-" + System.currentTimeMillis());
        return result;
    }

    public PaymentResultDTO processPayment(PaymentRequestDTO request) {
        return processPayment(null, request);
    }
}