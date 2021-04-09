/* eslint-disable no-trailing-spaces */
/* eslint-disable quotes */
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
  FlatList,
  TouchableHighlight,
  NativeEventEmitter,
  NativeModules,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
  PermissionsAndroid,
  Image,
  Modal,
  Alert,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import BluetoothStateManager from 'react-native-bluetooth-state-manager'; //this is for managing the bluethoot state
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {Button} from 'react-native-paper';

import {Colors} from 'react-native/Libraries/NewAppScreen';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  //questo è l'id del device a cui ci si collega
  //const deviceId = '02:80:E1:00:F0:7F';

  //BLE_Device

  const [showModal, setShowModal] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map();
  const [list, setList] = useState([]);

  const [isConnected, setIsConnected] = useState(false);
  const [deviceId, setDeviceId] = useState();

  //read idDevice data if exist
  const getData = async () => {
    try {
      const value = await AsyncStorage.getItem('DeviceId');
      if (value !== null) {
        // value previously stored
        console.log(value);
        setDeviceId(value);
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
      // saving error
    }
  };

  useEffect(() => {
    BleManager.start({showAlert: false});

    getData();

    //check if the bluethoot is connected
    BluetoothStateManager.getState().then(bluetoothState => {
      switch (bluetoothState) {
        case 'Unknown':
          console.log('unknown');
          break;
        case 'Resetting':
          console.log('resetting');
          break;
        case 'Unsupported':
          console.log('unsupported');
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
    });

    //check position is active
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ).then(granted => {
      if (granted) {
        console.log('You can use the ACCESS_FINE_LOCATION');
      } else {
        console.log('ACCESS_FINE_LOCATION permission denied');
      }
    });

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

  const handleDiscoverPeripheral = peripheral => {
    console.log('Got ble peripheral', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
    peripherals.set(peripheral.id, peripheral);
    setList(Array.from(peripherals.values()));
  };

  const handleDisconnectedPeripheral = data => {
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    }
    console.log('Disconnected from ' + data.peripheral);
  };

  const handleUpdateValueForCharacteristic = data => {
    console.log(
      'Received data from ' +
        data.peripheral +
        ' characteristic ' +
        data.characteristic,
      data.value,
    );
  };

  const retrieveConnected = () => {
    BleManager.getConnectedPeripherals([]).then(results => {
      if (results.length === 0) {
        console.log('No connected peripherals');
      }
      console.log(results);
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        setList(Array.from(peripherals.values()));
      }
    });
  };

  const startScan = () => {
    if (deviceId) {
      setIsScanning(true);
      connectDevice(deviceId);
    }
    if (!deviceId && !isScanning) {
      BleManager.scan([], 5, true)
        .then(results => {
          console.log('Scanning...');
          setIsScanning(true);
        })
        .catch(err => {
          console.error(err);
        });
    }
  };

  const handleStopScan = () => {
    console.log('Scan is stopped');
    setIsScanning(false);
  };

  //call this function if is already discovered
  const connectDevice = deviceId => {
    console.log(deviceId);
    if (deviceId) {
      console.log('id', deviceId);
      BleManager.connect(deviceId)
        .then(() => {
          let p = peripherals.get(deviceId);
          if (p) {
            p.connected = true;
            peripherals.set(deviceId, p);
            setList(Array.from(peripherals.values()));
          }
          setShowModal(true);
          //store the data in local storage
          storeData(deviceId);

          setTimeout(() => setShowModal(false), 2000);

          setTimeout(() => {
            /* Test read current RSSI value */
            BleManager.retrieveServices(deviceId).then(peripheralData => {
              console.log('Retrieved peripheral services', peripheralData);

              BleManager.retrieveServices(deviceId).then(peripheralInfo => {
                // Success code
                setTimeout(() => {
                  BleManager.startNotification(deviceId, '1801', '2a05')
                    .then(() => {
                      // Success code
                      console.log('Notification started');

                      BleManager.write(deviceId, '1800', '2a01', [1, 0])
                        .then(() => {
                          // Success code
                          console.log('Write: ' + 1);
                        })
                        .catch(error => {
                          // Failure code
                          console.log('write', error);
                        });
                      setTimeout(() => {
                        BleManager.read(deviceId, '1800', '2a01')
                          .then(readData => {
                            // Success code
                            console.log('Read: ' + readData);
                          })
                          .catch(error => {
                            // Failure code
                            console.log(error);
                          });
                      }, 700);
                    })
                    .catch(error => {
                      // Failure code
                      console.log('not', error);
                    });
                }, 500);
              });

              BleManager.readRSSI(deviceId).then(rssi => {
                console.log('Retrieved actual RSSI value', rssi);
                let p = peripherals.get(deviceId);
                if (p) {
                  p.rssi = rssi;
                  peripherals.set(deviceId, p);
                  setList(Array.from(peripherals.values()));
                }
              });
            });
          }, 900);
        })
        .catch(error => {
          console.log('Connection error', error);
        });
    }
  };

  const testPeripheral = peripheral => {
    console.log(peripheral.id);
    if (peripheral.id) {
      console.log('id', peripheral.id);
      BleManager.connect(peripheral.id)
        .then(() => {
          let p = peripherals.get(peripheral.id);
          if (p) {
            p.connected = true;
            peripherals.set(peripheral.id, p);
            setList(Array.from(peripherals.values()));
          }
          setShowModal(true);
          //store the data in local storage
          storeData(peripheral.id);
          console.log('Connected to ' + peripheral.id);
          setTimeout(() => setShowModal(false), 2000);

          setTimeout(() => {
            /* Test read current RSSI value */
            BleManager.retrieveServices(peripheral.id).then(peripheralData => {
              console.log('Retrieved peripheral services', peripheralData);

              BleManager.retrieveServices(peripheral.id).then(
                peripheralInfo => {
                  // Success code
                  setTimeout(() => {
                    BleManager.startNotification(peripheral.id, '1801', '2a05')
                      .then(() => {
                        // Success code
                        console.log('Notification started');

                        BleManager.write(peripheral.id, '1800', '2a01', [1, 0])
                          .then(() => {
                            // Success code
                            console.log('Write: ' + 1);
                          })
                          .catch(error => {
                            // Failure code
                            console.log('write', error);
                          });
                        setTimeout(() => {
                          BleManager.read(peripheral.id, '1800', '2a01')
                            .then(readData => {
                              // Success code
                              console.log('Read: ' + readData);
                            })
                            .catch(error => {
                              // Failure code
                              console.log(error);
                            });
                        }, 700);
                      })
                      .catch(error => {
                        // Failure code
                        console.log('not', error);
                      });
                  }, 500);
                },
              );

              BleManager.readRSSI(peripheral.id).then(rssi => {
                console.log('Retrieved actual RSSI value', rssi);
                let p = peripherals.get(peripheral.id);
                if (p) {
                  p.rssi = rssi;
                  peripherals.set(peripheral.id, p);
                  setList(Array.from(peripherals.values()));
                }
              });
            });
          }, 900);
        })
        .catch(error => {
          console.log('Connection error', error);
        });
    }
  };

  const renderItem = item => {
    const color = item.connected ? 'green' : '#fff';
    return (
      <TouchableHighlight onPress={() => testPeripheral(item)}>
        <View style={[styles.row, {backgroundColor: color}]}>
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

  return (
    <LinearGradient colors={['#070034', '#010132']} style={{flex: 1}}>
      <SafeAreaView style={styles.sectionContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Text style={styles.sectionTitle}>Control Bluetooth car</Text>

        <View style={{margin: 10}}>
          {!isConnected ? (
            <Button
              title={isScanning ? 'Connect' : ''}
              onPress={() => startScan()}
              mode="outlined"
              color="white"
              contentStyle={styles.button}
              loading={isScanning ? true : false}>
              CONNECT
            </Button>
          ) : (
            <Text>Connesso!</Text>
          )}
        </View>

        <View style={{margin: 10}}>
          <Button
            title="Retrieve connected peripherals"
            onPress={() => retrieveConnected()}
          />
        </View>
        <View style={{alignSelf: 'center'}}>
          <Image
            resizeMode="cover"
            source={require('./assets/images/car.png')}
            style={{width: 300, height: 300}}
          />
        </View>
        <FlatList
          data={list}
          renderItem={({item}) => renderItem(item)}
          keyExtractor={item => item.id}
        />
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#070034',
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
});

export default App;
