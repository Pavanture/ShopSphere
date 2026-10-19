package com.shopsphere.integration.qikink;

import com.shopsphere.entity.Order;
import com.shopsphere.entity.OrderItem;
import com.shopsphere.entity.ShippingAddressSnapshot;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class QikinkClient {

    private final RestClient restClient;
    private final boolean enabled;
    private final String clientId;
    private final String clientSecret;
    private final String gateway;
    private final String qikinkShipping;

    public QikinkClient(
            RestClient.Builder builder,
            @Value("${app.qikink.base-url:https://sandbox.qikink.com}") String baseUrl,
            @Value("${app.qikink.enabled:false}") boolean enabled,
            @Value("${app.qikink.client-id:}") String clientId,
            @Value("${app.qikink.client-secret:}") String clientSecret,
            @Value("${app.qikink.gateway:COD}") String gateway,
            @Value("${app.qikink.shipping:1}") String qikinkShipping) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.enabled = enabled;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.gateway = gateway;
        this.qikinkShipping = qikinkShipping;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public synchronized QikinkOrderResult createOrder(Order order) {
        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new IllegalStateException("Qikink credentials are not configured");
        }

        String accessToken = getAccessToken();
        Map<String, Object> response;
        try {
            response = restClient.post()
                    .uri("/api/order/create")
                    .header("ClientId", clientId)
                    .header("Accesstoken", accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(createOrderPayload(order))
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException(
                    "Qikink order request failed (HTTP " + exception.getStatusCode().value() + "): "
                            + exception.getResponseBodyAsString(), exception);
        }

        if (response == null || response.get("order_id") == null || response.containsKey("error")) {
            String message = response == null ? "Empty response from Qikink" : String.valueOf(response.get("error"));
            throw new IllegalStateException("Qikink did not accept the order: " + message);
        }

        return new QikinkOrderResult(String.valueOf(response.get("order_id")));
    }

    Map<String, Object> createOrderPayload(Order order) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("order_number", "SS" + Long.toString(order.getId(), 36).toUpperCase(Locale.ROOT));
        payload.put("qikink_shipping", qikinkShipping);
        payload.put("gateway", gateway);
        payload.put("total_order_value", order.getTotalAmount());

        List<Map<String, Object>> lineItems = new ArrayList<>();
        for (OrderItem item : order.getOrderItems()) {
            Map<String, Object> lineItem = new LinkedHashMap<>();
            lineItem.put("search_from_my_products", 1);
            lineItem.put("quantity", item.getQuantity());
            lineItem.put("sku", item.getQikinkSku() == null ? item.getProduct().getQikinkSku() : item.getQikinkSku());
            lineItem.put("price", item.getPriceAtPurchase());
            lineItems.add(lineItem);
        }
        payload.put("line_items", lineItems);
        payload.put("shipping_address", createShippingAddress(order));
        return payload;
    }

    private String getAccessToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("ClientId", clientId);
        form.add("client_secret", clientSecret);

        Map<String, Object> response = restClient.post()
                .uri("/api/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        Object accessToken = response == null ? null : response.get("Accesstoken");
        if (accessToken == null || accessToken.toString().isBlank()) {
            throw new IllegalStateException("Qikink did not return an access token");
        }
        return accessToken.toString();
    }

    private Map<String, Object> createShippingAddress(Order order) {
        ShippingAddressSnapshot address = order.getShippingAddress();
        String fullName = address.getFullName() == null ? "" : address.getFullName().trim();
        int nameSplit = fullName.indexOf(' ');
        String firstName = nameSplit < 0 ? fullName : fullName.substring(0, nameSplit);
        String lastName = nameSplit < 0 ? "" : fullName.substring(nameSplit + 1).trim();

        Map<String, Object> shippingAddress = new LinkedHashMap<>();
        shippingAddress.put("first_name", firstName);
        shippingAddress.put("last_name", lastName);
        shippingAddress.put("address1", address.getAddressLine1());
        shippingAddress.put("address2", address.getAddressLine2());
        shippingAddress.put("phone", address.getPhone());
        shippingAddress.put("email", order.getUser().getEmail());
        shippingAddress.put("city", address.getCity());
        shippingAddress.put("zip", address.getPostalCode());
        shippingAddress.put("province", address.getState());
        shippingAddress.put("country_code", countryCode(address.getCountry()));
        return shippingAddress;
    }

    private String countryCode(String country) {
        if (country == null || country.isBlank() || "India".equalsIgnoreCase(country) || "IN".equalsIgnoreCase(country)) {
            return "IN";
        }
        return country.toUpperCase(Locale.ROOT);
    }
}