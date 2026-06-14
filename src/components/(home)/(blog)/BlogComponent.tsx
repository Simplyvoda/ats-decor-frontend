import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {BookOpen} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {navigateTo} from '../../../utils/navigation';
import BlogService from '../../../services/BlogService';
import {BlogPost} from '../../../../interface/blog.interface';

const BlogComponent = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data = await BlogService.getPosts();
      const res: BlogPost[] = Object.values(data);
      setPosts(res as BlogPost[]);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if(loading) {
    return (
      <Text>Loadingg</Text>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <BookOpen size={22} color="#C1A36A" />
        <Text style={styles.headingText}>Design Inspiration</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#C1A36A" style={styles.loader} />
      ) : (
        posts.map(post => (
          <TouchableOpacity
            key={post._id}
            style={styles.row}
            activeOpacity={0.75}
            onPress={() => navigateTo(navigation, 'BlogPost', {post})}>
            {post.mainImage?.asset?.url ? (
              <Image
                source={{uri: post.mainImage.asset.url}}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbnail} />
            )}
            <View style={styles.info}>
              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.meta}>
                {new Date(post.datePosted).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2C20',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  headingText: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 22,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  loader: {
    marginVertical: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  thumbnail: {
    width: 100,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#D8CBBA',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2C2C',
    lineHeight: 21,
  },
  meta: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#999',
  },
});

export default BlogComponent;
