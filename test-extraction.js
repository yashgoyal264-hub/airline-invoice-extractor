// Test script to debug extraction
const fs = require('fs');

// Simulate the text from Airlines Invoices AI Reader.pdf
const testText = `Tax Invoice
(Original For Recipient)
InterGlobe Aviation Limited
Indira Gandhi International Airport
New Delhi - 110037
GSTIN : 07AABCI2726B1Z4
Number : DL1252605AJ43633
Date : 01-May-2025
Passenger Name :
PNR : CZFDFS Flight No : 6E - 5269 From : DEL To : BLR Place of Supply : Maharashtra
GSTIN of Customer : 27AAICK4821A1ZV
GSTIN Customer Name : KiranaKart Technologies Private Limited
Currency : INR
Description SAC
Code
Taxable
Value
NonTaxab
le/Exempt
ed Value
Total
IGST
Tax % Amount
CGST
Tax % Amount
SGST/UGST
Tax % Amount
CESS
Tax % Amount
Total(Incl
Taxes)
Air Travel and
related charges 996425 11,598.00
0.00 11,598.0
0
5.00 580.00 0.00 0.00 0.00 0.00 0 0.00 12,178.00
Airport Charges 0.00 388.00 388.00 0.00 0.00 0.00 0.00 0.00 0.00 0 0.00 388.00
Grand Total 11,598.
00 388.00 11,986.00 580.00 0.00 0.00 0.00 12,566.00`;

// Test patterns
console.log("Testing extraction patterns:\n");

// Test 1: Air Travel Taxable
console.log("1. Air Travel Taxable Value:");
const airTravelPattern1 = /Air\s*Travel\s*and[\s\n]*related\s*charges\s+996425\s+([\d,]+\.?\d*)/i;
const match1 = testText.match(airTravelPattern1);
console.log("   Pattern 1:", match1 ? match1[1] : "No match");

// Look for the actual pattern in the text
const airTravelLine = testText.match(/Air Travel and[\s\S]*?12,178\.00/);
console.log("   Air Travel Line:", airTravelLine ? airTravelLine[0].replace(/\n/g, '\\n') : "Not found");

// Test 2: IGST Amount
console.log("\n2. IGST Amount:");
const igstPattern = /5\.00\s+([\d,]+\.?\d*)/;
const match2 = testText.match(igstPattern);
console.log("   After 5.00:", match2 ? match2[1] : "No match");

// Test 3: Grand Total
console.log("\n3. Grand Total:");
const gtLine = testText.match(/Grand\s*Total[\s\S]*?12,566\.00/);
console.log("   Grand Total Line:", gtLine ? gtLine[0].replace(/\n/g, '\\n') : "Not found");

// Extract all numbers from Grand Total line
if (gtLine) {
    const numbers = gtLine[0].match(/[\d,]+\.?\d+/g);
    console.log("   Numbers in Grand Total:", numbers);
    console.log("   Last number (should be grand total):", numbers[numbers.length - 1]);
}

// Test the actual structure
console.log("\n4. Actual Table Structure:");
const tableMatch = testText.match(/Air Travel[\s\S]*?996425[\s\S]*?12,178\.00/);
if (tableMatch) {
    console.log("   Full Air Travel Row:");
    const row = tableMatch[0];
    // Split by whitespace and filter out empty strings
    const values = row.split(/\s+/).filter(v => v && v.match(/[\d,]+\.?\d*/));
    console.log("   Values found:", values);
    console.log("   - Taxable (should be 11,598.00):", values.find(v => v.includes('11,598')));
    console.log("   - IGST Amount (should be 580.00):", values.find(v => v === '580.00'));
    console.log("   - Total (should be 12,178.00):", values.find(v => v.includes('12,178')));
}