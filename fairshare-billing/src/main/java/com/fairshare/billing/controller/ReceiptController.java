package com.fairshare.billing.controller;

import com.fairshare.billing.dto.ReceiptParseResponse;
import com.fairshare.billing.dto.ReceiptRecord;
import com.fairshare.billing.service.ReceiptParserService;
import com.fairshare.billing.service.ReceiptStore;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = {"http://localhost:5173"})
public class ReceiptController {

    private final ReceiptParserService parserService;
    private final ReceiptStore receiptStore;

    public ReceiptController(ReceiptParserService parserService, ReceiptStore receiptStore) {
        this.parserService = parserService;
        this.receiptStore = receiptStore;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReceiptRecord> upload(@RequestPart("bill") MultipartFile bill) {
        try {
            ReceiptParseResponse parsed = parserService.parseWalmartReceipt(bill);
            ReceiptRecord record = new ReceiptRecord(null, parsed.getItems(), parsed.getSubtotal(), parsed.getTax(), parsed.getTotal(), Instant.now());
            String id = receiptStore.save(record);
            record.setId(id);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceiptRecord> getById(@PathVariable String id) {
        return receiptStore.get(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
