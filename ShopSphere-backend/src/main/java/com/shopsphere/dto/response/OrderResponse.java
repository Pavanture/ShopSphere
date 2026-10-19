package com.shopsphere.dto.response;

import com.shopsphere.entity.enums.OrderStatus;
import com.shopsphere.entity.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {

    private Long id;
    private List<OrderItemResponse> orderItems;
    private BigDecimal totalAmount;
    private OrderStatus orderStatus;
    private PaymentStatus paymentStatus;
    private String qikinkOrderId;
    private String qikinkStatus;
    private String qikinkError;
    private AddressResponse shippingAddress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
