import { useState } from "react";
import { Link, useRouter, Stack } from "expo-router";
import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../src/lib/session";
import { radius, useColors } from "../src/theme/tokens";

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signUp } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email and password are required");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await signUp(name, email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/account");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: "Create account" }} />
      <View style={{ padding: 24, gap: 16 }}>
        <View>
          <Text style={{ fontSize: 11.5, color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 }}>
            INTELLICART
          </Text>
          <Text style={{ fontSize: 26, fontWeight: "700", color: colors.text, marginTop: 4 }}>
            Create account
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>
            Track orders, save addresses, and review what you buy.
          </Text>
        </View>

        <Field
          label="Full name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoFocus
          textContentType="name"
          autoComplete="name"
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCorrect={false}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />

        {error && <Text style={{ fontSize: 12, color: colors.accentRose }}>{error}</Text>}

        <Pressable
          onPress={submit}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy }}
          style={({ pressed }) => ({
            backgroundColor: colors.text,
            paddingVertical: 14,
            borderRadius: radius.md,
            alignItems: "center",
            opacity: busy ? 0.6 : pressed ? 0.9 : 1,
            marginTop: 4,
          })}
        >
          {busy ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 14 }}>Create account</Text>
          )}
        </Pressable>

        <View style={{ marginTop: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            Already have one?{" "}
            <Link href="/sign-in" style={{ color: colors.brand600, fontWeight: "700" }}>
              Sign in
            </Link>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Field({ label, keyboardType, ...props }: { label: string } & TextInputProps) {
  const colors = useColors();
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={colors.textSubtle}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        keyboardType={keyboardType}
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
  );
}
