import { useState } from "react";
import { Link, useRouter, Stack } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../src/lib/session";
import { colors, radius } from "../src/theme/tokens";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }
    signUp(name, email);
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

        <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoFocus />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
        />

        {error && <Text style={{ fontSize: 12, color: colors.accentRose }}>{error}</Text>}

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
          <Text style={{ color: colors.surface, fontWeight: "700", fontSize: 14 }}>Create account</Text>
        </Pressable>

        <View style={{ marginTop: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            Already have one?{" "}
            <Link href="/sign-in" style={{ color: colors.brand500, fontWeight: "700" }}>
              Sign in
            </Link>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoFocus,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        autoFocus={autoFocus}
        secureTextEntry={secureTextEntry}
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
