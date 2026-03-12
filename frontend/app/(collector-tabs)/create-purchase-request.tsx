import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS, COLORS } from '@/constants/config';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreatePurchaseRequestScreen() {
  const { token } = useAuth();
  const { offerId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  // Form state
  const [offeredPrice, setOfferedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [proposedPickupTime, setProposedPickupTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleCreateRequest = async () => {
    // Validation
    if (!offeredPrice || parseFloat(offeredPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid price offer');
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        offeredPrice: parseFloat(offeredPrice),
        message: message.trim(),
        proposedPickupTime: proposedPickupTime.toISOString(),
      };

      const response = await fetch(
        `${API_URL}${ENDPOINTS.COLLECTOR_CREATE_PURCHASE_REQUEST(offerId as string)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success',
          'Your purchase request has been sent to the user!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to create purchase request');
      }
    } catch (error: any) {
      console.error('Error creating request:', error);
      Alert.alert('Error', 'Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Purchase Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.infoText}>
            Send a purchase request to the user with your price offer and preferred pickup time.
          </Text>
        </View>

        {/* Offered Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Price Offer (LKR) <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={24} color="#2ECC71" />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 12 }]}
              placeholder="Enter your price offer"
              value={offeredPrice}
              onChangeText={setOfferedPrice}
              keyboardType="decimal-pad"
            />
          </View>
          <Text style={styles.helperText}>
            Tip: Offering at or above the expected price increases acceptance chances
          </Text>
        </View>

        {/* Proposed Pickup Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Proposed Pickup Time <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#2ECC71" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.dateLabel}>Selected Time:</Text>
              <Text style={styles.dateText}>
                {proposedPickupTime.toLocaleDateString()} at{' '}
                {proposedPickupTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={proposedPickupTime}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (event.type === 'set' && selectedDate) {
                  setProposedPickupTime(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Message to User */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message to User (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Introduce yourself and explain why you're the right collector for this waste..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.helperText}>
            A personalized message can help build trust with the user
          </Text>
        </View>

        {/* Example Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Messages:</Text>
          {[
            'Hello! I have proper recycling certifications and can ensure your waste is processed responsibly.',
            'I operate in your area regularly and can pick up at your convenience.',
            'I specialize in this type of waste and can offer you a good price.',
          ].map((quickMessage, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickMessageButton}
              onPress={() => setMessage(quickMessage)}
            >
              <Text style={styles.quickMessageText}>{quickMessage}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCreateRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Send Request</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  required: {
    color: '#E74C3C',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  input: {
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  dateLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  quickMessageButton: {
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498DB',
  },
  quickMessageText: {
    fontSize: 13,
    color: '#2C3E50',
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#2ECC71',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#95A5A6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});
