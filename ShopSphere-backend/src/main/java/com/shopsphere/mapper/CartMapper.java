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
                .variantId(item.getVariant() == null ? null : item.getVariant().getId())
                .colorName(item.getVariant() == null ? null : item.getVariant().getColorName())
                .size(item.getVariant() == null ? null : item.getVariant().getSize())
                .imageUrl(item.getVariant() == null ? item.getProduct().getImageUrl() : item.getVariant().getImageUrl())
                .availableStock(item.getVariant() == null ? item.getProduct().getStock() : item.getVariant().getStock())
                .quantity(item.getQuantity())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
