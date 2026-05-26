package com.ttait.subscription.admin.service;

import com.ttait.subscription.admin.dto.AddressNormalizationResponse;
import com.ttait.subscription.admin.dto.LawdCodeMappingUpsertRequest;
import com.ttait.subscription.admin.dto.LawdCodeMappingUpsertResponse;
import com.ttait.subscription.common.exception.ApiException;
import com.ttait.subscription.external.service.AnnouncementUnitAddressEnrichmentService;
import com.ttait.subscription.market.domain.LawdCodeMapping;
import com.ttait.subscription.market.repository.LawdCodeMappingRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AdminMarketAddressService {

    private final LawdCodeMappingRepository lawdCodeMappingRepository;
    private final AnnouncementUnitAddressEnrichmentService addressEnrichmentService;

    public AdminMarketAddressService(LawdCodeMappingRepository lawdCodeMappingRepository,
                                     AnnouncementUnitAddressEnrichmentService addressEnrichmentService) {
        this.lawdCodeMappingRepository = lawdCodeMappingRepository;
        this.addressEnrichmentService = addressEnrichmentService;
    }

    @Transactional
    public LawdCodeMappingUpsertResponse upsertLawdCodeMappings(LawdCodeMappingUpsertRequest request) {
        List<LawdCodeMappingUpsertRequest.Item> mappings = request == null ? null : request.mappings();
        if (mappings == null || mappings.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "mappings is required");
        }

        int insertedCount = 0;
        int updatedCount = 0;
        for (LawdCodeMappingUpsertRequest.Item item : mappings) {
            validate(item);
            String regionLevel1 = normalize(item.regionLevel1());
            String regionLevel2 = normalize(item.regionLevel2());
            String legalDongName = normalize(item.legalDongName());
            String legalDongCode = item.legalDongCode().trim();

            LawdCodeMapping mapping = lawdCodeMappingRepository
                    .findFirstByRegionLevel2AndLegalDongNameAndLegalDongCode(
                            regionLevel2,
                            legalDongName,
                            legalDongCode)
                    .orElse(null);
            if (mapping == null) {
                lawdCodeMappingRepository.save(LawdCodeMapping.builder()
                        .regionLevel1(regionLevel1)
                        .regionLevel2(regionLevel2)
                        .legalDongName(legalDongName)
                        .legalDongCode(legalDongCode)
                        .active(item.active())
                        .build());
                insertedCount++;
            } else {
                mapping.updateMetadata(regionLevel1, item.active());
                updatedCount++;
            }
        }
        return new LawdCodeMappingUpsertResponse(mappings.size(), insertedCount, updatedCount);
    }

    public AddressNormalizationResponse normalizeAnnouncementUnits(Long announcementId, boolean retryNoLawdCode) {
        if (announcementId == null || announcementId <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "announcementId must be positive");
        }
        AnnouncementUnitAddressEnrichmentService.AddressEnrichmentResult result =
                addressEnrichmentService.enrichUnits(announcementId, retryNoLawdCode);
        return new AddressNormalizationResponse(
                result.announcementId(),
                result.processedCount(),
                result.successCount(),
                result.noAddressCount(),
                result.noLawdCodeCount()
        );
    }

    private void validate(LawdCodeMappingUpsertRequest.Item item) {
        if (item == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "mapping item is required");
        }
        if (!StringUtils.hasText(item.regionLevel2())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "regionLevel2 is required");
        }
        if (!StringUtils.hasText(item.legalDongName())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "legalDongName is required");
        }
        if (!StringUtils.hasText(item.legalDongCode()) || !item.legalDongCode().trim().matches("\\d{10}")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "legalDongCode must be 10 digits");
        }
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim().replaceAll("\s+", " ") : null;
    }
}
