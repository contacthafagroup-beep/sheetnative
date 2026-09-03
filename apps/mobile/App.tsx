/**
 * SheetNative mobile — native shell for the SheetNative Business OS.
 * Loads the production web app in a hardened WebView with:
 *  - offline detection + branded retry screen
 *  - Android hardware back-button handling
 *  - pull-to-refresh
 *  - push notification registration (expo-notifications)
 */
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import * as Notifications from "expo-notifications";

const PROD_URL = "https://sheetnative.vercel.app";
const URL = process.env.EXPO_PUBLIC_APP_URL || PROD_URL;

export default function App() {
  const webRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const [online, setOnline] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // network watching
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      const up = !!s.isConnected && !!s.isInternetReachable;
      setOnline(up);
      if (up) setReloadKey((k) => k + 1);
    });
    NetInfo.fetch().then((s) => setOnline(!!s.isConnected && !!s.isInternetReachable));
    return unsub;
  }, []);

  // Android hardware back → in-app history first
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBackRef.current && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  // push notifications (permission + token) — safe to fail silently
  useEffect(() => {
    (async () => {
      try {
        const settings = await Notifications.getPermissionsAsync();
        if (!settings.granted) {
          const req = await Notifications.requestPermissionsAsync();
          if (!req.granted) return;
        }
        await Notifications.getExpoPushTokenAsync(); // token ready for future server pushes
      } catch {
        // push not available (e.g. emulator) — non-fatal
      }
    })();
  }, []);

  const handleMessage = (_e: WebViewMessageEvent) => {
    // Reserved for web → native bridge (voice, camera, share intent)
  };

  if (!online) return <OfflineScreen onRetry={() => { setOnline(true); setReloadKey((k) => k + 1); }} />;

  return (
    <SafeAreaProvider style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#07090f" />
      {!loaded && (
        <View style={styles.boot}>
          <ActivityIndicator color="#818cf8" size="large" />
          <Text style={styles.bootText}>SheetNative</Text>
        </View>
      )}
      <WebView
        key={reloadKey}
        ref={webRef}
        source={{ uri: URL }}
        style={styles.web}
        containerStyle={!loaded ? styles.hidden : undefined}
        onLoadEnd={() => setLoaded(true)}
        onMessage={handleMessage}
        onNavigationStateChange={(s) => {
          canGoBackRef.current = s.canGoBack;
        }}
        onShouldStartLoadWithRequest={(req) => {
          // keep the app inside the product; open external links in system browser
          const host = req.url.replace(/^https?:\/\//, "").split("/")[0];
          const internal = host.includes("sheetnative.vercel.app") || host.includes("supabase.co") || req.isTopFrame === false;
          if (!internal && req.navigationType === "click") {
            Linking.openURL(req.url).catch(() => {});
            return false;
          }
          return true;
        }}
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        setSupportMultipleWindows
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="never"
        onError={() => setLoaded(true)}
        renderError={() => <OfflineScreen onRetry={() => setReloadKey((k) => k + 1)} embedded />}
      />
    </SafeAreaProvider>
  );
}

function OfflineScreen({ onRetry, embedded }: { onRetry: () => void; embedded?: boolean }) {
  return (
    <View style={[styles.offline, embedded && styles.web]}>
      <Text style={styles.offlineIcon}>✦</Text>
      <Text style={styles.offlineTitle}>You're offline</Text>
      <Text style={styles.offlineBody}>
        SheetNative needs a connection to sync your business data.{"\n"}
        Your changes are safe and will sync when you're back online.
      </Text>
      <Pressable onPress={onRetry} style={styles.retryBtn}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07090f" },
  web: { flex: 1, backgroundColor: "#07090f" },
  hidden: { opacity: 0 },
  boot: { ...StyleSheet.absoluteFillObject, backgroundColor: "#07090f", alignItems: "center", justifyContent: "center", zIndex: 10 },
  bootText: { color: "#f8fafc", fontSize: 26, fontWeight: "700", marginTop: 18 },
  offline: { flex: 1, backgroundColor: "#07090f", alignItems: "center", justifyContent: "center", padding: 32 },
  offlineIcon: { color: "#818cf8", fontSize: 44, marginBottom: 16 },
  offlineTitle: { color: "#f8fafc", fontSize: 22, fontWeight: "700" },
  offlineBody: { color: "#8b98a9", fontSize: 14, textAlign: "center", lineHeight: 21, marginTop: 8 },
  retryBtn: { marginTop: 24, backgroundColor: "#6366f1", borderRadius: 14, paddingHorizontal: 32, paddingVertical: 12 },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
