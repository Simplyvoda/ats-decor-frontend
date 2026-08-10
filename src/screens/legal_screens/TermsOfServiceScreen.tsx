import React from 'react';
import {ScrollView, Text, View} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {goBack} from '../../utils/navigation';
import LegalDocRenderer from '../../components/molecules/LegalDocRenderer';
import {TERMS_OF_SERVICE_TEXT} from '../../data/legal/termsOfService';

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView
      className="flex-1 bg-offWhite px-5 pt-[70px]"
      contentContainerStyle={{paddingBottom: 40}}
      showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center mb-6">
        <ChevronLeft
          className="text-[#2C2C2C]"
          size={24}
          onPress={() => goBack(navigation)}
        />
        <Text className="text-[20px] ml-5 font-semibold text-[#1A1A1A] font-cormorant">
          Terms of Service
        </Text>
      </View>

      <LegalDocRenderer text={TERMS_OF_SERVICE_TEXT} />
    </ScrollView>
  );
}
