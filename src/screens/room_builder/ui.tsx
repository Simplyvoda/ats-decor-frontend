// Small building blocks shared by the room builder steps.
import {ChevronDown, ChevronLeft, ChevronUp} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {makeStyles, useTheme} from '../../theme/useTheme';
import {round2} from './roomGeometry';

export const SERIF = 'Cormorant Garamond';
export const SANS = 'DM Sans';

// Back arrow + title, and the 4-part progress bar under it
export function StepHeader({
  title,
  step,
  totalSteps = 4,
  onBack,
}: {
  title: string;
  step: number;
  totalSteps?: number;
  onBack: () => void;
}) {
  const styles = useStyles();
  const {colors} = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} hitSlop={12} accessibilityLabel="Back">
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          {Array.from({length: totalSteps}, (_, i) => {
            const n = i + 1;
            // Finished steps are full; the current one is half full with a
            // dot at its end (full on the last step)
            const fill = n < step ? 1 : n === step ? (step === totalSteps ? 1 : 0.5) : 0;
            return (
              <View key={i} style={styles.progressSegment}>
                {fill > 0 && (
                  <View style={[styles.progressFill, {width: `${fill * 100}%`}]}>
                    {n === step && <View style={styles.progressDot} />}
                  </View>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.progressText}>
          {step}/{totalSteps}
        </Text>
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{disabled: !!disabled}}
      style={[styles.primaryButton, disabled && styles.disabled]}>
      {icon}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function OutlineButton({label, onPress}: {label: string; onPress: () => void}) {
  const styles = useStyles();
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" style={styles.outlineButton}>
      <Text style={styles.outlineButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

// Two-option switch (Doors / Windows, 2D / 3D)
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  variant = 'separate',
}: {
  options: {id: T; label: string}[];
  value: T;
  onChange: (v: T) => void;
  // 'separate' = two standalone buttons; 'joined' = one pill with a slider
  variant?: 'separate' | 'joined';
}) {
  const styles = useStyles();
  return (
    <View style={variant === 'joined' ? styles.segJoined : styles.segSeparate}>
      {options.map(o => {
        const active = o.id === value;
        return (
          <TouchableOpacity
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="tab"
            accessibilityState={{selected: active}}
            style={[
              variant === 'joined' ? styles.segJoinedItem : styles.segItem,
              active && styles.segItemActive,
            ]}>
            <Text style={[styles.segText, active && styles.segTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// A number you can type or nudge with the up/down arrows. Shown with
// `format`, edited as a plain number in metres.
export function NumberStepper({
  value,
  onChange,
  step,
  min,
  max,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  format: (v: number) => string;
}) {
  const styles = useStyles();
  const {colors} = useTheme();
  const [editing, setEditing] = useState<string | null>(null);

  const clamp = (v: number) => round2(Math.min(max, Math.max(min, v)));
  const nudge = (dir: 1 | -1) => onChange(clamp(value + dir * step));

  const commit = () => {
    if (editing !== null) {
      const parsed = parseFloat(editing.replace(',', '.'));
      if (Number.isFinite(parsed)) {
        onChange(clamp(parsed));
      }
      setEditing(null);
    }
  };

  return (
    <View style={styles.stepper}>
      <TextInput
        style={styles.stepperInput}
        value={editing ?? format(value)}
        onFocus={() => setEditing(String(value))}
        onChangeText={setEditing}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="decimal-pad"
        returnKeyType="done"
        selectTextOnFocus
      />
      <View style={styles.stepperDivider} />
      <View style={styles.stepperArrows}>
        <TouchableOpacity
          onPress={() => nudge(1)}
          disabled={value >= max}
          hitSlop={{top: 8, left: 8, right: 8}}
          accessibilityLabel="Increase">
          <ChevronUp size={18} color={value >= max ? colors.iconMuted : colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => nudge(-1)}
          disabled={value <= min}
          hitSlop={{bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Decrease">
          <ChevronDown size={18} color={value <= min ? colors.iconMuted : colors.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// A wall length typed in metres or centimetres. Always reports metres.
export function LengthInput({
  label,
  value,
  onChange,
  editable = true,
  error,
  hint,
}: {
  label: string;
  value: number;
  onChange: (metres: number) => void;
  editable?: boolean;
  error?: string | null;
  hint?: string;
}) {
  const styles = useStyles();
  const {colors} = useTheme();
  const [unit, setUnit] = useState<'m' | 'cm'>('m');
  const shown = (v: number) =>
    !Number.isFinite(v) ? '' : unit === 'm' ? v.toFixed(2) : String(Math.round(v * 100));
  const [text, setText] = useState(shown(value));
  const [focused, setFocused] = useState(false);

  // Follow changes made elsewhere (e.g. the opposite wall of a rectangle,
  // or switching units) while the person isn't typing here
  useEffect(() => {
    if (!focused) {
      setText(shown(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, unit, focused]);

  const onChangeText = (t: string) => {
    setText(t);
    const parsed = parseFloat(t.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      onChange(round2(unit === 'm' ? parsed : parsed / 100));
    } else {
      onChange(NaN);
    }
  };

  return (
    <View style={styles.lengthCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.lengthRow}>
        <View style={[styles.lengthInputWrap, !editable && styles.readOnly, !!error && styles.inputError]}>
          <TextInput
            style={styles.lengthInput}
            value={text}
            editable={editable}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="decimal-pad"
            returnKeyType="done"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={label}
          />
          <Text style={styles.lengthSuffix}>{unit}</Text>
        </View>
        {(['m', 'cm'] as const).map(u => (
          <TouchableOpacity
            key={u}
            onPress={() => setUnit(u)}
            style={[styles.unitChip, unit === u && styles.unitChipActive]}
            accessibilityLabel={u === 'm' ? 'Metres' : 'Centimetres'}
            accessibilityState={{selected: unit === u}}>
            <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.fieldHint, !!error && {color: colors.danger}]}>
        {error ?? hint ?? `Enter the wall length in ${unit === 'm' ? 'metres' : 'centimetres'}`}
      </Text>
    </View>
  );
}

export const useStyles = makeStyles(c => ({
  // Header
  header: {paddingHorizontal: 20, paddingTop: 12},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 24, height: 44},
  headerTitle: {fontFamily: SERIF, fontSize: 20, color: c.textPrimary, fontWeight: '600'},
  progressRow: {flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12},
  progressTrack: {flex: 1, flexDirection: 'row', gap: 3},
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: c.surfaceMuted,
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: c.brand,
    justifyContent: 'center',
  },
  progressDot: {
    position: 'absolute',
    right: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: c.brand,
  },
  progressText: {fontFamily: SANS, fontSize: 14, color: c.text},

  // Page text
  title: {fontFamily: SERIF, fontSize: 32, color: c.textPrimary, fontWeight: '600'},
  subtitle: {fontFamily: SANS, fontSize: 15, color: c.textSecondary, marginTop: 6, lineHeight: 21},

  // Buttons
  primaryButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {fontFamily: SANS, fontSize: 16, fontWeight: '700', color: c.onBrand, letterSpacing: 0.5},
  disabled: {opacity: 0.45},
  outlineButton: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {fontFamily: SANS, fontSize: 16, fontWeight: '600', color: c.textPrimary},

  // Segmented control
  segSeparate: {flexDirection: 'row', gap: 20},
  segItem: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segJoined: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: 276,
    padding: 4,
    borderRadius: 10,
    backgroundColor: c.surfaceMuted,
  },
  segJoinedItem: {flex: 1, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  segItemActive: {backgroundColor: c.brand},
  segText: {fontFamily: SANS, fontSize: 16, color: c.text},
  segTextActive: {color: c.onBrand, fontWeight: '700'},

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
    paddingLeft: 14,
  },
  stepperInput: {flex: 1, fontFamily: SANS, fontSize: 15, color: c.text, paddingVertical: 0},
  stepperDivider: {width: 1, height: 26, backgroundColor: c.border},
  stepperArrows: {width: 44, alignItems: 'center', justifyContent: 'center'},

  // Length input
  lengthCard: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  fieldLabel: {fontFamily: SANS, fontSize: 16, color: c.text},
  lengthRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  lengthInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 18,
    marginRight: 6,
  },
  readOnly: {backgroundColor: c.surfaceMuted},
  inputError: {borderColor: c.danger},
  lengthInput: {flex: 1, fontFamily: SANS, fontSize: 16, color: c.text, paddingVertical: 0},
  lengthSuffix: {fontFamily: SANS, fontSize: 16, color: c.textMuted},
  unitChip: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitChipActive: {backgroundColor: c.brand, borderColor: c.brand},
  unitText: {fontFamily: SANS, fontSize: 15, color: c.text},
  unitTextActive: {color: c.onBrand},
  fieldHint: {fontFamily: SANS, fontSize: 14, color: c.textMuted},
}));
