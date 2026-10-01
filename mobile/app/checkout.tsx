import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../src/lib/api";
import { useApi } from "../src/lib/useApi";
import { useCart, type CartLine } from "../src/lib/cart";
import { useSession } from "../src/lib/session";
import { radius, useColors } from "../src/theme/tokens";

interface SavedAddress {
  id: string;
  label: string;
  name: string;
  line1: string;
  city: string;
  postal: string;
  country: string;
  isDefault: boolean;
}

interface ServerCart {
  items: { productId: string; name: string; qty: number; stock: number }[];
}

/**
 * POST /checkout reads the server-side cart, so make it match this device's
 * cart first. The server quietly caps qty at stock when adding, so a short
 * line is reported here rather than turning into a smaller order.
 */
async function syncServerCart(lines: CartLine[]) {
  await api.del("/cart");
  let cart: ServerCart | undefined;
  for (const l of lines) cart = await api.post<ServerCart>("/cart/items", { productId: l.productId, qty: l.qty });
  for (const l of lines) {
    const got = cart?.items.find((i) => i.productId === l.productId);
    if (!got) throw new ApiError(409, "conflict", `${l.name} is no longer available.`);
    if (got.qty < l.qty) throw new ApiError(409, "conflict", `Only ${got.qty} left of ${l.name}.`);
  }
}

