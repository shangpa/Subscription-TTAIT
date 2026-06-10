package com.ttait.subscription.admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LhSelectedImportRequest(
        @NotNull
        @Size(min = 1, max = 100, message = "candidateIds size must be between 1 and 100")
        List<@NotNull Long> candidateIds,
        Boolean force
) {
    public static final int MAX_CANDIDATE_IDS = 100;

    public boolean forceOrDefault() {
        return Boolean.TRUE.equals(force);
    }
}
