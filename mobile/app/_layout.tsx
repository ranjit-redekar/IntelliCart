import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartProvider } from "../src/lib/cart";
import { SessionProvider } from "../src/lib/session";
import { colors } from "../src/theme/tokens";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTitleStyle: { color: colors.text, fontWeight: "600" },
              headerTintColor: colors.text,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="products/[id]" options={{ title: "Product" }} />
            <Stack.Screen name="orders/[id]" options={{ title: "Order" }} />
            <Stack.Screen
              name="checkout"
              options={{ title: "Checkout", presentation: "modal" }}
            />
            <Stack.Screen
              name="sign-in"
              options={{ title: "Sign in", presentation: "modal" }}
            />
            <Stack.Screen
              name="sign-up"
              options={{ title: "Create account", presentation: "modal" }}
            />
            <Stack.Screen
              name="assistant"
              options={{ title: "IntelliCart AI", presentation: "modal" }}
            />
          </Stack>
        </CartProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
