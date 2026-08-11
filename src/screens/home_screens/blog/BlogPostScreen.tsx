import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ChevronLeft, Globe, Heart, MessageCircle, Share2} from 'lucide-react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {PortableText} from '@portabletext/react-native';
import Toast from 'react-native-toast-message';
import {goBack} from '../../../utils/navigation';
import {BlogComment, BlogPost} from '../../../../interface/blog.interface';
import {portableTextComponents} from '../../../components/(home)/(blog)/BlogRenderer';
import InitialsAvatar from '../../../components/molecules/InitialsAvatar';
import BlogService from '../../../services/BlogService';

type BlogPostRouteParams = {
  BlogPost: {post: BlogPost};
};

const splitName = (name: string) => {
  const [first, ...rest] = name.trim().split(' ');
  return {firstName: first, lastName: rest.join(' ')};
};

const timeAgo = (isoDate: string) => {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Date(isoDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
};

const BlogPostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<BlogPostRouteParams, 'BlogPost'>>();
  const {post} = route.params;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsPage, setCommentsPage] = useState(1);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);

  const [comment, setComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    BlogService.getLikeStatus(post._id)
      .then(res => {
        setLiked(res.data.liked_by_me);
        setLikeCount(res.data.likes_count);
      })
      .catch(() => {});

    BlogService.getComments(post._id, {page: 1})
      .then(res => {
        setComments(res.data);
        setCommentsTotal(res.total);
        setCommentsPage(res.page);
      })
      .catch(() => {
        Toast.show({type: 'error', text1: 'Could not load comments'});
      })
      .finally(() => setLoadingComments(false));
  }, [post._id]);

  const handleLike = useCallback(async () => {
    if (isLiking) {
      return;
    }
    setIsLiking(true);
    const wasLiked = liked;
    // Optimistic update
    setLiked(!wasLiked);
    setLikeCount(c => (wasLiked ? c - 1 : c + 1));
    try {
      const res = wasLiked
        ? await BlogService.unlike(post._id)
        : await BlogService.like(post._id);
      setLiked(res.data.liked_by_me);
      setLikeCount(res.data.likes_count);
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount(c => (wasLiked ? c + 1 : c - 1));
      Toast.show({type: 'error', text1: 'Could not update like'});
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, liked, post._id]);

  const handleLoadMoreComments = async () => {
    if (loadingMoreComments || comments.length >= commentsTotal) {
      return;
    }
    setLoadingMoreComments(true);
    try {
      const res = await BlogService.getComments(post._id, {page: commentsPage + 1});
      setComments(prev => [...prev, ...res.data]);
      setCommentsPage(res.page);
    } catch {
      Toast.show({type: 'error', text1: 'Could not load more comments'});
    } finally {
      setLoadingMoreComments(false);
    }
  };

  const handlePostComment = async () => {
    const body = comment.trim();
    if (!body || isPosting) {
      return;
    }
    setIsPosting(true);
    try {
      const res = await BlogService.postComment(post._id, body);
      setComments(prev => [res.data, ...prev]);
      setCommentsTotal(t => t + 1);
      setComment('');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not post comment',
        text2: err.response?.data?.message || err.message,
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this blog post on Pladomus: ${post.title}`,
        title: post.title,
      });
    } catch {
      // User dismissed the share sheet — nothing to do
    }
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
          <TouchableOpacity style={styles.engagementItem} onPress={handleLike} disabled={isLiking}>
            <Heart size={20} color="#2C2C2C" fill={liked ? '#2C2C2C' : 'transparent'} />
            <Text style={styles.engagementCount}>{likeCount}</Text>
          </TouchableOpacity>

          <View style={styles.engagementItem}>
            <MessageCircle size={20} color="#2C2C2C" />
            <Text style={styles.engagementCount}>{commentsTotal}</Text>
          </View>

          <TouchableOpacity onPress={handleShare}>
            <Share2 size={20} color="#2C2C2C" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Author box */}
        {post.authorBox && (
          <View style={styles.authorBox}>
            {post.authorBox.image?.asset?.url ? (
              <Image source={{uri: post.authorBox.image.asset.url}} style={styles.authorBoxAvatar} />
            ) : (
              <InitialsAvatar {...splitName(post.authorBox.name)} size={56} />
            )}
            <View style={styles.authorBoxInfo}>
              <Text style={styles.authorBoxName}>{post.authorBox.name}</Text>
              {post.authorBox.title ? (
                <Text style={styles.authorBoxTitle}>{post.authorBox.title}</Text>
              ) : null}
              {post.authorBox.bio ? (
                <Text style={styles.authorBoxBio}>{post.authorBox.bio}</Text>
              ) : null}
              {post.authorBox.socialLinks && post.authorBox.socialLinks.length > 0 && (
                <View style={styles.socialLinksRow}>
                  {post.authorBox.socialLinks.map((link, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.socialLink}
                      onPress={() => Linking.openURL(link.url).catch(() => {})}>
                      <Globe size={14} color="#C1A36A" />
                      <Text style={styles.socialLinkText}>{link.platform}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {post.authorBox && <View style={styles.divider} />}

        {/* Comments */}
        {loadingComments ? (
          <ActivityIndicator color="#C1A36A" style={styles.commentsLoader} />
        ) : comments.length === 0 ? (
          <Text style={styles.noComments}>No comments yet — be the first to comment.</Text>
        ) : (
          <>
            {comments.map(c => (
              <View key={c.id} style={styles.comment}>
                {c.author.profilePicture ? (
                  <Image source={{uri: c.author.profilePicture}} style={styles.commentAvatarImg} />
                ) : (
                  <InitialsAvatar {...splitName(c.author.name)} size={40} />
                )}
                <View style={styles.commentBody}>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentAuthor}>{c.author.name}</Text>
                    <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentText}>{c.body}</Text>
                </View>
              </View>
            ))}

            {comments.length < commentsTotal && (
              <TouchableOpacity onPress={handleLoadMoreComments} disabled={loadingMoreComments}>
                {loadingMoreComments ? (
                  <ActivityIndicator color="#C1A36A" style={styles.commentsLoader} />
                ) : (
                  <Text style={styles.loadMoreText}>Load more comments</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Comment input */}
        <View style={styles.inputRow}>
          <InitialsAvatar size={40} />
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.commentBtn, (!comment.trim() || isPosting) && styles.commentBtnDisabled]}
          activeOpacity={0.85}
          onPress={handlePostComment}
          disabled={!comment.trim() || isPosting}>
          {isPosting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.commentBtnText}>Comment</Text>
          )}
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
  authorBox: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  authorBoxAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  authorBoxInfo: {
    flex: 1,
  },
  authorBoxName: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  authorBoxTitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#C1A36A',
    marginTop: 2,
  },
  authorBoxBio: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
    marginTop: 8,
  },
  socialLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  socialLinkText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: '#C1A36A',
    textTransform: 'capitalize',
  },
  commentsLoader: {
    marginVertical: 16,
  },
  noComments: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#999',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  loadMoreText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    fontWeight: '600',
    color: '#C1A36A',
    textAlign: 'center',
    marginBottom: 20,
  },
  comment: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  commentAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  commentBtnDisabled: {
    opacity: 0.5,
  },
  commentBtnText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default BlogPostScreen;
