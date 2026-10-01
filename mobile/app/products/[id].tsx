import { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { feedback, productExtras, products, promotions } from "../../src/mockdata";
import { getProductExtra } from "../../../shared/productExtras";
import type { PromotionTheme } from "../../../shared/types";
import { useCart } from "../../src/lib/cart";
import { useWishlist } from "../../src/lib/wishlist";
import { light, radius, useColors } from "../../src/theme/tokens";

const themeAccent: Record<PromotionTheme, string> = {
  brand: light.brand500,
  violet: light.accentViolet,
  mint: light.accentMint,
  amber: light.accentAmber,
  rose: light.accentRose,
};

export default function ProductScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { add } = useCart();
  const wishlist = useWishlist();
  const [added, setAdded] = useState(false);
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const galleryRef = useRef<ScrollView>(null);

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Stack.Screen options={{ title: "Not found" }} />
        <Text style={{ fontSize: 16, color: colors.text }}>Product not found</Text>
      </SafeAreaView>
    );
  }

  const extras = getProductExtra(product, productExtras);
  const reviews = feedback.filter((f) => f.productId === product.id);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : product.rating.toFixed(1);
  const offers = promotions.filter(
    (o) => o.status === "active" && (o.audience === "all" || o.audience === "mobile")
  );
  const discountPromo = offers.find((o) => /\d+%\s*off/i.test(o.title));
  const discountPct = discountPromo ? Number(discountPromo.title.match(/(\d+)%/)?.[1] ?? 0) : 0;
  const listPrice = discountPct ? Math.round(product.price * (100 / (100 - discountPct))) : null;

  function onGalleryScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / screenW);
    if (i !== activeImage) setActiveImage(i);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: product.name,
          headerBackTitle: "Back",
          headerRight: () => {
            const saved = wishlist.has(product.id);
            return (
              <Pressable
                onPress={() => wishlist.toggle(product.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={saved ? "Remove from wishlist" : "Save to wishlist"}
                accessibilityState={{ selected: saved }}
              >
                {/* ponytail: Feather has no filled heart; saved = rose tint */}
                <Feather name="heart" size={20} color={saved ? colors.accentRose : colors.text} />
              </Pressable>
            );
          },
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View>
          <ScrollView
            ref={galleryRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onGalleryScroll}
          >
            {extras.images.map((img) => {
              const accent = themeAccent[img.theme];
              return (
                <View
                  key={img.id}
                  style={{
                    width: screenW,
                    aspectRatio: 1,
                    backgroundColor: accent + "22",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                    padding: 24,
                  }}
                >
                  {img.url ? (
                    <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
                  ) : null}
                  {img.caption ? (
                    <View
                      style={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        backgroundColor: colors.surface,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: accent, fontSize: 10.5, fontWeight: "700", letterSpacing: 0.7 }}>
                        {img.caption.toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                  {img.url ? null : (
                    <Text
                      style={{
                        fontSize: 130,
                        fontWeight: "700",
                        color: accent,
                        opacity: 0.22,
                        letterSpacing: -6,
                        lineHeight: 130,
                      }}
                    >
                      {img.initials}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {extras.images.length > 1 ? (
            <View
              style={{
                position: "absolute",
                bottom: 12,
                left: 0,
                right: 0,
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {extras.images.map((img, i) => (
                <Pressable
                  key={img.id}
                  onPress={() => {
                    setActiveImage(i);
                    galleryRef.current?.scrollTo({ x: i * screenW, animated: true });
                  }}
                  hitSlop={8}
                >
                  <View
                    style={{
                      height: 5,
                      borderRadius: 3,
                      width: i === activeImage ? 20 : 5,
                      backgroundColor: i === activeImage ? colors.text : colors.borderStrong,
                    }}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {/* Title + price */}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
            {product.category.toUpperCase()} · {product.id}
          </Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text, marginTop: 4, letterSpacing: -0.4 }}>
            {product.name}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 10, flexWrap: "wrap" }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: colors.text }}>${product.price}</Text>
            {listPrice ? (
              <>
                <Text style={{ fontSize: 14, color: colors.textSubtle, textDecorationLine: "line-through" }}>
                  ${listPrice}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: colors.accentMint + "1F",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accentMint }}>
                    {discountPct}% off
                  </Text>
                </View>
              </>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
            <Text style={{ fontSize: 12.5, color: colors.accentAmber }}>★ {avgRating}</Text>
            <Text style={{ fontSize: 11.5, color: colors.textSubtle }}>
              ({reviews.length || "no"} reviews)
            </Text>
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: product.stock < 20 ? colors.accentRose + "1F" : colors.accentMint + "1F",
              }}
            >
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: "700",
                  color: product.stock < 20 ? colors.accentRose : colors.accentMint,
                }}
              >
                {product.stock < 20 ? "LOW STOCK" : "IN STOCK"}
              </Text>
            </View>
          </View>
        </View>

        {/* Offers */}
        {offers.length > 0 ? (
          <View style={{ paddingHorizontal: 20, paddingBottom: 4 }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: colors.surface2,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Feather name="gift" size={12} color={colors.textSubtle} />
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: "700",
                    letterSpacing: 1,
                    color: colors.textSubtle,
                  }}
                >
                  AVAILABLE OFFERS
                </Text>
              </View>
              {offers.slice(0, 4).map((o, i) => {
                const accent = themeAccent[o.theme];
                return (
                  <View
                    key={o.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: 12,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        backgroundColor: accent + "1F",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather name="percent" size={11} color={accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                        {o.title}
                      </Text>
                      <Text style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 2 }}>
                        {o.message}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Quantity */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.5 }}>
            QTY
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.md,
            }}
          >
            <Pressable
              onPress={() => {
                setQty((q) => Math.max(1, q - 1));
                setAdded(false);
              }}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>−</Text>
            </Pressable>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, minWidth: 22, textAlign: "center" }}>
              {qty}
            </Text>
            <Pressable
              onPress={() => {
                setQty((q) => Math.min(product.stock, q + 1));
                setAdded(false);
              }}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Highlights */}
        {extras.highlights.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
              HIGHLIGHTS
            </Text>
            <View style={{ marginTop: 8, gap: 8 }}>
              {extras.highlights.map((h, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <Feather name="check" size={14} color={colors.accentMint} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 19 }}>
                    {h}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Specifications */}
        {extras.specs.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
            <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
              SPECIFICATIONS
            </Text>
            <View
              style={{
                marginTop: 8,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                overflow: "hidden",
              }}
            >
              {extras.specs.map((s, i) => (
                <View
                  key={s.key}
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: i % 2 === 0 ? colors.surface : colors.surface2,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <Text style={{ flex: 1, fontSize: 12.5, color: colors.textMuted }}>{s.key}</Text>
                  <Text style={{ flex: 1.5, fontSize: 12.5, color: colors.text, fontWeight: "500" }}>
                    {s.value}
                  </Text>
                </View>
              ))}
            </View>
            {extras.inBox && extras.inBox.length > 0 ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, letterSpacing: 0.7 }}>
                  IN THE BOX
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {extras.inBox.map((b) => (
                    <View
                      key={b}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: colors.surface2,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text style={{ fontSize: 11.5, color: colors.text }}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Reviews */}
        {reviews.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
              CUSTOMER REVIEWS
            </Text>
            <View style={{ gap: 10, marginTop: 8 }}>
              {reviews.slice(0, 3).map((r) => (
                <View
                  key={r.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: radius.lg,
                    padding: 14,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.text }} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.accentAmber }}>{"★".repeat(r.rating)}</Text>
                  </View>
                  <Text style={{ fontSize: 11.5, color: colors.textSubtle, marginTop: 2 }}>
                    {r.customerName} · {r.createdAt}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 19, marginTop: 8 }}>
                    {r.body}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: 16 + insets.bottom,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: "row",
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => {
            // First tap adds and keeps the shopper browsing; second tap goes to the cart.
            if (added) return router.dismissTo("/(tabs)/cart");
            add(product.id, qty);
            setAdded(true);
          }}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.text,
            paddingVertical: 14,
            borderRadius: radius.md,
            alignItems: "center",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 14 }}>
            {added ? "Added ✓ · View cart" : `Add to cart · $${product.price * qty}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
