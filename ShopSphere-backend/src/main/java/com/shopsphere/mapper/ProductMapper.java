package com.shopsphere.mapper;

import com.shopsphere.dto.response.ProductResponse;
import com.shopsphere.dto.response.ProductVariantResponse;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.ProductVariant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final CategoryMapper categoryMapper;

    public ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stock(product.getStock())
                .category(categoryMapper.toResponse(product.getCategory()))
                .imageUrl(product.getImageUrl())
                .qikinkSku(product.getQikinkSku())
                .variants(product.getVariants().stream().map(this::toVariantResponse).toList())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private ProductVariantResponse toVariantResponse(ProductVariant variant) {
        return ProductVariantResponse.builder()
                .id(variant.getId())
                .colorName(variant.getColorName())
                .colorValue(variant.getColorValue())
                .size(variant.getSize())
                .imageUrl(variant.getImageUrl())
                .stock(variant.getStock())
                .qikinkSku(variant.getQikinkSku())
                .build();
    }
}
