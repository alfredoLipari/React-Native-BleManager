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
  Button,
  Alert,
} from 'react-native';
import StartScreen from './screen/startScreen';
import BleManager from 'react-native-ble-manager';

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
  const [deviceId, setDeviceId] = useState();
  const [renderList, setRenderList] = useState(false);

  /* LocalStorage methods */

  //read idDevice data if exist
  const getData = async () => {
    try {
      const value = await AsyncStorage.getItem('DeviceId');
      if (value !== null) {
        // value previously stored
        console.log('get Id', value);
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
      console.log(e, 'in store data');
      // saving error
    }
  };

  const removeData = async () => {
    try {
      await AsyncStorage.removeItem('DeviceId');
      //riazzero lo state
      setDeviceId();
      console.log('data rimossi');
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

    console.log(isConnected);

    //check position is active
    /*    I have to test this more
     PermissionsAndroid.check(
       PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
     ).then(granted => {
       if (granted) {
         console.log('You can use the ACCESS_FINE_LOCATION');
       } else {
         console.log('ACCESS_FINE_LOCATION permission denied');
       }
     });
     */

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
  }, [isConnected]);

  /* end useEffect and bluethoot is ready */

  /* functions of the Native Module to discover and disconnect peripherals   */

  // this is handled when Connect is pressed
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
    let peripheral = peripherals.get(data.peripheral);
    removeData();
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    }
    console.log('Disconnected from ' + data.peripheral);
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
    if (deviceId) {
      console.log('lol');
      connectPeripheral(deviceId);
    }
    if (!deviceId && !isScanning) {
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
    try {
      const response = await BleManager.isPeripheralConnected(devId, []);
      if (response) {
        console.log('Peripheral is connected!');
        setIsConnected(true);
      } else {
        console.log('Peripheral is NOT connected');
        setIsConnected(false);
      }
    } catch (e) {
      console.log(e, 'in isPeripheralConnected');
    }
  }

  /*
  //call this function if the device its already discovered
  const connectDevice = devId => {
    BleManager.isPeripheralConnected(devId, []).then(isConnected => {
      // if its already connected disconnect the device else try to connect it
      if (isConnected) {
        console.log('Peripheral is connected!');
        setIsConnected(false);
        setDeviceId(undefined); //cambiare questo, la funzione è asincrona...
        BleManager.disconnect(devId);
        return;
      } else {
        console.log('Peripheral is NOT connected!');
        if (devId) {
          BleManager.connect(devId)
            .then(() => {
              let p = peripherals.get(devId);
              console.log(p);
              if (p) {
                p.connected = true;
                peripherals.set(devId, p);
                setList(Array.from(peripherals.values()));
              }
              setShowModal(true);
              //store the data in local storage
              storeData(devId);
              setIsConnected(true);
              setTimeout(() => setShowModal(false), 2000);

              setTimeout(() => {
                /* Test read current RSSI value ;
                BleManager.retrieveServices(devId).then(peripheralData => {
                  console.log('Retrieved peripheral services', peripheralData);

                  BleManager.retrieveServices(devId).then(peripheralInfo => {
                    // Success code
                    setTimeout(() => {
                      BleManager.startNotification(devId, '1801', '2a05')
                        .then(() => {
                          // Success code
                          console.log('Notification started');

                          BleManager.write(devId, '1800', '2a01', [1, 0])
                            .then(() => {
                              // Success code
                              console.log('Write: ' + 1);
                            })
                            .catch(error => {
                              // Failure code
                              console.log('write', error);
                            });
                          setTimeout(() => {
                            BleManager.read(devId, '1800', '2a01')
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
                });
              }, 900);
            })
            .catch(error => {
              console.log('Connection error', error);
            });
        }
      }
    });
  };

  */

  //will call for the first time we want to connect to a device
  async function connectPeripheral(peripheral) {
    isPeripheralConnected();
    //if dont work try to enter with force here
    if (isConnected) {
      console.log('disconneting the device');
      const response = await BleManager.disconnect(peripheral.id);
      console.log(response);
      setIsConnected(false);
    } else {
      try {
        const response = await BleManager.connect(peripheral.id);
        if (response) {
          console.log('ok');
        }
        setShowModal(true);
        setRenderList(true);
        setIsConnected(true);
        setDeviceId(peripheral);
        //setNome(nome)
        storeData(peripheral);
      } catch (e) {
        console.log(e, 'in connectPeripheral');
      }
    }
  }
  /*
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
          setRenderList(false);
          //store the data in local storage
          storeData(peripheral.id);
          setDeviceId(peripheral.id);
          setIsConnected(true);
          console.log('Connected to ' + peripheral.id);
          setTimeout(() => setShowModal(false), 2000);

          setTimeout(() => {
            /* Test read current RSSI value ;
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
            });
          }, 900);
        })
        .catch(error => {
          console.log('Connection error', error);
        });
    }
  };


  const writeDevice = deviceId => {
    BleManager.write(deviceId, '1800', '2a01', [100, 101])
      .then(() => {
        // Success code
        console.log('Write: ' + 1);
      })
      .catch(error => {
        // Failure code
        console.log('write', error);
      });
    setTimeout(() => {
      BleManager.read(deviceId, '1800', '2a00')
        .then(readData => {
          // Success code
          console.log('Read: ' + readData);
        })
        .catch(error => {
          // Failure code
          console.log(error);
        });
    }, 700);
  };
*/

  async function writeAndRead(devId) {
    try {
      const retriveServiceResponse = await BleManager.retrieveServices(devId);
      if (retriveServiceResponse) {
        BleManager.write(devId, '1800', '2a01', [100, 101])
          .then(() => {
            // Success code
            console.log('Write: ' + 1);
          })
          .catch(error => {
            // Failure code
            console.log('write', error);
          });
        setTimeout(() => {
          BleManager.read(devId, '1800', '2a00')
            .then(readData => {
              // Success code
              console.log('Read: ' + readData);
            })
            .catch(error => {
              // Failure code
              console.log(error);
            });
        }, 700);
      } else {
        ('im in a strange else');
      }
    } catch (e) {
      console.log(e, 'in writeAndRead');
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

  return (
    <LinearGradient colors={['#4b6cb7', '#010132']} style={{flex: 1}}>
      <Button title="write" onPress={() => writeAndRead(deviceId)} />
      {isConnected ? (
        <Text style={{color: 'white'}}>Device connected</Text>
      ) : (
        <Text style={{color: 'white'}}>Disconnected</Text>
      )}

      <StartScreen
        renderList={renderList}
        showModal={showModal}
        deviceId={deviceId}
        isConnected={isConnected}
        startScan={startScan}
        isScanning={isScanning}
        renderItem={renderItem}
        list={list}
      />
    </LinearGradient>
  );
};

export default App;
