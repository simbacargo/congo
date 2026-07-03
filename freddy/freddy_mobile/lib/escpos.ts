/**
 * ESC/POS command builder for 58mm Bluetooth thermal printers.
 *
 * Produces a base64-encoded byte stream that is written raw to the printer
 * via react-native-bluetooth-classic (`device.write(base64, "base64")`).
 * We build the bytes ourselves instead of relying on an (unmaintained)
 * native ESC/POS library, so the receipt layout lives entirely in JS.
 */
import type { ReceiptData } from "./print";

// Most 58mm printers fit 32 characters per line in Font A.
const LINE_WIDTH = 32;

// ── Raw ESC/POS control sequences ──
const ESC = 0x1b;
const GS = 0x1d;
const INIT = [ESC, 0x40]; // initialise printer
const ALIGN_LEFT = [ESC, 0x61, 0x00];
const ALIGN_CENTER = [ESC, 0x61, 0x01];
const BOLD_ON = [ESC, 0x45, 0x01];
const BOLD_OFF = [ESC, 0x45, 0x00];
const DOUBLE_ON = [GS, 0x21, 0x11]; // double width + height
const DOUBLE_OFF = [GS, 0x21, 0x00];
// Select Windows-1252 code page so Latin accents (é, è, à…) print correctly.
const CODEPAGE_CP1252 = [ESC, 0x74, 0x10];
const FEED_LINE = [0x0a];

/** Encode a JS string to CP1252-ish bytes (code points < 256 map directly). */
function textBytes(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0x3f;
    out.push(code < 0x100 ? code : 0x3f); // "?" for anything outside the range
  }
  return out;
}

/** Left/right justified line, e.g. "Amount (USD)            $12.00". */
function twoCols(left: string, right: string): number[] {
  const space = Math.max(1, LINE_WIDTH - left.length - right.length);
  return [...textBytes(left + " ".repeat(space) + right), ...FEED_LINE];
}

function line(text = ""): number[] {
  return [...textBytes(text), ...FEED_LINE];
}

function divider(): number[] {
  return [...textBytes("-".repeat(LINE_WIDTH)), ...FEED_LINE];
}

/** Base64-encode a byte array without relying on Buffer/btoa. */
function toBase64(bytes: number[]): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += chars[b0 >> 2];
    out += chars[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? chars[((b1 & 0x0f) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < bytes.length ? chars[b2 & 0x3f] : "=";
  }
  return out;
}

/**
 * Build the receipt as a base64 ESC/POS payload ready to write to the printer.
 */
export function buildReceiptEscPos(r: ReceiptData): string {
  const bytes: number[] = [];

  bytes.push(...INIT, ...CODEPAGE_CP1252);

  // Header
  bytes.push(...ALIGN_CENTER, ...BOLD_ON, ...DOUBLE_ON);
  bytes.push(...line("LUBUMBASHI"));
  bytes.push(...line("CHARITY"));
  bytes.push(...DOUBLE_OFF);
  bytes.push(...line("FUEL INITIATIVE"), ...BOLD_OFF);
  bytes.push(...line("Verified Fuel Receipt"));
  bytes.push(...ALIGN_LEFT, ...divider());

  // Parties
  if (r.companyName) bytes.push(...line(r.companyName));
  if (r.stationName) bytes.push(...line(r.stationName));
  bytes.push(...twoCols("Church:", r.churchName));
  bytes.push(...divider());

  // Amounts
  bytes.push(...twoCols("Fuel Type:", r.fuelType));
  bytes.push(...twoCols("Amount (USD):", `$${r.amountUsd}`));
  bytes.push(...twoCols("Amount (CDF):", `${r.amountCdf} FC`));
  bytes.push(...divider());

  // Levy — emphasised
  bytes.push(...BOLD_ON);
  bytes.push(...twoCols("2% Charity Levy:", `$${r.levyUsd}`));
  bytes.push(...BOLD_OFF);
  bytes.push(...twoCols("", `${r.levyCdf} FC`));
  bytes.push(...divider());

  // Meta
  bytes.push(...twoCols("Agent:", r.agentName));
  bytes.push(...twoCols("Date:", r.date));
  bytes.push(...divider());

  // Receipt code
  bytes.push(...ALIGN_CENTER, ...BOLD_ON);
  bytes.push(...line(`RECEIPT: ${r.receiptCode}`), ...BOLD_OFF);
  bytes.push(...line(`Verify: lci.verify / ${r.receiptCode}`));
  bytes.push(...line("Thank you for supporting"));
  bytes.push(...line("the community."));

  // Feed past the tear bar.
  bytes.push(...FEED_LINE, ...FEED_LINE, ...FEED_LINE, ...FEED_LINE);

  return toBase64(bytes);
}
