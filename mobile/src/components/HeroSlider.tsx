import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import type { HeroSlide, SlideTheme } from "../../../shared/types";
import { light, radius, useColors } from "../theme/tokens";

const themeAccent: Record<SlideTheme, string> = {
  brand: light.brand500,
  violet: light.accentViolet,
  mint: light.accentMint,
  amber: light.accentAmber,
  rose: light.accentRose,
};

// Visual constants
const SIDE_PADDING = 20;
const GAP = 12;
const SLIDE_HEIGHT = 195;
const AUTO_ADVANCE_MS = 6000;

function deriveInitials(title: string, override?: string) {
  if (override) return override.slice(0, 2).toUpperCase();
  return (
    title
      .replace(/\n/g, " ")
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "•"
  );
}

/** `refreshKey`: bump it to refetch (the Home screen's pull-to-refresh). */
export default function HeroSlider({ refreshKey = 0 }: { refreshKey?: number }) {
  const colors = useColors();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();

  // The server filters to active slides for this surface and sorts by order.
  const { data, loading } = useApi(
    () => api.get<{ items: HeroSlide[] }>("/slides?surface=mobile"),
    [refreshKey]
  );
  const visible = data?.items ?? [];

  // Each slide leaves a small peek of the neighbor so users feel the swipe.
  const slideW = screenW - SIDE_PADDING * 2;
  const snap = slideW + GAP;

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const userInteracting = useRef(false);

  // Auto-advance.
  useEffect(() => {
    if (visible.length <= 1) return;
    const t = setInterval(() => {
      if (userInteracting.current) return;
      setIndex((i) => {
        const next = (i + 1) % visible.length;
        scrollRef.current?.scrollTo({ x: next * snap, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [visible.length, snap]);

  // Re-align if the screen rotates after we've scrolled.
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: index * snap, animated: false });
  }, [snap, index]);

  if (loading && !data) {
    return (
      <View
        accessibilityLabel="Loading featured content"
        style={{
          marginTop: 16,
          marginHorizontal: SIDE_PADDING,
          height: SLIDE_HEIGHT,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        }}
      />
    );
  }
  // A refresh can return fewer slides; don't point past the end.
  if (visible.length > 0 && index >= visible.length) setIndex(0);
  // ponytail: a failed or empty slide fetch hides the slider; it's decorative.
  if (visible.length === 0) return null;

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / snap);
    const clamped = Math.max(0, Math.min(visible.length - 1, i));
    if (clamped !== index) setIndex(clamped);
    userInteracting.current = false;
  }

  return (
    <View style={{ marginTop: 16 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snap}
        snapToAlignment="start"
        decelerationRate="fast"
        onScrollBeginDrag={() => {
          userInteracting.current = true;
        }}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{
          paddingHorizontal: SIDE_PADDING,
        }}
      >
        {visible.map((slide, i) => {
          const accent = themeAccent[slide.theme];
          const initials = deriveInitials(slide.title, slide.imageInitials);
          const isLast = i === visible.length - 1;
          return (
            <Pressable
              key={slide.id}
              onPress={() => {
                if (!slide.ctaUrl) return;
                // Web-only browse paths (/shop, /products) map to the Search tab,
                // keeping any query (?cat=…, ?q=…). /products/<id> opens the product.
                const url = /^\/(shop|products)(\?|$)/.test(slide.ctaUrl)
                  ? "/search" + (slide.ctaUrl.match(/\?.*$/)?.[0] ?? "")
                  : slide.ctaUrl;
                router.push(url as never);
              }}
              style={({ pressed }) => ({
                width: slideW,
                marginRight: isLast ? 0 : GAP,
                opacity: pressed ? 0.97 : 1,
              })}
            >
              <View
                style={{
                  height: SLIDE_HEIGHT,
                  borderRadius: radius.xl,
                  overflow: "hidden",
                  backgroundColor: accent,
                }}
              >
                {/* Faint gradient layer using a half-tint */}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: SLIDE_HEIGHT * 0.7,
                    backgroundColor: "rgba(0,0,0,0.18)",
                  }}
                />

                {/* Big watermark initials */}
                <Text
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: -16,
                    right: -8,
                    fontSize: 150,
                    fontWeight: "800",
                    color: "white",
                    opacity: 0.12,
                    letterSpacing: -8,
                    lineHeight: 150,
                  }}
                >
                  {initials}
                </Text>

                {/* Content */}
                <View
                  style={{
                    flex: 1,
                    padding: 20,
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    {slide.eyebrow ? (
                      <View
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: "rgba(255,255,255,0.18)",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            letterSpacing: 1.4,
                            color: "white",
                          }}
                        >
                          {slide.eyebrow.toUpperCase()}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "700",
                        color: "white",
                        lineHeight: 28,
                        letterSpacing: -0.4,
                      }}
                      numberOfLines={3}
                    >
                      {slide.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "white",
                        opacity: 0.86,
                        marginTop: 8,
                        lineHeight: 18,
                      }}
                      numberOfLines={2}
                    >
                      {slide.subtitle}
                    </Text>
                    {slide.ctaText ? (
                      <View
                        style={{
                          backgroundColor: "white",
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderRadius: 999,
                          alignSelf: "flex-start",
                          marginTop: 14,
                        }}
                      >
                        <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.text }}>
                          {slide.ctaText} →
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {visible.length > 1 ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
          }}
        >
          {visible.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setIndex(i);
                scrollRef.current?.scrollTo({ x: i * snap, animated: true });
              }}
              accessibilityLabel={`Go to slide ${i + 1}`}
              hitSlop={8}
            >
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  width: i === index ? 24 : 6,
                  backgroundColor: i === index ? colors.text : colors.borderStrong,
                }}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
