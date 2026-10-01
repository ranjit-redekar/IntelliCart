import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";
import { colors } from "../src/theme/tokens";

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, gap: 12 }}>
      <Stack.Screen options={{ title: "Not found" }} />
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>This page doesn't exist</Text>
      <Link href="/" style={{ color: colors.brand500, fontWeight: "600" }}>
        Back to home
      </Link>
    </View>
  );
}
