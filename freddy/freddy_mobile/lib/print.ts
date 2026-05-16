/**
 * Thermal receipt printing.
 * Uses expo-print to generate a PDF receipt that can be shared to a
 * Bluetooth-paired printer app (e.g. PrintHand, RawBT) or printed directly
 * via expo-sharing on devices with a paired thermal printer.
 */
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export interface ReceiptData {
  receiptCode: string;
  companyName: string;
  stationName: string;
  churchName: string;
  fuelType: string;
  currencyUsed: string;
  amountUsd: string;
  amountCdf: string;
  levyUsd: string;
  levyCdf: string;
  agentName: string;
  date: string;
}

function buildReceiptHtml(r: ReceiptData): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 8px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .highlight { background: #f0f0f0; padding: 4px; border-radius: 2px; }
  .code { font-size: 11px; letter-spacing: 1px; }
</style>
</head>
<body>
  <div class="center bold" style="font-size:14px">LUBUMBASHI CHARITY</div>
  <div class="center bold">FUEL INITIATIVE</div>
  <div class="center" style="font-size:10px">Verified Fuel Transaction Receipt</div>
  <div class="divider"></div>

  <div class="row"><span>${r.companyName}</span></div>
  <div class="row"><span>${r.stationName}</span></div>
  <div class="row"><span class="bold">Church:</span><span>${r.churchName}</span></div>
  <div class="divider"></div>

  <div class="row"><span>Fuel Type:</span><span>${r.fuelType}</span></div>
  <div class="row"><span>Amount (USD):</span><span class="bold">$${r.amountUsd}</span></div>
  <div class="row"><span>Amount (CDF):</span><span>${r.amountCdf} FC</span></div>
  <div class="divider"></div>

  <div class="highlight">
    <div class="row bold"><span>2% Charity Levy:</span><span>$${r.levyUsd}</span></div>
    <div class="row" style="font-size:10px"><span></span><span>${r.levyCdf} FC</span></div>
  </div>
  <div class="divider"></div>

  <div class="row" style="font-size:10px"><span>Agent:</span><span>${r.agentName}</span></div>
  <div class="row" style="font-size:10px"><span>Date:</span><span>${r.date}</span></div>
  <div class="divider"></div>

  <div class="center bold code">RECEIPT: ${r.receiptCode}</div>
  <div class="center" style="font-size:9px">Verify at: lci.verify / ${r.receiptCode}</div>
  <div class="divider"></div>
  <div class="center" style="font-size:9px">Thank you for supporting the community.</div>
</body>
</html>
  `.trim();
}

export async function printReceipt(data: ReceiptData): Promise<void> {
  const html = buildReceiptHtml(data);
  const { uri } = await Print.printToFileAsync({ html, width: 280, height: 560 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Print or Share Receipt",
      UTI: "com.adobe.pdf",
    });
  } else {
    await Print.printAsync({ uri });
  }
}
