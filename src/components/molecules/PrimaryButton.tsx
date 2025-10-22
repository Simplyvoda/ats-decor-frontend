import {Pressable, Text} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

const PrimaryButton = ({title, onPress}: ButtonProps) => (
  <Pressable
    onPress={onPress}
    className="w-full bg-[#C1A36A] py-4 rounded-lg items-center active:opacity-80">
    <Text className="text-white text-base font-semibold">{title}</Text>
  </Pressable>
);

export default PrimaryButton;
