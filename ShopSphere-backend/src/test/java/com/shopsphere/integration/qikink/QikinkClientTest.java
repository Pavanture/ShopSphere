package com.shopsphere.integration.qikink;

import com.shopsphere.entity.Order;
import com.shopsphere.entity.OrderItem;
import com.shopsphere.entity.Product;
import com.shopsphere.entity.ShippingAddressSnapshot;
import com.shopsphere.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.match.MockRestRequestMatchers;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;

class QikinkClientTest {

    @Test
    void createOrder_usesSandboxTokenAndMyProductsSku() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        QikinkClient client = new QikinkClient(
                builder,
                "https://sandbox.qikink.com",
                true,
                "client-id",
                "client-secret",
                "COD",
                "1");

        LinkedMultiValueMap<String, String> expectedForm = new LinkedMultiValueMap<>();
        expectedForm.add("ClientId", "client-id");
        expectedForm.add("client_secret", "client-secret");

        server.expect(requestTo("https://sandbox.qikink.com/api/token"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().formData(expectedForm))
                .andRespond(MockRestResponseCreators.withSuccess(
                        "{\"Accesstoken\":\"sandbox-token\"}", MediaType.APPLICATION_JSON));

        server.expect(requestTo("https://sandbox.qikink.com/api/order/create"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("ClientId", "client-id"))
                .andExpect(header("Accesstoken", "sandbox-token"))
                .andExpect(content().json("""
                        {
                          "order_number": "SS16",
                          "qikink_shipping": "1",
                          "gateway": "COD",
                          "total_order_value": 1298.00,
                          "line_items": [
                            {
                              "search_from_my_products": 1,
                              "quantity": 2,
                              "sku": "QIK-TEE-BLK-M",
                              "price": 649.00
                            }
                          ],
                          "shipping_address": {
                            "first_name": "Jane",
                            "last_name": "Doe",
                            "address1": "12 Main Street",
                            "address2": "",
                            "phone": "9876543210",
                            "email": "jane@example.com",
                            "city": "Pune",
                            "zip": "411001",
                            "province": "Maharashtra",
                            "country_code": "IN"
                          }
                        }
                        """, false))
                .andRespond(MockRestResponseCreators.withSuccess(
                        "{\"order_id\":12345,\"status_code\":\"200\"}", MediaType.APPLICATION_JSON));

        QikinkOrderResult result = client.createOrder(order());

        assertEquals("12345", result.orderId());
        server.verify();
    }

    private Order order() {
        User user = User.builder().email("jane@example.com").build();
        Product product = Product.builder().id(3L).qikinkSku("QIK-TEE-BLK-M").build();
        OrderItem item = OrderItem.builder()
                .product(product)
                .quantity(2)
                .priceAtPurchase(new BigDecimal("649.00"))
                .qikinkSku("QIK-TEE-BLK-M")
                .build();

        return Order.builder()
                .id(42L)
                .user(user)
                .orderItems(List.of(item))
                .totalAmount(new BigDecimal("1298.00"))
                .shippingAddress(ShippingAddressSnapshot.builder()
                        .fullName("Jane Doe")
                        .phone("9876543210")
                        .addressLine1("12 Main Street")
                        .addressLine2("")
                        .city("Pune")
                        .state("Maharashtra")
                        .postalCode("411001")
                        .country("India")
                        .build())
                .build();
    }
}