package com.shopsphere.controller;

import com.shopsphere.dto.request.AddCartItemRequest;
import com.shopsphere.dto.request.UpdateCartItemRequest;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.CartResponse;
import com.shopsphere.service.CartService;
import com.shopsphere.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart management for the current user")
public class CartController {

    private final CartService cartService;
    private final SecurityUtils securityUtils;

    @GetMapping
    @Operation(summary = "Get the current user's cart")
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        return ResponseEntity.ok(ApiResponse.success("Cart fetched successfully", cartService.getCart(securityUtils.getCurrentUserId())));
    }

    @PostMapping("/items")
    @Operation(summary = "Add a product to the cart")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(@Valid @RequestBody AddCartItemRequest request) {
        CartResponse response = cartService.addItem(securityUtils.getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", response));
    }

    @PutMapping("/items/{productId}")
    @Operation(summary = "Update the quantity of a product in the cart")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(@PathVariable Long productId,
                                                                  @Valid @RequestBody UpdateCartItemRequest request) {
        CartResponse response = cartService.updateItem(securityUtils.getCurrentUserId(), productId, request);
        return ResponseEntity.ok(ApiResponse.success("Cart item updated", response));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove a product from the cart")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(@PathVariable Long productId) {
        CartResponse response = cartService.removeItem(securityUtils.getCurrentUserId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", response));
    }

    @DeleteMapping
    @Operation(summary = "Clear the entire cart")
    public ResponseEntity<ApiResponse<Void>> clearCart() {
        cartService.clearCart(securityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Cart cleared successfully"));
    }
}
