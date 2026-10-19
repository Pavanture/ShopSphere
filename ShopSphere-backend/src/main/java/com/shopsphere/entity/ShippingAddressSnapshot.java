package com.shopsphere.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingAddressSnapshot {

    @Column(name = "ship_full_name", length = 100)
    private String fullName;

    @Column(name = "ship_phone", length = 20)
    private String phone;

    @Column(name = "ship_address_line1", length = 255)
    private String addressLine1;

    @Column(name = "ship_address_line2", length = 255)
    private String addressLine2;

    @Column(name = "ship_city", length = 100)
    private String city;

    @Column(name = "ship_state", length = 100)
    private String state;

    @Column(name = "ship_postal_code", length = 20)
    private String postalCode;

    @Column(name = "ship_country", length = 100)
    private String country;
}
