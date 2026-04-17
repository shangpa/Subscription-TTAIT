package com.ttait.subscription.announcement.repository;

import com.ttait.subscription.announcement.domain.AnnouncementDetail;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementDetailRepository extends JpaRepository<AnnouncementDetail, Long> {
    Optional<AnnouncementDetail> findByAnnouncementIdAndDeletedFalse(Long announcementId);
}
