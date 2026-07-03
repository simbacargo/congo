/**
 * Thermal receipt printing.
 *
 * Prints directly to a paired 58mm Bluetooth ESC/POS printer via
 * react-native-bluetooth-classic. The receipt bytes are built in `escpos.ts`;
 * connection/printer selection lives in `printer.ts`.
 */
import { buildReceiptEscPos } from "./escpos";
import { NoPrinterError, writeToSavedPrinter } from "./printer";

export { NoPrinterError };

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

/**
 * Print a receipt to the agent's saved thermal printer.
 * @throws NoPrinterError if no printer has been selected yet.
 */
export async function printReceipt(data: ReceiptData): Promise<void> {
  const payload = buildReceiptEscPos(data);
  await writeToSavedPrinter(payload);
}
