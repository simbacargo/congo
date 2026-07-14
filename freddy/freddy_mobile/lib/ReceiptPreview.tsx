import { StyleSheet, Text, View } from "react-native";
import type { ReceiptData } from "./print";
import { useTheme } from "./ThemeContext";

export default function ReceiptPreview(props: Omit<ReceiptData, "date">) {
  const { colors } = useTheme();
  const date = new Date().toLocaleString();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.receipt}>
        {/* Header */}
        <Text style={[styles.text, styles.headerMain]}>LUBUMBASHI</Text>
        <Text style={[styles.text, styles.headerMain]}>CHARITY</Text>
        <Text style={[styles.text, styles.headerSub]}>FUEL INITIATIVE</Text>
        <Text style={[styles.text, styles.subtitle]}>Verified Fuel Receipt</Text>
        <View style={styles.divider} />

        {/* Company & Station */}
        {props.companyName && (
          <Text style={[styles.text, styles.regular]}>{props.companyName}</Text>
        )}
        {props.stationName && (
          <Text style={[styles.text, styles.regular]}>{props.stationName}</Text>
        )}
        <View style={styles.twoCol}>
          <Text style={[styles.text, styles.label]}>Church:</Text>
          <Text style={[styles.text, styles.value]}>{props.churchName}</Text>
        </View>
        <View style={styles.divider} />

        {/* Amounts */}
        <View style={styles.twoCol}>
          <Text style={[styles.text, styles.label]}>Fuel Type:</Text>
          <Text style={[styles.text, styles.value]}>{props.fuelType}</Text>
        </View>
        <View style={styles.twoCol}>
          <Text style={[styles.text, styles.label]}>Amount (USD):</Text>
          <Text style={[styles.text, styles.value]}>${parseFloat(props.amountUsd).toFixed(2)}</Text>
        </View>
        <View style={styles.twoCol}>
          <Text style={[styles.text, styles.label]}>Amount (CDF):</Text>
          <Text style={[styles.text, styles.value]}>{parseFloat(props.amountCdf).toFixed(0)} FC</Text>
        </View>
        <View style={styles.divider} />

        {/* Levy */}
        <View style={[styles.twoCol, styles.levyRow]}>
          <Text style={[styles.text, styles.levyLabel]}>2% Charity Levy:</Text>
          <Text style={[styles.text, styles.levyValue]}>${parseFloat(props.levyUsd).toFixed(4)}</Text>
        </View>
        <View style={styles.twoCol}>
          <Text style={[styles.text, styles.label]} />
          <Text style={[styles.text, styles.levyValue]}>{parseFloat(props.levyCdf).toFixed(2)} FC</Text>
        </View>
        <View style={styles.divider} />

        {/* Meta */}
        <View style={styles.twoCol}>
          <Text style={[styles.text, styles.label]}>Agent:</Text>
          <Text style={[styles.text, styles.value]}>{props.agentName}</Text>
        </View>
        <View style={styles.twoCol}>
          <Text style={[styles.text, styles.label]}>Date:</Text>
          <Text style={[styles.text, styles.value]}>{date}</Text>
        </View>
        <View style={styles.divider} />

        {/* Receipt Code */}
        <Text style={[styles.text, styles.centerText, styles.receiptCode]}>
          RECEIPT: {props.receiptCode}
        </Text>
        <Text style={[styles.text, styles.centerText, styles.verifyText]}>
          Verify: lci.verify / {props.receiptCode}
        </Text>
        <Text style={[styles.text, styles.centerText, styles.thankYouText]}>
          Thank you for supporting
        </Text>
        <Text style={[styles.text, styles.centerText, styles.thankYouText]}>
          the community.
        </Text>
      </View>
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    receipt: {
      width: "100%",
      maxWidth: 240,
      fontFamily: "monospace",
    },
    text: {
      fontFamily: "monospace",
      color: colors.text,
      fontSize: 10,
      lineHeight: 14,
    },
    headerMain: {
      fontWeight: "700",
      fontSize: 13,
      textAlign: "center",
    },
    headerSub: {
      fontWeight: "600",
      fontSize: 11,
      textAlign: "center",
    },
    subtitle: {
      textAlign: "center",
      fontSize: 9,
      color: colors.textSecondary,
    },
    regular: {
      marginVertical: 2,
    },
    label: {
      color: colors.textSecondary,
      flex: 1,
    },
    value: {
      color: colors.text,
      fontWeight: "600",
      textAlign: "right",
      flex: 1,
    },
    levyLabel: {
      color: colors.success,
      fontWeight: "700",
      flex: 1,
    },
    levyValue: {
      color: colors.success,
      fontWeight: "700",
      textAlign: "right",
      flex: 1,
    },
    levyRow: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 6,
    },
    twoCol: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 2,
    },
    centerText: {
      textAlign: "center",
      marginVertical: 2,
    },
    receiptCode: {
      fontWeight: "700",
      fontSize: 11,
    },
    verifyText: {
      fontSize: 9,
      color: colors.textSecondary,
    },
    thankYouText: {
      fontSize: 9,
      color: colors.textSecondary,
    },
  });
}
