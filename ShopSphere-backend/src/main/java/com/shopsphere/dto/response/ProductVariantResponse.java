package com.shopsphere.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantResponse {

    private Long id;
    private String colorName;
    private String colorValue;
    private String size;
    private String imageUrl;
    private Integer stock;
}