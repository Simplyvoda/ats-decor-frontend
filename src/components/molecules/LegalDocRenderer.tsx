import React from 'react';
import {Text, View} from 'react-native';

// Splits a raw legal-doc text blob (blank-line separated) into blocks and
// renders each as a heading, a bullet list, or a paragraph. Headings are
// detected as short, single-line, all-caps blocks (matches the numbered
// "1. INTRODUCTION" style section titles used on the source pages).
const isHeading = (block: string) => {
  const trimmed = block.trim();
  return (
    !trimmed.includes('\n') &&
    trimmed.length < 100 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-Z]/.test(trimmed)
  );
};

const isList = (block: string) =>
  block
    .split('\n')
    .every(line => line.trim().startsWith('- '));

export default function LegalDocRenderer({text}: {text: string}) {
  const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);

  return (
    <>
      {blocks.map((block, i) => {
        if (isHeading(block)) {
          return (
            <Text
              key={i}
              className="text-[18px] font-semibold font-cormorant text-[#1A1A1A] mt-6 mb-2">
              {block}
            </Text>
          );
        }

        if (isList(block)) {
          const items = block.split('\n').map(l => l.replace(/^- /, '').trim());
          return (
            <View key={i} className="mb-3">
              {items.map((item, j) => (
                <View key={j} className="flex-row mb-1.5">
                  <Text className="text-[14px] font-dm-sans text-[#444] mr-2">•</Text>
                  <Text className="flex-1 text-[14px] font-dm-sans text-[#444] leading-5">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        return (
          <Text
            key={i}
            className="text-[14px] font-dm-sans text-[#444] leading-5 mb-3">
            {block.replace(/\n/g, ' ')}
          </Text>
        );
      })}
    </>
  );
}
