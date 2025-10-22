import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  HelpCircle,
  Mail,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Headset,
} from 'lucide-react-native';
import { goBack } from '../../utils/navigation';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import SecondaryButton from '../../components/molecules/SecondaryButton';

const HelpFeedback = () => {
  const navigation = useNavigation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How do I get started?',
      answer: `Simply sign up for a Free Casual account. You’ll immediately have access to 3 room scans, 4 designs, and our Basic AI Decor Assistant. From your dashboard you can:
- Upload or scan your room
- Drag & drop furniture and decor
- Generate mood boards
- Save and share designs in the community gallery.
When you’re ready for more, upgrade to Hobbyist (or higher) to unlock additional features.`,
    },
    {
      question: 'Do I need to be a professional to use All Things Snug?',
      answer:
        'Not at all! All Things Snug is built for everyone, from first-time DIYers to seasoned pros. We make it easy for anyone to design, visualize, and execute home projects without specialized training.',
    },
    {
      question: 'Can I upgrade or downgrade my plan at any time?',
      answer:
        'Yes, upgrades take effect immediately and unlock new features right away. Downgrades apply at the start of your next billing period.',
    },
    {
      question: 'What add-ons are available, and how do they work?',
      answer:
        'You can top up your plan with Design Boosters, Scan Boosters, and Inspiration Boosters anytime — all instantly applied and billed once.',
    },
    {
      question:
        'What happens to unused scans and designs at the end of my billing period?',
      answer:
        'Standard rollover applies — unused scans or designs reset to your plan’s base allotment each new cycle.',
    },
    {
      question: 'How does cancellation and refund work?',
      answer:
        'Monthly plans: Cancel anytime — access continues through the end of your billing month. Annual plans: 14-day refund window from purchase.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit/debit cards and PayPal. All transactions are encrypted and secure.',
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-offWhite px-5 pt-[70px]"
      showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View className="flex-row items-center mb-6">
      <ChevronLeft
          className="text-[#2C2C2C]"
          size={24}
          onPress={() => goBack(navigation)}
        />
        <Text className="text-[20px] ml-5 font-semibold text-[#1A1A1A] font-cormorant">
        Help & Feedback
        </Text>
      </View>

      {/* FAQ SECTION */}
      <View className="border border-[#2C2C2C33] rounded-2xl p-4 mb-6 mt-4">
        <View className="flex-row items-center gap-2 mb-3">
          <HelpCircle size={18} color="#C4A663" />
          <Text className="text-xl font-semibold font-cormorant text-[#1A1A1A]">
            Frequently Asked Questions
          </Text>
        </View>

        {/* Search Bar */}
        <TextInput
          className="border border-[#2C2C2C33] bg-white rounded-lg py-2.5 px-3 text-[14px] text-[#333] mt-4 mb-8"
          placeholder="Search FAQs"
          placeholderTextColor="#2C2C2C80"
        />

        {/* FAQ List */}
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <View
              key={index}
              className="border border-[#C1A36A33] rounded-md mb-3 bg-transparent">
              <TouchableOpacity
                onPress={() => setOpenIndex(isOpen ? null : index)}
                className="flex-row justify-between items-center px-4 py-3">
                <Text className="text-[#1A1A1A] font-dm-sans font-medium w-[85%]">
                  {faq.question}
                </Text>
                {isOpen ? (
                  <ChevronUp size={18} color="#2C2C2C80" />
                ) : (
                  <ChevronDown size={18} color="#2C2C2C80" />
                )}
              </TouchableOpacity>
              {isOpen && (
                <View className="px-4 pb-4">
                  {faq.answer.split('\n').map((line, i) => (
                    <Text
                      key={i}
                      className="text-[#444] text-[13px] font-dm-sans mb-1 leading-5">
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
      <View className=" border border-[#2C2C2C33] rounded-2xl px-4 pt-4 pb-10 mb-5">
        <View className="flex-row items-center gap-2 mb-5">
          <Headset size={18} color="#C4A663" />
          <Text className="text-xl font-semibold font-cormorant text-[#1A1A1A]">
            Contact Support
          </Text>
        </View>
        <View className="flex-row gap-2 justify-between">
          <TouchableOpacity className="flex-1 border border-[#2C2C2C33] rounded-xl py-3 mr-2 flex-col items-center justify-center gap-2">
            <Mail size={16} color="#C4A663" />
            <Text className="text-[#2C2C2C] font-medium">Email</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 border border-[#2C2C2C33] rounded-xl py-3 ml-2 flex-col items-center justify-center gap-2">
            <MessageSquare size={16} color="#C4A663" />
            <Text className="text-[#2C2C2C] font-medium">Live Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SUPPORT HOURS */}
      <View className="bg-[#C1A36A0D]  rounded-2xl p-4 mb-5">
        <Text className="text-[#1A1A1A] font-semibold mb-2 font-cormorant text-xl">Support Hours</Text>
        <Text className="text-[#444] text-sm leading-5 font-dm-sans">
          Monday – Friday: 9 AM – 5 PM EST{'\n'}Saturday: 10 AM – 4 PM EST
        </Text>
      </View>

      {/* SEND FEEDBACK */}
      <View className="border border-[#2C2C2C33] rounded-2xl p-4 mb-5">
        <Text className="text-[#1A1A1A] font-semibold mb-5 text-xl font-cormorant">Send Feedback</Text>
        <Text className="text-[#444] text-sm mb-1 font-dm-sans">Your Feedback</Text>
        <TextInput
          multiline
          numberOfLines={5}
          className="border border-[#F1EADC] bg-white rounded-lg py-5 px-3 text-[14px] text-[#333] mb-6"
          placeholder="Tell us what you think or suggest improvements..."
          placeholderTextColor="#2C2C2C80"
        />
        <PrimaryButton title='Send Feedback' onPress={() => {}}/>
      </View>

      {/* APP INFORMATION */}
      <View className=" border border-[#2C2C2C33] rounded-2xl p-4 mb-10">
        <Text className="text-[#1A1A1A] font-semibold font-cormorant text-xl mb-3">
          App Information
        </Text>
        <Text className="text-[#444] text-sm mb-1 font-dm-sans">Version 1.1.0</Text>
        <Text className="text-[#444] text-sm mb-3 font-dm-sans">
          Last Updated: July 3, 2025
        </Text>
        <SecondaryButton title='Rate App' onPress={() => {}}/>
      </View>
    </ScrollView>
  );
};

export default HelpFeedback;
