package com.ttait.subscription.admin.service;

import com.ttait.subscription.admin.dto.AdminReviewDetailResponse;
import com.ttait.subscription.admin.dto.AdminReviewListResponse;
import com.ttait.subscription.admin.dto.AdminReviewRequest;
import com.ttait.subscription.announcement.domain.Announcement;
import com.ttait.subscription.announcement.domain.AnnouncementDetail;
import com.ttait.subscription.announcement.domain.AnnouncementEligibility;
import com.ttait.subscription.announcement.domain.MaritalTargetType;
import com.ttait.subscription.announcement.domain.ParseReviewStatus;
import com.ttait.subscription.announcement.repository.AnnouncementDetailRepository;
import com.ttait.subscription.announcement.repository.AnnouncementEligibilityRepository;
import com.ttait.subscription.announcement.repository.AnnouncementRepository;
import com.ttait.subscription.common.exception.ApiException;
import com.ttait.subscription.external.service.NoticeImportOrchestrator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminReviewService {

    private static final Logger log = LoggerFactory.getLogger(AdminReviewService.class);

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementDetailRepository announcementDetailRepository;
    private final AnnouncementEligibilityRepository eligibilityRepository;
    private final NoticeImportOrchestrator orchestrator;

    public AdminReviewService(AnnouncementRepository announcementRepository,
                              AnnouncementDetailRepository announcementDetailRepository,
                              AnnouncementEligibilityRepository eligibilityRepository,
                              NoticeImportOrchestrator orchestrator) {
        this.announcementRepository = announcementRepository;
        this.announcementDetailRepository = announcementDetailRepository;
        this.eligibilityRepository = eligibilityRepository;
        this.orchestrator = orchestrator;
    }

    @Transactional(readOnly = true)
    public Page<AdminReviewListResponse> listByStatus(ParseReviewStatus status, Pageable pageable) {
        return eligibilityRepository.findByReviewStatus(status, pageable)
                .map(AdminReviewListResponse::from);
    }

    @Transactional(readOnly = true)
    public AdminReviewDetailResponse getDetail(Long announcementId) {
        Announcement announcement = announcementRepository.findByIdAndDeletedFalse(announcementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "announcement not found"));
        AnnouncementEligibility eligibility = eligibilityRepository.findByAnnouncementId(announcementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "eligibility not found for announcement " + announcementId));
        AnnouncementDetail detail = announcementDetailRepository.findByAnnouncementIdAndDeletedFalse(announcementId)
                .orElse(null);
        return AdminReviewDetailResponse.from(announcement, detail, eligibility);
    }

    public void review(Long announcementId, AdminReviewRequest request, String reviewerLoginId) {
        String action = request.action();
        if (action == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "action is required");
        }

        switch (action.toUpperCase()) {
            case "APPROVE" -> handleApprove(announcementId, reviewerLoginId);
            case "CORRECT" -> handleCorrect(announcementId, request, reviewerLoginId);
            case "REJECT" -> handleReject(announcementId, request, reviewerLoginId);
            case "REIMPORT" -> handleReimport(announcementId, reviewerLoginId);
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "unknown action: " + action);
        }
    }

    private void handleApprove(Long announcementId, String reviewerLoginId) {
        AnnouncementEligibility eligibility = findEligibility(announcementId);
        eligibility.approve(reviewerLoginId);
    }

    private void handleCorrect(Long announcementId, AdminReviewRequest request, String reviewerLoginId) {
        AdminReviewRequest.Corrections c = request.corrections();
        if (c == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "corrections required for CORRECT action");
        }

        Announcement announcement = announcementRepository.findByIdAndDeletedFalse(announcementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "announcement not found"));
        announcement.updateDepositAndRent(c.depositAmount(), c.monthlyRentAmount());
        if (c.supplyHouseholdCount() != null) {
            announcement.updateSupplyHouseholdCount(c.supplyHouseholdCount());
        }

        MaritalTargetType maritalTargetType = null;
        if (c.maritalTargetType() != null) {
            try {
                maritalTargetType = MaritalTargetType.valueOf(c.maritalTargetType());
            } catch (IllegalArgumentException e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "unknown maritalTargetType: " + c.maritalTargetType());
            }
        }

        AnnouncementEligibility eligibility = findEligibility(announcementId);
        eligibility.correct(reviewerLoginId, request.note(),
                c.ageMin(), c.ageMax(), maritalTargetType,
                c.marriageYearLimit(), c.childrenMinCount(),
                c.homelessRequired(), c.lowIncomeRequired(),
                c.elderlyRequired(), c.elderlyAgeMin());
    }

    private void handleReject(Long announcementId, AdminReviewRequest request, String reviewerLoginId) {
        AnnouncementEligibility eligibility = findEligibility(announcementId);
        eligibility.reject(reviewerLoginId, request.note());
    }

    private void handleReimport(Long announcementId, String reviewerLoginId) {
        log.info("Reimport triggered by {} for announcementId={}", reviewerLoginId, announcementId);
        orchestrator.reimportAnnouncement(announcementId);
        AnnouncementEligibility eligibility = findEligibility(announcementId);
        eligibility.resetToPending();
    }

    private AnnouncementEligibility findEligibility(Long announcementId) {
        return eligibilityRepository.findByAnnouncementId(announcementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "eligibility not found for announcement " + announcementId));
    }
}
