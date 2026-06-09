package com.ttait.subscription.announcement.controller;

import com.ttait.subscription.announcement.dto.EligibilityChecklistResponse;
import com.ttait.subscription.announcement.service.EligibilityChecklistService;
import com.ttait.subscription.common.util.CurrentUser;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementEligibilityChecklistController {

    private final EligibilityChecklistService eligibilityChecklistService;

    public AnnouncementEligibilityChecklistController(EligibilityChecklistService eligibilityChecklistService) {
        this.eligibilityChecklistService = eligibilityChecklistService;
    }

    @GetMapping("/{announcementId}/eligibility-checklist")
    public ResponseEntity<EligibilityChecklistResponse> getEligibilityChecklist(@PathVariable Long announcementId) {
        EligibilityChecklistResponse response = eligibilityChecklistService.getChecklist(CurrentUser.id(), announcementId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(response);
    }
}
