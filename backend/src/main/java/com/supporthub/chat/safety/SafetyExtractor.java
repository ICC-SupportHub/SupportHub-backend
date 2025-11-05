package com.supporthub.chat.safety;

public interface SafetyExtractor {
    SafetySignal predict(String text);
}
