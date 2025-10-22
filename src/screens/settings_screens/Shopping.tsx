import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { ArrowLeft, Crown, CreditCard, FileText } from "lucide-react-native";

const ShoppingScreen = () => {
  return (
    <ScrollView
      className="flex-1 bg-[#FFFDF8] px-5 pt-12"
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View className="flex-row items-center mb-6">
        <ArrowLeft size={22} color="#1A1A1A" />
        <Text className="text-lg font-semibold text-[#1A1A1A] ml-3">
          Shopping
        </Text>
      </View>

      {/* SUBSCRIPTION PLANS */}
      <View className="border border-[#E5DFCE] rounded-2xl p-4 mb-6">
        <View className="flex-row items-center gap-2 mb-3">
          <Crown size={18} color="#C4A663" />
          <Text className="text-lg font-semibold text-[#1A1A1A]">
            Subscription Plans
          </Text>
        </View>

        {/* CASUAL PLAN */}
        <View className="border border-[#E5DFCE] rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold text-[#1A1A1A] mb-1">
            Casual Plan
          </Text>
          <Text className="text-[#C4A663] text-[18px] font-bold mb-3">$0</Text>

          <View className="gap-1 mb-3">
            {[
              "3 Scans",
              "Basic AI assistance (Limited Use)",
              "4 Designs",
              "2 Notes",
              "3 Mood Boards",
              "Save up to 10 designs from the idea gallery",
              "Basic Community Gallery access (view only)",
              "1 full-design unlock (no watermark export)",
              "All exports carry a watermark",
            ].map((item, i) => (
              <Text key={i} className="text-[#444] text-[13px]">
                • {item}
              </Text>
            ))}
          </View>

          <TouchableOpacity className="bg-[#C4A663] py-2.5 rounded-lg mt-2">
            <Text className="text-white font-semibold text-center">
              Upgrade to Casual
            </Text>
          </TouchableOpacity>
        </View>

        {/* HOBBYIST PLAN */}
        <View className="border border-[#C4A663] rounded-xl p-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-[#1A1A1A]">
              Hobbyist Plan
            </Text>
            <Text className="bg-[#C4A66333] text-[#C4A663] text-xs px-3 py-1 rounded-full">
              Current Plan
            </Text>
          </View>

          <Text className="text-[#C4A663] text-[18px] font-bold mb-3">
            $10/m
          </Text>

          <View className="gap-1">
            {[
              "7 Scans per month",
              "10 Designs per month",
              "7 Notes",
              "Pro AI Decor assistant (rate-limited)",
              "Access 360° panoramas & walk-throughs",
              "10 Mood Boards",
              "Save up to 50 Community designs",
              "Full Community Gallery access",
              "Automated shopping list",
              "Priority support badge",
              "Export without watermarks",
            ].map((item, i) => (
              <Text key={i} className="text-[#444] text-[13px]">
                • {item}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* PAYMENT METHODS */}
      <View className="border border-[#E5DFCE] rounded-2xl p-4 mb-6">
        <View className="flex-row items-center gap-2 mb-3">
          <CreditCard size={18} color="#C4A663" />
          <Text className="text-lg font-semibold text-[#1A1A1A]">
            Payment Methods
          </Text>
        </View>

        {/* Card items */}
        {[
          { brand: "Visa", digits: "4242", exp: "12/25", default: true },
          { brand: "Mastercard", digits: "8888", exp: "12/25", default: false },
        ].map((card, i) => (
          <View
            key={i}
            className="border border-[#E5DFCE] rounded-lg px-4 py-3 mb-3 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-[#1A1A1A] font-medium">
                {card.brand} •••• {card.digits}
              </Text>
              <Text className="text-[#777] text-xs">Expires {card.exp}</Text>
            </View>
            {card.default && (
              <Text className="bg-[#C4A66333] text-[#C4A663] text-xs px-3 py-1 rounded-full">
                Default
              </Text>
            )}
          </View>
        ))}

        <TouchableOpacity className="border border-[#C4A663] rounded-lg py-2.5 mt-2">
          <Text className="text-[#C4A663] text-center font-medium">
            Add a payment method
          </Text>
        </TouchableOpacity>
      </View>

      {/* PURCHASE HISTORY */}
      <View className="border border-[#E5DFCE] rounded-2xl p-4 mb-8">
        <View className="flex-row items-center gap-2 mb-3">
          <FileText size={18} color="#C4A663" />
          <Text className="text-lg font-semibold text-[#1A1A1A]">
            Purchase History
          </Text>
        </View>

        {[1, 2, 3].map((_, i) => (
          <View
            key={i}
            className="border border-[#E5DFCE] rounded-lg px-4 py-3 mb-3 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-[#1A1A1A] font-medium">
                Hobbyist Subscription
              </Text>
              <Text className="text-[#777] text-xs">2024-01-15</Text>
            </View>
            <View className="items-end">
              <Text className="text-[#1A1A1A] font-semibold">$19.99</Text>
              <Text className="text-[#4CAF50] text-xs font-medium">Paid</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default ShoppingScreen;
