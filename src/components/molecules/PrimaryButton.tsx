import {ActivityIndicator, Pressable, Text} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

const PrimaryButton = ({title, onPress, isSubmitting}: ButtonProps) => (
  <Pressable
    onPress={onPress}
    className="w-full bg-[#C1A36A] py-4 rounded-lg items-center active:opacity-80">
    {isSubmitting ? (
      <ActivityIndicator size="small" color="#fff" />
    ) : (
      <Text className="text-white text-base font-semibold">{title}</Text>
    )}
  </Pressable>
);

export default PrimaryButton;
