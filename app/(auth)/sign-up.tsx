import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [emailcode, setEmailCode] = React.useState("");

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      await signUp.create({
        emailAddress,
        password,
        username,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display verification form
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors?.[0]?.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      // Use the code the user provided to attempt verification
      const emailVerify = await signUp.attemptEmailAddressVerification({
        code: emailcode,
      });

      // If verification was completed, set the session to active and redirect
      if (emailVerify.status === "complete") {
        await setActive({ session: emailVerify.createdSessionId });
        router.replace("/(tabs)"); // Fixed: Redirect to your tabs layout
      } else {
        console.error("Verification incomplete:", JSON.stringify(emailVerify, null, 2));
        Alert.alert("Error", "Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            Enter the verification code sent to {emailAddress}
          </Text>
          <TextInput
            style={styles.input}
            value={emailcode}
            placeholder="Enter verification code"
            onChangeText={setEmailCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            onPress={onVerifyPress}
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Verifying..." : "Verify"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Sign up</Text>
        
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={setEmailAddress}
          keyboardType="email-address"
          autoComplete="email"
        />
        
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={setPassword}
          autoComplete="password-new"
        />
        
        <TextInput
          style={styles.input}
          value={username}
          placeholder="Enter username"
          onChangeText={setUsername}
          autoComplete="username-new"
        />
        
        <TouchableOpacity
          onPress={onSignUpPress}
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating Account..." : "Continue"}
            </Text>
        </TouchableOpacity>
        
        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 16,
    color: '#666',
  },
  link: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
});
