import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import StudioComponent from '../../components/(home)/(studio)/StudioComponent';
import MoodBoardComponent from '../../components/(home)/(moodboard)/MoodBoardComponent';
import BlogComponent from '../../components/(home)/(blog)/BlogComponent';
import SharedHeader from '../../components/shared/Header';
import {Plus} from 'lucide-react-native';
import {navigateTo} from '../../utils/navigation';
import {useNavigation} from '@react-navigation/native';

type Tab = 'Studio' | 'MoodBoard' | 'Blog';

const TABS: {label: string; value: Tab}[] = [
  {label: 'Studio', value: 'Studio'},
  {label: 'Mood Board', value: 'MoodBoard'},
  {label: 'Blog', value: 'Blog'},
];

const TAB_CONTENT: Record<Tab, React.ReactElement> = {
  Studio: <StudioComponent />,
  MoodBoard: <MoodBoardComponent />,
  Blog: <BlogComponent />,
};

const HomeScreen = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Studio');
  const navigation = useNavigation();

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}>

      <SharedHeader
        subtitle="Design your dream home"
        action={{
          label: 'Start New Design',
          icon: <Plus size={16} color="#fff" />,
          onPress: () => navigateTo(navigation, 'Design'),
        }}
      />

      {/* Tab row */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.activeTab]}
            onPress={() => setActiveTab(tab.value)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab.value && styles.activeTabText,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={styles.tabContent}>{TAB_CONTENT[activeTab]}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  content: {
    paddingBottom: 24,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 5,
    // paddingVertical: 14,
    marginTop: 70,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    gap: 24,
    borderRadius: 12,
    width: '90%',
    alignSelf: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tab: {
    paddingBottom: 4,
    // width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#2C2C2C08',
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tabText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#999',
    paddingHorizontal: 15,
  },
  activeTabText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  // Content
  tabContent: {
    paddingTop: 4,
  },
});

export default HomeScreen;
