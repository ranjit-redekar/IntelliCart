import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../src/lib/cart";
import { useSession } from "../src/lib/session";
import { colors, radius } from "../src/theme/tokens";

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { expanded, subtotal, clear } = useCart();
  const [name, setName] = useState(user?.name ?? "");
  const [address, setAddress] = useState("121 Marine Drive");
  const [city, setCity] = useState("Mumbai");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");

  const shipping = subtotal >= 50 ? 0 : 8;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  function placeOrder() {
    const orderId = `ORD-${Math.floor(9000 + Math.random() * 999)}`;
    clear();
    router.dismissAll();
    router.push(`/orders/${orderId}`);
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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
          SHIPPING
        </Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          <Input label="Full name" value={name} onChangeText={setName} />
          <Input label="Address" value={address} onChangeText={setAddress} />
          <Input label="City" value={city} onChangeText={setCity} />
        </View>

        <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1, marginTop: 24 }}>
          PAYMENT
        </Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          <Input label="Card number" value={cardNumber} onChangeText={setCardNumber} />
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

        <Pressable
          onPress={placeOrder}
          style={({ pressed }) => ({
            backgroundColor: colors.text,
            paddingVertical: 16,
            borderRadius: radius.md,
            alignItems: "center",
            marginTop: 20,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 15 }}>
            Place order · ${total}
          </Text>
        </Pressable>
        <Text style={{ fontSize: 11, color: colors.textSubtle, textAlign: "center", marginTop: 10 }}>
          Demo only — no real payment is processed.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View>
      <Text style={{ fontSize: 11.5, fontWeight: "700", color: colors.text }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
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
