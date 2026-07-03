import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { parseDriverId } from "../../lib/api";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(false);
  // Guards against the camera firing onBarcodeScanned dozens of times for the
  // same code before we've navigated away.
  const locked = useRef(false);

  // Only mount the camera while this tab is focused, and reset the scan lock
  // each time we come back (e.g. after viewing a driver and tapping back).
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      locked.current = false;
      return () => setActive(false);
    }, []),
  );

  function handleScan(data: string) {
    if (locked.current) return;
    const id = parseDriverId(data);
    if (!id) return; // ignore non-driver QR codes, keep scanning
    locked.current = true;
    router.push(`/driver/${id}`);
  }

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.center]}>
        <View style={styles.iconWrap}>
          <FontAwesome name="camera" size={30} color="#818cf8" />
        </View>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.subtitle}>
          Freddy uses the camera to scan a driver&apos;s ID card QR code and pull
          up their levy history.
        </Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {active && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => handleScan(data)}
        />
      )}

      {/* Framing overlay */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Point the camera at the driver&apos;s QR code</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  center: { justifyContent: "center", alignItems: "center", padding: 28 },

  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#1e1a3a", borderWidth: 1, borderColor: "#312e81",
    justifyContent: "center", alignItems: "center", marginBottom: 18,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#f8fafc", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  btn: { backgroundColor: "#4f46e5", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  frame: {
    width: 240, height: 240, borderRadius: 24,
    borderWidth: 3, borderColor: "rgba(129,140,248,0.9)",
    backgroundColor: "transparent",
  },
  hint: {
    marginTop: 24, color: "#e2e8f0", fontSize: 14, fontWeight: "600",
    backgroundColor: "rgba(10,15,30,0.7)", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, overflow: "hidden",
  },
});
