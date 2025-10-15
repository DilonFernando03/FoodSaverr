import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SupabaseTest from '@/components/SupabaseTest';

export default function TestSupabaseScreen() {
  return (
    <ScrollView style={styles.container}>
      <SupabaseTest />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

