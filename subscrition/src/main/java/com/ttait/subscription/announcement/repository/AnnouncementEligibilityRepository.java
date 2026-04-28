package com.ttait.subscription.announcement.repository;

import com.ttait.subscription.announcement.domain.AnnouncementEligibility;
import com.ttait.subscription.announcement.domain.ParseReviewStatus;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnnouncementEligibilityRepository extends JpaRepository<AnnouncementEligibility, Long> {

    Optional<AnnouncementEligibility> findByAnnouncementId(Long announcementId);

    List<AnnouncementEligibility> findByAnnouncementIdIn(Collection<Long> announcementIds);

    @Query("SELECT e FROM AnnouncementEligibility e WHERE e.reviewStatus = :status AND e.announcement.deleted = false")
    Page<AnnouncementEligibility> findByReviewStatus(@Param("status") ParseReviewStatus status, Pageable pageable);

    @Query("SELECT COUNT(e) FROM AnnouncementEligibility e WHERE e.reviewStatus = :status AND e.announcement.deleted = false")
    long countByReviewStatus(@Param("status") ParseReviewStatus status);

    @Query("SELECT COUNT(e) FROM AnnouncementEligibility e WHERE e.reviewedAt >= :reviewedAtStart AND e.reviewStatus <> :excludedStatus AND e.announcement.deleted = false")
    long countByReviewedAtGreaterThanEqualAndReviewStatusNot(@Param("reviewedAtStart") LocalDateTime reviewedAtStart,
                                                             @Param("excludedStatus") ParseReviewStatus excludedStatus);
}
