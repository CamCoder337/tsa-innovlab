import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { getPlacePredictions, PlacePrediction } from '../services/googlePlacesService';

interface PlaceAutocompleteProps {
  placeholder: string;
  onPlaceSelected: (_prediction: PlacePrediction) => void;
  currentLocation?: { latitude: number; longitude: number };
  initialValue?: string;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  placeholder,
  onPlaceSelected,
  currentLocation,
  initialValue = '',
}) => {
  const [searchText, setSearchText] = useState(initialValue);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  useEffect(() => {
    const searchPlaces = async () => {
      if (searchText.length < 2) {
        setPredictions([]);
        return;
      }

      setLoading(true);
      const results = await getPlacePredictions(searchText, currentLocation);
      setPredictions(results);
      setLoading(false);
    };

    const timeoutId = setTimeout(searchPlaces, 300);
    return () => clearTimeout(timeoutId);
  }, [searchText, currentLocation]);

  const handleSelectPrediction = (prediction: PlacePrediction) => {
    setSearchText(prediction.description);
    setShowPredictions(false);
    setPredictions([]);
    onPlaceSelected(prediction);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            setShowPredictions(true);
          }}
          onFocus={() => setShowPredictions(true)}
          placeholderTextColor={Colors.text.secondary}
        />
        {loading && (
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
      </View>

      {showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          {predictions.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              style={styles.predictionItem}
              onPress={() => handleSelectPrediction(item)}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📍</Text>
              </View>
              <View style={styles.predictionText}>
                <Text style={styles.mainText}>{item.structured_formatting.main_text}</Text>
                <Text style={styles.secondaryText}>
                  {item.structured_formatting.secondary_text}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.text.primary,
    paddingRight: 40,
  },
  loadingIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  predictionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 300,
    zIndex: 1000,
  },
  predictionItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  predictionText: {
    flex: 1,
  },
  mainText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
});
