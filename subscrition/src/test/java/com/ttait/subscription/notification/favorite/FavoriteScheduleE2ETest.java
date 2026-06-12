package com.ttait.subscription.notification.favorite;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ttait.subscription.announcement.domain.Announcement;
import com.ttait.subscription.announcement.domain.AnnouncementEligibility;
import com.ttait.subscription.announcement.domain.AnnouncementStatus;
import com.ttait.subscription.announcement.domain.SourceType;
import com.ttait.subscription.announcement.repository.AnnouncementEligibilityRepository;
import com.ttait.subscription.announcement.repository.AnnouncementRepository;
import com.ttait.subscription.auth.jwt.JwtTokenProvider;
import com.ttait.subscription.notification.favorite.domain.UserFavoriteAnnouncement;
import com.ttait.subscription.notification.favorite.repository.UserFavoriteAnnouncementRepository;
import com.ttait.subscription.user.domain.enums.Role;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.datasource.url=jdbc:h2:mem:favoriteschedulee2e;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false",
        "spring.task.scheduling.enabled=false",
        "jwt.secret=test-jwt-secret-key-for-e2e-test-1234567890",
        "jwt.expiration-hours=1",
        "gemini.api-key=test-gemini-api-key",
        "external.lh.service-key=test-lh-service-key",
        "spring.mail.username=test@example.com",
        "spring.mail.password=test-mail-password",
        "app.notification.from-email=test@example.com",
        "naver.maps.client-id=test-naver-client-id",
        "naver.maps.client-secret=test-naver-client-secret",
        "rtms.service-key=test-rtms-service-key"
    }
)
class FavoriteScheduleE2ETest {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    private static final String NOTICE_NAME = "E2E 승인 즐겨찾기 공고";

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private AnnouncementEligibilityRepository eligibilityRepository;

    @Autowired
    private UserFavoriteAnnouncementRepository favoriteRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        favoriteRepository.deleteAllInBatch();
        eligibilityRepository.deleteAllInBatch();
        announcementRepository.deleteAllInBatch();

        Announcement announcement = announcementRepository.save(announcement());
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
        eligibility.approve("e2e-tester");
        eligibilityRepository.save(eligibility);
        favoriteRepository.save(new UserFavoriteAnnouncement(1L, announcement));
    }

    @Test
    void getFavoriteScheduleOverHttpUsesSecurityAndDatabase() throws Exception {
        String token = jwtTokenProvider.generateToken(1L, "user1", Role.USER);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<String> response = restTemplate.exchange(
            "/api/me/favorites/schedule",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/summary/totalCount").asInt()).isEqualTo(1);
        assertThat(body.at("/summary/returnedCount").asInt()).isEqualTo(1);
        assertThat(body.at("/summary/truncated").asBoolean()).isFalse();
        assertThat(body.findValuesAsText("noticeName")).contains(NOTICE_NAME);
        assertThat(body.findValuesAsText("scheduleStatus")).contains("OPEN");
        assertThat(body.findValuesAsText("eventType"))
            .containsAnyOf("APPLICATION_START", "APPLICATION_END");
    }

    private Announcement announcement() {
        LocalDate today = LocalDate.now(SEOUL_ZONE);
        return new Announcement(
            SourceType.LH,
            "E2E-PAN-001",
            NOTICE_NAME,
            "LH",
            "https://example.com/notice/E2E-PAN-001",
            null,
            null,
            null,
            AnnouncementStatus.OPEN,
            today.minusDays(2),
            today.minusDays(1),
            today.plusDays(10),
            today.plusDays(30),
            "서울특별시",
            "강남구",
            "서울특별시 강남구 테스트로",
            null,
            "E2E 테스트 단지",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "match-key-E2E-PAN-001",
            false,
            null,
            LocalDateTime.now()
        );
    }
}
