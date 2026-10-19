package com.shopsphere.service;

import com.shopsphere.dto.request.CreateOrderRequest;
import com.shopsphere.dto.request.UpdateOrderStatusRequest;
import com.shopsphere.dto.response.OrderResponse;
import com.shopsphere.dto.response.PageResponse;

public interface OrderService {
    OrderResponse createOrder(Long userId, CreateOrderRequest request);
    PageResponse<OrderResponse> getUserOrders(Long userId, int page, int size);
    OrderResponse getUserOrderById(Long userId, Long orderId);
    OrderResponse cancelOrder(Long userId, Long orderId);

    // Admin operations
    PageResponse<OrderResponse> getAllOrders(int page, int size);
    OrderResponse getOrderById(Long orderId);
    OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request);
}
