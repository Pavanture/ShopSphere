package com.shopsphere.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal priceAtPurchase;
    private Integer quantity;
    private BigDecimal lineTotal;
}
