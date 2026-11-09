import React, {useEffect, useState} from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {makeStyles, useTheme} from '../../theme/useTheme';

export type TourStep = {
  icon: LucideIcon;
  title: string;
  body: string;
};

type Props = {
  visible: boolean;
  steps: TourStep[];
  // Last step's button. Only this counts as finishing the tour.
  finishLabel?: string;
  onFinish: () => void;
  // "Skip for now" just closes the tour. It isn't saved as done, so the
  // tour shows again next time.
  onSkip: () => void;
};

// A short step-by-step card shown over the screen: an icon, a title, a
// sentence or two, and Back / Next buttons with dots showing progress.
export default function GuidedTour({
  visible,
  steps,
  finishLabel = 'Get started',
  onFinish,
  onSkip,
}: Props) {
  const styles = useStyles();
  const {colors} = useTheme();
  const [index, setIndex] = useState(0);

  // Start from the first step each time the tour opens.
  useEffect(() => {
    if (visible) {
      setIndex(0);
    }
  }, [visible]);

  if (steps.length === 0) {
    return null;
  }

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const Icon = step.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {!isLast && (
            <TouchableOpacity
              style={styles.skip}
              onPress={onSkip}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}

          <View style={styles.iconWrap}>
            <Icon size={32} color={colors.brand} />
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.buttons}>
            {!isFirst ? (
              <TouchableOpacity
                style={[styles.button, styles.secondary]}
                onPress={() => setIndex(i => i - 1)}>
                <Text style={styles.secondaryText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonSpacer} />
            )}
            <TouchableOpacity
              style={[styles.button, styles.primary]}
              onPress={() => (isLast ? onFinish() : setIndex(i => i + 1))}>
              <Text style={styles.primaryText}>
                {isLast ? finishLabel : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: 'center',
  },
  skip: {position: 'absolute', top: 16, right: 20},
  skipText: {fontFamily: 'DM Sans', fontSize: 14, color: c.textMuted},
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: c.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 26,
    fontWeight: '600',
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
    textAlign: 'center',
  },
  dots: {flexDirection: 'row', gap: 6, marginTop: 24, marginBottom: 24},
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: c.borderStrong},
  dotActive: {width: 18, backgroundColor: c.brand},
  buttons: {flexDirection: 'row', gap: 12, alignSelf: 'stretch'},
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonSpacer: {flex: 1},
  primary: {backgroundColor: c.brand},
  primaryText: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '600',
    color: c.onBrand,
  },
  secondary: {borderWidth: 1, borderColor: c.borderStrong},
  secondaryText: {fontFamily: 'DM Sans', fontSize: 16, color: c.text},
}));
