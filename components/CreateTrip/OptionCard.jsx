import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { Colors } from '@/constants/Colors';

export default function OptionCard({ option, selectedOption }) {
  // Determine if the current option is selected
  const isSelected = selectedOption?.id === option?.id;

  return (
    <View style={[styles.container, { borderWidth: isSelected ? 3 : 0 }]}>
      <View>
        <Text style={styles.title}>{option?.title}</Text>
        <Text style={styles.desc}>{option?.desc}</Text>
      </View>
      {/* Ensure that the icon is wrapped in a <Text> component */}
      <Text style={styles.icon}>{option?.icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 25,
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 15,
  },
  title: {
    fontFamily: 'poppins-semi',
    fontSize: 20,
  },
  desc: {
    fontFamily: 'poppins',
    fontSize: 17,
    color: Colors.GRAY,
  },
  icon: {
    fontSize: 35,
  },
});
