import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@/components/ForgeIcon';
import { reloadAppAsync } from 'expo';
import { VISUAL_TOKENS } from '@/constants/experience';

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error('Failed to restart app:', restartError);
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  const monoFont = Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {__DEV__ ? (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          accessibilityLabel="View error details"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.topButton,
            {
              top: insets.top + 16,
              backgroundColor: colors.card,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="alert-circle" size={20} color={colors.foreground} />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Something went wrong
        </Text>

        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          Please reload the app to continue.
        </Text>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text
            style={[styles.buttonText, { color: colors.primaryForeground }]}
          >
            Try Again
          </Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Error Details
                </Text>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  accessibilityLabel="Close error details"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Feather name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={[
                  styles.modalScrollContent,
                  { paddingBottom: insets.bottom + 16 },
                ]}
                showsVerticalScrollIndicator
              >
                <View
                  style={[
                    styles.errorContainer,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Text
                    style={[
                      styles.errorText,
                      {
                        color: colors.foreground,
                        fontFamily: monoFont,
                      },
                    ]}
                    selectable
                  >
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: VISUAL_TOKENS.state.errorFallback.containerPadding,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: VISUAL_TOKENS.state.errorFallback.contentGap,
    width: '100%',
    maxWidth: VISUAL_TOKENS.state.errorFallback.contentMaxWidth,
  },
  title: {
    fontSize: VISUAL_TOKENS.state.errorFallback.title.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: VISUAL_TOKENS.state.errorFallback.title.lineHeight,
  },
  message: {
    fontSize: VISUAL_TOKENS.state.errorFallback.message.fontSize,
    textAlign: 'center',
    lineHeight: VISUAL_TOKENS.state.errorFallback.message.lineHeight,
  },
  topButton: {
    position: 'absolute',
    right: VISUAL_TOKENS.state.errorFallback.topButton.inset,
    width: VISUAL_TOKENS.state.errorFallback.topButton.size,
    height: VISUAL_TOKENS.state.errorFallback.topButton.size,
    borderRadius: VISUAL_TOKENS.state.errorFallback.topButton.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  button: {
    paddingVertical: VISUAL_TOKENS.state.errorFallback.button.paddingVertical,
    borderRadius: VISUAL_TOKENS.state.errorFallback.button.radius,
    paddingHorizontal: VISUAL_TOKENS.state.errorFallback.button.paddingHorizontal,
    minWidth: VISUAL_TOKENS.state.errorFallback.button.minWidth,
    shadowColor: '#000',
    shadowOffset: {
      width: VISUAL_TOKENS.state.errorFallback.button.shadow.offsetWidth,
      height: VISUAL_TOKENS.state.errorFallback.button.shadow.offsetHeight,
    },
    shadowOpacity: VISUAL_TOKENS.state.errorFallback.button.shadow.opacity,
    shadowRadius: VISUAL_TOKENS.state.errorFallback.button.shadow.radius,
    elevation: VISUAL_TOKENS.state.errorFallback.button.elevation,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: VISUAL_TOKENS.state.errorFallback.buttonTextSize,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: `rgba(0, 0, 0, ${VISUAL_TOKENS.state.errorFallback.modalOverlayOpacity})`,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    height: VISUAL_TOKENS.state.errorFallback.modal.height,
    borderTopLeftRadius: VISUAL_TOKENS.state.errorFallback.modal.radius,
    borderTopRightRadius: VISUAL_TOKENS.state.errorFallback.modal.radius,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
     paddingHorizontal: VISUAL_TOKENS.state.errorFallback.modalHeader.paddingHorizontal,
     paddingTop: VISUAL_TOKENS.state.errorFallback.modalHeader.paddingTop,
     paddingBottom: VISUAL_TOKENS.state.errorFallback.modalHeader.paddingBottom,
     borderBottomWidth: VISUAL_TOKENS.state.errorFallback.modalHeader.borderWidth,
  },
  modalTitle: {
    fontSize: VISUAL_TOKENS.state.errorFallback.modalTitleSize,
    fontWeight: '600',
  },
  closeButton: {
    width: VISUAL_TOKENS.state.errorFallback.closeButtonSize,
    height: VISUAL_TOKENS.state.errorFallback.closeButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: VISUAL_TOKENS.state.errorFallback.errorContainer.padding,
  },
  errorContainer: {
    width: '100%',
    borderRadius: VISUAL_TOKENS.state.errorFallback.errorContainer.radius,
    overflow: 'hidden',
    padding: VISUAL_TOKENS.state.errorFallback.errorContainer.padding,
  },
  errorText: {
    fontSize: VISUAL_TOKENS.state.errorFallback.errorText.fontSize,
    lineHeight: VISUAL_TOKENS.state.errorFallback.errorText.lineHeight,
    width: '100%',
  },
});
