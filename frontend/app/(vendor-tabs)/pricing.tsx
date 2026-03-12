import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, WASTE_TYPES, ENDPOINTS } from '@/constants/config';
import api from '@/services/api';

export default function PricingScreen() {
  const [pricing, setPricing] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      console.log('💰 Fetching vendor pricing...');
      const response: any = await api.get(ENDPOINTS.VENDOR_PRICING);
      console.log('💰📥 Vendor pricing response:', response);
      
      if (response.success && response.data) {
        // Convert array of pricing objects to a map
        const pricingMap: any = {};
        if (Array.isArray(response.data)) {
          response.data.forEach((item: any) => {
            pricingMap[item.wasteType] = item.pricePerKg.toString();
          });
        } else if (response.data.pricing) {
          response.data.pricing.forEach((item: any) => {
            pricingMap[item.wasteType] = item.pricePerKg.toString();
          });
        }
        
        // Fallback to default values for missing types
        WASTE_TYPES.forEach(type => {
          if (!pricingMap[type.value]) {
            pricingMap[type.value] = '0';
          }
        });
        
        setPricing(pricingMap);
        console.log('💰✅ Vendor pricing loaded:', pricingMap);
      }
    } catch (error) {
      console.error('💰❌ Error fetching vendor pricing:', error);
      // Set default pricing on error
      const defaultPricing: any = {};
      WASTE_TYPES.forEach(type => {
        defaultPricing[type.value] = '0';
      });
      setPricing(defaultPricing);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💰 Saving vendor pricing...');
      
      // Validate: all entries must be non-negative numbers
      for (const [wasteType, price] of Object.entries(pricing)) {
        const parsed = parseFloat(price as string);
        if (isNaN(parsed) || parsed < 0) {
          Alert.alert('Invalid Price', `Please enter a valid price for ${wasteType}`);
          setSaving(false);
          return;
        }
      }

      // Convert pricing map to array format expected by backend
      const pricingArray = Object.entries(pricing).map(([wasteType, price]) => ({
        wasteType,
        pricePerKg: parseFloat(price as string) || 0,
        isActive: true,
      }));
      
      // Backend route is PUT /vendors/pricing
      const response: any = await api.put(ENDPOINTS.VENDOR_PRICING, {
        pricing: pricingArray,
      });
      
      if (response.success) {
        // Re-fetch from server to confirm saved values are reflected
        await fetchPricing();
        Alert.alert('Success ✅', 'Pricing updated successfully!');
        console.log('💰✅ Pricing saved successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update pricing');
      }
    } catch (error: any) {
      console.error('💰❌ Error saving pricing:', error);
      Alert.alert('Error', error.message || 'Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pricing Management</Text>
        <Text style={styles.subtitle}>Set purchase prices per kg</Text>
      </View>

      <View style={styles.pricingList}>
        {WASTE_TYPES.map((type) => (
          <View key={type.value} style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <Text style={styles.wasteIcon}>{type.icon}</Text>
              <Text style={styles.wasteType}>{type.label}</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.currency}>Rs.</Text>
              <TextInput
                style={styles.input}
                value={pricing[type.value]}
                onChangeText={(value) => setPricing({ ...pricing, [type.value]: value })}
                keyboardType="numeric"
                placeholder="0"
              />
              <Text style={styles.unit}>/ kg</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Pricing</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 60, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#FFFFFF', opacity: 0.9 },
  pricingList: { padding: 20 },
  pricingCard: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  pricingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  wasteIcon: { fontSize: 28, marginRight: 12 },
  wasteType: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12 },
  currency: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginRight: 8 },
  input: { flex: 1, fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  unit: { fontSize: 14, color: COLORS.gray, marginLeft: 8 },
  saveButton: { backgroundColor: COLORS.primary, margin: 20, padding: 18, borderRadius: 15, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});
