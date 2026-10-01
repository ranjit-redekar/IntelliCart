import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Platform, Pressable, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../src/lib/cart";
import { useColors } from "../../src/theme/tokens";

type IconName = React.ComponentProps<typeof Feather>["name"];

const iconForRoute: Record<string, IconName> = {
  index: "home",
  search: "search",
  cart: "shopping-bag",
  account: "user",
};

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { count } = useCart();

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.surface,
          borderRadius: 28,
          padding: 6,
          borderWidth: 1,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
            },
            android: { elevation: 8 },
            default: {},
          }),
        }}
      >
        {state.routes.map((route, i) => {
          const { options } = descriptors[route.key];
          const focused = state.index === i;
          const iconName = iconForRoute[route.name] ?? "circle";
          const isCart = route.name === "cart";
          const accessibilityLabel =
            options.tabBarAccessibilityLabel ?? options.title ?? route.name;

          function onPress() {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          function onLongPress() {
            navigation.emit({ type: "tabLongPress", target: route.key });
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={accessibilityLabel}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                marginHorizontal: 2,
                borderRadius: 22,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 30,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: focused ? colors.brand500 + "1F" : "transparent",
                }}
              >
                <Feather
                  name={iconName}
                  size={20}
                  color={focused ? colors.brand600 : colors.textSubtle}
                />
                {isCart && count > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      top: -3,
                      right: 4,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: colors.accentRose,
                      paddingHorizontal: 4,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: colors.surface,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 9.5, fontWeight: "800", lineHeight: 12 }}>
                      {count > 9 ? "9+" : count}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 10.5,
                  fontWeight: focused ? "700" : "600",
                  letterSpacing: 0.2,
                  color: focused ? colors.brand600 : colors.textSubtle,
                }}
                numberOfLines={1}
              >
                {options.title ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: "Shop" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="cart" options={{ title: "Cart" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
    </Tabs>
  );
}
