package com.ttait.subscription.admin.controller;

import com.ttait.subscription.admin.dto.AdminReviewDetailResponse;
import com.ttait.subscription.admin.dto.AdminReviewListResponse;
import com.ttait.subscription.admin.dto.AdminReviewRequest;
import com.ttait.subscription.admin.service.AdminReviewService;
import com.ttait.subscription.announcement.domain.ParseReviewStatus;
import com.ttait.subscription.auth.domain.AuthenticatedUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/review")
public class AdminReviewController {

    private final AdminReviewService adminReviewService;

    public AdminReviewController(AdminReviewService adminReviewService) {
        this.adminReviewService = adminReviewService;
    }

    @GetMapping
    public ResponseEntity<Page<AdminReviewListResponse>> list(
            @RequestParam(defaultValue = "PENDING") ParseReviewStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminReviewService.listByStatus(status, PageRequest.of(page, size)));
    }

    @GetMapping("/{announcementId}")
    public ResponseEntity<AdminReviewDetailResponse> detail(@PathVariable Long announcementId) {
        return ResponseEntity.ok(adminReviewService.getDetail(announcementId));
    }

    @PostMapping("/{announcementId}")
    public ResponseEntity<Void> review(@PathVariable Long announcementId,
                                       @RequestBody AdminReviewRequest request,
                                       @AuthenticationPrincipal AuthenticatedUser currentUser) {
        adminReviewService.review(announcementId, request, currentUser.loginId());
        return ResponseEntity.ok().build();
    }
}
