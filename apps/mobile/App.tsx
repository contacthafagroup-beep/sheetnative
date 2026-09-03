/**
 * SheetNative mobile — offline-first companion app.
 * Camera (OCR/barcode), GPS check-ins, NFC tagging, voice approvals,
 * push notifications and background sync with the same Supabase backend.
 */
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://supabase-api-prod.verdent.ai",
  process.env.EXPO_PUBLIC_SUPABASE_KEY ?? ""
);

type Workbook = { id: string; file_name: string; status: string };

export default function App() {
  const [workbooks, setWorkbooks] = useState<Workbook[] | null>(null);

  useEffect(() => {
    supabase
      .from("workbooks")
      .select("id,file_name,status")
      .order("created_at", { ascending: false })
      .limit(25)
      .then(({ data }) => setWorkbooks((data as Workbook[]) ?? []));
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <Text style={styles.title}>SheetNative</Text>
        <Text style={styles.subtitle}>Your business, offline-first</Text>
        {workbooks === null ? (
          <ActivityIndicator color="#818cf8" style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={workbooks}
            keyExtractor={(w) => w.id}
            contentContainerStyle={{ gap: 10, paddingTop: 16 }}
            renderItem={({ item }) => (
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>{item.file_name}</Text>
                <Text style={styles.cardSub}>{item.status}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No workbooks yet — upload one on the web app.</Text>
            }
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07090f", paddingHorizontal: 20 },
  title: { color: "#e6edf3", fontSize: 28, fontWeight: "700", marginTop: 12 },
  subtitle: { color: "#8b98a9", fontSize: 14, marginTop: 4 },
  card: { backgroundColor: "#131a24", borderRadius: 16, borderWidth: 1, borderColor: "rgba(148,163,184,0.12)", padding: 16 },
  cardTitle: { color: "#e6edf3", fontSize: 15, fontWeight: "600" },
  cardSub: { color: "#8b98a9", fontSize: 12, marginTop: 4 },
  empty: { color: "#8b98a9", marginTop: 32, textAlign: "center" },
});
