import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, ENDPOINTS } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socketService';

interface ChatMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

export default function CollectorChatScreen() {
  const { userName, requestId } = useLocalSearchParams<{ userName: string; requestId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Room ID scoped to this specific request
  const roomId = `req_${requestId}`;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  // Load history + connect socket
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. Load persisted messages from REST
      try {
        const res: any = await api.get(ENDPOINTS.CHAT_HISTORY(roomId));
        if (mounted && res.success) {
          setMessages(res.data || []);
          scrollToEnd();
        }
      } catch {
        // history fetch failure is non-fatal
      }

      // 2. Connect socket
      try {
        const sock = await connectSocket();
        if (!mounted) return;

        sock.emit('join_room', { roomId });

        sock.on('new_message', (msg: ChatMessage) => {
          if (!mounted) return;
          setMessages(prev => {
            // Deduplicate by _id
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          scrollToEnd();
        });

        sock.on('message_error', ({ message }: { message: string }) => {
          setError(message);
        });

        setConnecting(false);
      } catch {
        if (mounted) {
          setError('Could not connect to chat server. Check your network.');
          setConnecting(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      const sock = getSocket();
      if (sock) {
        sock.emit('leave_room', { roomId });
        sock.off('new_message');
        sock.off('message_error');
      }
      disconnectSocket();
    };
  }, [roomId, scrollToEnd]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const sock = getSocket();
    if (!sock?.connected) {
      setError('Not connected. Please wait...');
      return;
    }

    sock.emit('send_message', { roomId, text });
    setInput('');
    setError(null);
  };

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?._id;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>{item.senderName[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(collector-tabs)/user-offers' as any)}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(userName || 'U')[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{userName || 'User'}</Text>
            <Text style={styles.headerStatus}>
              {connecting ? 'Connecting...' : 'Request · #' + (requestId?.slice(-6) || '')}
            </Text>
          </View>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {connecting ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.connectingText}>Connecting to chat...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={m => m._id}
            contentContainerStyle={styles.messageList}
            renderItem={renderMessage}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubbles-outline" size={48} color="#BDC3C7" />
                <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
              </View>
            }
          />
        )}

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={14} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#95A5A6"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            submitBehavior="newline"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={20} color={input.trim() ? '#fff' : '#BDC3C7'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 10,
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary + '25', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  headerName: { fontSize: 15, fontWeight: '700', color: '#2C3E50' },
  headerStatus: { fontSize: 11, color: '#95A5A6', marginTop: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  connectingText: { fontSize: 14, color: '#95A5A6' },
  messageList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 12, alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  msgRowMe: { alignItems: 'flex-end', flexDirection: 'row-reverse', gap: 0 },
  senderAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E8E8E8', justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  senderAvatarText: { fontSize: 12, fontWeight: '700', color: '#7F8C8D' },
  bubble: {
    maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#F0F0F0',
  },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleThem: { borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: '700', color: '#7F8C8D', marginBottom: 3 },
  bubbleText: { fontSize: 14, color: '#2C3E50', lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: '#95A5A6', marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  emptyChat: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyChatText: { fontSize: 14, color: '#95A5A6' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E74C3C', paddingHorizontal: 14, paddingVertical: 8,
  },
  errorText: { color: '#fff', fontSize: 12, flex: 1 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#fff',
  },
  input: {
    flex: 1, minHeight: 42, maxHeight: 100,
    backgroundColor: '#F5F6FA', borderRadius: 21,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#2C3E50',
    borderWidth: 1, borderColor: '#E8E8E8',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#F0F0F0' },
});
