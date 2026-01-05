import { StyleSheet,Text,View,FlatList,TouchableOpacity,ToastAndroid} from 'react-native'
import { useNavigation,useRouter} from 'expo-router';
import { useEffect,useState,useContext } from "react";
import { Colors } from '@/constants/Colors';
import { CreateTripContext } from '../../context/CreateTripContext';
import {selectBudgetOption} from './../../constants/data'
import { SelectBudgetOptions } from '@/constants/Options';
import OptionCard from '@/components/CreateTrip/OptionCard';
const SelectBudget = () => {
    const navigation = useNavigation();
    const router = useRouter();

    const [selectedOption, setSelectedOption] = useState();

    const { tripData, setTripData } = useContext(CreateTripContext);

    
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: '',
    });
  }, [navigation]);

  useEffect(() => {
    selectedOption&&setTripData({
        ...tripData,
        budget:selectedOption?.title
    })
  }, [selectedOption]);

 const onClickContinue=()=>{
    if(!selectedOption){
        ToastAndroid.show('Select Your Budget',ToastAndroid.LONG)
        return
    }
    router.push('/create-trip/review-trip')
 }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budget</Text>
      <View style={{marginTop:20}}>
            <Text style={{fontFamily:'poppins-semi',fontSize:20}}>Select Your Trip Spending Habit</Text>
            <FlatList
                data={selectBudgetOption}
                renderItem={({ item }) => (
                    <TouchableOpacity style={{marginVertical:10}}
                    onPress={()=>{setSelectedOption(item)}}
                    >
                        <OptionCard option={item} selectedOption={selectedOption}/>
                    </TouchableOpacity>
                )}
                keyExtractor={item => item.id.toString()}
            />
      </View>
      <TouchableOpacity style={styles.button} onPress={onClickContinue}>
            <Text style={{color:Colors.WHITE,textAlign:'center',fontFamily: 'poppins-medium',fontSize:20}}>Continue</Text>
      </TouchableOpacity>
      
    </View>
  )
}

export default SelectBudget

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        paddingTop: 85,
        padding: 25,
        height: '100%',
      },
    title: {
        fontFamily: 'poppins-semi',
        fontSize: 30,
        textAlign: 'center',
        marginTop: 10,
      },
    button: {
        backgroundColor:Colors.PRIMARY,
        padding: 15,
        borderRadius:15,
        marginTop:20,
        padding:15
    },
})