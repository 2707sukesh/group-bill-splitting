package com.fairshare.billing.service;

import com.fairshare.billing.dto.ReceiptRecord;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ReceiptStore {
    private final Map<String, ReceiptRecord> store = new ConcurrentHashMap<>();

    public String save(ReceiptRecord record) {
        String id = record.getId();
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
            record.setId(id);
        }
        store.put(id, record);
        return id;
    }

    public Optional<ReceiptRecord> get(String id) {
        return Optional.ofNullable(store.get(id));
    }
}
