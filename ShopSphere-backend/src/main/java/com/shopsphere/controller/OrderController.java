package com.shopsphere.controller;

import com.shopsphere.dto.request.CreateOrderRequest;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.OrderResponse;
import com.shopsphere.dto.response.PageResponse;
import com.shopsphere.service.OrderService;
import com.shopsphere.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order placement and management")
public class OrderController {

    private final OrderService orderService;
    private final SecurityUtils securityUtils;

    @PostMapping
    @Operation(summary = "Place an order from the current user's cart")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.createOrder(securityUtils.getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Order placed successfully", response));
    }

    @GetMapping
    @Operation(summary = "List the current user's orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<OrderResponse> response = orderService.getUserOrders(securityUtils.getCurrentUserId(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Orders fetched successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one of the current user's orders by id")
    public ResponseEntity<ApiResponse<OrderResponse>> getMyOrderById(@PathVariable Long id) {
        OrderResponse response = orderService.getUserOrderById(securityUtils.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Order fetched successfully", response));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel one of the current user's orders")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(@PathVariable Long id) {
        OrderResponse response = orderService.cancelOrder(securityUtils.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", response));
    }
}
