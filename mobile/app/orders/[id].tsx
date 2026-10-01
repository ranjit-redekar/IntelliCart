import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Order, OrderStatus } from "../../../shared/types";
import { api } from "../../src/lib/api";
import { useApi } from "../../src/lib/useApi";
import { radius, useColors } from "../../src/theme/tokens";

const stepOrder: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];
const stepLabels: Record<OrderStatus, string> = {
  pending: "Order placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

interface OrderDetail extends Order {
  subtotal: number;
  shipping: number;
  tax: number;
  items: { productId: string | null; sku: string; name: string; qty: number; unitPrice: number }[];
  address: { name: string; line1: string; city: string; postal: string; country: string };
  timeline: { status: string; at: string; note: string | null }[];
}

export default function OrderDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, error, loading, refreshing, reload, refresh } = useApi(
    () => api.get<OrderDetail>(`/account/orders/${encodeURIComponent(id)}`),
    [id],
  );

  if (!order) {
    const notFound = error?.status === 404;
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}
      >
        <Stack.Screen options={{ title: loading ? "Order" : notFound ? "Not found" : "Order" }} />
        {loading ? (
          <ActivityIndicator />
        ) : notFound ? (
          <Text style={{ fontSize: 16, color: colors.text }}>Order not found</Text>
        ) : (
          <>
            <Text style={{ fontSize: 14, color: colors.text, textAlign: "center" }}>
              {error?.message ?? "Couldn't load this order."}
            </Text>
            <Pressable
              onPress={reload}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: colors.text,
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: radius.md,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 13 }}>Retry</Text>
            </Pressable>
          </>
        )}
      </SafeAreaView>
    );
  }

  const { items, subtotal, shipping, tax, address } = order;
  // When each step happened, from the server's event log.
  const stepAt = new Map(order.timeline.map((e) => [e.status, e.at.slice(0, 10)]));
  const currentStep = stepOrder.indexOf(order.status);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
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
                <Text style={{ flex: 1, fontSize: 13.5, color: done ? colors.text : colors.textMuted, fontWeight: "600" }}>
                  {stepLabels[step]}
                </Text>
                {stepAt.has(step) && (
                  <Text style={{ fontSize: 11.5, color: colors.textSubtle }}>{stepAt.get(step)}</Text>
                )}
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
              key={`${it.sku}-${it.productId}`}
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
          SHIPPING TO
        </Text>
        <Text style={{ fontSize: 13.5, fontWeight: "600", color: colors.text, marginTop: 10 }}>{address.name}</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
          {address.line1}, {address.city} {address.postal}, {address.country}
        </Text>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const colors = useColors();
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
