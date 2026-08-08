import React, {useState} from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ChevronLeft, Heart, MessageCircle, ChevronDown, Share2} from 'lucide-react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {PortableText} from '@portabletext/react-native';
import {goBack} from '../../../utils/navigation';
import {BlogPost} from '../../../../interface/blog.interface';
import {portableTextComponents} from '../../../components/(home)/(blog)/BlogRenderer';

type BlogPostRouteParams = {
  BlogPost: {post: BlogPost};
};

interface Comment {
  id: string;
  author: string;
  timeAgo: string;
  text: string;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    author: 'Vodina E.',
    timeAgo: '1 day ago',
    text: 'These tips are amazing! Just tried the mirror trick in my tiny apartment.',
  },
  {
    id: '2',
    author: 'Ahmad Fola',
    timeAgo: '12hr ago',
    text: 'These tips are amazing! Just tried the mirror trick in my tiny apartment.',
  },
];

const BlogPostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<BlogPostRouteParams, 'BlogPost'>>();
  const {post} = route.params;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(32);
  const [comment, setComment] = useState('');

  const handleLike = () => {
    setLiked(prev => !prev);
    setLikeCount(prev => (liked ? prev - 1 : prev + 1));
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack(navigation)} hitSlop={8}>
          <ChevronLeft size={22} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{post.title}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero image */}
        {post.mainImage?.asset?.url ? (
          <Image
            source={{uri: post.mainImage.asset.url}}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.heroImage} />
        )}

        {/* Author + date */}
        <Text style={styles.postMeta}>
          {[
            post.author,
            new Date(post.datePosted).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          ]
            .filter(Boolean)
            .join('  ·  ')}
        </Text>

        {/* Body */}
        <View style={styles.body}>
          <PortableText
            value={post.body ?? []}
            components={portableTextComponents}
          />
        </View>

        <View style={styles.divider} />

        {/* Engagement row */}
        <View style={styles.engagementRow}>
          <TouchableOpacity style={styles.engagementItem} onPress={handleLike}>
            <Heart size={20} color="#2C2C2C" fill={liked ? '#2C2C2C' : 'transparent'} />
            <Text style={styles.engagementCount}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.engagementItem}>
            <MessageCircle size={20} color="#2C2C2C" />
            <Text style={styles.engagementCount}>2</Text>
            <ChevronDown size={16} color="#2C2C2C" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Share2 size={20} color="#2C2C2C" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Comments */}
        {MOCK_COMMENTS.map(c => (
          <View key={c.id} style={styles.comment}>
            <View style={styles.commentAvatar} />
            <View style={styles.commentBody}>
              <View style={styles.commentMeta}>
                <Text style={styles.commentAuthor}>{c.author}</Text>
                <Text style={styles.commentTime}>{c.timeAgo}</Text>
              </View>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          </View>
        ))}

        {/* Comment input */}
        <View style={styles.inputRow}>
          <View style={styles.commentAvatar} />
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.commentBtn} activeOpacity={0.85}>
          <Text style={styles.commentBtnText}>Comment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 17,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  heroImage: {
    marginHorizontal: 20,
    height: 220,
    borderRadius: 16,
    backgroundColor: '#D8CBBA',
    marginBottom: 20,
  },
  postMeta: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#999',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  body: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2C15',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 24,
    marginBottom: 20,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engagementCount: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#2C2C2C',
  },
  comment: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D8CBBA',
    flexShrink: 0,
  },
  commentBody: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  commentTime: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2C2C2C20',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#2C2C2C',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  commentBtn: {
    marginHorizontal: 20,
    backgroundColor: '#C1A36A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  commentBtnText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default BlogPostScreen;
