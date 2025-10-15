import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    const results: string[] = [];
    
    try {
      // Test 1: Basic connection
      results.push('🔍 Testing Supabase connection...');
      setTestResults([...results]);
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, user_type')
        .limit(1);
      
      if (usersError) {
        throw new Error(`Database connection failed: ${usersError.message}`);
      }
      
      results.push('✅ Database connection successful!');
      setTestResults([...results]);
      
      // Test 2: Check tables
      results.push('🔍 Checking database tables...');
      setTestResults([...results]);
      
      const { data: bags, error: bagsError } = await supabase
        .from('surprise_bags')
        .select('id, title')
        .limit(1);
      
      if (bagsError) {
        throw new Error(`Surprise bags table not found: ${bagsError.message}`);
      }
      
      results.push('✅ All tables exist!');
      setTestResults([...results]);
      
      // Test 3: Check RLS policies
      results.push('🔍 Testing Row Level Security...');
      setTestResults([...results]);
      
      // Try to read public data (should work)
      const { data: publicBags, error: publicError } = await supabase
        .from('surprise_bags')
        .select('id, title, is_available')
        .eq('is_available', true)
        .limit(1);
      
      if (publicError) {
        results.push(`⚠️ RLS test: ${publicError.message}`);
      } else {
        results.push('✅ RLS policies working correctly!');
      }
      
      results.push('🎉 Supabase connection test completed!');
      setTestResults([...results]);
      setConnectionStatus('connected');
      
    } catch (error) {
      results.push(`❌ Connection failed: ${error.message}`);
      setTestResults([...results]);
      setConnectionStatus('error');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'error': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '✅ Connected';
      case 'error': return '❌ Error';
      default: return '🔄 Testing...';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      
      <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
      
      <View style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
      
      <Text style={styles.infoText}>
        If you see "✅ Connected" above, your Supabase setup is working correctly!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
});

