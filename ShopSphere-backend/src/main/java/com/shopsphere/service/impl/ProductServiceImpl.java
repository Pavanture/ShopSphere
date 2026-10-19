package com.shopsphere.service.impl;

import com.shopsphere.dto.request.ProductRequest;
import com.shopsphere.dto.request.ProductVariantRequest;
import com.shopsphere.dto.response.PageResponse;
import com.shopsphere.dto.response.ProductResponse;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.ProductVariant;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.exception.InvalidOrderStateException;
import com.shopsphere.mapper.ProductMapper;
import com.shopsphere.repository.CartItemRepository;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.OrderItemRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(String keyword, Long categoryId, int page, int size,
                                                       String sortBy, String direction) {
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = (sortBy == null || sortBy.isBlank()) ? "id" : sortBy;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

        Page<Product> products = productRepository.search(keyword, categoryId, pageable);
        Page<ProductResponse> mapped = products.map(productMapper::toResponse);

        return PageResponse.from(mapped);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        return productMapper.toResponse(findProductOrThrow(id));
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = findCategoryOrThrow(request.getCategoryId());

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .category(category)
                .imageUrl(request.getImageUrl())
                .qikinkSku(request.getQikinkSku())
                .build();

            replaceVariants(product, request.getVariants(), request.getStock());

        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = findProductOrThrow(id);
        Category category = findCategoryOrThrow(request.getCategoryId());

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCategory(category);
        product.setImageUrl(request.getImageUrl());
        product.setQikinkSku(request.getQikinkSku());
        replaceVariants(product, request.getVariants(), request.getStock());

        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = findProductOrThrow(id);
        productRepository.delete(product);
    }

    private Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    private Category findCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    private void replaceVariants(Product product, List<ProductVariantRequest> requests, int fallbackStock) {
        List<ProductVariant> currentVariants = new ArrayList<>(product.getVariants());
        Map<Long, ProductVariant> currentById = new HashMap<>();
        currentVariants.forEach(variant -> currentById.put(variant.getId(), variant));
        List<ProductVariant> updatedVariants = new ArrayList<>();
        Set<List<String>> colorSizeKeys = new HashSet<>();

        if (requests != null) {
            for (ProductVariantRequest request : requests) {
                List<String> colorSizeKey = List.of(
                    request.getColorName().trim().toLowerCase(java.util.Locale.ROOT),
                    request.getSize().trim().toUpperCase(java.util.Locale.ROOT));
                if (!colorSizeKeys.add(colorSizeKey)) {
                    throw new InvalidOrderStateException("Each color and size combination must be unique");
                }
                ProductVariant variant;
                if (request.getId() == null) {
                    variant = new ProductVariant();
                    variant.setProduct(product);
                } else {
                    variant = currentById.get(request.getId());
                    if (variant == null) {
                        throw new ResourceNotFoundException("Variant not found for product id: " + product.getId());
                    }
                }
                variant.setColorName(request.getColorName().trim());
                variant.setColorValue(request.getColorValue());
                variant.setSize(request.getSize().trim());
                variant.setImageUrl(request.getImageUrl().trim());
                variant.setStock(request.getStock());
                variant.setQikinkSku(request.getQikinkSku() == null ? null : request.getQikinkSku().trim());
                updatedVariants.add(variant);
            }
        }

        for (ProductVariant currentVariant : currentVariants) {
            if (!updatedVariants.contains(currentVariant)) {
                Long variantId = currentVariant.getId();
                if (variantId != null && (cartItemRepository.existsByVariantId(variantId)
                        || orderItemRepository.existsByVariantId(variantId))) {
                    throw new InvalidOrderStateException(
                            "Cannot remove a variant that is referenced by a cart or order");
                }
                product.getVariants().remove(currentVariant);
            }
        }
        for (ProductVariant updatedVariant : updatedVariants) {
            if (!product.getVariants().contains(updatedVariant)) {
                product.getVariants().add(updatedVariant);
            }
        }

        if (updatedVariants.isEmpty()) {
            product.setStock(fallbackStock);
            return;
        }

        int totalStock = 0;
        for (ProductVariant variant : updatedVariants) {
            totalStock += variant.getStock();
        }
        product.setStock(totalStock);
    }
}
