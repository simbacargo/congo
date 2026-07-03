/**
 * Bluetooth Classic (SPP) connection management for ESC/POS thermal printers.
 *
 * Cheap 58mm receipt printers speak ESC/POS over Bluetooth Classic, so we use
 * react-native-bluetooth-classic to connect to a *bonded* (already paired in
 * Android settings) device and write raw bytes. The selected printer is
 * remembered in AsyncStorage so agents only pick it once.
 *
 * NOTE: requires a development build — the native module is not in Expo Go.
 */
import { PermissionsAndroid, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNBluetoothClassic, {
  BluetoothDevice,
} from "react-native-bluetooth-classic";

const SAVED_ADDRESS_KEY = "printer_address";
const SAVED_NAME_KEY = "printer_name";

export interface SavedPrinter {
  address: string;
  name: string;
}

/** Thrown when no printer has been chosen yet, so the UI can prompt for one. */
export class NoPrinterError extends Error {
  constructor() {
    super("No thermal printer selected.");
    this.name = "NoPrinterError";
  }
}

/**
 * Android 12+ requires runtime BLUETOOTH_CONNECT/SCAN permissions to talk to
 * bonded devices. No-op on older Android and on iOS.
 */
export async function ensureBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  if (Number(Platform.Version) < 31) return true;

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  ]);
  return (
    result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
    PermissionsAndroid.RESULTS.GRANTED
  );
}

/** List printers already paired with the phone in Android Bluetooth settings. */
export async function listPairedPrinters(): Promise<BluetoothDevice[]> {
  const granted = await ensureBluetoothPermissions();
  if (!granted) throw new Error("Bluetooth permission denied.");

  const enabled = await RNBluetoothClassic.isBluetoothEnabled();
  if (!enabled) {
    const turnedOn = await RNBluetoothClassic.requestBluetoothEnabled();
    if (!turnedOn) throw new Error("Bluetooth is turned off.");
  }

  return RNBluetoothClassic.getBondedDevices();
}

export async function getSavedPrinter(): Promise<SavedPrinter | null> {
  const [address, name] = await Promise.all([
    AsyncStorage.getItem(SAVED_ADDRESS_KEY),
    AsyncStorage.getItem(SAVED_NAME_KEY),
  ]);
  if (!address) return null;
  return { address, name: name ?? address };
}

export async function savePrinter(p: SavedPrinter): Promise<void> {
  await AsyncStorage.multiSet([
    [SAVED_ADDRESS_KEY, p.address],
    [SAVED_NAME_KEY, p.name],
  ]);
}

export async function clearSavedPrinter(): Promise<void> {
  await AsyncStorage.multiRemove([SAVED_ADDRESS_KEY, SAVED_NAME_KEY]);
}

/**
 * Send a base64 ESC/POS payload to the saved printer. Connects on demand,
 * writes, and leaves the connection open (reconnecting is cheap and keeping
 * it warm speeds up back-to-back reprints).
 *
 * @throws NoPrinterError if no printer has been selected.
 */
export async function writeToSavedPrinter(base64: string): Promise<void> {
  const saved = await getSavedPrinter();
  if (!saved) throw new NoPrinterError();

  await ensureBluetoothPermissions();

  let device = await RNBluetoothClassic.getConnectedDevice(saved.address).catch(
    () => null,
  );

  if (!device) {
    device = await RNBluetoothClassic.connectToDevice(saved.address, {
      // Delimiter-based reads are irrelevant for write-only; keep defaults.
    });
  }

  await device.write(base64, "base64");
}
