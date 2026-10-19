package com.shopsphere.integration.qikink;

import com.shopsphere.entity.Order;
import com.shopsphere.event.QikinkOrderRequested;
import com.shopsphere.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QikinkOrderListenerTest {

    @Mock private OrderRepository orderRepository;
    @Mock private QikinkClient qikinkClient;

    @InjectMocks
    private QikinkOrderListener listener;

    @Test
    void submitOrder_savesQikinkIdOnSuccess() {
        Order order = Order.builder().id(42L).build();
        when(orderRepository.findById(42L)).thenReturn(Optional.of(order));
        when(qikinkClient.createOrder(order)).thenReturn(new QikinkOrderResult("12345"));

        listener.submitOrder(new QikinkOrderRequested(42L));

        assertEquals("12345", order.getQikinkOrderId());
        assertEquals("SUBMITTED", order.getQikinkStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void submitOrder_recordsFailureWithoutLosingLocalOrder() {
        Order order = Order.builder().id(42L).build();
        when(orderRepository.findById(42L)).thenReturn(Optional.of(order));
        when(qikinkClient.createOrder(order)).thenThrow(new IllegalStateException("Sandbox unavailable"));

        listener.submitOrder(new QikinkOrderRequested(42L));

        assertEquals("FAILED", order.getQikinkStatus());
        assertEquals("Sandbox unavailable", order.getQikinkError());
        verify(orderRepository).save(order);
    }
}