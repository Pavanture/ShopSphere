package com.shopsphere.controller;

import com.shopsphere.dto.request.UpdateUserRequest;
import com.shopsphere.dto.response.ApiResponse;
import com.shopsphere.dto.response.UserResponse;
import com.shopsphere.service.UserService;
import com.shopsphere.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Current user profile management")
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    @GetMapping("/me")
    @Operation(summary = "Get the currently authenticated user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UserResponse response = userService.getCurrentUser(securityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("User fetched successfully", response));
    }

    @PutMapping("/me")
    @Operation(summary = "Update the currently authenticated user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUser(@Valid @RequestBody UpdateUserRequest request) {
        UserResponse response = userService.updateCurrentUser(securityUtils.getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", response));
    }
}
