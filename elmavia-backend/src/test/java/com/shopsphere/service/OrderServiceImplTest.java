package com.shopsphere.service;

import com.shopsphere.dto.request.CreateOrderRequest;
import com.shopsphere.dto.response.OrderResponse;
import com.shopsphere.entity.*;
import com.shopsphere.exception.InsufficientStockException;
import com.shopsphere.exception.InvalidOrderStateException;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.mapper.AddressMapper;
import com.shopsphere.mapper.OrderMapper;
import com.shopsphere.repository.AddressRepository;
import com.shopsphere.repository.CartRepository;
import com.shopsphere.repository.OrderRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Covers the core transactional order-creation flow: stock validation,
 * total calculation, stock reduction, and cart clearing.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CartRepository cartRepository;
    @Mock private ProductRepository productRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private OrderMapper orderMapper;
    @Mock private AddressMapper addressMapper;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User user;
    private Cart cart;
    private Product product;
    private Address address;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email("jane@example.com").build();
        product = Product.builder().id(1L).name("Laptop").price(BigDecimal.valueOf(100)).stock(5).build();
        address = Address.builder().id(1L).user(user).fullName("Jane Doe").build();

        CartItem cartItem = CartItem.builder().id(1L).product(product).quantity(2).build();
        List<CartItem> items = new ArrayList<>();
        items.add(cartItem);
        cart = Cart.builder().id(1L).user(user).items(items).build();
    }

    @Test
    void createOrder_shouldReduceStockAndClearCart_whenStockIsSufficient() {
        CreateOrderRequest request = CreateOrderRequest.builder().addressId(1L).build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(addressRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(address));
        when(addressMapper.toSnapshot(address)).thenReturn(ShippingAddressSnapshot.builder().build());
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(OrderResponse.builder().id(1L).build());

        OrderResponse response = orderService.createOrder(1L, request);

        assertNotNull(response);
        assertEquals(3, product.getStock()); // 5 - 2 = 3
        assertTrue(cart.getItems().isEmpty());
        verify(cartRepository, times(1)).save(cart);

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());
        assertEquals(BigDecimal.valueOf(200), orderCaptor.getValue().getTotalAmount());
    }

    @Test
    void createOrder_shouldThrowInsufficientStockException_whenStockIsTooLow() {
        product.setStock(1); // less than requested quantity of 2
        CreateOrderRequest request = CreateOrderRequest.builder().addressId(1L).build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(addressRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(address));

        assertThrows(InsufficientStockException.class, () -> orderService.createOrder(1L, request));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void createOrder_shouldThrowInvalidOrderStateException_whenCartIsEmpty() {
        cart.getItems().clear();
        CreateOrderRequest request = CreateOrderRequest.builder().addressId(1L).build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));

        assertThrows(InvalidOrderStateException.class, () -> orderService.createOrder(1L, request));
    }

    @Test
    void createOrder_shouldThrowResourceNotFoundException_whenAddressDoesNotBelongToUser() {
        CreateOrderRequest request = CreateOrderRequest.builder().addressId(99L).build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(addressRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> orderService.createOrder(1L, request));
    }
}
