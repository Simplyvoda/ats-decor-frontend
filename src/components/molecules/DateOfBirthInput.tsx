import React, {useRef, useState} from 'react';
import {Text, TextInput, View} from 'react-native';
import {Calendar} from 'lucide-react-native';
import {useTheme} from '../../theme/useTheme';

type Props = {
  // YYYY-MM-DD once all three boxes are filled in, otherwise ''.
  onChange: (dateOfBirth: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
};

// Date of birth as three number boxes: DD / MM / YYYY. Jumps to the next
// box once one is full. Works without a native date-picker library.
export default function DateOfBirthInput({onChange, onBlur, hasError}: Props) {
  const {colors} = useTheme();
  const [date, setDate] = useState({day: '', month: '', year: ''});
  const {day, month, year} = date;
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  // Updates one box and tells the parent the full date (or '' while
  // any box is still incomplete).
  const update = (part: keyof typeof date, text: string) => {
    const next = {...date, [part]: text};
    setDate(next);
    const complete =
      next.day.length > 0 && next.month.length > 0 && next.year.length === 4;
    onChange(
      complete
        ? `${next.year}-${next.month.padStart(2, '0')}-${next.day.padStart(2, '0')}`
        : '',
    );
  };

  const digits = (text: string) => text.replace(/\D/g, '');

  const box = (
    value: string,
    placeholder: string,
    maxLength: number,
    onText: (text: string) => void,
    ref?: React.RefObject<TextInput | null>,
    accessibilityLabel?: string,
  ) => (
    <TextInput
      ref={ref}
      className={`text-center text-black dark:text-night-text ${maxLength === 4 ? 'w-14' : 'w-8'}`}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType="number-pad"
      maxLength={maxLength}
      onChangeText={text => onText(digits(text))}
      onBlur={onBlur}
      accessibilityLabel={accessibilityLabel}
    />
  );

  return (
    <View
      className={`flex flex-row items-center border ${hasError ? 'border-red-600' : 'border-[#ccc] dark:border-night-border'} bg-white dark:bg-night-surface mb-1.5 rounded-md px-2 py-3`}>
      <Calendar color={colors.textMuted} size={18} />
      <Text className="ml-2 mr-1 text-light-gray dark:text-night-text-muted">
        Date of birth
      </Text>
      <View className="flex-1 flex-row items-center justify-end">
        {box(
          day,
          'DD',
          2,
          text => {
            update('day', text);
            if (text.length === 2) {
              monthRef.current?.focus();
            }
          },
          undefined,
          'Day of birth',
        )}
        <Text className="text-light-gray dark:text-night-text-muted">/</Text>
        {box(
          month,
          'MM',
          2,
          text => {
            update('month', text);
            if (text.length === 2) {
              yearRef.current?.focus();
            }
          },
          monthRef,
          'Month of birth',
        )}
        <Text className="text-light-gray dark:text-night-text-muted">/</Text>
        {box(
          year,
          'YYYY',
          4,
          text => {
            update('year', text);
          },
          yearRef,
          'Year of birth',
        )}
      </View>
    </View>
  );
}
