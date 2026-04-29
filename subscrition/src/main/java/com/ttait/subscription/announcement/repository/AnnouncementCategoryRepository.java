package com.ttait.subscription.announcement.repository;

import com.ttait.subscription.announcement.domain.AnnouncementCategory;
import com.ttait.subscription.user.domain.enums.CategoryCode;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementCategoryRepository extends JpaRepository<AnnouncementCategory, Long> {

    boolean existsByAnnouncementIdAndCategoryCode(Long announcementId, CategoryCode categoryCode);

    List<AnnouncementCategory> findByAnnouncementIdIn(Collection<Long> announcementIds);

    void deleteByAnnouncementId(Long announcementId);
}
