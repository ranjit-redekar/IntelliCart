import { useEffect, useMemo, useRef, useState } from "react";
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
import { heroSlides } from "../mockdata";
import type { HeroSlide, SlideTheme } from "../../../shared/types";
import { colors, radius } from "../theme/tokens";

const themeAccent: Record<SlideTheme, string> = {
  brand: colors.brand500,
  violet: colors.accentViolet,
  mint: colors.accentMint,
  amber: colors.accentAmber,
  rose: colors.accentRose,
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

export default function HeroSlider() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();

  const visible = useMemo(
    () =>
      heroSlides
        .filter(
          (s) => s.status === "active" && (s.audience === "all" || s.audience === "mobile")
        )
        .slice()
        .sort((a, b) => a.order - b.order),
    []
  );

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
                if (slide.ctaUrl) router.push(slide.ctaUrl as never);
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
