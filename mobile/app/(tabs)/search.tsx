import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Product } from "../../../shared/types";
import { api, qs, type Page } from "../../src/lib/api";
import { useApi } from "../../src/lib/useApi";
import ProductTile from "../../src/components/ProductTile";
import { radius, useColors } from "../../src/theme/tokens";

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  // Hero slide CTAs can land here with ?cat=… or ?q=…
  const params = useLocalSearchParams<{ q?: string; cat?: string }>();
  const cat = params.cat;
  const [query, setQuery] = useState(params.q ?? "");
  const [debounced, setDebounced] = useState(query.trim());
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Text matching, filtering and natural-language interpretation run server-side.
  // With no query, show the top-rated handful as "popular".
  const res = useApi(
    () =>
      api.get<Page<Product> & { interpretation: string | null }>(
        `/products${qs(
          debounced ? { q: debounced, cat, pageSize: 40 } : { cat, sort: "rating", pageSize: 8 }
        )}`
      ),
    [debounced, cat]
  );
  const filtered = res.data?.items ?? [];
  const total = res.data?.total ?? 0;
  const searching = !!debounced;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Text
          style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}
        >
          DISCOVER
        </Text>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text, marginTop: 2 }}>
          Search
        </Text>
        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderColor: colors.border,
            borderWidth: 1,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <TextInput
            placeholder="Search products, categories…"
            value={query}
            onChangeText={setQuery}
            style={{ fontSize: 14, color: colors.text }}
            placeholderTextColor={colors.textSubtle}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search products"
          />
        </View>

        {cat ? (
          <Pressable
            onPress={() => router.setParams({ cat: undefined })}
            accessibilityRole="button"
            accessibilityLabel={`Remove category filter ${cat}`}
            style={{
              marginTop: 10,
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: colors.text,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.surface }}>{cat}</Text>
            <Feather name="x" size={12} color={colors.surface} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push("/assistant")}
          style={({ pressed }) => ({
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.accentViolet + "55",
            backgroundColor: colors.accentViolet + "10",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: colors.accentViolet,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="zap" size={14} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.text }}>
              Ask IntelliCart AI
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
              Describe what you want — "gift under $100", "cozy for fall"
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.textSubtle} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={res.refreshing} onRefresh={res.refresh} tintColor={colors.textSubtle} />
        }
      >
        <Text
          style={{
            fontSize: 11.5,
            color: colors.textSubtle,
            fontWeight: "700",
            letterSpacing: 1,
            paddingHorizontal: 20,
            marginTop: 20,
            marginBottom: 10,
          }}
        >
          {searching ? `${total} RESULTS` : "POPULAR RIGHT NOW"}
        </Text>
        {searching && res.data?.interpretation ? (
          <View style={{ paddingHorizontal: 20, marginBottom: 10, flexDirection: "row", gap: 6 }}>
            <Feather name="zap" size={12} color={colors.accentViolet} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, fontSize: 12, color: colors.textMuted }}>
              <Text style={{ fontWeight: "700", color: colors.text }}>AI interpreted: </Text>
              {res.data.interpretation}
            </Text>
          </View>
        ) : null}
        {res.error && !res.data ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 40, alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center" }}>
              {res.error.message}
            </Text>
            <Pressable
              onPress={res.reload}
              accessibilityRole="button"
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: colors.text,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.surface }}>Retry</Text>
            </Pressable>
          </View>
        ) : res.loading && !res.data ? (
          <ActivityIndicator
            style={{ paddingTop: 40 }}
            color={colors.textSubtle}
            accessibilityLabel="Loading products"
          />
        ) : filtered.length === 0 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>No products match.</Text>
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: 14,
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            {filtered.map((p) => (
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
