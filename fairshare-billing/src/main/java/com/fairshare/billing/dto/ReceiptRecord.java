package com.fairshare.billing.dto;

import java.time.Instant;
import java.util.List;

public class ReceiptRecord {
    private String id;
    private List<ReceiptItem> items;
    private Double subtotal;
    private Double tax;
    private Double total;
    private Instant createdAt;

    public ReceiptRecord() {}

    public ReceiptRecord(String id, List<ReceiptItem> items, Double subtotal, Double tax, Double total, Instant createdAt) {
        this.id = id;
        this.items = items;
        this.subtotal = subtotal;
        this.tax = tax;
        this.total = total;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public List<ReceiptItem> getItems() { return items; }
    public void setItems(List<ReceiptItem> items) { this.items = items; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getTax() { return tax; }
    public void setTax(Double tax) { this.tax = tax; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
