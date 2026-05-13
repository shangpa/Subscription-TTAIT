package com.ttait.subscription.external.openclaw;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "openclaw")
public record OpenClawProperties(
        boolean enabled,
        boolean fallbackToGemini,
        String gatewayUrl,
        String gatewayToken,
        String sessionKey,
        Pdf pdf
) {
    public OpenClawProperties {
        if (gatewayUrl == null || gatewayUrl.isBlank()) {
            gatewayUrl = "http://127.0.0.1:18789";
        }
        if (sessionKey == null || sessionKey.isBlank()) {
            sessionKey = "main";
        }
        if (pdf == null) {
            pdf = new Pdf(null, null);
        }
    }

    public record Pdf(
            Integer maxBytesMb,
            Integer maxPages
    ) {
        public Pdf {
            if (maxBytesMb == null || maxBytesMb <= 0) {
                maxBytesMb = 50;
            }
            if (maxPages == null || maxPages <= 0) {
                maxPages = 80;
            }
        }
    }
}
