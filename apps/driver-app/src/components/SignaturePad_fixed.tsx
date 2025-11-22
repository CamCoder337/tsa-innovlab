import React, { useRef, useState, useCallback, ReactElement } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface SignaturePadProps {
  onSave: (_signature: string) => void;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  webStyle?: string;
  fullScreen?: boolean;
  onClose?: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onClear = () => {},
  containerStyle,
  webStyle = '',
  fullScreen = false,
  onClose = () => {},
}): ReactElement => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signature, setSignature] = useState<string | null>(null);

  const handleSignature = useCallback(
    (signatureData: string) => {
      setSignature(signatureData);
      onSave(signatureData);
    },
    [onSave]
  );

  const handleClear = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('clearSignature(); true;');
      setSignature(null);
      onClear();
    }
  }, [onClear]);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'signatureEnd' && data.signature) {
          handleSignature(data.signature);
        }
      } catch (error) {
        console.error('Error parsing message from WebView:', error);
      }
    },
    [handleSignature]
  );

  const signaturePadHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js"></script>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          touch-action: none;
        }
        #signature-pad {
          width: 100%;
          height: 100%;
          touch-action: none;
        }
        canvas {
          display: block;
          width: 100% !important;
          height: 100% !important;
          background-color: white;
          touch-action: none;
        }
        * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        ${webStyle}
      </style>
    </head>
    <body>
      <div id="signature-pad">
        <canvas id="canvas"></canvas>
      </div>
      <script>
        const canvas = document.getElementById('canvas');
        const signaturePad = new SignaturePad(canvas, {
          backgroundColor: 'white',
          penColor: 'black',
          minWidth: 1,
          maxWidth: 3,
        });

        function resizeCanvas() {
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvas.width = canvas.offsetWidth * ratio;
          canvas.height = canvas.offsetHeight * ratio;
          canvas.getContext('2d').scale(ratio, ratio);
          signaturePad.clear();
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        function clearSignature() {
          signaturePad.clear();
        }

        function getSignature() {
          if (signaturePad.isEmpty()) {
            return '';
          }
          return signaturePad.toDataURL('image/png');
        }

        // Détecter le début de la signature
        canvas.addEventListener('touchstart', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'signatureStart' }));
        });

        // Détecter la fin de la signature
        canvas.addEventListener('touchend', () => {
          const signature = getSignature();
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'signatureEnd',
            signature: signature
          }));
        });

        // Pour la souris
        canvas.addEventListener('mousedown', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'signatureStart' }));
        });

        canvas.addEventListener('mouseup', () => {
          const signature = getSignature();
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'signatureEnd',
            signature: signature
          }));
        });
      </script>
    </body>
    </html>
  `;

  const renderSignaturePad = (): ReactElement => {
    return (
      <View
        style={[styles.container, fullScreen ? styles.fullScreenContainer : {}, containerStyle]}
      >
        {fullScreen && (
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Signature</Text>
            <View style={{ width: 24 }} />
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ html: signaturePadHTML }}
          style={[styles.webview, fullScreen ? styles.fullScreenWebview : {}]}
          onLoadEnd={() => setIsLoading(false)}
          onMessage={handleWebViewMessage}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {fullScreen && (
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
              <Text style={[styles.buttonText, styles.clearButtonText]}>Effacer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={onClose}>
              <Text style={[styles.buttonText, styles.saveButtonText]}>Valider</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (fullScreen) {
    return (
      <Modal visible={true} animationType="slide" statusBarTranslucent>
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />
          {renderSignaturePad()}
        </SafeAreaView>
      </Modal>
    );
  }

  return renderSignaturePad();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fullScreenWebview: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeButton: {
    padding: 8,
    zIndex: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    flex: 1,
    marginLeft: -40,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  clearButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: Colors.white,
  },
  clearButtonText: {
    color: Colors.text.primary,
  },
});

export default SignaturePad;
