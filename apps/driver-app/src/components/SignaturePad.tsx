import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { Colors } from '../constants/colors';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear?: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onClear,
}) => {
  const signatureRef = useRef<any>(null);

  const handleSignature = (signature: string) => {
    onSave(signature);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    onClear?.();
  };

  const handleEnd = () => {
    signatureRef.current?.readSignature();
  };

  const style = `.m-signature-pad {
    box-shadow: none;
    border: none;
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
  }
  body,html {
    width: 100%;
    height: 100%;
  }`;

  return (
    <View style={styles.container}>
      <View style={styles.signatureContainer}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleSignature}
          onEnd={handleEnd}
          descriptionText="Signez ici"
          clearText="Effacer"
          confirmText="Confirmer"
          webStyle={style}
          backgroundColor={Colors.white}
          penColor={Colors.black}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Effacer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
  },
  signatureContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.gray[200],
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
