package com.ttait.subscription.announcement.repository;

import com.ttait.subscription.announcement.domain.AnnouncementEligibility;
import com.ttait.subscription.announcement.domain.ParseReviewStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementEligibilityRepository extends JpaRepository<AnnouncementEligibility, Long> {

    Optional<AnnouncementEligibility> findByAnnouncementId(Long announcementId);

    Page<AnnouncementEligibility> findByReviewStatus(ParseReviewStatus status, Pageable pageable);

    long countByReviewStatus(ParseReviewStatus status);
}
