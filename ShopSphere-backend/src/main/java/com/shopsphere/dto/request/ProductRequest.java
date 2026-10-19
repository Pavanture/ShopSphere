package com.shopsphere.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import jakarta.validation.Valid;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Name must not exceed 200 characters")
    private String name;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    @NotNull(message = "Category id is required")
    private Long categoryId;

    private String imageUrl;

    @Size(max = 50, message = "Qikink SKU must not exceed 50 characters")
    private String qikinkSku;

    @Valid
    @Size(max = 100, message = "A product cannot have more than 100 variants")
    private List<ProductVariantRequest> variants;
}
