import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Layout from '../../../layout/HomeLayout';
import {Plus, ChevronLeft} from 'lucide-react-native';


const ViewMoodboards = () => {
  const [activeTab, setActiveTab] = useState('Studio');
  const tabs = [
    {id: 1, label: 'Studio', value: 'Studio'},
    {id: 2, label: 'Mood Board', value: 'MoodBoard'},
    {id: 3, label: 'Blog', value: 'Blog'},
  ];



  return (
    <Layout activeTab="Home" showHeader={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <Text style={styles.pageTitle}><ChevronLeft color={'white'}/> Mood Board</Text>
            <Text style={styles.pageSubtitle}>
              Your saved inspirations and ideas
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.startButton}>
                <Plus size={20} color="#fff" />
                <Text style={styles.startButtonText}>Start New Design</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{backgroundColor: '#FAF9F6', height: '100%'}}>
            {/* Navigation Tabs */}

            <View style={styles.tabsContainer}>
              {tabs.map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    activeTab === tab.value && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab(tab.value)}>
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


          </View>
        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#C1A36A',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '300',
    fontFamily: 'CormorantGaramond-SemiBold',
    color: '#fff',
    marginBottom: 8,
    display: 'flex',
    justifyContent: 'center',
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    color: '#fff',
    opacity: 0.9,
    marginBottom: 30,
  },
  buttonContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: '#C1A36A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    // backgroundColor: '#fff',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  tab: {
    marginRight: 30,
    paddingBottom: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#D4A574',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  activeTabText: {
    color: '#333',
    fontWeight: '500',
  },
  welcomeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderRadius: 16,
    borderColor: '#2C2C2C33',
    borderWidth: 1,
  },
  cardTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    fontFamily: 'DMSans-Regular',
    color: '#666',
    marginBottom: 20,
  },
  tipsContainer: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  recentSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderColor: '#2C2C2C33',
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  designItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  designImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  designInfo: {
    flex: 1,
  },
  designTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  designStyle: {
    fontSize: 14,
    color: '#999',
  },
  bookmarkIcon: {
    marginLeft: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  activeNavText: {
    color: '#D4A574',
  },
});

export default ViewMoodboards;
