import {Pressable, Text} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

const SecondaryButton = ({title, onPress}: ButtonProps) => (
  <Pressable
    onPress={onPress}
    className="w-full border-[1.5px] border-[#C1A36A] py-4 rounded-lg items-center active:opacity-80">
    <Text className="text-brand text-base font-semibold">{title}</Text>
  </Pressable>
);

export default SecondaryButton;
