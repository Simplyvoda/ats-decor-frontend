import React from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {
  ArrowLeft,
  Crown,
  CreditCard,
  FileText,
  ChevronLeft,
} from 'lucide-react-native';
import {goBack} from '../../utils/navigation';
import {useNavigation} from '@react-navigation/native';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import SecondaryButton from '../../components/molecules/SecondaryButton';

const ShoppingScreen = () => {
  const navigation = useNavigation();
  return (
    <ScrollView
      className="flex-1 bg-[#FFFDF8] px-5 pt-[70px]"
      showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View className="flex-row items-center mb-6">
        <ChevronLeft
          className="text-[#2C2C2C]"
          size={24}
          onPress={() => goBack(navigation)}
        />
        <Text className="text-[20px] ml-5 font-semibold text-[#1A1A1A] font-cormorant">
          Shopping
        </Text>
      </View>

      {/* SUBSCRIPTION PLANS */}
      <View className="border border-[#E5DFCE] rounded-2xl p-4 mb-6">
        <View className="flex-row items-center gap-2 mb-3">
          <Crown size={18} color="#C4A663" />
          <Text className="text-lg font-semibold font-cormorant text-[#1A1A1A]">
            Subscription Plans
          </Text>
        </View>

        <View className="flex flex-col mt-6">
          {/* HOBBYIST PLAN */}
          <View className="border bg-[#C1A36A1A] border-[#C4A663] rounded-xl px-5 py-7 mb-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-semibold font-cormorant text-[#1A1A1A]">
                Hobbyist Plan
              </Text>
              <Text className="bg-brand text-white font-dm-sans text-xs px-3 py-1 rounded-full">
                Current Plan
              </Text>
            </View>

            <Text className="text-[#C4A663] mt-2 text-[18px] font-dm-sans font-bold mb-3">
              $10/m
            </Text>

            <View className="gap-3">
              {[
                '7 Scans per month',
                '10 Designs per month',
                '7 Notes',
                'Pro AI Decor assistant (rate-limited)',
                'Access 360° panoramas & walk-throughs',
                '10 Mood Boards',
                'Save up to 50 Community designs',
                'Full Community Gallery access',
                'Automated shopping list',
                'Priority support badge',
                'Export without watermarks',
              ].map((item, i) => (
                <Text key={i} className="text-[#444] font-dm-sans text-[13px]">
                  • {item}
                </Text>
              ))}
            </View>
          </View>

          {/* CASUAL PLAN */}
          <View className="border border-[#E5DFCE] rounded-xl px-5 py-7 ">
            <Text className="text-xl font-semibold font-cormorant text-[#1A1A1A] mb-1">
              Casual Plan
            </Text>
            <Text className="text-[#C4A663] text-[18px] font-bold mb-3 font-dm-sans">
              $0
            </Text>

            <View className="gap-3 mb-10">
              {[
                '3 Scans',
                'Basic AI assistance (Limited Use)',
                '4 Designs',
                '2 Notes',
                '3 Mood Boards',
                'Save up to 10 designs from the idea gallery',
                'Basic Community Gallery access (view only)',
                '1 full-design unlock (no watermark export)',
                'All exports carry a watermark',
              ].map((item, i) => (
                <Text key={i} className="text-[#444] font-dm-sans text-[13px]">
                  • {item}
                </Text>
              ))}
            </View>

            <PrimaryButton title="Upgrade to Casual" onPress={() => {}} />
          </View>
        </View>
      </View>

      {/* PAYMENT METHODS */}
      <View className="border border-[#E5DFCE] rounded-2xl p-4 mb-6">
        <View className="flex-row items-center gap-2 mb-3">
          <CreditCard size={18} color="#C4A663" />
          <Text className="text-xl font-semibold font-cormorant text-[#1A1A1A]">
            Payment Methods
          </Text>
        </View>

        <View className="mb-10 mt-5">
          {/* Card items */}
          {[
            {brand: 'Visa', digits: '4242', exp: '12/25', default: true},
            {brand: 'Mastercard', digits: '8888', exp: '12/25', default: false},
          ].map((card, i) => (
            <View
              key={i}
              className="border border-[#E5DFCE] rounded-lg px-4 py-3 mb-3 flex-row justify-between items-center">
              <View>
                <Text className="text-[#1A1A1A] font-medium font-dm-sans">
                  {card.brand} •••• {card.digits}
                </Text>
                <Text className="text-[#777] text-xs font-dm-sans">
                  Expires {card.exp}
                </Text>
              </View>
              {card.default && (
                <Text className="bg-[#C4A66333] text-[#C4A663] font-dm-sans text-xs px-3 py-1 rounded-full">
                  Default
                </Text>
              )}
            </View>
          ))}
        </View>

        <SecondaryButton title="Add a payment method" onPress={() => {}} />
      </View>

      {/* PURCHASE HISTORY */}
      <View className="border border-[#E5DFCE] rounded-2xl p-4 mb-8">
        <View className="flex-row items-center gap-2 mb-3">
          <FileText size={18} color="#C4A663" />
          <Text className="text-xl font-semibold font-cormorant text-[#1A1A1A]">
            Purchase History
          </Text>
        </View>

        <View className="my-5">
          {[1, 2, 3].map((_, i) => (
            <View
              key={i}
              className="border border-[#E5DFCE] rounded-lg px-4 py-3 mb-3 flex-row justify-between items-center">
              <View>
                <Text className="text-[#1A1A1A] font-medium font-dm-sans ">
                  Hobbyist Subscription
                </Text>
                <Text className="text-[#777] text-xs">2024-01-15</Text>
              </View>
              <View className="items-end">
                <Text className="text-[#1A1A1A] font-dm-sans font-semibold">
                  $19.99
                </Text>

                <Text className="text-[#1D590F] bg-[#34C51726] px-2 py-1 rounded-full font-dm-sans text-xs font-medium">
                  Paid
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default ShoppingScreen;
