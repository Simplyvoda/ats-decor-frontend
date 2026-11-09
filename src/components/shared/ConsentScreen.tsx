import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {LucideIcon} from 'lucide-react-native';
import {Check} from 'lucide-react-native';
import {makeStyles, useTheme} from '../../theme/useTheme';

type Props = {
  icon: LucideIcon;
  title: string;
  intro: string;
  points: string[];
  // Small link under the points (e.g. to the privacy policy).
  footnote?: string;
  onFootnotePress?: () => void;
  acceptLabel: string;
  onAccept: () => void;
  declineLabel?: string;
  onDecline: () => void;
  busy?: boolean;
};

// A full-screen "here's what happens, do you agree?" page: icon, title,
// a short intro, a ticked list of points, and accept / decline buttons.
// Used for the room-data and camera consent before scanning.
export default function ConsentScreen({
  icon: Icon,
  title,
  intro,
  points,
  footnote,
  onFootnotePress,
  acceptLabel,
  onAccept,
  declineLabel = 'Not now',
  onDecline,
  busy = false,
}: Props) {
  const styles = useStyles();
  const {colors} = useTheme();

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <Icon size={36} color={colors.brand} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.intro}>{intro}</Text>

        {points.map(point => (
          <View key={point} style={styles.point}>
            <View style={styles.tick}>
              <Check size={14} color={colors.brand} />
            </View>
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}

        {footnote && (
          <Text
            style={[styles.footnote, onFootnotePress && styles.footnoteLink]}
            onPress={onFootnotePress}
            accessibilityRole={onFootnotePress ? 'link' : undefined}>
            {footnote}
          </Text>
        )}
      </ScrollView>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.accept, busy && styles.disabled]}
          onPress={onAccept}
          disabled={busy}
          accessibilityRole="button">
          {busy ? (
            <ActivityIndicator color={colors.onBrand} />
          ) : (
            <Text style={styles.acceptText}>{acceptLabel}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.decline}
          onPress={onDecline}
          disabled={busy}
          accessibilityRole="button">
          <Text style={styles.declineText}>{declineLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(c => ({
  root: {flex: 1, backgroundColor: c.background},
  content: {paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24},
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 30,
    fontWeight: '600',
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  intro: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    lineHeight: 23,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  point: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16},
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: c.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  pointText: {
    flex: 1,
    fontFamily: 'DM Sans',
    fontSize: 15,
    lineHeight: 22,
    color: c.text,
  },
  footnote: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    lineHeight: 19,
    color: c.textMuted,
    marginTop: 8,
  },
  footnoteLink: {color: c.brand, textDecorationLine: 'underline'},
  buttons: {paddingHorizontal: 24, paddingBottom: 16, gap: 8},
  accept: {
    backgroundColor: c.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabled: {opacity: 0.6},
  acceptText: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '600',
    color: c.onBrand,
  },
  decline: {paddingVertical: 12, alignItems: 'center'},
  declineText: {fontFamily: 'DM Sans', fontSize: 15, color: c.textMuted},
}));
