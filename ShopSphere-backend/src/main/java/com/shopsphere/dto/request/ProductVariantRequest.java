package com.shopsphere.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantRequest {

    private Long id;

    @NotBlank(message = "Variant color is required")
    @Size(max = 50)
    private String colorName;

    @NotBlank(message = "Variant color value is required")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color value must be a six-digit hex color")
    private String colorValue;

    @NotBlank(message = "Variant size is required")
    @Size(max = 30)
    private String size;

    @NotBlank(message = "Variant image URL is required")
    @Size(max = 1000)
    private String imageUrl;

    @NotNull(message = "Variant stock is required")
    @Min(value = 0, message = "Variant stock cannot be negative")
    private Integer stock;

    @Size(max = 50, message = "Qikink SKU must not exceed 50 characters")
    private String qikinkSku;
}