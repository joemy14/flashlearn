import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faf9',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#006156',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  heroSubtext: {
    color: '#6b7280',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006156',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
  },
  performanceTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 16,
    color: '#1f2937',
  },
  subjectItem: {
    marginBottom: 16,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  subjectFill: {
    height: '100%',
    backgroundColor: '#006156',
  },
});
