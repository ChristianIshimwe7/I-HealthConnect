import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { initDB } from './src/db/database';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch(e => setError(String(e)));
  }, []);

  if (error) return (
    <View style={styles.center}>
      <Text style={{ color: Colors.redText }}>DB Error: {error}</Text>
    </View>
  );

  if (!ready) return (
    <View style={styles.center}>
      <Text style={{ color: Colors.green, fontSize: 18 }}>I-HealthConnect</Text>
      <Text style={{ color: Colors.textMuted, marginTop: 8 }}>Initializing…</Text>
    </View>
  );

  return <AppNavigator />;
}

    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
});
