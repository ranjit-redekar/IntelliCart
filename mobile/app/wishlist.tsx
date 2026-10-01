import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { products } from "../src/mockdata";
import { useWishlist } from "../src/lib/wishlist";
import ProductTile from "../src/components/ProductTile";
import { radius, useColors } from "../src/theme/tokens";

export default function WishlistScreen() {
  const colors = useColors();
  const router = useRouter();
  const { ids } = useWishlist();
  const saved = products.filter((p) => ids.includes(p.id));

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
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
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
