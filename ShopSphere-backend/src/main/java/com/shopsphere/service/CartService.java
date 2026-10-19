package com.shopsphere.service;

import com.shopsphere.dto.request.AddCartItemRequest;
import com.shopsphere.dto.request.UpdateCartItemRequest;
import com.shopsphere.dto.response.CartResponse;

public interface CartService {
    CartResponse getCart(Long userId);
    CartResponse addItem(Long userId, AddCartItemRequest request);
    CartResponse updateItem(Long userId, Long cartItemId, UpdateCartItemRequest request);
    CartResponse removeItem(Long userId, Long cartItemId);
    void clearCart(Long userId);
}
