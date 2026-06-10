package com.ttait.subscription.announcement.controller;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ttait.subscription.announcement.dto.EligibilityCheckStatus;
import com.ttait.subscription.announcement.dto.EligibilityChecklistItemResponse;
import com.ttait.subscription.announcement.dto.EligibilityChecklistResponse;
import com.ttait.subscription.announcement.dto.EligibilitySummaryStatus;
import com.ttait.subscription.announcement.service.EligibilityChecklistService;
import com.ttait.subscription.auth.domain.AuthenticatedUser;
import com.ttait.subscription.common.exception.GlobalExceptionHandler;
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
class AnnouncementEligibilityChecklistControllerTest {

    private static final String DISCLAIMER = "이 결과는 저장된 프로필과 파싱된 공고 정보를 기준으로 한 참고용 체크입니다. 최종 신청 가능 여부는 공고 원문에서 확인해야 합니다.";

    @Mock
    private EligibilityChecklistService eligibilityChecklistService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new AnnouncementEligibilityChecklistController(eligibilityChecklistService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getEligibilityChecklistReturnsRouteResponseForAuthenticatedUser() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new AuthenticatedUser(10L, "user1"),
                null,
                List.of()));
        given(eligibilityChecklistService.getChecklist(10L, 1L)).willReturn(response());

        mockMvc.perform(get("/api/announcements/{announcementId}/eligibility-checklist", 1L))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "private, no-store"))
                .andExpect(jsonPath("$.announcementId").value(1))
                .andExpect(jsonPath("$.summaryStatus").value("REVIEW_REQUIRED"))
                .andExpect(jsonPath("$.summaryMessage").value("대체로 확인 가능하지만 공고 원문 또는 프로필 보완 확인이 필요합니다."))
                .andExpect(jsonPath("$.metCount").value(0))
                .andExpect(jsonPath("$.notMetCount").value(0))
                .andExpect(jsonPath("$.needsVerificationCount").value(1))
                .andExpect(jsonPath("$.notApplicableCount").value(0))
                .andExpect(jsonPath("$.disclaimer").value(DISCLAIMER))
                .andExpect(jsonPath("$.items[0].key").value("INCOME_ASSETS"))
                .andExpect(jsonPath("$.items[0].group").value("소득·자산"))
                .andExpect(jsonPath("$.items[0].label").value("소득·자산 상세 기준"))
                .andExpect(jsonPath("$.items[0].status").value("NEEDS_VERIFICATION"))
                .andExpect(jsonPath("$.items[0].reason").value("소득·자산 상세 기준은 원문 대조가 필요합니다."))
                .andExpect(jsonPath("$.items[0].actionTarget").value("OFFICIAL_NOTICE"))
                .andExpect(jsonPath("$.eligibilityRaw").doesNotExist())
                .andExpect(jsonPath("$.specialSupplyRaw").doesNotExist())
                .andExpect(jsonPath("$.items[0].eligibilityRaw").doesNotExist())
                .andExpect(jsonPath("$.items[0].specialSupplyRaw").doesNotExist());

        then(eligibilityChecklistService).should().getChecklist(10L, 1L);
    }

    @Test
    void getEligibilityChecklistRequiresAuthenticatedUserEvenThoughAnnouncementGetPathIsPublic() throws Exception {
        mockMvc.perform(get("/api/announcements/{announcementId}/eligibility-checklist", 1L))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("authentication required"));

        then(eligibilityChecklistService).shouldHaveNoInteractions();
    }

    private EligibilityChecklistResponse response() {
        return new EligibilityChecklistResponse(
                1L,
                EligibilitySummaryStatus.REVIEW_REQUIRED,
                "대체로 확인 가능하지만 공고 원문 또는 프로필 보완 확인이 필요합니다.",
                0,
                0,
                1,
                0,
                List.of(new EligibilityChecklistItemResponse(
                        "INCOME_ASSETS",
                        "소득·자산",
                        "소득·자산 상세 기준",
                        EligibilityCheckStatus.NEEDS_VERIFICATION,
                        "WARNING",
                        "소득·자산 상세 기준은 원문 대조가 필요합니다.",
                        "프로필 소득/자산 정보 참고",
                        "공고 원문 확인 필요",
                        "공고 원문 확인",
                        "OFFICIAL_NOTICE")),
                DISCLAIMER);
    }
}
