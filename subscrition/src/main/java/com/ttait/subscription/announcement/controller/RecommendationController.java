package com.ttait.subscription.announcement.controller;

import com.ttait.subscription.announcement.dto.RecommendationItemResponse;
import com.ttait.subscription.announcement.service.RecommendationService;
import com.ttait.subscription.common.util.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public Page<RecommendationItemResponse> getRecommendations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return recommendationService.getRecommendations(CurrentUser.id(), PageRequest.of(page, size));
    }
}
