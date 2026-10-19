package com.shopsphere.integration.qikink;

import com.shopsphere.entity.Order;
import com.shopsphere.event.QikinkOrderRequested;
import com.shopsphere.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class QikinkOrderListener {

    private final OrderRepository orderRepository;
    private final QikinkClient qikinkClient;

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void submitOrder(QikinkOrderRequested event) {
        Order order = orderRepository.findById(event.orderId()).orElse(null);
        if (order == null) {
            log.error("Cannot submit missing ShopSphere order {} to Qikink", event.orderId());
            return;
        }

        try {
            QikinkOrderResult result = qikinkClient.createOrder(order);
            order.setQikinkOrderId(result.orderId());
            order.setQikinkStatus("SUBMITTED");
            order.setQikinkError(null);
        } catch (Exception exception) {
            order.setQikinkStatus("FAILED");
            String error = exception.getMessage() == null ? "Qikink request failed" : exception.getMessage();
            order.setQikinkError(error.substring(0, Math.min(error.length(), 500)));
            log.error("Qikink submission failed for ShopSphere order {}", order.getId(), exception);
        }

        orderRepository.save(order);
    }
}