import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LABEL_COLORS, SpotWithDistance } from '../lib/types';

export default function SpotCard({ spot, onPress }: { spot: SpotWithDistance; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="link">
      <View style={[styles.dot, { backgroundColor: LABEL_COLORS[spot.label] }]} />
      <View style={styles.body}>
        <Text style={styles.name}>{spot.name}</Text>
        <Text style={styles.meta}>
          {spot.label} · {spot.distanceKm.toFixed(1)} km · best at {spot.bestTime}
        </Text>
      </View>
      <Text style={styles.score}>{Math.round(spot.score)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    backgroundColor: '#fff',
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, color: '#555', marginTop: 2 },
  score: { fontSize: 20, fontWeight: '700' },
});
