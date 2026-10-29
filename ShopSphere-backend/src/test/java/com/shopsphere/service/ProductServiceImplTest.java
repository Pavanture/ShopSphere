package com.shopsphere.service;

import com.shopsphere.dto.request.ProductRequest;
import com.shopsphere.dto.request.ProductVariantRequest;
import com.shopsphere.dto.response.ProductResponse;
import com.shopsphere.entity.Category;
import com.shopsphere.entity.Product;
import com.shopsphere.exception.ResourceNotFoundException;
import com.shopsphere.mapper.ProductMapper;
import com.shopsphere.repository.CategoryRepository;
import com.shopsphere.repository.CartItemRepository;
import com.shopsphere.repository.OrderItemRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock private ProductRepository productRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ProductMapper productMapper;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private OrderItemRepository orderItemRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Category category;
    private Product product;

    @BeforeEach
    void setUp() {
        category = Category.builder().id(1L).name("Electronics").build();
        product = Product.builder()
                .id(1L)
                .name("Laptop")
                .price(BigDecimal.valueOf(999.99))
                .stock(10)
                .category(category)
                .build();
    }

    @Test
    void getProductById_shouldReturnProduct_whenProductExists() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productMapper.toResponse(product)).thenReturn(ProductResponse.builder().id(1L).name("Laptop").build());

        ProductResponse response = productService.getProductById(1L);

        assertNotNull(response);
        assertEquals("Laptop", response.getName());
    }

    @Test
    void getProductById_shouldThrowException_whenProductDoesNotExist() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(99L));
    }

    @Test
    void createProduct_shouldSaveProduct_whenCategoryExists() {
        ProductRequest request = ProductRequest.builder()
                .name("Phone")
                .price(BigDecimal.valueOf(499.99))
                .stock(5)
                .categoryId(1L)
                .build();

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(productMapper.toResponse(any(Product.class))).thenReturn(ProductResponse.builder().id(1L).build());

        ProductResponse response = productService.createProduct(request);

        assertNotNull(response);
        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository, times(1)).save(productCaptor.capture());
    }

        @Test
        void createProduct_shouldDeriveAggregateStockFromVariants() {
        ProductRequest request = ProductRequest.builder()
            .name("Oversized Tee")
            .price(BigDecimal.valueOf(649))
            .stock(999)
            .categoryId(1L)
            .variants(java.util.List.of(
                ProductVariantRequest.builder()
                    .colorName("Black")
                    .colorValue("#111111")
                    .size("M")
                    .imageUrl("https://images.example/black-m.jpg")
                    .stock(4)
                    .build(),
                ProductVariantRequest.builder()
                    .colorName("White")
                    .colorValue("#FFFFFF")
                    .size("L")
                    .imageUrl("https://images.example/white-l.jpg")
                    .stock(3)
                    .build()))
            .build();

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        when(productMapper.toResponse(any(Product.class))).thenReturn(ProductResponse.builder().id(1L).build());

        productService.createProduct(request);

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(productCaptor.capture());
        assertEquals(7, productCaptor.getValue().getStock());
        assertEquals(2, productCaptor.getValue().getVariants().size());
        }

    @Test
    void createProduct_shouldThrowException_whenCategoryDoesNotExist() {
        ProductRequest request = ProductRequest.builder()
                .name("Phone")
                .price(BigDecimal.valueOf(499.99))
                .stock(5)
                .categoryId(99L)
                .build();

        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void deleteProduct_shouldRemoveProduct_whenProductExists() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        productService.deleteProduct(1L);

        verify(productRepository, times(1)).delete(product);
    }
}
