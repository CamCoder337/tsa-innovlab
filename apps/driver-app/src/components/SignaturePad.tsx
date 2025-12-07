import React, { useRef, useState, useCallback, ReactElement } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
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
  const [error, setError] = useState<string | null>(null);

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'ready') {
        setIsLoading(false);
      } else if (data.type === 'signature') {
        if (data.data) {
          setSignature(data.data);
          onSave(data.data);
        }
      } else if (data.type === 'error') {
        setError(data.message || 'Une erreur est survenue');
        setIsLoading(false);
      }
    } catch (_err) {
      setError('Erreur de communication avec la zone de signature');
      setIsLoading(false);
    }
  };

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  const renderErrorView = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingView = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Chargement de la zone de signature...</Text>
    </View>
  );

  const signaturePadHTML = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Signature Pad</title>
    <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js"></script>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      html, body {
        width: 100%;
        height: 100%;
        overflow: hidden;
        touch-action: none;
        background-color: white;
      }

      #signature-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
      }

      #signature-canvas {
        display: block;
        width: 100%;
        height: 100%;
        background-color: white;
        touch-action: none;
      }
    </style>
  </head>
  <body>
    <div id="signature-container">
      <canvas id="signature-canvas"></canvas>
    </div>
    <script>
      // Fonction pour envoyer un message à React Native
      function sendMessage(type, data) {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
        } catch (error) {
          console.error("Erreur d'envoi du message:", error);
        }
      }

      // Initialisation
      document.addEventListener('DOMContentLoaded', function() {
        const canvas = document.getElementById('signature-canvas');
        if (!canvas) {
          sendMessage('error', 'Canvas non trouvé');
          return;
        }

        try {
          // Configuration du canvas
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvas.width = canvas.offsetWidth * ratio;
          canvas.height = canvas.offsetHeight * ratio;
          const ctx = canvas.getContext('2d');
          ctx.scale(ratio, ratio);

          // Initialisation de SignaturePad
          const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'white',
            penColor: 'black',
            minWidth: 1,
            maxWidth: 3,
          });

          // Fonction pour effacer la signature
          window.clearSignature = function() {
            if (signaturePad) {
              signaturePad.clear();
              return true;
            }
            return false;
          };

          // Gestion des événements tactiles
          canvas.addEventListener('touchend', function() {
            if (signaturePad && !signaturePad.isEmpty()) {
              const signatureData = signaturePad.toDataURL('image/png');
              sendMessage('signature', signatureData);
            }
          });

          // Gestion des événements souris (pour le web)
          canvas.addEventListener('mouseup', function() {
            if (signaturePad && !signaturePad.isEmpty()) {
              const signatureData = signaturePad.toDataURL('image/png');
              sendMessage('signature', signatureData);
            }
          });

          // Signaler que le composant est prêt
          sendMessage('ready', null);
        } catch (error) {
          sendMessage('error', error.message);
        }
      });
    </script>
  </body>
  </html>`;

  // Rendu du contenu (avec ou sans header selon fullScreen)
  const content = (
    <View style={[styles.container, fullScreen ? styles.fullScreenContainer : {}, containerStyle]}>
      {fullScreen && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Signature</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={() => {
                webViewRef.current?.injectJavaScript('clearSignature(); true;');
                setSignature(null);
                onClear();
              }}
            >
              <Text style={[styles.buttonText, styles.clearButtonText]}>Effacer</Text>
            </TouchableOpacity>
            <View style={{ width: 10 }} />
            <TouchableOpacity
              style={[styles.button, styles.saveButton, !signature && styles.disabledButton]}
              onPress={() => {
                if (signature) {
                  console.log('Validation de la signature...');
                  onSave(signature);
                  // Fermer le modal parent via onClose
                  onClose();
                } else {
                  console.log('Aucune signature à valider');
                }
              }}
              disabled={!signature}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.webviewContainer}>
        {error ? (
          renderErrorView()
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: signaturePadHTML }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onMessage={handleWebViewMessage}
            onLoadStart={() => {
              setIsLoading(true);
              setError(null);
            }}
            onError={() => {
              setError('Impossible de charger la zone de signature');
              setIsLoading(false);
            }}
            renderLoading={renderLoadingView}
          />
        )}
      </View>
    </View>
  );

  // Wrapper avec SafeAreaView pour fullScreen
  if (fullScreen) {
    return <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>;
  }

  return content;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 0,
  },
  webviewContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
  webview: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.text.primary,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
  },
  errorText: {
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 16,
  },
  closeButton: {
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButtonText: {
    color: Colors.text.primary,
  },
  saveButtonText: {
    color: Colors.white,
  },
});

export default SignaturePad;
