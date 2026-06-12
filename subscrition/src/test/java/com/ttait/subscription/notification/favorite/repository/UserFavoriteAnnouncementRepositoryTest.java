package com.ttait.subscription.notification.favorite.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.ttait.subscription.announcement.domain.Announcement;
import com.ttait.subscription.announcement.domain.AnnouncementEligibility;
import com.ttait.subscription.announcement.domain.AnnouncementStatus;
import com.ttait.subscription.announcement.domain.ParseReviewStatus;
import com.ttait.subscription.announcement.domain.SourceType;
import com.ttait.subscription.announcement.repository.AnnouncementEligibilityRepository;
import com.ttait.subscription.announcement.repository.AnnouncementRepository;
import com.ttait.subscription.config.JpaConfig;
import com.ttait.subscription.notification.favorite.domain.UserFavoriteAnnouncement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@DataJpaTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:userfavoriteannouncementrepository;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(JpaConfig.class)
class UserFavoriteAnnouncementRepositoryTest {

    @Autowired
    private UserFavoriteAnnouncementRepository favoriteRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private AnnouncementEligibilityRepository eligibilityRepository;

    @Test
    @DisplayName("사용자, 삭제/병합 여부, public visible 검수 상태로 즐겨찾기 일정을 필터링한다")
    void findVisibleByUserIdWithAnnouncementFiltersUserAndVisibilityConditions() {
        Announcement approved = saveFavorite(1L, "PAN-APPROVED", "승인 공고", ParseReviewStatus.APPROVED, false, false);
        Announcement corrected = saveFavorite(1L, "PAN-CORRECTED", "수정 승인 공고", ParseReviewStatus.CORRECTED, false, false);
        saveFavorite(1L, "PAN-PENDING", "대기 공고", ParseReviewStatus.PENDING, false, false);
        saveFavorite(1L, "PAN-REJECTED", "거절 공고", ParseReviewStatus.REJECTED, false, false);
        saveFavorite(2L, "PAN-OTHER-USER", "다른 사용자 공고", ParseReviewStatus.APPROVED, false, false);
        saveFavorite(1L, "PAN-DELETED", "삭제 공고", ParseReviewStatus.APPROVED, true, false);
        saveFavorite(1L, "PAN-MERGED", "병합 공고", ParseReviewStatus.APPROVED, false, true);

        List<UserFavoriteAnnouncement> result = favoriteRepository.findVisibleByUserIdWithAnnouncement(
            1L,
            ParseReviewStatus.publicVisibleStatuses());

        assertThat(result)
            .extracting("announcement.noticeName")
            .containsExactlyInAnyOrder("승인 공고", "수정 승인 공고");
        assertThat(result)
            .extracting("announcement")
            .containsExactlyInAnyOrder(approved, corrected);
    }

    @Test
    @DisplayName("일정 page는 저장 순서가 아니라 일정 우선순위로 정렬해 cap 이전에 긴급 공고를 보존한다")
    void findSchedulePageOrdersByBusinessPriorityBeforeApplyingLimit() {
        LocalDate today = LocalDate.of(2026, 6, 11);
        for (int index = 1; index <= 200; index++) {
            saveFavorite(
                1L,
                "PAN-OPEN-" + index,
                "Open %03d".formatted(index),
                ParseReviewStatus.APPROVED,
                false,
                false,
                today.minusDays(1),
                today.plusDays(20)
            );
        }
        saveFavorite(
            1L,
            "PAN-DUE-TODAY",
            "긴급 오늘 마감",
            ParseReviewStatus.APPROVED,
            false,
            false,
            today.minusDays(1),
            today
        );

        Page<UserFavoriteAnnouncement> result = favoriteRepository.findSchedulePageByUserIdWithAnnouncement(
            1L,
            ParseReviewStatus.publicVisibleStatuses(),
            today,
            today.plusDays(1),
            today.plusDays(7),
            PageRequest.of(0, 200)
        );

        assertThat(result.getTotalElements()).isEqualTo(201);
        assertThat(result.getContent()).hasSize(200);
        assertThat(result.getContent())
            .extracting("announcement.noticeName")
            .first()
            .isEqualTo("긴급 오늘 마감");
        assertThat(result.getContent())
            .extracting("announcement.noticeName")
            .contains("긴급 오늘 마감")
            .doesNotContain("Open 200");
    }

    private Announcement saveFavorite(Long userId,
                                      String sourceNoticeId,
                                      String noticeName,
                                      ParseReviewStatus reviewStatus,
                                      boolean deleted,
                                      boolean merged) {
        return saveFavorite(
            userId,
            sourceNoticeId,
            noticeName,
            reviewStatus,
            deleted,
            merged,
            LocalDate.of(2026, 6, 10),
            LocalDate.of(2026, 6, 20)
        );
    }

    private Announcement saveFavorite(Long userId,
                                      String sourceNoticeId,
                                      String noticeName,
                                      ParseReviewStatus reviewStatus,
                                      boolean deleted,
                                      boolean merged,
                                      LocalDate applicationStartDate,
                                      LocalDate applicationEndDate) {
        Announcement announcement = announcement(sourceNoticeId, noticeName, merged, applicationStartDate, applicationEndDate);
        if (deleted) {
            announcement.softDelete();
        }
        Announcement saved = announcementRepository.save(announcement);
        eligibilityRepository.save(eligibility(saved, reviewStatus));
        favoriteRepository.save(new UserFavoriteAnnouncement(userId, saved));
        return saved;
    }

    private AnnouncementEligibility eligibility(Announcement announcement, ParseReviewStatus reviewStatus) {
        AnnouncementEligibility eligibility = new AnnouncementEligibility(
            announcement,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        );
        switch (reviewStatus) {
            case APPROVED -> eligibility.approve("tester");
            case CORRECTED -> eligibility.correct("tester", "corrected", null, null, null, null, null, null, null, null, null);
            case REJECTED -> eligibility.reject("tester", "rejected");
            case PENDING, RE_IMPORT -> {
            }
        }
        return eligibility;
    }

    private Announcement announcement(String sourceNoticeId,
                                      String noticeName,
                                      boolean merged,
                                      LocalDate applicationStartDate,
                                      LocalDate applicationEndDate) {
        return new Announcement(
            SourceType.LH,
            sourceNoticeId,
            noticeName,
            "LH",
            "https://example.com/notice/" + sourceNoticeId,
            null,
            null,
            null,
            AnnouncementStatus.OPEN,
            LocalDate.of(2026, 6, 1),
            applicationStartDate,
            applicationEndDate,
            null,
            "서울특별시",
            "강남구",
            "서울특별시 강남구 테스트로",
            null,
            "테스트 단지",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "match-key-" + sourceNoticeId,
            merged,
            null,
            LocalDateTime.of(2026, 5, 21, 9, 0)
        );
    }
}
