import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { Product } from "../../shared/types";
import { api, ApiError } from "../src/lib/api";
import { useApi } from "../src/lib/useApi";
import { useWishlist } from "../src/lib/wishlist";
import ProductTile from "../src/components/ProductTile";
import { radius, useColors } from "../src/theme/tokens";

export default function WishlistScreen() {
  const colors = useColors();
  const router = useRouter();
  const { ids } = useWishlist();
  // ponytail: one request per saved id; add a batch endpoint if wishlists grow large.
  const state = useApi(async () => {
    const results = await Promise.allSettled(ids.map((id) => api.get<Product>(`/products/${id}`)));
    const failed = results.find(
      (r): r is PromiseRejectedResult => r.status === "rejected" && !(r.reason instanceof ApiError && r.reason.status === 404),
    );
    if (failed) throw failed.reason;
    // Ids that 404 (product removed from the catalog) are silently dropped.
    return results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  }, [ids.join(",")]);
  const saved = state.data ?? [];

  if (ids.length > 0 && state.loading && !state.data) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.textMuted} accessibilityLabel="Loading wishlist" />
      </View>
    );
  }

  if (state.error && !state.data) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>Couldn't load your wishlist</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: "center" }}>
          {state.error.message}
        </Text>
        <Pressable
          onPress={state.reload}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginTop: 16,
            backgroundColor: colors.text,
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: radius.md,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 13 }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (ids.length === 0 || saved.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
        <Feather name="heart" size={28} color={colors.textSubtle} />
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 12 }}>
          Nothing saved yet
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: "center" }}>
          Tap the heart on any product to keep it here.
        </Text>
        <Pressable
          onPress={() => router.dismissTo("/")}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginTop: 16,
            backgroundColor: colors.text,
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: radius.md,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 13 }}>Browse products</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={state.refresh} />}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {saved.filter((p) => ids.includes(p.id)).map((p) => (
          <View key={p.id} style={{ width: "50%", padding: 6 }}>
            <ProductTile
              id={p.id}
              name={p.name}
              price={p.price}
              rating={p.rating}
              category={p.category}
              categoryId={p.categoryId}
              image={p.image}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
