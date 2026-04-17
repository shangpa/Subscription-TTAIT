package com.ttait.subscription.announcement.service;

import com.ttait.subscription.announcement.domain.Announcement;
import com.ttait.subscription.announcement.domain.AnnouncementDetail;
import com.ttait.subscription.announcement.dto.AnnouncementDetailResponse;
import com.ttait.subscription.announcement.dto.AnnouncementListItemResponse;
import com.ttait.subscription.announcement.repository.AnnouncementDetailRepository;
import com.ttait.subscription.announcement.repository.AnnouncementRepository;
import com.ttait.subscription.common.exception.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AnnouncementQueryService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementDetailRepository announcementDetailRepository;

    public AnnouncementQueryService(AnnouncementRepository announcementRepository,
                                    AnnouncementDetailRepository announcementDetailRepository) {
        this.announcementRepository = announcementRepository;
        this.announcementDetailRepository = announcementDetailRepository;
    }

    public Page<AnnouncementListItemResponse> getAnnouncements(Pageable pageable) {
        return announcementRepository.findByDeletedFalseAndMergedFalse(pageable)
                .map(this::toListItem);
    }

    public AnnouncementDetailResponse getAnnouncementDetail(Long announcementId) {
        Announcement announcement = announcementRepository.findByIdAndDeletedFalse(announcementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "announcement not found"));
        AnnouncementDetail detail = announcementDetailRepository.findByAnnouncementIdAndDeletedFalse(announcementId)
                .orElse(null);
        return toDetailResponse(announcement, detail);
    }

    private AnnouncementListItemResponse toListItem(Announcement a) {
        return new AnnouncementListItemResponse(
                a.getId(),
                a.getNoticeName(),
                a.getProviderName(),
                a.getSupplyTypeNormalized(),
                a.getHouseTypeNormalized(),
                a.getRegionLevel1(),
                a.getRegionLevel2(),
                a.getComplexName(),
                a.getDepositAmount(),
                a.getMonthlyRentAmount(),
                a.getApplicationStartDate(),
                a.getApplicationEndDate(),
                a.getNoticeStatus().name()
        );
    }

    private AnnouncementDetailResponse toDetailResponse(Announcement a, AnnouncementDetail d) {
        return new AnnouncementDetailResponse(
                a.getId(),
                a.getNoticeName(),
                a.getProviderName(),
                a.getNoticeStatus().name(),
                a.getAnnouncementDate(),
                a.getApplicationStartDate(),
                a.getApplicationEndDate(),
                a.getWinnerAnnouncementDate(),
                a.getSupplyTypeNormalized(),
                a.getHouseTypeNormalized(),
                a.getComplexName(),
                a.getFullAddress(),
                a.getDepositAmount(),
                a.getMonthlyRentAmount(),
                d != null ? d.getHouseholdCount() : null,
                a.getSupplyHouseholdCount(),
                d != null ? d.getHeatingType() : null,
                d != null ? d.getExclusiveAreaText() : null,
                d != null ? d.getExclusiveAreaValue() : null,
                d != null ? d.getMoveInExpectedYm() : null,
                d != null ? d.getApplicationDatetimeText() : null,
                d != null ? d.getGuideText() : null,
                d != null ? d.getContactPhone() : null,
                a.getSourceNoticeUrl()
        );
    }
}
