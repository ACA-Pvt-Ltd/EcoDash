import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS } from '@/constants/config';

interface LocationPickerProps {
  onLocationSelect: (latitude: string, longitude: string, address: string) => void;
  initialLat?: string;
  initialLng?: string;
  initialAddress?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLat = '6.9271',
  initialLng = '79.8612',
  initialAddress = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: parseFloat(initialLat) || 6.9271,
    longitude: parseFloat(initialLng) || 79.8612,
  });
  const [address, setAddress] = useState(initialAddress);
  const mapRef = useRef<MapView>(null);

  // Request location permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
      }
    })();
  }, []);

  // Search for location by address
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a location or address');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        setCoordinates({ latitude, longitude });
        
        // Get address from coordinates
        const addressResults = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        const fullAddress = addressResults[0]
          ? `${addressResults[0].street}, ${addressResults[0].city}, ${addressResults[0].region}`
          : searchQuery;
        
        setAddress(fullAddress);

        // Animate map to the new location
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      } else {
        Alert.alert('Not Found', 'Could not find the location. Try a different address.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search location. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      
      setCoordinates({ latitude, longitude });

      // Get address from coordinates
      const addressResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const fullAddress = addressResults[0]
        ? `${addressResults[0].street}, ${addressResults[0].city}, ${addressResults[0].region}`
        : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      setAddress(fullAddress);
      setSearchQuery(fullAddress);

      // Animate map to current location
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location. Please check permissions.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle map press to select location
  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setCoordinates({ latitude, longitude });

    // Get address from coordinates
    try {
      const addressResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const fullAddress = addressResults[0]
        ? `${addressResults[0].street}, ${addressResults[0].city}, ${addressResults[0].region}`
        : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      setAddress(fullAddress);
      setSearchQuery(fullAddress);
    } catch (error) {
      console.error('Error getting address:', error);
      setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!address) {
      Alert.alert('Error', 'Please select a location');
      return;
    }
    onLocationSelect(
      coordinates.latitude.toFixed(6),
      coordinates.longitude.toFixed(6),
      address
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location or address..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={handleGetCurrentLocation}
        disabled={loading}
      >
        <Text style={styles.currentLocationText}>📍 Use Current Location</Text>
      </TouchableOpacity>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onPress={handleMapPress}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        <Marker
          coordinate={coordinates}
          title="Selected Location"
          description={address}
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            handleMapPress({ nativeEvent: { coordinate: { latitude, longitude } } });
          }}
        />
      </MapView>

      <View style={styles.infoContainer}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Selected Location:</Text>
          <Text style={styles.infoAddress}>{address || 'No location selected'}</Text>
          <Text style={styles.infoCoordinates}>
            📍 {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => onLocationSelect('', '', '')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={!address}
          >
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
  },
  searchButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary || '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  currentLocationButton: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#EBF8FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BEE3F8',
  },
  currentLocationText: {
    color: '#0284C7',
    fontWeight: '500',
    fontSize: 14,
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoAddress: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 6,
  },
  infoCoordinates: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary || '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default LocationPicker;
