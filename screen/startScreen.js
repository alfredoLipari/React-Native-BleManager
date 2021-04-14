/* eslint-disable prettier/prettier */
/* eslint-disable react-native/no-inline-styles */

import React from 'react';

import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Image,
  FlatList,
  Modal,
} from 'react-native';
import {Button} from 'react-native-paper';

const startScreen = ({
  renderList,
  device,
  isConnected,
  startScan,
  isScanning,
  renderItem,
  list,
  removePeripheral,
}) => {
  return (
    <SafeAreaView style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Control BLE car</Text>
      <Text style={styles.sectionDescription}>
        Start by connecting to a peripheral!
      </Text>
      <View style={styles.line} />
      <View>
        {device ? (
          <View style={{alignSelf: 'center', marginBottom: 20}}>
            <Text style={{color: 'white', marginTop: 20}}>
              Memorized Device:
              <Text style={{fontWeight: 'bold'}}> {device.name}</Text>
            </Text>
          </View>
        ) : (
          <View style={{alignSelf: 'center'}}>
            <Text
              style={{color: 'white', marginVertical: 20}}
              accessibilityLabel="lol">
              No memorized peripherals!
            </Text>
          </View>
        )}
        <Button
          style={styles.tinyButton}
          color="white"
          onPress={() => removePeripheral()}>
          REMOVE PERIPHERAL
        </Button>
      </View>
      <View style={styles.line} />
      <View style={{margin: 10}}>
        <Button
          title={device ? 'Disconnect' : 'Connect'}
          onPress={() => startScan()}
          mode="outlined"
          color="white"
          contentStyle={styles.button}
          loading={isScanning ? true : false}>
          {isConnected ? 'DISCONNECT' : 'CONNECT'}
        </Button>
      </View>
      {/* <View style={styles.imageContainer}>
        <Image
          resizeMode="cover"
          source={require('../assets/images/car.png')}
          style={{width: 300, height: 300}}
        />
      </View> */}

      {isScanning || !isConnected ? (
        <FlatList
          data={list}
          renderItem={({item}) => renderItem(item)}
          keyExtractor={item => item.id}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    alignSelf: 'center',
    color: 'white',
    marginTop: 20,
  },
  sectionDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: 'white',
    marginBottom: 20,
    alignSelf: 'center',
  },
  highlight: {
    fontWeight: '700',
  },
  button: {
    overflow: 'hidden',
    borderRadius: 20,
    borderColor: 'white',
    borderWidth: 2,
  },
  tinyButton: {
    overflow: 'hidden',
    borderRadius: 20,
    borderColor: 'white',
    borderWidth: 2,
    width: 250,
    alignSelf: 'center',
    marginBottom: 30,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 22,
  },

  modalText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: 'white',
  },
  imageContainer: {
    alignSelf: 'center',
    marginTop: 20,
  },
  line: {
    width: '80%',
    alignSelf: 'center',
    borderWidth: 0.3,
    borderColor: 'white',
  },
});

export default startScreen;
