package com.shopsphere.service.impl;

import com.shopsphere.dto.request.AddCartItemRequest;
import com.shopsphere.dto.request.UpdateCartItemRequest;
import com.shopsphere.dto.response.CartResponse;
import com.shopsphere.entity.Cart;
import com.shopsphere.entity.CartItem;
import com.shopsphere.entity.Product;
import com.shopsphere.exception.InsufficientStockException;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.mapper.CartMapper;
import com.shopsphere.repository.CartItemRepository;
import com.shopsphere.repository.CartRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CartMapper cartMapper;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        return cartMapper.toResponse(findCartOrThrow(userId));
    }

    @Override
    @Transactional
    public CartResponse addItem(Long userId, AddCartItemRequest request) {
        Cart cart = findCartOrThrow(userId);
        Product product = findProductOrThrow(request.getProductId());

        CartItem existingItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), product.getId())
                .orElse(null);

        int desiredQuantity = request.getQuantity() + (existingItem != null ? existingItem.getQuantity() : 0);
        validateStock(product, desiredQuantity);

        if (existingItem != null) {
            existingItem.setQuantity(desiredQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return cartMapper.toResponse(findCartOrThrow(userId));
    }

    @Override
    @Transactional
    public CartResponse updateItem(Long userId, Long productId, UpdateCartItemRequest request) {
        Cart cart = findCartOrThrow(userId);
        Product product = findProductOrThrow(productId);

        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found in cart"));

        validateStock(product, request.getQuantity());

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return cartMapper.toResponse(findCartOrThrow(userId));
    }

    @Override
    @Transactional
    public CartResponse removeItem(Long userId, Long productId) {
        Cart cart = findCartOrThrow(userId);

        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found in cart"));

        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        return cartMapper.toResponse(findCartOrThrow(userId));
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = findCartOrThrow(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private void validateStock(Product product, int requestedQuantity) {
        if (product.getStock() < requestedQuantity) {
            throw new InsufficientStockException(
                    "Insufficient stock for product '" + product.getName() + "'. Available: " + product.getStock());
        }
    }

    private Cart findCartOrThrow(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user id: " + userId));
    }

    private Product findProductOrThrow(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
    }
}
