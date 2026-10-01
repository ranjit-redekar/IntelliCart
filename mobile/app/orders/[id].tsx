import { ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { orders, products } from "../../src/mockdata";
import type { OrderStatus } from "../../../shared/types";
import { colors, radius } from "../../src/theme/tokens";
import { placedItems, placedOrders } from "../../src/lib/placedOrders";

const stepOrder: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];
const stepLabels: Record<OrderStatus, string> = {
  pending: "Order placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function deriveItems(orderId: string) {
  const seed = hashString(orderId);
  const count = (seed % 3) + 1;
  const items: { sku: string; name: string; qty: number; unitPrice: number }[] = [];
  for (let i = 0; i < count; i++) {
    const p = products[(seed + i * 17) % products.length];
    const qty = ((seed >> (i + 1)) % 2) + 1;
    items.push({ sku: p.id, name: p.name, qty, unitPrice: p.price });
  }
  return items;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = [...placedOrders, ...orders].find((o) => o.id === id);

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Stack.Screen options={{ title: "Not found" }} />
        <Text style={{ fontSize: 16, color: colors.text }}>Order not found</Text>
      </SafeAreaView>
    );
  }

  const items = placedItems.get(order.id) ?? deriveItems(order.id);
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const shipping = subtotal >= 50 ? 0 : 8;
  const tax = Math.round(subtotal * 0.08);
  const currentStep = stepOrder.indexOf(order.status);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <Stack.Screen options={{ title: order.id }} />
      <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
        ORDER
      </Text>
      <Text style={{ fontSize: 26, fontWeight: "700", color: colors.text, marginTop: 4 }}>
        {order.id}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
        Placed {order.placedAt} · {items.length} item{items.length === 1 ? "" : "s"}
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderColor: colors.border,
          borderWidth: 1,
          padding: 16,
          marginTop: 20,
        }}
      >
        <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
          PROGRESS
        </Text>
        <View style={{ marginTop: 12, gap: 12 }}>
          {stepOrder.map((step, i) => {
            const done = i <= currentStep;
            return (
              <View key={step} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: done ? colors.brand500 : colors.surface2,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: done ? "white" : colors.textMuted, fontWeight: "700", fontSize: 11 }}>
                    {done ? "✓" : i + 1}
                  </Text>
                </View>
                <Text style={{ fontSize: 13.5, color: done ? colors.text : colors.textMuted, fontWeight: "600" }}>
                  {stepLabels[step]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderColor: colors.border,
          borderWidth: 1,
          padding: 16,
          marginTop: 16,
        }}
      >
        <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
          ITEMS
        </Text>
        <View style={{ marginTop: 10, gap: 10 }}>
          {items.map((it) => (
            <View
              key={it.sku}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 4,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontWeight: "600", color: colors.text }}>{it.name}</Text>
                <Text style={{ fontSize: 11.5, color: colors.textSubtle }}>
                  {it.sku} · ${it.unitPrice} × {it.qty}
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                ${it.qty * it.unitPrice}
              </Text>
            </View>
          ))}
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            marginTop: 12,
            paddingTop: 10,
            gap: 6,
          }}
        >
          <Row label="Subtotal" value={`$${subtotal}`} />
          <Row label="Shipping" value={shipping === 0 ? "Free" : `$${shipping}`} />
          <Row label="Tax" value={`$${tax}`} />
          <Row label="Order total" value={`$${order.total}`} bold />
        </View>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 13, color: bold ? colors.text : colors.textMuted, fontWeight: bold ? "700" : "500" }}>
        {label}
      </Text>
      <Text style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? "700" : "500", color: colors.text }}>
        {value}
      </Text>
    </View>
  );
}
