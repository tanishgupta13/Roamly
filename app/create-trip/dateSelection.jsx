import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { useEffect, useState, useContext } from 'react';
import moment from 'moment';
import { CreateTripContext } from '../../context/CreateTripContext';

export default function SelectDate() {
  const navigation = useNavigation();
  const router = useRouter();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const { tripData, setTripData } = useContext(CreateTripContext);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: '',
    });
  }, []);

  const onStartChange = (event, selectedDate) => {
    setShowStart(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const onEndChange = (event, selectedDate) => {
    setShowEnd(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const endDateLimit = new Date(startDate);
endDateLimit.setDate(startDate.getDate() + 5);

  const handleContinue = () => {
    const start = moment(startDate);
    const end = moment(endDate);
    setTripData({
      ...tripData,
      startDate: start,
      endDate: end,
      totalNumOfDays: end.diff(start, 'days') + 1
    });
    router.push('/create-trip/select-budget');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Travel Dates</Text>
      
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowStart(true)}>
        <Text style={styles.dateText}>Start Date: {moment(startDate).format('DD/MM/YYYY')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dateButton} onPress={() => setShowEnd(true)}>
        <Text style={styles.dateText}>End Date: {moment(endDate).format('DD/MM/YYYY')}</Text>
      </TouchableOpacity>

      {showStart && (
        <DateTimePicker
          value={startDate}
          mode="date"
          onChange={onStartChange}
          minimumDate={new Date()}
          
        />
      )}

      {showEnd && (
        <DateTimePicker
          value={endDate}
          mode="date"
          onChange={onEndChange}
          minimumDate={startDate}
          maximumDate={endDateLimit}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    padding: 20,
  },
  title: {
    fontFamily: 'poppins-semi',
    fontSize: 35,
    marginTop: 60,
    marginBottom: 30,
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  dateText: {
    fontFamily: 'poppins',
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    borderRadius: 15,
    marginTop: 30,
  },
  buttonText: {
    color: Colors.WHITE,
    textAlign: 'center',
    fontFamily: 'poppins-medium',
    fontSize: 18,
  }
});