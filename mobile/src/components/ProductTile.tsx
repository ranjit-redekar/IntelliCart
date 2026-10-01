import { Pressable, StyleSheet, Text, View, type DimensionValue } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { categoryAccent, radius, useColors } from "../theme/tokens";

interface Props {
  id: string;
  name: string;
  price: number;
  rating: number;
  category: string;
  categoryId: string;
  image?: string;
  width?: DimensionValue;
}

export default function ProductTile({ id, name, price, rating, category, categoryId, image, width }: Props) {
  const colors = useColors();
  const router = useRouter();
  const accent = categoryAccent[categoryId] ?? colors.brand500;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Pressable
      onPress={() => router.push(`/products/${id}`)}
      accessibilityRole="link"
      accessibilityLabel={`${name}, $${price}, rated ${rating}`}
      style={({ pressed }) => ({
        width: width ?? "100%",
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderColor: colors.border,
        borderWidth: 1,
        overflow: "hidden",
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          aspectRatio: 1,
          backgroundColor: accent + "1F",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: 12,
        }}
      >
        {image ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : null}
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: colors.surface,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: accent, fontSize: 9.5, fontWeight: "700", letterSpacing: 0.6 }}>
            {category.toUpperCase()}
          </Text>
        </View>
        {image ? null : (
          <Text
            style={{
              fontSize: 44,
              fontWeight: "700",
              color: accent,
              opacity: 0.28,
              letterSpacing: -2,
              lineHeight: 44,
            }}
          >
            {initials}
          </Text>
        )}
      </View>
      <View style={{ padding: 12, gap: 4 }}>
        <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: "600", color: colors.text }}>
          {name}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>★ {rating}</Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>${price}</Text>
        </View>
      </View>
    </Pressable>
  );
}
