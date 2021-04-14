/* eslint-disable prettier/prettier */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  Image,
  Modal,
} from 'react-native';
import {Button, Appbar} from 'react-native-paper';

const DeviceConnectedScreen = ({
  device,
  disconnectDevice,
  writeAndRead,
  isConnected,
  showModal,
  read,
}) => {
  //pass here the device Connected

  return (
    <>
      <Appbar.Header style={styles.header} dark>
        <Appbar.Content title={device ? device.name : 'Error'} />
        <Appbar.Content title={isConnected ? 'connected' : 'not connected'} />
      </Appbar.Header>
      <View style={styles.container}>
        <Text style={styles.title}>TRUNK LIFT CONTROL</Text>
        <View style={styles.menuContainer}>
          <View style={{flexDirection: 'column', alignItems: 'center'}}>
            <TouchableHighlight
              style={styles.iconContainer}
              onPress={() => writeAndRead(device, 1)}>
              <Image
                source={require('../assets/images/unlock.png')}
                style={styles.image}
              />
            </TouchableHighlight>
            <Text style={{color: '#263eac'}}> UNLOCK </Text>
          </View>
          <View style={{flexDirection: 'column', alignItems: 'center'}}>
            <TouchableHighlight
              style={styles.iconContainer}
              onPress={() => writeAndRead(device, 2)}>
              <Image
                source={require('../assets/images/lock.png')}
                style={styles.image}
              />
            </TouchableHighlight>
            <Text style={{color: '#263eac'}}> LOCK </Text>
          </View>
        </View>
        <View>
          <TouchableHighlight
            style={styles.disconnectContainer}
            onPress={() => disconnectDevice(device)}>
            <Text style={styles.textDisconnect}>DISCONNECT DEVICE</Text>
          </TouchableHighlight>
        </View>
        <View>
          <TouchableHighlight
            style={styles.disconnectContainer}
            onPress={() => read(device)}>
            <Text style={styles.textDisconnect}>Read</Text>
          </TouchableHighlight>
        </View>
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
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#263eac',
  },
  container: {
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'space-around',
    padding: 5,
  },
  title: {
    fontSize: 20,
    alignSelf: 'center',
    color: '#263eac',
    fontWeight: '600',
  },
  disconnectContainer: {
    backgroundColor: '#263eac',
    width: '50%',
    alignSelf: 'center',
    padding: 10,
    overflow: 'hidden',
    borderRadius: 20,
    marginVertical: 10,
    textAlign: 'center',
  },
  textDisconnect: {
    color: 'white',
    alignSelf: 'center',
  },

  menuContainer: {
    marginVertical: 10,

    backgroundColor: 'white',
    flexDirection: 'row',

    justifyContent: 'space-around',
  },
  iconContainer: {
    width: 75,
    height: 75,
    borderWidth: 1,
    borderColor: '#263eac',
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  image: {
    width: 35,
    height: 35,
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
});

export default DeviceConnectedScreen;
