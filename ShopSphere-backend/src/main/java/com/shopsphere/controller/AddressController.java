package com.shopsphere.controller;

import com.shopsphere.dto.request.AddressRequest;
import com.shopsphere.dto.response.AddressResponse;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.service.AddressService;
import com.shopsphere.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@Tag(name = "Addresses", description = "Shipping address management for the current user")
public class AddressController {

    private final AddressService addressService;
    private final SecurityUtils securityUtils;

    @GetMapping
    @Operation(summary = "List the current user's addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses() {
        return ResponseEntity.ok(ApiResponse.success("Addresses fetched successfully",
                addressService.getAddresses(securityUtils.getCurrentUserId())));
    }

    @PostMapping
    @Operation(summary = "Add a new shipping address")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(@Valid @RequestBody AddressRequest request) {
        AddressResponse response = addressService.addAddress(securityUtils.getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Address added successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a shipping address")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(@PathVariable Long id,
                                                                        @Valid @RequestBody AddressRequest request) {
        AddressResponse response = addressService.updateAddress(securityUtils.getCurrentUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Address updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a shipping address")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(@PathVariable Long id) {
        addressService.deleteAddress(securityUtils.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully"));
    }
}
