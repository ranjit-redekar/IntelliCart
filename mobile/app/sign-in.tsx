import { useState } from "react";
import { Link, useRouter, Stack } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../src/lib/session";
import { customers } from "../src/mockdata";
import { radius, useColors } from "../src/theme/tokens";

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    const ok = signIn(email.trim());
    if (!ok) {
      setError(`No customer with that email. Try ${customers[0].email}.`);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/account");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: "Sign in" }} />
      <View style={{ padding: 24, gap: 16 }}>
        <View>
          <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
            INTELLICART
          </Text>
          <Text style={{ fontSize: 26, fontWeight: "700", color: colors.text, marginTop: 4 }}>
            Welcome back
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.md,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: colors.text,
              marginTop: 4,
            }}
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textSubtle}
            secureTextEntry
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.md,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: colors.text,
              marginTop: 4,
            }}
          />
        </View>

        {error && (
          <Text style={{ fontSize: 12, color: colors.accentRose }}>{error}</Text>
        )}

        <Pressable
          onPress={submit}
          style={({ pressed }) => ({
            backgroundColor: colors.text,
            paddingVertical: 14,
            borderRadius: radius.md,
            alignItems: "center",
            opacity: pressed ? 0.9 : 1,
            marginTop: 4,
          })}
        >
          <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 14 }}>Sign in</Text>
        </Pressable>

        <Text style={{ fontSize: 11.5, color: colors.textSubtle, textAlign: "center" }}>
          Demo only — use any customer email from the mock list.
        </Text>

        <View style={{ marginTop: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            New to IntelliCart?{" "}
            <Link href="/sign-up" style={{ color: colors.brand600, fontWeight: "700" }}>
              Create an account
            </Link>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
