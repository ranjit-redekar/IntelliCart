import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateAssistantReply, type AssistantReply } from "../src/lib/ai";
import { categoryAccent, colors, radius } from "../src/theme/tokens";

interface Message {
  id: string;
  role: "assistant" | "user";
  text?: string;
  reply?: AssistantReply;
}

const seed: Message = {
  id: "intro",
  role: "assistant",
  reply: {
    text:
      "Hi — I'm IntelliCart's shopping assistant. Ask me to find products, summarize reviews, or compare picks.",
    products: [],
    followups: ["Find me a gift under $100", "Top-rated home goods", "What's on sale?"],
  },
};

export default function AssistantScreen() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([seed]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, thinking]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: clean }]);
    setDraft("");
    setThinking(true);
    setTimeout(() => {
      const reply = generateAssistantReply(clean);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", reply }]);
      setThinking(false);
    }, 700);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <Stack.Screen options={{ title: "IntelliCart AI", headerBackTitle: "Close" }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 6,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.brand500,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="zap" size={16} color="white" />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1.2 }}>
              INTELLICART AI
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
              Shopping assistant
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <Bubble key={msg.id} message={msg} onFollowup={send} onProductPress={(id) => router.push(`/products/${id}`)} />
          ))}
          {thinking ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Dot delay={0} />
              <Dot delay={150} />
              <Dot delay={300} />
              <Text style={{ fontSize: 12.5, color: colors.textSubtle }}>Thinking</Text>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask anything…"
            placeholderTextColor={colors.textSubtle}
            style={{
              flex: 1,
              backgroundColor: colors.surface2,
              borderRadius: radius.md,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 14,
              color: colors.text,
            }}
            onSubmitEditing={() => send(draft)}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => send(draft)}
            disabled={!draft.trim() || thinking}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.text,
              alignItems: "center",
              justifyContent: "center",
              opacity: !draft.trim() || thinking ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            <Feather name="send" size={16} color="white" />
          </Pressable>
        </View>
        <Text
          style={{
            fontSize: 10.5,
            color: colors.textSubtle,
            textAlign: "center",
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: colors.surface,
          }}
        >
          IntelliCart AI · responses are demo-generated from the catalog.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({
  message,
  onFollowup,
  onProductPress,
}: {
  message: Message;
  onFollowup: (text: string) => void;
  onProductPress: (id: string) => void;
}) {
  if (message.role === "user") {
    return (
      <View style={{ alignItems: "flex-end" }}>
        <View
          style={{
            maxWidth: "85%",
            backgroundColor: colors.text,
            borderRadius: 16,
            borderBottomRightRadius: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: colors.surface, fontSize: 13.5 }}>{message.text}</Text>
        </View>
      </View>
    );
  }
  const reply = message.reply;
  if (!reply) return null;
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          alignSelf: "flex-start",
          maxWidth: "90%",
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 16,
          borderBottomLeftRadius: 6,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 19 }}>{reply.text}</Text>
      </View>
      {reply.products.length > 0 && (
        <View style={{ gap: 6 }}>
          {reply.products.map((p) => {
            const accent = categoryAccent[p.categoryId] ?? colors.brand500;
            const initials = p.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <Pressable
                key={p.id}
                onPress={() => onProductPress(p.id)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 10,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: radius.md,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: accent + "26",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {p.image ? (
                    <Image source={{ uri: p.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <Text style={{ color: accent, fontSize: 14, fontWeight: "700" }}>{initials}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.textSubtle, marginTop: 2 }}>
                    ★ {p.rating} · ${p.price}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.textSubtle} />
              </Pressable>
            );
          })}
        </View>
      )}
      {reply.followups.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {reply.followups.map((f) => (
            <Pressable
              key={f}
              onPress={() => onFollowup(f)}
              style={({ pressed }) => ({
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderColor: colors.border,
                borderWidth: 1,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 11.5, color: colors.text, fontWeight: "600" }}>{f}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  // RN doesn't animate inline easily; we cycle opacity via setInterval via key prop trick.
  // For demo purposes, a static dot row reads as "thinking" well enough.
  return (
    <View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.textSubtle,
        opacity: delay === 0 ? 0.9 : delay === 150 ? 0.6 : 0.35,
      }}
    />
  );
}
