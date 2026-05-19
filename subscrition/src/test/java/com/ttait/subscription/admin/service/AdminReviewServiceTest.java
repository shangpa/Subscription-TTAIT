package com.ttait.subscription.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.ttait.subscription.admin.dto.AdminReviewDetailResponse;
import com.ttait.subscription.admin.dto.AdminReviewListResponse;
import com.ttait.subscription.announcement.domain.Announcement;
import com.ttait.subscription.announcement.domain.AnnouncementDetail;
import com.ttait.subscription.announcement.domain.AnnouncementEligibility;
import com.ttait.subscription.announcement.domain.AnnouncementStatus;
import com.ttait.subscription.announcement.domain.AnnouncementUnit;
import com.ttait.subscription.announcement.domain.AnnouncementUnitSource;
import com.ttait.subscription.announcement.domain.ParseReviewStatus;
import com.ttait.subscription.announcement.domain.SourceType;
import com.ttait.subscription.announcement.repository.AnnouncementDetailRepository;
import com.ttait.subscription.announcement.repository.AnnouncementEligibilityRepository;
import com.ttait.subscription.announcement.repository.AnnouncementRepository;
import com.ttait.subscription.announcement.repository.AnnouncementUnitRepository;
import com.ttait.subscription.external.service.NoticeImportOrchestrator;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminReviewServiceTest {

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private AnnouncementDetailRepository announcementDetailRepository;

    @Mock
    private AnnouncementEligibilityRepository eligibilityRepository;

    @Mock
    private AnnouncementUnitRepository announcementUnitRepository;

    @Mock
    private NoticeImportOrchestrator orchestrator;

    private AdminReviewService service;

    @BeforeEach
    void setUp() {
        service = new AdminReviewService(
                announcementRepository,
                announcementDetailRepository,
                eligibilityRepository,
                announcementUnitRepository,
                orchestrator);
    }

    @Test
    void listByStatusMapsAnnouncementSummaryAndBatchUnitCount() {
        Announcement first = announcement(1L, "PAN-001", "테스트 공고 1", "수원시", "A단지");
        Announcement second = announcement(2L, "PAN-002", "테스트 공고 2", "성남시", "B단지");
        PageRequest pageable = PageRequest.of(0, 20);
        given(eligibilityRepository.findByReviewStatus(ParseReviewStatus.PENDING, pageable))
                .willReturn(new PageImpl<>(List.of(eligibility(first), eligibility(second)), pageable, 2));
        given(announcementUnitRepository.countUnitsByAnnouncementIds(List.of(1L, 2L)))
                .willReturn(List.of(unitCount(1L, 3L), unitCount(2L, 1L)));

        Page<AdminReviewListResponse> response = service.listByStatus(ParseReviewStatus.PENDING, pageable);

        assertThat(response.getTotalElements()).isEqualTo(2);
        assertThat(response.getContent().get(0).providerName()).isEqualTo("LH");
        assertThat(response.getContent().get(0).noticeStatus()).isEqualTo("OPEN");
        assertThat(response.getContent().get(0).regionLevel2()).isEqualTo("수원시");
        assertThat(response.getContent().get(0).complexName()).isEqualTo("A단지");
        assertThat(response.getContent().get(0).supplyType()).isEqualTo("국민임대");
        assertThat(response.getContent().get(0).houseType()).isEqualTo("아파트");
        assertThat(response.getContent().get(0).depositAmount()).isEqualTo(5000L);
        assertThat(response.getContent().get(0).unitCount()).isEqualTo(3L);
        assertThat(response.getContent().get(1).unitCount()).isEqualTo(1L);
        then(announcementUnitRepository).should().countUnitsByAnnouncementIds(List.of(1L, 2L));
    }

    @Test
    void getDetailAddsAnnouncementSummaryAndUnitCount() {
        Announcement announcement = announcement(1L, "PAN-001", "테스트 공고", "수원시", "A단지");
        AnnouncementUnit firstUnit = unit(announcement, 1);
        AnnouncementUnit secondUnit = unit(announcement, 2);
        given(announcementRepository.findByIdAndDeletedFalse(1L)).willReturn(Optional.of(announcement));
        given(eligibilityRepository.findByAnnouncementId(1L)).willReturn(Optional.of(eligibility(announcement)));
        given(announcementDetailRepository.findByAnnouncementIdAndDeletedFalse(1L))
                .willReturn(Optional.of(AnnouncementDetail.builder().announcement(announcement).build()));
        given(announcementUnitRepository.findByAnnouncementIdAndDeletedFalseOrderByUnitOrderAsc(1L))
                .willReturn(List.of(firstUnit, secondUnit));

        AdminReviewDetailResponse response = service.getDetail(1L);

        assertThat(response.sourcePrimary()).isEqualTo("LH");
        assertThat(response.sourceNoticeId()).isEqualTo("PAN-001");
        assertThat(response.sourceNoticeUrl()).isEqualTo("https://example.com/PAN-001");
        assertThat(response.noticeStatus()).isEqualTo("OPEN");
        assertThat(response.applicationStartDate()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(response.regionLevel2()).isEqualTo("수원시");
        assertThat(response.fullAddress()).isEqualTo("경기도 수원시 테스트로 1");
        assertThat(response.complexName()).isEqualTo("A단지");
        assertThat(response.supplyType()).isEqualTo("국민임대");
        assertThat(response.houseType()).isEqualTo("아파트");
        assertThat(response.unitCount()).isEqualTo(2L);
        assertThat(response.units()).hasSize(2);
    }

    private Announcement announcement(Long id, String sourceNoticeId, String noticeName,
                                      String regionLevel2, String complexName) {
        Announcement announcement = Announcement.builder()
                .sourcePrimary(SourceType.LH)
                .sourceNoticeId(sourceNoticeId)
                .noticeName(noticeName)
                .providerName("LH")
                .sourceNoticeUrl("https://example.com/" + sourceNoticeId)
                .noticeStatus(AnnouncementStatus.OPEN)
                .announcementDate(LocalDate.of(2026, 5, 1))
                .applicationStartDate(LocalDate.of(2026, 6, 1))
                .applicationEndDate(LocalDate.of(2026, 6, 10))
                .winnerAnnouncementDate(LocalDate.of(2026, 7, 1))
                .regionLevel1("경기도")
                .regionLevel2(regionLevel2)
                .fullAddress("경기도 " + regionLevel2 + " 테스트로 1")
                .complexName(complexName)
                .supplyTypeNormalized("국민임대")
                .houseTypeNormalized("아파트")
                .depositAmount(5000L)
                .monthlyRentAmount(25L)
                .supplyHouseholdCount(30)
                .matchKey("match-" + sourceNoticeId)
                .merged(false)
                .collectedAt(LocalDateTime.of(2026, 5, 1, 0, 0))
                .build();
        ReflectionTestUtils.setField(announcement, "id", id);
        return announcement;
    }

    private AnnouncementEligibility eligibility(Announcement announcement) {
        return AnnouncementEligibility.builder()
                .announcement(announcement)
                .build();
    }

    private AnnouncementUnit unit(Announcement announcement, int order) {
        AnnouncementUnit unit = AnnouncementUnit.builder()
                .announcement(announcement)
                .unitSource(AnnouncementUnitSource.LH_API)
                .sourceUnitKey("unit-" + order)
                .unitOrder(order)
                .complexName(announcement.getComplexName())
                .fullAddress(announcement.getFullAddress())
                .regionLevel1(announcement.getRegionLevel1())
                .regionLevel2(announcement.getRegionLevel2())
                .supplyTypeNormalized(announcement.getSupplyTypeNormalized())
                .houseTypeNormalized(announcement.getHouseTypeNormalized())
                .depositAmount(announcement.getDepositAmount())
                .monthlyRentAmount(announcement.getMonthlyRentAmount())
                .supplyHouseholdCount(10)
                .build();
        ReflectionTestUtils.setField(unit, "id", (long) order);
        return unit;
    }

    private AnnouncementUnitRepository.UnitCountProjection unitCount(Long announcementId, Long unitCount) {
        return new AnnouncementUnitRepository.UnitCountProjection() {
            @Override
            public Long getAnnouncementId() {
                return announcementId;
            }

            @Override
            public Long getUnitCount() {
                return unitCount;
            }
        };
    }
}
