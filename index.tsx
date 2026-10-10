import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import SpotCard from '../components/SpotCard';
import SpotMap from '../components/SpotMap';
import { getRatings } from '../lib/apiClient';
import { distanceKm, useUserLocation } from '../lib/geo';
import { Rating, SpotWithDistance } from '../lib/types';

type SortMode = 'score' | 'distance';
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function MapAndListPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { location } = useUserLocation();

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [sort, setSort] = useState<SortMode>('score');

  const load = useCallback(() => {
    setStatus('loading');
    getRatings(todayISO())
      .then((data) => {
        setRatings(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(load, [load]);

  const spots: SpotWithDistance[] = useMemo(() => {
    const withDistance = ratings.map((r) => ({ ...r, distanceKm: distanceKm(location, r) }));
    return withDistance.sort((a, b) =>
      sort === 'score' ? b.score - a.score : a.distanceKm - b.distanceKm
    );
  }, [ratings, location, sort]);

  const openSpot = (id: string) => router.push({ pathname: '/spots/[id]', params: { id } });

  return (
    <View style={[styles.page, { flexDirection: isWide ? 'row' : 'column' }]}>
      <View style={[styles.mapPane, isWide ? { flex: 2 } : { height: 320 }]}>
        <SpotMap spots={spots} center={location} onSelect={openSpot} />
      </View>

      <View style={[styles.listPane, isWide && { maxWidth: 440 }]}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Sort by</Text>
          {(['score', 'distance'] as SortMode[]).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setSort(mode)}
              style={[styles.toggle, sort === mode && styles.toggleActive]}
            >
              <Text style={sort === mode && styles.toggleActiveText}>{mode}</Text>
            </Pressable>
          ))}
        </View>

        {status === 'loading' && <ActivityIndicator style={styles.center} size="large" />}

        {status === 'error' && (
          <View style={styles.center}>
            <Text>Couldn't load spots. Check your connection and try again.</Text>
            <Pressable onPress={load} style={styles.retry}>
              <Text>Retry</Text>
            </Pressable>
          </View>
        )}

        {status === 'ready' && spots.length === 0 && (
          <Text style={styles.center}>No spots found for tonight.</Text>
        )}

        {status === 'ready' && spots.length > 0 && (
          <FlatList
            data={spots}
            keyExtractor={(s) => s.spotId}
            renderItem={({ item }) => <SpotCard spot={item} onPress={() => openSpot(item.spotId)} />}
            contentContainerStyle={{ padding: 12 }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  mapPane: { position: 'relative', backgroundColor: '#e8e8e8' },
  listPane: { flex: 1, backgroundColor: '#f6f6f6' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  toggleLabel: { fontWeight: '600' },
  toggle: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#bbb' },
  toggleActive: { backgroundColor: '#14213d', borderColor: '#14213d' },
  toggleActiveText: { color: '#fff' },
  center: { padding: 24, textAlign: 'center', alignItems: 'center' },
  retry: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#999', borderRadius: 6 },
});
