import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Tracker } from "./src/Tracker";

export default function App() {
  const [ready] = useFonts({
    Bricolage: require("./assets/fonts/bricolage-600.woff2"),
    Inter: require("./assets/fonts/inter-400.woff2"),
    "Inter-Medium": require("./assets/fonts/inter-500.woff2"),
  });

  return (
    <View style={styles.stage}>
      <StatusBar style="dark" />
      <View style={styles.phone}>
        {ready ? <Tracker /> : <ActivityIndicator color="#007AFF" style={styles.loading} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: "#E7EEF8",
    alignItems: "center",
  },
  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
  },
  loading: {
    marginTop: 120,
  },
});
