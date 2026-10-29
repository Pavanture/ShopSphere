package com.shopsphere.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_variants", uniqueConstraints = {
        @UniqueConstraint(name = "uk_product_variant_color_size", columnNames = {"product_id", "color_name", "size"})
}, indexes = @Index(name = "idx_product_variant_product", columnList = "product_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "color_name", nullable = false, length = 50)
    private String colorName;

    @Column(name = "color_value", nullable = false, length = 7)
    private String colorValue;

    @Column(nullable = false, length = 30)
    private String size;

    @Column(name = "image_url", nullable = false, length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    private Integer stock;

    public void decreaseStock(int quantity) {
        this.stock -= quantity;
    }
}