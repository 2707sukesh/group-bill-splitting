package com.fairshare.billing.dto;

import java.util.List;

public class ReceiptParseResponse {
    private List<ReceiptItem> items;
    private Double subtotal;
    private Double tax;
    private Double total;

    public ReceiptParseResponse() {}

    public ReceiptParseResponse(List<ReceiptItem> items, Double subtotal, Double tax, Double total) {
        this.items = items;
        this.subtotal = subtotal;
        this.tax = tax;
        this.total = total;
    }

    public List<ReceiptItem> getItems() { return items; }
    public void setItems(List<ReceiptItem> items) { this.items = items; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getTax() { return tax; }
    public void setTax(Double tax) { this.tax = tax; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }
}
