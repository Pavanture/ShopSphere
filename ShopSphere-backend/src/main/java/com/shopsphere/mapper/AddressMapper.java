package com.shopsphere.mapper;

import com.shopsphere.dto.response.AddressResponse;
import com.shopsphere.entity.Address;
import com.shopsphere.entity.ShippingAddressSnapshot;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {

    public AddressResponse toResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .fullName(address.getFullName())
                .phone(address.getPhone())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .isDefault(address.isDefault())
                .build();
    }

    public ShippingAddressSnapshot toSnapshot(Address address) {
        return ShippingAddressSnapshot.builder()
                .fullName(address.getFullName())
                .phone(address.getPhone())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .build();
    }

    public AddressResponse toResponse(ShippingAddressSnapshot snapshot) {
        return AddressResponse.builder()
                .fullName(snapshot.getFullName())
                .phone(snapshot.getPhone())
                .addressLine1(snapshot.getAddressLine1())
                .addressLine2(snapshot.getAddressLine2())
                .city(snapshot.getCity())
                .state(snapshot.getState())
                .postalCode(snapshot.getPostalCode())
                .country(snapshot.getCountry())
                .build();
    }
}
