package com.shopsphere.service.impl;

import com.shopsphere.dto.request.CreateOrderRequest;
import com.shopsphere.dto.request.UpdateOrderStatusRequest;
import com.shopsphere.dto.response.OrderResponse;
import com.shopsphere.dto.response.PageResponse;
import com.shopsphere.entity.*;
import com.shopsphere.entity.enums.OrderStatus;
import com.shopsphere.exception.InsufficientStockException;
import com.shopsphere.exception.InvalidOrderStateException;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.mapper.AddressMapper;
import com.shopsphere.mapper.OrderMapper;
import com.shopsphere.repository.*;
import com.shopsphere.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Handles order creation and lifecycle management.
 *
 * Order creation flow (all wrapped in a single DB transaction):
 *   1. Validate stock for every item in the user's cart.
 *   2. Create the Order.
 *   3. Create OrderItems (price/name snapshotted at time of purchase).
 *   4. Calculate the total amount.
 *   5. Reduce product stock.
 *   6. Clear the user's cart.
 *   7. Persist everything atomically.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final OrderMapper orderMapper;
    private final AddressMapper addressMapper;

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user id: " + userId));

        if (cart.getItems().isEmpty()) {
            throw new InvalidOrderStateException("Cannot place an order with an empty cart");
        }

        Address shippingAddress = addressRepository.findByIdAndUserId(request.getAddressId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + request.getAddressId()));

        Map<Long, Integer> requestedByProduct = new HashMap<>();
        Map<Long, Integer> requestedByVariant = new HashMap<>();
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            ProductVariant variant = cartItem.getVariant();
            if (!product.getVariants().isEmpty() && variant == null) {
                throw new InvalidOrderStateException("Choose a color and size for product '" + product.getName() + "'");
            }
            int availableStock = variant == null ? product.getStock() : variant.getStock();
            if (availableStock < cartItem.getQuantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock for product '" + product.getName() + "'. Available: " + availableStock);
            }
            requestedByProduct.merge(product.getId(), cartItem.getQuantity(), Integer::sum);
            if (variant != null) {
                requestedByVariant.merge(variant.getId(), cartItem.getQuantity(), Integer::sum);
            }
        }
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            if (requestedByProduct.get(product.getId()) > product.getStock()) {
                throw new InsufficientStockException(
                        "Insufficient total stock for product '" + product.getName() + "'. Available: " + product.getStock());
            }
            ProductVariant variant = cartItem.getVariant();
            if (variant != null && requestedByVariant.get(variant.getId()) > variant.getStock()) {
                throw new InsufficientStockException(
                        "Insufficient stock for " + variant.getColorName() + " " + variant.getSize()
                                + ". Available: " + variant.getStock());
            }
        }

        // 2. Create the order shell.
        Order order = Order.builder()
                .user(cart.getUser())
                .orderItems(new ArrayList<>())
                .shippingAddress(addressMapper.toSnapshot(shippingAddress))
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        // 3 & 4. Create order items and accumulate the total.
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .variant(cartItem.getVariant())
                    .productName(product.getName())
                    .variantColor(cartItem.getVariant() == null ? null : cartItem.getVariant().getColorName())
                    .variantSize(cartItem.getVariant() == null ? null : cartItem.getVariant().getSize())
                    .priceAtPurchase(product.getPrice())
                    .quantity(cartItem.getQuantity())
                    .build();

            order.getOrderItems().add(orderItem);
            total = total.add(orderItem.getLineTotal());

            // 5. Reduce stock.
            if (cartItem.getVariant() != null) {
                cartItem.getVariant().decreaseStock(cartItem.getQuantity());
            }
            product.decreaseStock(cartItem.getQuantity());
            productRepository.save(product);
        }

        order.setTotalAmount(total);

        // 7. Persist the order (cascades to order items).
        Order savedOrder = orderRepository.save(order);

        // 6. Clear the cart.
        cart.getItems().clear();
        cartRepository.save(cart);

        log.info("Order {} created for user {} with total {}", savedOrder.getId(), userId, total);

        return orderMapper.toResponse(savedOrder);
    }

    @Override
    public PageResponse<OrderResponse> getUserOrders(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponse> orders = orderRepository.findByUserId(userId, pageable).map(orderMapper::toResponse);
        return PageResponse.from(orders);
    }

    @Override
    public OrderResponse getUserOrderById(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (order.getOrderStatus() == OrderStatus.SHIPPED || order.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new InvalidOrderStateException("Cannot cancel an order that has already been shipped or delivered");
        }
        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new InvalidOrderStateException("Order is already cancelled");
        }

        // Restock cancelled items.
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            if (item.getVariant() != null) {
                item.getVariant().setStock(item.getVariant().getStock() + item.getQuantity());
            }
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);

        return orderMapper.toResponse(saved);
    }

    @Override
    public PageResponse<OrderResponse> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponse> orders = orderRepository.findAll(pageable).map(orderMapper::toResponse);
        return PageResponse.from(orders);
    }

    @Override
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (request.getOrderStatus() != null) {
            order.setOrderStatus(request.getOrderStatus());
        }
        if (request.getPaymentStatus() != null) {
            order.setPaymentStatus(request.getPaymentStatus());
        }

        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }
}
