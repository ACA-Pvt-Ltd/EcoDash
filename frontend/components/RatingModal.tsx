import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '@/constants/config';

interface RatingModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (score: number, comment: string) => Promise<void>;
}

export default function RatingModal({ visible, title, onClose, onSubmit }: RatingModalProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(score, comment.trim());
      setScore(0);
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setScore(0);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.label}>Your Rating</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setScore(s)} activeOpacity={0.7}>
                <Text style={[styles.star, s <= score && styles.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Leave a comment (optional)"
            placeholderTextColor="#aaa"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={300}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={submitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, score === 0 && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={score === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  star: {
    fontSize: 36,
    color: '#ddd',
  },
  starActive: {
    color: '#F39C12',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
});
