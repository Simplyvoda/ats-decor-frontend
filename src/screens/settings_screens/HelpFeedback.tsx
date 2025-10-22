import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";

const HelpFeedback = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I get started?",
      answer: `Simply sign up for a Free Casual account. You’ll immediately have access to 3 room scans, 4 designs, and our Basic AI Decor Assistant. From your dashboard you can:
- Upload or scan your room
- Drag & drop furniture and decor
- Generate mood boards
- Save and share designs in the community gallery.
When you’re ready for more, upgrade to Hobbyist (or higher) to unlock additional features.`,
    },
    {
      question: "Do I need to be a professional to use All Things Snug?",
      answer:
        "Not at all! All Things Snug is built for everyone, from first-time DIYers to seasoned pros. We make it easy for anyone to design, visualize, and execute home projects without specialized training.",
    },
    {
      question: "Can I upgrade or downgrade my plan at any time?",
      answer:
        "Yes, upgrades take effect immediately and unlock new features right away. Downgrades apply at the start of your next billing period.",
    },
    {
      question: "What add-ons are available, and how do they work?",
      answer:
        "You can top up your plan with Design Boosters, Scan Boosters, and Inspiration Boosters anytime — all instantly applied and billed once.",
    },
    {
      question: "What happens to unused scans and designs at the end of my billing period?",
      answer:
        "Standard rollover applies — unused scans or designs reset to your plan’s base allotment each new cycle.",
    },
    {
      question: "How does cancellation and refund work?",
      answer:
        "Monthly plans: Cancel anytime — access continues through the end of your billing month. Annual plans: 14-day refund window from purchase.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit/debit cards and PayPal. All transactions are encrypted and secure.",
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-[#FFFDF8] px-5 pt-12"
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View className="flex-row items-center mb-6">
        <ArrowLeft size={22} color="#1A1A1A" />
        <Text className="text-lg font-semibold text-[#1A1A1A] ml-3">
          Help & Feedback
        </Text>
      </View>

      {/* FAQ SECTION */}
      <View className="border border-[#E5DFCE] rounded-2xl p-4 mb-6">
        <View className="flex-row items-center gap-2 mb-3">
          <HelpCircle size={18} color="#C4A663" />
          <Text className="text-lg font-semibold text-[#1A1A1A]">
            Frequently Asked Questions
          </Text>
        </View>

        {/* Search Bar */}
        <TextInput
          className="border border-[#E5DFCE] bg-[#FFFDF8] rounded-lg py-2.5 px-3 text-[14px] text-[#333] mb-4"
          placeholder="Search FAQs"
          placeholderTextColor="#2C2C2C80"
        />

        {/* FAQ List */}
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <View
              key={index}
              className="border border-[#E5DFCE] rounded-xl mb-3 bg-white"
            >
              <TouchableOpacity
                onPress={() => setOpenIndex(isOpen ? null : index)}
                className="flex-row justify-between items-center px-4 py-3"
              >
                <Text className="text-[#1A1A1A] font-medium w-[85%]">
                  {faq.question}
                </Text>
                {isOpen ? (
                  <ChevronUp size={18} color="#C4A663" />
                ) : (
                  <ChevronDown size={18} color="#C4A663" />
                )}
              </TouchableOpacity>
              {isOpen && (
                <View className="px-4 pb-4">
                  {faq.answer.split("\n").map((line, i) => (
                    <Text
                      key={i}
                      className="text-[#444] text-[13px] mb-1 leading-5"
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* CONTACT SUPPORT */}
      <View className="bg-[#FFF] border border-[#E5DFCE] rounded-2xl p-4 mb-5">
        <Text className="text-[#1A1A1A] font-semibold mb-3">
          Contact Support
        </Text>
        <View className="flex-row justify-between">
          <TouchableOpacity className="flex-1 border border-[#C4A663] rounded-xl py-3 mr-2 flex-row items-center justify-center gap-2">
            <Mail size={16} color="#C4A663" />
            <Text className="text-[#C4A663] font-medium">Email</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 border border-[#C4A663] rounded-xl py-3 ml-2 flex-row items-center justify-center gap-2">
            <MessageSquare size={16} color="#C4A663" />
            <Text className="text-[#C4A663] font-medium">Live Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SUPPORT HOURS */}
      <View className="bg-[#FFF] border border-[#E5DFCE] rounded-2xl p-4 mb-5">
        <Text className="text-[#1A1A1A] font-semibold mb-2">Support Hours</Text>
        <Text className="text-[#444] text-sm leading-5">
          Monday – Friday: 9 AM – 5 PM EST{"\n"}Saturday: 10 AM – 4 PM EST
        </Text>
      </View>

      {/* SEND FEEDBACK */}
      <View className="bg-[#FFF] border border-[#E5DFCE] rounded-2xl p-4 mb-5">
        <Text className="text-[#1A1A1A] font-semibold mb-3">
          Send Feedback
        </Text>
        <Text className="text-[#444] text-sm mb-1">Your Feedback</Text>
        <TextInput
          multiline
          numberOfLines={3}
          className="border border-[#F1EADC] bg-[#FFFDF8] rounded-lg py-2.5 px-3 text-[14px] text-[#333] mb-3"
          placeholder="Tell us what you think or suggest improvements..."
          placeholderTextColor="#2C2C2C80"
        />
        <TouchableOpacity className="bg-[#C4A663] py-2.5 rounded-lg">
          <Text className="text-white font-semibold text-center">
            Send Feedback
          </Text>
        </TouchableOpacity>
      </View>

      {/* APP INFORMATION */}
      <View className="bg-[#FFF] border border-[#E5DFCE] rounded-2xl p-4 mb-10">
        <Text className="text-[#1A1A1A] font-semibold mb-3">
          App Information
        </Text>
        <Text className="text-[#444] text-sm mb-1">Version 1.1.0</Text>
        <Text className="text-[#444] text-sm mb-3">
          Last Updated: July 3, 2025
        </Text>
        <TouchableOpacity className="border border-[#C4A663] rounded-lg py-2.5">
          <View className="flex-row items-center justify-center gap-2">
            <Star size={16} color="#C4A663" />
            <Text className="text-[#C4A663] font-medium">Rate App</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HelpFeedback;
