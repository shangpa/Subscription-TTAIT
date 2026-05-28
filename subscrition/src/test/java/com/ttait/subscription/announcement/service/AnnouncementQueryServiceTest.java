package com.ttait.subscription.announcement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.ttait.subscription.announcement.domain.Announcement;
import com.ttait.subscription.announcement.domain.AnnouncementStatus;
import com.ttait.subscription.announcement.domain.AnnouncementUnit;
import com.ttait.subscription.announcement.domain.AnnouncementUnitSource;
import com.ttait.subscription.announcement.domain.ParseReviewStatus;
import com.ttait.subscription.announcement.domain.SourceType;
import com.ttait.subscription.announcement.dto.AnnouncementDetailResponse;
import com.ttait.subscription.announcement.repository.AnnouncementCategoryRepository;
import com.ttait.subscription.announcement.repository.AnnouncementDetailRepository;
import com.ttait.subscription.announcement.repository.AnnouncementRepository;
import com.ttait.subscription.announcement.repository.AnnouncementUnitRepository;
import com.ttait.subscription.external.support.AnnouncementNormalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AnnouncementQueryServiceTest {

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private AnnouncementDetailRepository announcementDetailRepository;

    @Mock
    private AnnouncementCategoryRepository announcementCategoryRepository;

    @Mock
    private AnnouncementUnitRepository announcementUnitRepository;

    private AnnouncementQueryService service;

    @BeforeEach
    void setUp() {
        service = new AnnouncementQueryService(
                announcementRepository,
                announcementDetailRepository,
                announcementCategoryRepository,
                announcementUnitRepository,
                new AnnouncementNormalizer());
    }

    @Test
    void getAnnouncementDetailKeepsPublicVisibilityGuardAndReturnsSafeUnits() {
        Announcement announcement = announcement();
        given(announcementRepository.findPublicVisibleById(
                1L,
                List.of(ParseReviewStatus.APPROVED, ParseReviewStatus.CORRECTED)))
                .willReturn(Optional.of(announcement));
        given(announcementDetailRepository.findByAnnouncementIdAndDeletedFalse(1L)).willReturn(Optional.empty());
        given(announcementUnitRepository.findByAnnouncementIdAndDeletedFalseOrderByUnitOrderAsc(1L))
                .willReturn(List.of(unit(announcement)));

        AnnouncementDetailResponse response = service.getAnnouncementDetail(1L);

        assertThat(response.announcementId()).isEqualTo(1L);
        assertThat(response.units()).hasSize(1);
        assertThat(response.units().get(0).complexName()).isEqualTo("테스트단지");
        assertThat(response.units().get(0).supplyType()).isEqualTo("국민임대");
        assertThat(publicUnitComponentNames()).doesNotContain(
                "rawText",
                "sourceUnitKey",
                "salePriceRaw",
                "matchSource",
                "unitSource",
                "confidenceLevel");
        then(announcementRepository).should().findPublicVisibleById(
                1L,
                List.of(ParseReviewStatus.APPROVED, ParseReviewStatus.CORRECTED));
        then(announcementUnitRepository).should().findByAnnouncementIdAndDeletedFalseOrderByUnitOrderAsc(1L);
    }

    private Announcement announcement() {
        Announcement announcement = Announcement.builder()
                .sourcePrimary(SourceType.LH)
                .sourceNoticeId("PAN-001")
                .noticeName("테스트 공고")
                .providerName("LH")
                .sourceNoticeUrl("https://example.com/PAN-001")
                .noticeStatus(AnnouncementStatus.OPEN)
                .announcementDate(LocalDate.of(2026, 5, 1))
                .applicationStartDate(LocalDate.of(2026, 6, 1))
                .applicationEndDate(LocalDate.of(2026, 6, 10))
                .winnerAnnouncementDate(LocalDate.of(2026, 7, 1))
                .regionLevel1("경기도")
                .regionLevel2("수원시")
                .fullAddress("경기도 수원시 테스트로 1")
                .complexName("테스트단지")
                .supplyTypeNormalized("국민임대")
                .houseTypeNormalized("아파트")
                .depositAmount(5000L)
                .monthlyRentAmount(25L)
                .supplyHouseholdCount(30)
                .matchKey("match-key")
                .merged(false)
                .collectedAt(LocalDateTime.of(2026, 5, 1, 0, 0))
                .build();
        ReflectionTestUtils.setField(announcement, "id", 1L);
        return announcement;
    }

    private AnnouncementUnit unit(Announcement announcement) {
        AnnouncementUnit unit = AnnouncementUnit.builder()
                .announcement(announcement)
                .unitSource(AnnouncementUnitSource.MERGED)
                .sourceUnitKey("unit-key-1")
                .unitOrder(1)
                .complexName("테스트단지")
                .fullAddress("경기도 수원시 테스트로 1")
                .regionLevel1("경기도")
                .regionLevel2("수원시")
                .supplyTypeNormalized("국민임대")
                .houseTypeNormalized("아파트")
                .depositAmount(5000L)
                .monthlyRentAmount(25L)
                .supplyHouseholdCount(30)
                .rawText("원문 행 텍스트")
                .build();
        ReflectionTestUtils.setField(unit, "id", 10L);
        return unit;
    }

    private String[] publicUnitComponentNames() {
        return Arrays.stream(com.ttait.subscription.announcement.dto.AnnouncementUnitResponse.class.getRecordComponents())
                .map(component -> component.getName())
                .toArray(String[]::new);
    }
}
