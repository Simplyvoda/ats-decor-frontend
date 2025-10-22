import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {Lightbulb} from 'lucide-react-native';

const StudioComponent = () => {
  // Tips data
  const designTips = [
    {
      id: 1,
      icon: Lightbulb,
      text: 'Use the 60-30-10 rule for colour schemes',
    },
    {
      id: 2,
      icon: Lightbulb,
      text: 'Layer different textures for visual interest',
    },
    {
      id: 3,
      icon: Lightbulb,
      text: 'Mix high and low-end pieces',
    },
  ];

  const recentDesigns = [
    {
      id: 1,
      title: 'Cozy Living Room',
      style: 'Minimalist',
      image: require('../../../assets/images/step1.png'),
    },
    {
      id: 2,
      title: 'Cozy Living Room',
      style: 'Minimalist',
      image: require('../../../assets/images/step1.png'),
      isBookmarked: true,
    },
    {
      id: 3,
      title: 'Cozy Living Room',
      style: 'Minimalist',
      image: require('../../../assets/images/step1.png'),
    },
  ];
  return (
    <>
      {/* Welcome Back Card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.cardTitle}>Welcome Back!</Text>
        <Text style={styles.cardSubtitle}>
          Ready to design your next cozy space?
        </Text>

        <View style={styles.tipsContainer}>
          {designTips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <View style={styles.tipItem} key={index}>
                <Icon size={16} color="#D4A574" style={styles.tipIcon} />
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Recent Designs */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Design</Text>

        {recentDesigns.map(design => (
          <TouchableOpacity key={design.id} style={styles.designItem}>
            <Image source={design.image} style={styles.designImage} />
            <View style={styles.designInfo}>
              <Text style={styles.designTitle}>{design.title}</Text>
              <Text style={styles.designStyle}>{design.style}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </>
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
  heroTitle: {
    fontSize: 32,
    fontWeight: '300',
    fontFamily: 'CormorantGaramond-SemiBold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
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

export default StudioComponent;
