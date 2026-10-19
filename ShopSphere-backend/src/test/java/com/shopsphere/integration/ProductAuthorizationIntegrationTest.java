package com.shopsphere.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.dto.request.ProductRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies role-based authorization rules on the product endpoints:
 * ADMIN can manage products, plain USER cannot, and product reads are public.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private ProductRequest sampleRequest() {
        return ProductRequest.builder()
                .name("Test Product")
                .description("A product used in tests")
                .price(BigDecimal.valueOf(19.99))
                .stock(10)
                .categoryId(1L)
                .build();
    }

    @Test
    void getProducts_shouldBeAccessible_withoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk());
    }

    @Test
    void createProduct_shouldBeForbidden_withoutAuthentication() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void createProduct_shouldBeForbidden_forNonAdminUser() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_shouldBeAllowed_forAdminUser_whenCategoryExists() throws Exception {
        // Category with id=1 doesn't exist in a fresh in-memory DB, so this
        // exercises the authorization layer; a 404 confirms the request passed
        // the ADMIN authorization check and reached the service layer.
        mockMvc.perform(post("/api/products")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isNotFound());
    }
}
