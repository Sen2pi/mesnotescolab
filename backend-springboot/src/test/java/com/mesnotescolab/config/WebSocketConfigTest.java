package com.mesnotescolab.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;

import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("WebSocketConfig Tests")
class WebSocketConfigTest {

    @Test
    @DisplayName("Should configure message broker correctly")
    void shouldConfigureMessageBrokerCorrectly() {
        // Given
        WebSocketConfig config = new WebSocketConfig();
        MessageBrokerRegistry registry = mock(MessageBrokerRegistry.class);

        // When
        config.configureMessageBroker(registry);

        // Then
        verify(registry).enableSimpleBroker("/topic", "/queue");
        verify(registry).setApplicationDestinationPrefixes("/app");
        verify(registry).setUserDestinationPrefix("/user");
    }

    @Test
    @DisplayName("Should register STOMP endpoints correctly")
    void shouldRegisterStompEndpointsCorrectly() {
        // Given
        WebSocketConfig config = new WebSocketConfig();
        StompEndpointRegistry registry = mock(StompEndpointRegistry.class);
        StompEndpointRegistry.StompWebSocketEndpointRegistration registration = 
                mock(StompEndpointRegistry.StompWebSocketEndpointRegistration.class);

        when(registry.addEndpoint("/ws")).thenReturn(registration);
        when(registration.setAllowedOriginPatterns("*")).thenReturn(registration);

        // When
        config.registerStompEndpoints(registry);

        // Then
        verify(registry).addEndpoint("/ws");
        verify(registration).setAllowedOriginPatterns("*");
        verify(registration).withSockJS();
    }
}