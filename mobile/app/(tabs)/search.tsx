import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { products } from "../../src/mockdata";
import ProductTile from "../../src/components/ProductTile";
import { colors, radius } from "../../src/theme/tokens";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return products.slice(0, 8);
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

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
          {query ? `${filtered.length} RESULTS` : "POPULAR RIGHT NOW"}
        </Text>
        {filtered.length === 0 ? (
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
