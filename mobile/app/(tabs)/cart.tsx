import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../../src/lib/cart";
import { categoryAccent, colors, radius } from "../../src/theme/tokens";

export default function CartScreen() {
  const router = useRouter();
  const { expanded, subtotal, update, remove, clear } = useCart();
  const shipping = subtotal === 0 ? 0 : subtotal >= 50 ? 0 : 8;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
          BAG
        </Text>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text, marginTop: 2 }}>
          Your cart
        </Text>
        <Text style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 4 }}>
          {expanded.length === 0
            ? "Empty"
            : `${expanded.reduce((s, l) => s + l.qty, 0)} items`}
        </Text>
      </View>

      {expanded.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            Your cart is empty
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>
            Start exploring to add pieces you love.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/")}
            style={({ pressed }) => ({
              marginTop: 16,
              backgroundColor: colors.text,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: radius.md,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 13 }}>Shop now</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
          >
            {expanded.map((line) => {
              const accent = categoryAccent[line.categoryId] ?? colors.brand500;
              const initials = line.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <View
                  key={line.productId}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    borderColor: colors.border,
                    borderWidth: 1,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: radius.md,
                      backgroundColor: accent + "22",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: accent, fontSize: 20, fontWeight: "700" }}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                      {line.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSubtle, marginTop: 2 }}>
                      ${line.price} each
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                      <Pressable
                        onPress={() => update(line.productId, line.qty - 1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: colors.surface2,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>−</Text>
                      </Pressable>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: colors.text,
                          minWidth: 28,
                          textAlign: "center",
                        }}
                      >
                        {line.qty}
                      </Text>
                      <Pressable
                        onPress={() => update(line.productId, line.qty + 1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: colors.surface2,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>+</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => remove(line.productId)}
                        style={{ marginLeft: 12 }}
                      >
                        <Text style={{ fontSize: 12, color: colors.accentRose, fontWeight: "600" }}>
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                    ${line.lineTotal}
                  </Text>
                </View>
              );
            })}
            <Pressable onPress={clear} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center" }}>
                Clear cart
              </Text>
            </Pressable>
          </ScrollView>

          <View
            style={{
              padding: 20,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.surface,
              gap: 6,
            }}
          >
            <Row label="Subtotal" value={`$${subtotal}`} />
            <Row label="Shipping" value={shipping === 0 ? "Free" : `$${shipping}`} />
            <Row label="Tax" value={`$${tax}`} />
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                marginTop: 6,
                paddingTop: 8,
              }}
            >
              <Row label="Total" value={`$${total}`} bold />
            </View>
            <Pressable
              onPress={() => router.push("/checkout")}
              style={({ pressed }) => ({
                marginTop: 8,
                backgroundColor: colors.text,
                paddingVertical: 14,
                borderRadius: radius.md,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 14 }}>
                Checkout · ${total}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: bold ? 15 : 13, color: bold ? colors.text : colors.textMuted, fontWeight: bold ? "700" : "500" }}>
        {label}
      </Text>
      <Text style={{ fontSize: bold ? 16 : 13, fontWeight: bold ? "700" : "500", color: colors.text }}>
        {value}
      </Text>
    </View>
  );
}
