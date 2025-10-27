package com.supporthub.diary.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ChartStatsResponse(
        List<String> labels,
        List<Dataset> datasets,
        Map<String, Long> totals,
        long totalDiaries,
        long totalEmotions,

        // 👇 새로 추가
        Instant rangeStart,
        Instant rangeEnd
) {
    public record Dataset(
            String label,
            List<Long> data,
            String color
    ) {}
}
