package com.shopsphere.mapper;

import com.shopsphere.dto.response.CartItemResponse;
import com.shopsphere.dto.response.CartResponse;
import com.shopsphere.entity.Cart;
import com.shopsphere.entity.CartItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CartMapper {

    private final ProductMapper productMapper;

    public CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        return CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .subtotal(cart.getSubtotal())
                .totalItems(cart.getTotalItems())
                .build();
    }

    public CartItemResponse toItemResponse(CartItem item) {
        return CartItemResponse.builder()
                .id(item.getId())
                .product(productMapper.toResponse(item.getProduct()))
                .quantity(item.getQuantity())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
