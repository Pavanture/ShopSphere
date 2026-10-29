package com.shopsphere.mapper;

import com.shopsphere.dto.response.OrderItemResponse;
import com.shopsphere.dto.response.OrderResponse;
import com.shopsphere.entity.Order;
import com.shopsphere.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderMapper {

    private final AddressMapper addressMapper;

    public OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getOrderItems().stream()
                .map(this::toItemResponse)
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .orderItems(items)
                .totalAmount(order.getTotalAmount())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .shippingAddress(addressMapper.toResponse(order.getShippingAddress()))
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    public OrderItemResponse toItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProductName())
                .variantColor(item.getVariantColor())
                .variantSize(item.getVariantSize())
                .priceAtPurchase(item.getPriceAtPurchase())
                .quantity(item.getQuantity())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
