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

import deviceList from '../components/deviceList';

const startScreen = ({
  renderList,
  showModal,
  deviceId,
  isConnected,
  startScan,
  isScanning,
  renderItem,
  list,
}) => {
  return (
    <SafeAreaView style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Control Bluetooth car</Text>
      {deviceId ? (
        <View style={{alignSelf: 'center'}}>
          <Text style={{color: 'white', marginTop: 20}}>{deviceId}</Text>
        </View>
      ) : (
        <View style={{alignSelf: 'center'}}>
          <Text
            style={{color: 'white', marginVertical: 20}}
            accessibilityLabel="lol">
            No connected dispositives!
          </Text>
        </View>
      )}

      <View style={{margin: 10}}>
        <Button
          title={deviceId ? 'Disconnect' : 'Connect'}
          onPress={() => startScan()}
          mode="outlined"
          color="white"
          contentStyle={styles.button}
          loading={isScanning ? true : false}>
          {isConnected ? 'DISCONNECT' : 'CONNECT'}
        </Button>
      </View>

      <View style={styles.imageContainer}>
        <Image
          resizeMode="cover"
          source={require('../assets/images/car.png')}
          style={{width: 300, height: 300}}
        />
      </View>

      {renderList ? (
        <FlatList
          data={list}
          renderItem={({item}) => renderItem(item)}
          keyExtractor={item => item.id}
        />
      ) : null}

      <Modal
        style={styles.modal}
        animationType="slide"
        transparent={true}
        visible={showModal}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Connessione Avvenuta!</Text>
          </View>
        </View>
      </Modal>
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
    fontWeight: '600',
    alignSelf: 'center',
    color: 'white',
    marginVertical: 30,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  button: {
    borderRadius: 20,
    borderColor: 'white',
    borderWidth: 2,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    backgroundColor: 'rgba(44, 182, 125, 1)',
    margin: 20,
    borderRadius: 20,
    paddingVertical: 15,
    width: '70%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
});

export default startScreen;
