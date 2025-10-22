package com.supporthub.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class OpenAIClientConfig {

    /**
     * OpenAI Chat Completions 엔드포인트용 WebClient
     * Authorization 헤더와 JSON 기본 헤더 세팅
     */
    @Bean("openAiWebClient")
    public WebClient openAiWebClient(@Value("${openai.apiKey}") String apiKey) {
        // 응답이 길어질 수 있으니 버퍼 상향
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(4 * 1024 * 1024))
                .build();

        return WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeaders(h -> {
                    h.setBearerAuth(apiKey);
                    h.setContentType(MediaType.APPLICATION_JSON);
                    h.setAccept(MediaType.parseMediaTypes("application/json"));
                })
                .exchangeStrategies(strategies)
                .build();
    }
}
