package com.ttait.subscription.notification.favorite.controller;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ttait.subscription.auth.domain.AuthenticatedUser;
import com.ttait.subscription.common.exception.GlobalExceptionHandler;
import com.ttait.subscription.notification.favorite.dto.FavoriteScheduleResponse;
import com.ttait.subscription.notification.favorite.dto.FavoriteScheduleSummaryResponse;
import com.ttait.subscription.notification.favorite.service.FavoriteScheduleService;
import com.ttait.subscription.notification.favorite.service.FavoriteService;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class FavoriteControllerTest {

    @Mock
    private FavoriteService favoriteService;

    @Mock
    private FavoriteScheduleService favoriteScheduleService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new FavoriteController(favoriteService, favoriteScheduleService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getScheduleReturnsSummaryForAuthenticatedUser() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            new AuthenticatedUser(10L, "user1"),
            null,
            List.of()));
        given(favoriteScheduleService.getSchedule(10L)).willReturn(scheduleResponse());

        mockMvc.perform(get("/api/me/favorites/schedule"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.summary.totalCount").value(3))
            .andExpect(jsonPath("$.summary.returnedCount").value(2))
            .andExpect(jsonPath("$.summary.truncated").value(true));

        then(favoriteScheduleService).should().getSchedule(10L);
    }

    @Test
    void getScheduleRequiresAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/me/favorites/schedule"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("authentication required"));

        then(favoriteScheduleService).shouldHaveNoInteractions();
    }

    private FavoriteScheduleResponse scheduleResponse() {
        return new FavoriteScheduleResponse(
            new FavoriteScheduleSummaryResponse(3, 2, true, 1, 0, 1, 1, 0, 0, 0),
            List.of(),
            List.of(),
            "disclaimer"
        );
    }
}
