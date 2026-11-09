import React from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import {Sofa, X} from 'lucide-react-native';
import {makeStyles, useTheme} from '../../theme/useTheme';

type Props = {
  visible: boolean;
  designName: string;
  lastActivity: string; // e.g. "Added a sofa"
  when: string; // e.g. "Yesterday · 4:30 PM"
  onContinue: () => void;
  onClose: () => void;
  // Runs once the popup has fully closed (iOS).
  onDismiss?: () => void;
};

// Shown to returning users when the app opens: their latest design and a
// button to jump straight back into it.
export default function WelcomeBackModal({
  visible,
  designName,
  lastActivity,
  when,
  onContinue,
  onClose,
  onDismiss,
}: Props) {
  const styles = useStyles();
  const {colors} = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onDismiss={onDismiss}
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.close}
            onPress={onClose}
            accessibilityLabel="Close"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>Welcome back! 👋</Text>
          <Text style={styles.subtitle}>Here’s where you left off:</Text>

          <Sofa size={30} color={colors.brand} style={styles.icon} />

          <Text style={styles.designName} numberOfLines={1}>
            {designName}
          </Text>
          <Text style={styles.detail}>Last activity: {lastActivity}</Text>
          <Text style={styles.detail}>{when}</Text>

          <TouchableOpacity style={styles.button} onPress={onContinue}>
            <Text style={styles.buttonText}>Continue designing</Text>
          </TouchableOpacity>
          <Text style={styles.caption}>Your space is waiting for you</Text>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles(c => ({
  backdrop: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
  },
  close: {position: 'absolute', top: 16, right: 20},
  title: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 30,
    fontWeight: '600',
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'DM Sans',
    fontSize: 17,
    color: c.textPrimary,
    textAlign: 'center',
  },
  icon: {marginTop: 28, marginBottom: 20},
  designName: {
    fontFamily: 'DM Sans',
    fontSize: 18,
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  detail: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 40,
    borderWidth: 1,
    borderColor: c.brand,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: c.textPrimary,
  },
  caption: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: c.textMuted,
    marginTop: 14,
  },
}));
