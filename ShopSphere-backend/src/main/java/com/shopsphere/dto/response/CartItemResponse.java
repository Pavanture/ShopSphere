package com.shopsphere.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {

    private Long id;
    private ProductResponse product;
    private Long variantId;
    private String colorName;
    private String size;
    private String imageUrl;
    private Integer availableStock;
    private Integer quantity;
    private BigDecimal lineTotal;
}
