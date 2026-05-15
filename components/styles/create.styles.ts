import { StyleSheet } from 'react-native';

export const cstyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faf9',
    padding: 16,
  },

  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  label: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  row: {
    flexDirection: 'row',
    gap: 8,
  },

  difficultyBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },

  activeDifficulty: {
    backgroundColor: '#006156',
  },

  difficultyText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },

  activeText: {
    color: 'white',
  },

  createBtn: {
    marginTop: 20,
    backgroundColor: '#006156',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  createText: {
    color: 'white',
    fontWeight: '600',
  },
});