import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { Product } from "../../shared/types";
import { api, ApiError } from "../src/lib/api";
import { useApi } from "../src/lib/useApi";
import { useSession } from "../src/lib/session";
import { useWishlist } from "../src/lib/wishlist";
import ProductTile from "../src/components/ProductTile";
import { radius, useColors } from "../src/theme/tokens";

export default function WishlistScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useSession();
  const wishlist = useWishlist();
  const { ids } = wishlist;
  // Signed out: device ids only, so one GET /products/:id each.
  // ponytail: one request per saved id; fine for a device-sized list.
  const state = useApi(async () => {
    if (user) return [];
    const results = await Promise.allSettled(ids.map((id) => api.get<Product>(`/products/${id}`)));
    const failed = results.find(
      (r): r is PromiseRejectedResult => r.status === "rejected" && !(r.reason instanceof ApiError && r.reason.status === 404),
    );
    if (failed) throw failed.reason;
    // Ids that 404 (product removed from the catalog) are silently dropped.
    return results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  }, [user?.id, user ? "" : ids.join(",")]);

  // Signed in: GET /account/wishlist returns the products; refetch on open so items saved elsewhere show.
  const [pulling, setPulling] = useState(false);
  const { refresh } = wishlist;
  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);
  const pull = () => {
    setPulling(true);
    void refresh().finally(() => setPulling(false));
  };

  const view = user
    ? {
        saved: wishlist.items.filter((p) => wishlist.has(p.id)),
        loading: !wishlist.ready,
        error: wishlist.error && wishlist.items.length === 0 ? wishlist.error : null,
        retry: () => void refresh(),
        refreshing: pulling,
        onRefresh: pull,
      }
    : {
        saved: (state.data ?? []).filter((p) => ids.includes(p.id)),
        loading: ids.length > 0 && state.loading && !state.data,
        error: state.error && !state.data ? state.error.message : null,
        retry: state.reload,
        refreshing: state.refreshing,
        onRefresh: state.refresh,
      };
  const saved = view.saved;

  if (view.loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.textMuted} accessibilityLabel="Loading wishlist" />
      </View>
    );
  }

  if (view.error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>Couldn't load your wishlist</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: "center" }}>
          {view.error}
        </Text>
        <Pressable
          onPress={view.retry}
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

  if (saved.length === 0) {
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
      refreshControl={<RefreshControl refreshing={view.refreshing} onRefresh={view.onRefresh} />}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {saved.map((p) => (
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
