import {Compass, Eye, Heart} from 'lucide-react-native';
import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import DesignService from '../../services/DesignService';
import MoodboardService from '../../services/MoodboardService';
import {IDesign} from '../../../interface/design.interface';
import {navigateTo} from '../../utils/navigation';
import SharedHeader from '../shared/Header';

export default function ExploreScreen() {
  const navigation = useNavigation();

  const [designs, setDesigns] = useState<IDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await DesignService.getExplore();
      setDesigns(res.data);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not load Explore',
        text2: err.response?.data?.message || err.message,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [fetchFeed]),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchFeed();
  };

  const toggleLike = async (design: IDesign) => {
    const liked = !!design.liked_by_me;
    // Optimistic update
    setDesigns(prev =>
      prev.map(d =>
        d.id === design.id
          ? {
              ...d,
              liked_by_me: !liked,
              likes_count: Math.max(0, d.likes_count + (liked ? -1 : 1)),
            }
          : d,
      ),
    );
    try {
      if (liked) {
        await MoodboardService.unlike(design.id);
      } else {
        await MoodboardService.like(design.id);
      }
    } catch {
      // Roll back on failure
      setDesigns(prev =>
        prev.map(d =>
          d.id === design.id
            ? {
                ...d,
                liked_by_me: liked,
                likes_count: Math.max(0, d.likes_count + (liked ? 1 : -1)),
              }
            : d,
        ),
      );
      Toast.show({type: 'error', text1: 'Could not update moodboard'});
    }
  };

  const openDesign = (design: IDesign) => {
    DesignService.addView(design.id).catch(() => {});
    setDesigns(prev =>
      prev.map(d =>
        d.id === design.id ? {...d, views_count: d.views_count + 1} : d,
      ),
    );
    navigateTo(navigation, 'ARViewer', {
      modelUrl: design.file_url,
      designId: design.id,
    });
  };

  const renderCard = ({item}: {item: IDesign}) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => openDesign(item)}
      className="bg-white rounded-[18px] mx-4 mt-5 overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      }}>
      {/* Thumbnail */}
      <View className="w-full aspect-[4/3] bg-[#D8CBBA]">
        {item.thumbnail_url ? (
          <Image
            source={{uri: item.thumbnail_url}}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Compass size={40} color="#B5A489" />
          </View>
        )}

        {/* Stat pills */}
        <View className="absolute top-3 right-3 flex-row gap-2">
          <TouchableOpacity
            onPress={() => toggleLike(item)}
            hitSlop={6}
            className="flex-row items-center bg-[#000000B3] rounded-full px-3 py-1.5">
            <Heart
              size={16}
              color={item.liked_by_me ? '#E05B5B' : 'white'}
              fill={item.liked_by_me ? '#E05B5B' : 'transparent'}
            />
            <Text className="text-white font-dm-sans text-[14px] ml-1.5">
              {item.likes_count}
            </Text>
          </TouchableOpacity>
          <View className="flex-row items-center bg-[#000000B3] rounded-full px-3 py-1.5">
            <Eye size={16} color="white" />
            <Text className="text-white font-dm-sans text-[14px] ml-1.5">
              {item.views_count}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="px-4 pt-3 pb-4">
        <Text className="font-cormorant text-[22px] text-gray-primary">
          {item.name}
        </Text>
        {item.style ? (
          <Text className="font-dm-sans text-brand text-[15px] mt-0.5">
            {item.style}
          </Text>
        ) : null}
        {item.tags && item.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-2">
            {item.tags.map(tag => (
              <View
                key={tag.id}
                className="bg-[#F0EEE9] rounded-full px-3 py-1">
                <Text className="font-dm-sans text-[13px] text-gray-primary capitalize">
                  {tag.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-offWhite">
      <FlatList
        data={designs}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        ListHeaderComponent={
          <SharedHeader
            title="Explore"
            subtitle="Browse styles, colors, and inspirations"
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#C1A36A" />
            </View>
          ) : (
            <View className="px-4 mt-6">
              <View className="bg-white border border-[#E5E0D5] rounded-[16px] items-center py-14 px-6">
                <Compass size={44} color="#8A8A8A" strokeWidth={1.4} />
                <Text className="font-cormorant text-[20px] text-gray-primary mt-4">
                  Nothing here yet
                </Text>
                <Text className="font-dm-sans text-[#7A7A7A] text-[14px] mt-2 text-center">
                  Publish your first design and it will show up here
                </Text>
              </View>
            </View>
          )
        }
        contentContainerStyle={{paddingBottom: 32}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#C1A36A"
          />
        }
      />
    </View>
  );
}