export default function CheckoutScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useSession();
  const { lines, expanded, subtotal, clear } = useCart();
  const [name, setName] = useState(user?.name ?? "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("US");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [addressId, setAddressId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  // One key per checkout attempt: a retry after a dropped response returns
  // the original order instead of placing a second one.
  const [idempotencyKey] = useState(() => `co-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

  // Saved addresses are a shortcut, never a gate: the fields work without them.
  // Tagged with the user it was loaded for, so the signed-out empty list
  // doesn't count as "loaded" right after signing in.
  const saved = useApi(
    async () => ({ uid: user?.id, items: user ? (await api.get<{ items: SavedAddress[] }>("/account/addresses")).items : [] }),
    [user?.id],
  );
  const savedAddresses = saved.data?.items ?? [];

  function pickAddress(a: SavedAddress) {
    setAddressId(a.id);
    setName(a.name || user?.name || "");
    setAddress(a.line1);
    setCity(a.city);
    setPostal(a.postal);
    setCountry(a.country);
  }

  // Prefill once: name when the user signs in from here, then the default address.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (user && seededFor !== user.id && (saved.data?.uid === user.id || saved.error)) {
    setSeededFor(user.id);
    const first = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
    if (first && !address) pickAddress(first);
    else if (!name) setName(user.name);
  }

  // Estimate only; the server prices the order (same rules as pricing.ts).
  const shipping = subtotal === 0 || subtotal >= 50 ? 0 : 8;
  const tax = Math.round(subtotal * 8) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  async function placeOrder() {
    if (placing) return;
    setPlacing(true);
    setOrderError(null);
    try {
      await syncServerCart(lines);
      const last4 = cardNumber.replace(/\D/g, "").slice(-4);
      const order = await api.post<{ id: string }>(
        "/checkout",
        {
          name,
          line1: address,
          city,
          postal,
          country: country.trim() || "US",
          paymentMethod: "card",
          cardLast4: /^\d{4}$/.test(last4) ? last4 : undefined,
        },
        { "Idempotency-Key": idempotencyKey },
      );
      clear();
      router.dismissAll();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/sign-in");
        return;
      }
      const fields = err instanceof ApiError && err.details ? Object.values(err.details).flat()[0] : undefined;
      setOrderError(fields ?? (err instanceof ApiError ? err.message : "Could not place your order. Try again."));
    } finally {
      setPlacing(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Stack.Screen options={{ title: "Checkout" }} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Sign in to check out</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8, textAlign: "center", maxWidth: 280 }}>
          Your cart is saved. We'll bring you right back here.
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
          <Pressable
            onPress={() => router.push("/sign-in")}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: colors.text,
              paddingHorizontal: 22,
              paddingVertical: 12,
              borderRadius: radius.md,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 13.5 }}>Sign in</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/sign-up")}
            accessibilityRole="button"
            style={({ pressed }) => ({
              paddingHorizontal: 22,
              paddingVertical: 12,
              borderRadius: radius.md,
              borderColor: colors.border,
              borderWidth: 1,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13.5 }}>Create account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (expanded.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Stack.Screen options={{ title: "Checkout" }} />
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Your cart is empty</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginTop: 16,
            backgroundColor: colors.text,
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: radius.md,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 13 }}>Back to shop</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: "Checkout" }} />
      {/* iOS pads via automaticallyAdjustKeyboardInsets; edge-to-edge Android needs the KAV. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "android" ? "height" : undefined}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
          SHIPPING
        </Text>
        {savedAddresses.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 10 }}>
            {savedAddresses.map((a) => {
              const on = a.id === addressId;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => pickAddress(a)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${a.label}, ${a.line1}, ${a.city}`}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: on ? colors.text : colors.border,
                    backgroundColor: colors.surface,
                    maxWidth: 220,
                  }}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.text }}>{a.label}</Text>
                  <Text style={{ fontSize: 11.5, color: colors.textMuted }} numberOfLines={1}>
                    {a.line1}, {a.city}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        <View style={{ gap: 10, marginTop: 10 }}>
          <Input label="Full name" value={name} onChangeText={setName} textContentType="name" autoComplete="name" />
          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            textContentType="fullStreetAddress"
            autoComplete="street-address"
          />
          <Input label="City" value={city} onChangeText={setCity} textContentType="addressCity" />
          <Input
            label="Postal code"
            value={postal}
            onChangeText={setPostal}
            textContentType="postalCode"
            autoComplete="postal-code"
          />
          <Input label="Country" value={country} onChangeText={setCountry} textContentType="countryName" />
        </View>

        <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1, marginTop: 24 }}>
          PAYMENT
        </Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          <Input
            label="Card number"
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="number-pad"
            textContentType="creditCardNumber"
            autoComplete="cc-number"
          />
        </View>

        <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1, marginTop: 24 }}>
          SUMMARY
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderColor: colors.border,
            borderWidth: 1,
            padding: 14,
            marginTop: 10,
            gap: 6,
          }}
        >
          {expanded.map((l) => (
            <View key={l.productId} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12.5, color: colors.text, flex: 1 }} numberOfLines={1}>
                {l.name} × {l.qty}
              </Text>
              <Text style={{ fontSize: 12.5, color: colors.text, fontWeight: "600" }}>${l.lineTotal}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
          <Row label="Subtotal" value={`$${subtotal}`} />
          <Row label="Shipping" value={shipping === 0 ? "Free" : `$${shipping}`} />
          <Row label="Tax" value={`$${tax}`} />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
          <Row label="Total" value={`$${total}`} bold />
        </View>

        {orderError && (
          <Text accessibilityLiveRegion="polite" style={{ fontSize: 13, color: colors.accentRose, marginTop: 14 }}>
            {orderError}
          </Text>
        )}

        <Pressable
          onPress={placeOrder}
          disabled={placing}
          accessibilityRole="button"
          accessibilityState={{ busy: placing, disabled: placing }}
          style={({ pressed }) => ({
            backgroundColor: colors.text,
            paddingVertical: 16,
            borderRadius: radius.md,
            alignItems: "center",
            marginTop: 20,
            opacity: placing ? 0.6 : pressed ? 0.9 : 1,
          })}
        >
          {placing ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 15 }}>Place order · ${total}</Text>
          )}
        </Pressable>
        <Text style={{ fontSize: 11, color: colors.textSubtle, textAlign: "center", marginTop: 10 }}>
          Demo only — no real payment is processed.
        </Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Input({ label, ...props }: { label: string } & TextInputProps) {
  const colors = useColors();
  return (
    <View>
      <Text style={{ fontSize: 11.5, fontWeight: "700", color: colors.text }}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={colors.textSubtle}
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 10,
          fontSize: 14,
          color: colors.text,
          marginTop: 4,
        }}
      />
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: bold ? 14 : 12.5, color: bold ? colors.text : colors.textMuted, fontWeight: bold ? "700" : "500" }}>
        {label}
      </Text>
      <Text style={{ fontSize: bold ? 15 : 12.5, fontWeight: bold ? "700" : "500", color: colors.text }}>
        {value}
      </Text>
    </View>
  );
}
