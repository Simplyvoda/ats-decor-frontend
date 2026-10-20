import {ActivityIndicator, Pressable, Text} from 'react-native';
import {useTheme} from '../../theme/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

const PrimaryButton = ({title, onPress, isSubmitting}: ButtonProps) => {
  const {colors} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className="w-full bg-[#C1A36A] py-4 rounded-lg items-center active:opacity-80">
      {isSubmitting ? (
        <ActivityIndicator size="small" color={colors.onBrand} />
      ) : (
        <Text className="text-white dark:text-night text-base font-semibold">
          {title}
        </Text>
      )}
    </Pressable>
  );
};

export default PrimaryButton;
