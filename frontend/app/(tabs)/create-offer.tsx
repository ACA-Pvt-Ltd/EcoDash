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
import { API_URL, ENDPOINTS, WASTE_TYPES, COLORS } from '@/constants/config';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateOfferScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form state
  const [wasteType, setWasteType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [description, setDescription] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pickupPreference, setPickupPreference] = useState('anytime'); // Default to 'anytime'
  const [availableFrom, setAvailableFrom] = useState(new Date());
  const [availableUntil, setAvailableUntil] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  // Function to reset form
  const resetForm = () => {
    setWasteType('');
    setQuantity('');
    setUnit('kg');
    setDescription('');
    setExpectedPrice('');
    setAddress('');
    setCity('');
    setPickupPreference('anytime');
    setAvailableFrom(new Date());
    setAvailableUntil(null);
  };

  const handleCreateOffer = async () => {
    // Validation
    if (!wasteType) {
      Alert.alert('Error', 'Please select a waste type');
      return;
    }
    if (!quantity || quantity.trim() === '' || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity greater than 0');
      return;
    }
    if (!expectedPrice || expectedPrice.trim() === '' || isNaN(parseFloat(expectedPrice)) || parseFloat(expectedPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid price greater than 0');
      return;
    }
    if (!address || address.trim() === '') {
      Alert.alert('Error', 'Please enter your address');
      return;
    }
    if (!city || city.trim() === '') {
      Alert.alert('Error', 'Please enter your city');
      return;
    }

    setLoading(true);

    try {
      const quantityValue = parseFloat(quantity);
      const priceValue = parseFloat(expectedPrice);

      const offerData = {
        wasteType,
        quantity: {
          value: quantityValue,
          unit,
        },
        description: description.trim(),
        expectedPrice: priceValue,
        location: {
          address: address.trim(),
          city: city.trim(),
        },
        pickupPreference: pickupPreference || 'anytime', // Always send a valid value
        availableFrom: availableFrom.toISOString(),
        ...(availableUntil && { availableUntil: availableUntil.toISOString() }),
      };

      console.log('Sending offer data:', JSON.stringify(offerData, null, 2));

      const response = await fetch(`${API_URL}${ENDPOINTS.USER_CREATE_OFFER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(offerData),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form fields
        resetForm();
        
        Alert.alert(
          'Success',
          'Your waste offer has been created successfully!',
          [
            {
              text: 'View Offers',
              onPress: () => router.back(),
            },
            {
              text: 'Create Another',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to create offer');
      }
    } catch (error: any) {
      console.error('Error creating offer:', error);
      Alert.alert('Error', 'Failed to create offer. Please try again.');
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
        <Text style={styles.headerTitle}>Create Waste Offer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Waste Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Waste Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.wasteTypeGrid}>
            {WASTE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.wasteTypeCard,
                  wasteType === type.value && {
                    backgroundColor: type.color + '20',
                    borderColor: type.color,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setWasteType(type.value)}
              >
                <Text style={styles.wasteTypeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.wasteTypeLabel,
                    wasteType === type.value && { color: type.color, fontWeight: 'bold' },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Quantity <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.quantityRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
                onPress={() => setUnit('kg')}
              >
                <Text style={[styles.unitText, unit === 'kg' && styles.unitTextActive]}>kg</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitButton, unit === 'pieces' && styles.unitButtonActive]}
                onPress={() => setUnit('pieces')}
              >
                <Text style={[styles.unitText, unit === 'pieces' && styles.unitTextActive]}>
                  pieces
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Expected Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Expected Price (LKR) <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color="#7F8C8D" />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              placeholder="Enter your asking price"
              value={expectedPrice}
              onChangeText={setExpectedPrice}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the condition and details of your waste..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Location <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons name="home-outline" size={20} color="#7F8C8D" />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              placeholder="House/Street address"
              value={address}
              onChangeText={setAddress}
            />
          </View>
          <View style={[styles.inputContainer, { marginTop: 12 }]}>
            <Ionicons name="location-outline" size={20} color="#7F8C8D" />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              placeholder="City"
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          
          <Text style={styles.label}>Available From</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowFromPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#2ECC71" />
            <Text style={styles.dateText}>
              {availableFrom.toLocaleDateString()} {availableFrom.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>

          {showFromPicker && (
            <DateTimePicker
              value={availableFrom}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowFromPicker(false);
                if (event.type === 'set' && selectedDate) {
                  setAvailableFrom(selectedDate);
                }
              }}
            />
          )}

          <Text style={[styles.label, { marginTop: 16 }]}>Available Until (Optional)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowUntilPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#2ECC71" />
            <Text style={styles.dateText}>
              {availableUntil
                ? `${availableUntil.toLocaleDateString()} ${availableUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'No end date'}
            </Text>
          </TouchableOpacity>

          {showUntilPicker && (
            <DateTimePicker
              value={availableUntil || new Date()}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowUntilPicker(false);
                if (event.type === 'set' && selectedDate) {
                  setAvailableUntil(selectedDate);
                }
              }}
            />
          )}

          {availableUntil && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setAvailableUntil(null)}
            >
              <Text style={styles.clearButtonText}>Clear End Date</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pickup Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Time Preference (Optional)</Text>
          <View style={styles.pickupGrid}>
            {[
              { value: 'anytime', label: 'Any Time', icon: '🕐' },
              { value: 'morning', label: 'Morning', icon: '🌅' },
              { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
              { value: 'evening', label: 'Evening', icon: '🌆' },
              { value: 'weekend', label: 'Weekend', icon: '📅' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickupCard,
                  pickupPreference === option.value && styles.pickupCardActive,
                ]}
                onPress={() => setPickupPreference(option.value)}
              >
                <Text style={styles.pickupIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.pickupLabel,
                    pickupPreference === option.value && styles.pickupLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateOffer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Offer</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  required: {
    color: '#E74C3C',
  },
  wasteTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wasteTypeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  wasteTypeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  wasteTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  unitButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F6FA',
  },
  unitButtonActive: {
    backgroundColor: '#2ECC71',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  unitTextActive: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#2C3E50',
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F6FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dateText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: 13,
    color: '#E74C3C',
    fontWeight: '600',
  },
  pickupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pickupCard: {
    width: '30%',
    aspectRatio: 1.2,
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  pickupCardActive: {
    backgroundColor: '#2ECC71' + '20',
    borderColor: '#2ECC71',
    borderWidth: 2,
  },
  pickupIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  pickupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  pickupLabelActive: {
    color: '#2ECC71',
    fontWeight: 'bold',
  },
  createButton: {
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
  createButtonDisabled: {
    backgroundColor: '#95A5A6',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});
