import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Feedback, Order } from "../../../shared/types";
import { api, type Page } from "../../src/lib/api";
import { useApi } from "../../src/lib/useApi";
import { useSession } from "../../src/lib/session";
import { useWishlist } from "../../src/lib/wishlist";
import { radius, useColors } from "../../src/theme/tokens";

interface Overview {
  orders: number;
  totalSpent: number;
  reviews: number;
  wishlist: number;
  tier: string;
}

export default function AccountScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, signOut } = useSession();
  const account = useApi(
    async () =>
      user
        ? Promise.all([
            api.get<Overview>("/account/overview"),
            api.get<Page<Order>>("/account/orders?pageSize=4"),
            api.get<Page<Feedback>>("/account/reviews?pageSize=3"),
          ])
        : null,
    [user?.id],
  );

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>Welcome</Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.textMuted,
              marginTop: 8,
              textAlign: "center",
              maxWidth: 280,
            }}
          >
            Sign in to track orders, save addresses, and review what you buy.
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
            <Pressable
              onPress={() => router.push("/sign-in")}
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
          <View style={{ alignSelf: "stretch", marginTop: 28 }}>
            <WishlistLink />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const [overview, myOrders, myReviews] = account.data ?? [];
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={account.refreshing} onRefresh={account.refresh} />}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.brand500,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 20 }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>{user.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>{user.email}</Text>
          </View>
          {overview && (
            <View
              style={{
                backgroundColor: colors.surface2,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text }}>{overview.tier}</Text>
            </View>
          )}
        </View>

        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Stat label="Orders" value={overview ? String(overview.orders) : "–"} />
          <Stat label="Spent" value={overview ? `$${overview.totalSpent}` : "–"} />
          <Stat label="Reviews" value={overview ? String(overview.reviews) : "–"} />
        </View>

        {account.loading && !account.data && <ActivityIndicator style={{ marginVertical: 12 }} />}
        {account.error && !account.refreshing && (
          <View style={{ marginHorizontal: 20, marginBottom: 12, gap: 8 }}>
            <Text style={{ fontSize: 13, color: colors.accentRose }}>{account.error.message}</Text>
            <Pressable
              onPress={account.reload}
              accessibilityRole="button"
              style={({ pressed }) => ({
                alignSelf: "flex-start",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: radius.md,
                borderColor: colors.border,
                borderWidth: 1,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>Retry</Text>
            </Pressable>
          </View>
        )}

        <View style={{ paddingHorizontal: 20 }}>
          <WishlistLink />
        </View>

        <Section title="Recent orders">
          {!myOrders ? null : myOrders.items.length === 0 ? (
            <Text style={{ fontSize: 13, color: colors.textMuted, paddingHorizontal: 20 }}>
              No orders yet.
            </Text>
          ) : (
            myOrders.items.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push(`/orders/${o.id}`)}
                style={{
                  marginHorizontal: 20,
                  marginBottom: 8,
                  padding: 14,
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  borderColor: colors.border,
                  borderWidth: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{o.id}</Text>
                  <Text style={{ fontSize: 11.5, color: colors.textSubtle, marginTop: 2 }}>
                    {o.placedAt} · {o.status}
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>${o.total}</Text>
              </Pressable>
            ))
          )}
        </Section>

        <Section title="Reviews left">
          {!myReviews ? null : myReviews.items.length === 0 ? (
            <Text style={{ fontSize: 13, color: colors.textMuted, paddingHorizontal: 20 }}>
              You haven't reviewed anything yet.
            </Text>
          ) : (
            myReviews.items.map((r) => (
              <View
                key={r.id}
                style={{
                  marginHorizontal: 20,
                  marginBottom: 8,
                  padding: 14,
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.text }}>{r.title}</Text>
                <Text style={{ fontSize: 11.5, color: colors.textSubtle, marginTop: 2 }}>
                  {r.productName} · {"★".repeat(r.rating)}
                </Text>
                <Text style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 6 }} numberOfLines={2}>
                  {r.body}
                </Text>
              </View>
            ))
          )}
        </Section>

        <Pressable
          onPress={() => void signOut()}
          accessibilityRole="button"
          style={({ pressed }) => ({
            margin: 20,
            paddingVertical: 12,
            borderRadius: radius.md,
            borderColor: colors.border,
            borderWidth: 1,
            alignItems: "center",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ fontSize: 13.5, fontWeight: "600", color: colors.text }}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function WishlistLink() {
  const colors = useColors();
  const router = useRouter();
  // ponytail: raw id count; may include products since removed from the catalog.
  const count = useWishlist().ids.length;
  return (
    <Pressable
      onPress={() => router.push("/wishlist")}
      accessibilityRole="link"
      accessibilityLabel={`Wishlist, ${count} saved`}
      style={({ pressed }) => ({
        padding: 14,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderColor: colors.border,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Feather name="heart" size={16} color={colors.accentRose} />
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.text }}>Wishlist</Text>
      <Text style={{ fontSize: 12.5, color: colors.textMuted }}>{count} saved</Text>
      <Feather name="chevron-right" size={16} color={colors.textSubtle} />
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderColor: colors.border,
        borderWidth: 1,
        padding: 14,
      }}
    >
      <Text style={{ fontSize: 11, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 19, fontWeight: "700", color: colors.text, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ marginTop: 16 }}>
      <Text
        style={{
          fontSize: 11.5,
          color: colors.textSubtle,
          fontWeight: "700",
          letterSpacing: 1,
          paddingHorizontal: 20,
          marginBottom: 10,
        }}
      >
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}
