import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { categories, products } from "../../src/mockdata";
import ProductTile from "../../src/components/ProductTile";
import HeroSlider from "../../src/components/HeroSlider";
import { categoryAccent, radius, useColors } from "../../src/theme/tokens";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filtered = useMemo(
    () =>
      selectedCategory === "all"
        ? products
        : products.filter((p) => p.categoryId === selectedCategory),
    [selectedCategory]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 8,
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
              INTELLICART
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: colors.text,
                letterSpacing: -0.6,
                marginTop: 2,
              }}
            >
              Quiet essentials, made well.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/assistant")}
            accessibilityLabel="Open IntelliCart AI"
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.brand500,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            <Feather name="zap" size={18} color="white" />
          </Pressable>
        </View>

        <HeroSlider />

        <Text
          style={{
            fontSize: 11.5,
            color: colors.textSubtle,
            fontWeight: "700",
            letterSpacing: 1,
            paddingHorizontal: 20,
            marginTop: 24,
            marginBottom: 10,
          }}
        >
          CATEGORIES
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                hitSlop={{ top: 6, bottom: 6 }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: isActive ? colors.text : colors.surface,
                  borderColor: isActive ? colors.text : colors.border,
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: "600",
                    color: isActive ? colors.surface : colors.textMuted,
                  }}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text
          style={{
            fontSize: 11.5,
            color: colors.textSubtle,
            fontWeight: "700",
            letterSpacing: 1,
            paddingHorizontal: 20,
            marginTop: 24,
            marginBottom: 10,
          }}
        >
          BROWSE
        </Text>
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

        <Text
          style={{
            fontSize: 11.5,
            color: colors.textSubtle,
            fontWeight: "700",
            letterSpacing: 1,
            paddingHorizontal: 20,
            marginTop: 24,
            marginBottom: 10,
          }}
        >
          SHOP BY CATEGORY
        </Text>
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {categories
            .filter((c) => c.id !== "all")
            .map((c) => {
              const accent = categoryAccent[c.id] ?? colors.brand500;
              const count = products.filter((p) => p.categoryId === c.id).length;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCategory(c.id)}
                  style={{
                    backgroundColor: accent + "14",
                    borderRadius: radius.xl,
                    padding: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{c.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{count} items</Text>
                  </View>
                  <Text style={{ fontSize: 22, color: accent, fontWeight: "700" }}>→</Text>
                </Pressable>
              );
            })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
