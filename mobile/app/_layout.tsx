import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartProvider } from "../src/lib/cart";
import { SessionProvider } from "../src/lib/session";
import { WishlistProvider } from "../src/lib/wishlist";
import { useColors } from "../src/theme/tokens";

// Deep links (e.g. /products/<id>) stack on top of the tabs so Back has somewhere to go.
export const unstable_settings = { initialRouteName: "(tabs)" };

export default function RootLayout() {
  const colors = useColors();
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <CartProvider>
        <WishlistProvider>
          <StatusBar style="auto" />
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
            <Stack.Screen name="wishlist" options={{ title: "Wishlist" }} />
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
        </WishlistProvider>
        </CartProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
