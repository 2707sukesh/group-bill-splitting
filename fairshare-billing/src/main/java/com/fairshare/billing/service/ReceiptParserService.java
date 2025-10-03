package com.fairshare.billing.service;

import com.fairshare.billing.dto.ReceiptItem;
import com.fairshare.billing.dto.ReceiptParseResponse;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ReceiptParserService {

    // Optional quantity markers like x2 or 2 @ 3.50 7.00
    private static final Pattern QTY_AT = Pattern.compile("(?<qty>\\d+)\\s*@\\s*(?<unit>[0-9]+\\.[0-9]{2})\\s+(?<total>[0-9]+\\.[0-9]{2})(?:\\s*[A-Z])?$");
    private static final Pattern MULTIPLIER = Pattern.compile("(?i)x\\s*(?<qty>\\d+)");
    private static final Pattern LAST_AMOUNT = Pattern.compile("([$]?[0-9]+\\.[0-9]{2})(?!.*[$]?[0-9]+\\.[0-9]{2})");
    private static final Pattern IGNORE_LINE = Pattern.compile(
            "(?i)^(change|cash|debit|credit|visa|mastercard|card|approval|terminal|store|manager|walmart|thank|visit|survey|coupon|subtotal|total|tax|hst|gst|pst|balance|tender|auth|appr|invoice|transaction|trans|date|time|sold|qty|item|return|ref|delivery|free delivery|free|tip|driver|service fee|shipping|temporary|adjusted|adjustment)\\b"
    );
    private static final Pattern AMOUNT_ONLY = Pattern.compile("^[$]?[0-9]+\\.[0-9]{2}$");
    private static final Pattern INTEGER_ONLY = Pattern.compile("^\\d+$");

    public ReceiptParseResponse parseWalmartReceipt(MultipartFile file) throws IOException {
        try (InputStream in = file.getInputStream(); PDDocument doc = PDDocument.load(in)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            String[] lines = text.split("\n");

            List<ReceiptItem> items = new ArrayList<>();
            Double subtotal = null;
            Double tax = null;
            Double total = null;

            StringBuilder descBuffer = new StringBuilder();

            for (String rawLine : lines) {
                String line = rawLine.trim().replaceAll("\\s+", " ");
                if (line.isBlank()) continue;

                // Totals
                if (subtotal == null && line.matches("(?i).*subtotal.*[0-9]+\\.[0-9]{2}.*")) {
                    subtotal = extractLastAmount(line);
                    continue;
                }
                if (tax == null && line.matches("(?i).*(tax|hst|gst|pst).*[0-9]+\\.[0-9]{2}.*")) {
                    tax = extractLastAmount(line);
                    continue;
                }
                if (total == null && line.matches("(?i).*total.*[0-9]+\\.[0-9]{2}.*")) {
                    total = extractLastAmount(line);
                    continue;
                }

                if (IGNORE_LINE.matcher(line).find()) {
                    // Reset buffer on obvious non-item lines
                    descBuffer.setLength(0);
                    continue;
                }

                // Quantity with @ notation
                Matcher qtyAt = QTY_AT.matcher(line);
                if (qtyAt.find()) {
                    try {
                        int qty = Integer.parseInt(qtyAt.group("qty"));
                        double unit = Double.parseDouble(qtyAt.group("unit"));
                        double tot = Double.parseDouble(qtyAt.group("total"));
                        String prefix = line.substring(0, qtyAt.start()).trim();
                        String desc = prefix;
                        if (descBuffer.length() > 0) {
                            desc = (descBuffer.toString() + " " + prefix).trim();
                        }
                        if (!desc.isBlank()) {
                            items.add(new ReceiptItem(desc, qty, unit, tot));
                            descBuffer.setLength(0);
                            continue;
                        }
                    } catch (Exception ignored) {}
                }

                // Generic: use the last amount on the line as total price
                Matcher priceEnd = LAST_AMOUNT.matcher(line);
                if (priceEnd.find()) {
                    String amountStr = priceEnd.group(1).replace("$", "");
                    double price = Double.parseDouble(amountStr);
                    String prefix = line.substring(0, priceEnd.start()).trim();
                    String desc = prefix;
                    if (descBuffer.length() > 0) {
                        desc = (descBuffer.toString() + " " + prefix).trim();
                    }
                    int qty = 1;
                    double unit = price;

                    // Try to detect multiplier (e.g., "Bananas x2")
                    Matcher mult = MULTIPLIER.matcher(desc);
                    if (mult.find()) {
                        try {
                            qty = Integer.parseInt(mult.group("qty"));
                            unit = price / qty;
                            desc = desc.replaceAll("(?i)x\\s*" + qty, "").trim();
                        } catch (Exception ignored) {}
                    }

                    items.add(new ReceiptItem(desc, qty, unit, price));
                    descBuffer.setLength(0);
                } else {
                    // No price found on this line; accumulate to buffer unless it's noise
                    if (!IGNORE_LINE.matcher(line).find() && !AMOUNT_ONLY.matcher(line).matches() && !INTEGER_ONLY.matcher(line).matches()) {
                        if (descBuffer.length() > 0) descBuffer.append(' ');
                        descBuffer.append(line);
                    }
                }
            }

            return new ReceiptParseResponse(items, subtotal, tax, total);
        }
    }

    private Double extractLastAmount(String line) {
        Matcher m = Pattern.compile("([0-9]+\\.[0-9]{2})(?!.*[0-9]+\\.[0-9]{2})").matcher(line);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1)); } catch (Exception ignored) {}
        }
        return null;
    }
}
