package com.shopsphere.service;

import com.shopsphere.dto.request.AddCartItemRequest;
import com.shopsphere.dto.request.UpdateCartItemRequest;
import com.shopsphere.entity.Cart;
import com.shopsphere.entity.CartItem;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.ProductVariant;
import com.shopsphere.exception.InsufficientStockException;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.mapper.CartMapper;
import com.shopsphere.repository.CartItemRepository;
import com.shopsphere.repository.CartRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.service.impl.CartServiceImpl;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Verifies stock validation logic in the cart service, one of the
 * business rules explicitly required for the cart module.
 */
@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CartMapper cartMapper;

    @InjectMocks
    private CartServiceImpl cartService;

    private Cart cart;
    private Product product;

    @BeforeEach
    void setUp() {
        product = Product.builder().id(1L).name("Laptop").price(BigDecimal.TEN).stock(3).build();
        cart = Cart.builder().id(1L).items(new ArrayList<>()).build();
    }

    @Test
    void addItem_shouldThrowInsufficientStockException_whenQuantityExceedsStock() {
        AddCartItemRequest request = AddCartItemRequest.builder().productId(1L).quantity(10).build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductIdAndVariantId(cart.getId(), product.getId(), null)).thenReturn(Optional.empty());

        assertThrows(InsufficientStockException.class, () -> cartService.addItem(1L, request));
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    void addItem_shouldSucceed_whenQuantityIsWithinStock() {
        AddCartItemRequest request = AddCartItemRequest.builder().productId(1L).quantity(2).build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductIdAndVariantId(cart.getId(), product.getId(), null)).thenReturn(Optional.empty());
        when(cartMapper.toResponse(any(Cart.class))).thenReturn(null);

        cartService.addItem(1L, request);

        verify(cartItemRepository, times(1)).save(any(CartItem.class));
    }

    @Test
    void addItem_shouldThrowResourceNotFoundException_whenCartDoesNotExist() {
        AddCartItemRequest request = AddCartItemRequest.builder().productId(1L).quantity(1).build();
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> cartService.addItem(1L, request));
    }

    @Test
    void updateItem_shouldThrowInsufficientStockException_whenNewQuantityExceedsStock() {
        UpdateCartItemRequest request = UpdateCartItemRequest.builder().quantity(5).build();
        CartItem existingItem = CartItem.builder().id(1L).cart(cart).product(product).quantity(1).build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByIdAndCartId(1L, cart.getId())).thenReturn(Optional.of(existingItem));

        assertThrows(InsufficientStockException.class, () -> cartService.updateItem(1L, 1L, request));
    }

        @Test
        void addItem_shouldStoreSelectedVariantAndValidateItsStock() {
        ProductVariant variant = ProductVariant.builder()
            .id(7L)
            .product(product)
            .colorName("Black")
            .size("M")
            .stock(2)
            .build();
        product.setVariants(List.of(variant));
        AddCartItemRequest request = AddCartItemRequest.builder()
            .productId(1L)
            .variantId(7L)
            .quantity(1)
            .build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductIdAndVariantId(cart.getId(), product.getId(), 7L))
            .thenReturn(Optional.empty());
        when(cartMapper.toResponse(any(Cart.class))).thenReturn(null);

        cartService.addItem(1L, request);

        ArgumentCaptor<CartItem> itemCaptor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartItemRepository).save(itemCaptor.capture());
        assertEquals(variant, itemCaptor.getValue().getVariant());
        }
}
