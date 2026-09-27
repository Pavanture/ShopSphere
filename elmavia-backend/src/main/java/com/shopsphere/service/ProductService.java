package com.shopsphere.service;

import com.shopsphere.dto.request.ProductRequest;
import com.shopsphere.dto.response.PageResponse;
import com.shopsphere.dto.response.ProductResponse;

public interface ProductService {
    PageResponse<ProductResponse> getProducts(String keyword, Long categoryId, int page, int size, String sortBy, String direction);
    ProductResponse getProductById(Long id);
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
}
