package com.shopsphere.service;

import com.shopsphere.dto.request.UpdateUserRequest;
import com.shopsphere.dto.response.UserResponse;

public interface UserService {
    UserResponse getCurrentUser(Long userId);
    UserResponse updateCurrentUser(Long userId, UpdateUserRequest request);
}
