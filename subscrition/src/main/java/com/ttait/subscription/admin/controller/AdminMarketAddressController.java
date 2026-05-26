package com.ttait.subscription.admin.controller;

import com.ttait.subscription.admin.dto.AddressNormalizationRequest;
import com.ttait.subscription.admin.dto.AddressNormalizationResponse;
import com.ttait.subscription.admin.dto.LawdCodeMappingUpsertRequest;
import com.ttait.subscription.admin.dto.LawdCodeMappingUpsertResponse;
import com.ttait.subscription.admin.service.AdminMarketAddressService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/market/address")
public class AdminMarketAddressController {

    private final AdminMarketAddressService addressService;

    public AdminMarketAddressController(AdminMarketAddressService addressService) {
        this.addressService = addressService;
    }

    @PostMapping("/lawd-code-mappings")
    public ResponseEntity<LawdCodeMappingUpsertResponse> upsertLawdCodeMappings(
            @RequestBody LawdCodeMappingUpsertRequest request) {
        return ResponseEntity.ok(addressService.upsertLawdCodeMappings(request));
    }

    @PostMapping("/announcements/{announcementId}/normalize-units")
    public ResponseEntity<AddressNormalizationResponse> normalizeAnnouncementUnits(
            @PathVariable Long announcementId,
            @RequestBody(required = false) AddressNormalizationRequest request) {
        boolean retryNoLawdCode = request != null && request.retryNoLawdCodeOrDefault();
        return ResponseEntity.ok(addressService.normalizeAnnouncementUnits(announcementId, retryNoLawdCode));
    }
}
