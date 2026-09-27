package com.shopsphere.service;

import com.shopsphere.dto.request.AddressRequest;
import com.shopsphere.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {
    List<AddressResponse> getAddresses(Long userId);
    AddressResponse addAddress(Long userId, AddressRequest request);
    AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request);
    void deleteAddress(Long userId, Long addressId);
}
