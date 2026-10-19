package com.shopsphere.dto.request;

import com.shopsphere.entity.enums.OrderStatus;
import com.shopsphere.entity.enums.PaymentStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateOrderStatusRequest {

    private OrderStatus orderStatus;

    private PaymentStatus paymentStatus;
}
