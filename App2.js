/* eslint-disable prettier/prettier */
/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect} from 'react';
import {
  TouchableHighlight,
  NativeEventEmitter,
  NativeModules,
  Text,
  View,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import StartScreen from './screen/startScreen';
import DeviceConnectedScreen from './screen/DeviceConnectedScreen';
import BleManager from 'react-native-ble-manager';
import {Dialog, Paragraph, Button} from 'react-native-paper';

//this is for managing the bluethoot state:
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

//calls the native module of the ble
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map();
  const [list, setList] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState();
  const [renderList, setRenderList] = useState(false);
  const [showDeviceNotFound, setDeviceNotFound] = useState(false);

  console.log('is?', isConnected);

  // console.log('ok', device.name); this works as well device.id

  /* LocalStorage methods */

  //read idDevice data if exist
  const getData = async () => {
    try {
      const value = await AsyncStorage.getItem('DeviceId');

      if (value !== null) {
        // value previously stored
        console.log('get Id', value);

        var newValue = JSON.parse(value);

        setDevice(newValue);
      }
    } catch (e) {
      // error reading value
    }
  };

  //store idDevice in localStorage
  const storeData = async value => {
    console.log('salvataggio..');
    try {
      await AsyncStorage.setItem('DeviceId', value);
    } catch (e) {
      console.log(e, 'in store data');
      // saving error
    }
  };

  const removeData = async () => {
    try {
      await AsyncStorage.removeItem('DeviceId');
      //riazzero lo state
      setDevice();
      console.log('data rimossi');
      setIsConnected(false);
      //checckare qui!!
    } catch (e) {
      // remove error
      console.log(e);
    }

    console.log('item delated');
  };

  //check if the bluethoot is enable on the device
  async function getState() {
    try {
      const response = await BluetoothStateManager.getState();
      switch (response) {
        case 'Unknown':
          console.log('unknown');
          break;
        case 'Resetting':
          console.log('resetting');
          break;
        case 'Unsupported':
          console.log('unsported');
          break;
        case 'Unauthorized':
          console.log('unhauthorized');
          break;
        case 'PoweredOff':
          console.log('off');
          BluetoothStateManager.requestToEnable().then(result => {
            if (!result) {
              Alert('you must active the bluethoot');
            }
            // result === true -> user accepted to enable bluetooth
            // result === false -> user denied to enable bluetooth
          });
          break;
        case 'PoweredOn':
          console.log('on');
          break;
        default:
          break;
      }
    } catch (e) {
      console.log(e, 'Lol');
    }
  }

  useEffect(() => {
    BleManager.start({showAlert: false});

    getData();

    //active the bluethoot if its off
    getState();

    //check position is active
    /*  I have to test this more  */
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ).then(granted => {
      if (granted) {
      } else {
        console.log('ACCESS_FINE_LOCATION permission denied');
      }
    });

    /*Add all the listener to the module  */
    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);
    bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      handleDisconnectedPeripheral,
    );
    bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      handleUpdateValueForCharacteristic,
    );
    return () => {
      console.log('unmount');
      bleManagerEmitter.removeListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      );
      bleManagerEmitter.removeListener('BleManagerStopScan', handleStopScan);
      bleManagerEmitter.removeListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      );
      bleManagerEmitter.removeListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdateValueForCharacteristic,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* end useEffect and bluethoot is ready */

  /* functions of the Native Module to discover and disconnect peripherals   */

  // The scanning find a new peripheral.
  const handleDiscoverPeripheral = peripheral => {
    console.log('Got ble peripheral', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
    peripherals.set(peripheral.id, peripheral);
    setList(Array.from(peripherals.values()));
  };

  //this is called when the device is disconnected
  const handleDisconnectedPeripheral = data => {
    //here I want to put the alert when the device is not reachable
    if (!isConnected && !isScanning) {
      console.log('Ok');
      setDeviceNotFound(true);
    }
    let peripheral = peripherals.get(data.peripheral);
    // removeData();
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    }
    console.log('Disconnected from ' + data.peripheral);
    setIsConnected(false);
  };

  //I think we dont need this handle
  const handleUpdateValueForCharacteristic = data => {
    console.log(
      'Received data from ' +
        data.peripheral +
        ' characteristic ' +
        data.characteristic,
      data.value,
    );
  };

  // if the device exist dont scan anything go directly to connect this device
  const startScan = () => {
    if (device) {
      connectPeripheral(device);
    }
    if (!device && !isScanning) {
      BleManager.scan([], 3, true)
        .then(results => {
          console.log('Scanning...');
          setIsScanning(true);
          setRenderList(true);
        })
        .catch(err => {
          console.error(err);
        });
    }
  };

  // this is called when the scan is finished
  const handleStopScan = () => {
    console.log('Scan is stopped');
    setIsScanning(false);
  };

  async function isPeripheralConnected(devId) {
    console.log(devId, 'In isPeripheral eheheh');
    try {
      const response = await BleManager.isPeripheralConnected(devId, []);
      console.log(response, 'in peripheralconnected');
      if (response) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (e) {
      console.log(e, 'in isPeripheralConnected');
    }
  }

  // call when press the button Connect
  async function connectPeripheral(peripheral) {
    //this will call first false and then true
    //isPeripheralConnected();
    //Disconnect the device if its already connected
    if (isConnected) {
      console.log('disconneting the device');
      setIsConnected(false);
      const response = await BleManager.disconnect(peripheral.id);
      console.log(response, 'in disconnecting');
    } else {
      try {
        console.log(isConnected, 'IN IS PERIPHERAL CONNECTED COSI SENZA SENSO');
        await BleManager.connect(peripheral.id);
        setShowModal(true);
        setRenderList(false); //?
        setIsConnected(true);
        setDevice(peripheral);
        //setNome(nome)
        //I want to pass all the object to the store
        storeData(JSON.stringify(peripheral));
        setTimeout(() => setShowModal(false), 2000);
      } catch (e) {
        console.log(e, 'in connectPeripheral');
      }
    }
  }

  async function read(deviceConnected) {
    await BleManager.retrieveServices(deviceConnected.id);

    BleManager.write(deviceConnected.id, '1800', '2a01', [0])
      .then({
        // Success code
      })
      .catch(error => {
        // Failure code
        console.log(error, 'in write and read');
      });
  }

  //here are the functions for write and read, maybe here put isConnected to check connection before writing
  async function writeAndRead(deviceConnected, write) {
    await isPeripheralConnected(deviceConnected.id);
    console.log('writing...');
    try {
      const retriveServiceResponse = await BleManager.retrieveServices(
        deviceConnected.id,
      );
      if (retriveServiceResponse) {
        try {
          await BleManager.write(deviceConnected.id, '1800', '2a01', [write]);
          setTimeout(() => {
            BleManager.read(deviceConnected.id, '1800', '2a01')
              .then(readData => {
                // Success code
                console.log('Read: ' + readData);
              })
              .catch(error => {
                // Failure code
                console.log(error, 'in write and read');
              });
          }, 700);
        } catch (e) {
          console.log(e, 'in write and dsdsread');
          setIsConnected(false);
          Alert.alert('device not connected retry');
        }
      } else {
        ('im in a strange else');
      }
    } catch (e) {
      console.log(e, 'in writeAsasandRead');
    }
  }

  const renderItem = item => {
    const color = item.connected ? 'green' : '#fff';
    return (
      //try to correct this function, maybe we can only pass here connect and eliminate this.
      <TouchableHighlight onPress={() => connectPeripheral(item)}>
        <View style={{backgroundColor: color, marginTop: 10}}>
          <Text
            style={{
              fontSize: 12,
              textAlign: 'center',
              color: '#333333',
              padding: 10,
            }}>
            {item.name}
          </Text>
          <Text
            style={{
              fontSize: 10,
              textAlign: 'center',
              color: '#333333',
              padding: 2,
            }}>
            RSSI: {item.rssi}
          </Text>
          <Text
            style={{
              fontSize: 8,
              textAlign: 'center',
              color: '#333333',
              padding: 2,
              paddingBottom: 20,
            }}>
            {item.id}
          </Text>
        </View>
      </TouchableHighlight>
    );
  };

  const hideDialog = () => setDeviceNotFound(false);

  return (
    <>
      <LinearGradient colors={['#4b6cb7', '#263eac']} style={{flex: 1}}>
        <Dialog visible={showDeviceNotFound} onDismiss={hideDialog} dismissable>
          <Dialog.Title style={{color: '#263eac'}}>
            Device not found
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph>Try to reconnect or erase memory device</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => removeData()} color="#263eac">
              Remove Device
            </Button>
            <Button onPress={hideDialog} color="#263eac">
              Ok
            </Button>
          </Dialog.Actions>
        </Dialog>
        {isConnected ? (
          <DeviceConnectedScreen
            device={device}
            disconnectDevice={connectPeripheral}
            writeAndRead={writeAndRead}
            isConnected={isConnected}
            showModal={showModal}
            read={read}
          />
        ) : (
          <StartScreen
            renderList={renderList}
            showModal={showModal}
            device={device}
            isConnected={isConnected}
            startScan={startScan}
            isScanning={isScanning}
            renderItem={renderItem}
            list={list}
            removePeripheral={removeData}
          />
        )}
      </LinearGradient>
    </>
  );
};

export default App;
