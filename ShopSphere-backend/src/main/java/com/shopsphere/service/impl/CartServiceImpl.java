package com.shopsphere.service.impl;

import com.shopsphere.dto.request.AddCartItemRequest;
import com.shopsphere.dto.request.UpdateCartItemRequest;
import com.shopsphere.dto.response.CartResponse;
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
        ProductVariant variant = findVariantOrThrow(product, request.getVariantId());

        CartItem existingItem = cartItemRepository
            .findByCartIdAndProductIdAndVariantId(
                cart.getId(), product.getId(), variant == null ? null : variant.getId())
                .orElse(null);

        int desiredQuantity = request.getQuantity() + (existingItem != null ? existingItem.getQuantity() : 0);
        validateStock(product, variant, desiredQuantity);

        if (existingItem != null) {
            existingItem.setQuantity(desiredQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .variant(variant)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return cartMapper.toResponse(findCartOrThrow(userId));
    }

    @Override
    @Transactional
    public CartResponse updateItem(Long userId, Long cartItemId, UpdateCartItemRequest request) {
        Cart cart = findCartOrThrow(userId);
        CartItem item = cartItemRepository.findByIdAndCartId(cartItemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found in cart"));

        validateStock(item.getProduct(), item.getVariant(), request.getQuantity());

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return cartMapper.toResponse(findCartOrThrow(userId));
    }

    @Override
    @Transactional
    public CartResponse removeItem(Long userId, Long cartItemId) {
        Cart cart = findCartOrThrow(userId);

        CartItem item = cartItemRepository.findByIdAndCartId(cartItemId, cart.getId())
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

    private void validateStock(Product product, ProductVariant variant, int requestedQuantity) {
        int availableStock = variant == null ? product.getStock() : variant.getStock();
        if (availableStock < requestedQuantity) {
            throw new InsufficientStockException(
                    "Insufficient stock for product '" + product.getName() + "'. Available: " + availableStock);
        }
    }

    private ProductVariant findVariantOrThrow(Product product, Long variantId) {
        if (product.getVariants().isEmpty()) {
            if (variantId != null) {
                throw new ResourceNotFoundException("Variant not found for product id: " + product.getId());
            }
            return null;
        }
        if (variantId == null) {
            throw new ResourceNotFoundException("Choose a color and size before adding this product to the cart");
        }
        return product.getVariants().stream()
                .filter(variant -> variant.getId().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found for product id: " + product.getId()));
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
