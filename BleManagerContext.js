/* eslint-disable prettier/prettier */
import React, {useContext, useState, useReducer, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ThemeProvider} from 'react-native-paper';
import {
  TouchableHighlight,
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Alert,
} from 'react-native';

import BleManager from 'react-native-ble-manager';
import BluetoothStateManager from 'react-native-bluetooth-state-manager'; //this is for managing the bluethoot state

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const ManagerContext = React.createContext();

const BleManagerContext = props => {
  const [showModal, setShowModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map();
  const [list, setList] = useState([]);

  const [isConnected, setIsConnected] = useState(false);
  const [deviceId, setDeviceId] = useState();

  const [renderList, setRenderList] = useState(false);

  const [state, setState] = useState({
    showModal: false,
    isScanning: false,
    peripherals: new Map(),
    list: [],
    isConnected: true,
    deviceId: null,
    renderList: false,
  })

  const initialState = {
    showModal: false,
    isScanning: false,
    peripherals: new Map(),
    list: [],
    isConnected: true,
    deviceId: null,
    renderList: false,
  };

  const reducer = (state, action) => {
    console.log(action);
    console.log(state);
    switch (action) {
      case 'handleDiscoverPeripheral':
        console.log('handleee');
    }
  };

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
    removeData();
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

  const startScan = () => {
    if (deviceId) {
      console.log('lol');
      connectDevice(deviceId);
    }
    if (!deviceId && !isScanning) {
      BleManager.scan([], 5, true)
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

  const handleStopScan = () => {
    console.log('Scan is stopped');
    setIsScanning(false);
  };

  //call this function if is already discovered
  const connectDevice = devId => {
    BleManager.isPeripheralConnected(devId, []).then(isConnected => {
      if (isConnected) {
        console.log('Peripheral is connected!');
        setIsConnected(false);
        console.log('list', list);
        setDeviceId(undefined); //cambiare questo, la funzione è asincrona...
        BleManager.disconnect(devId);

        return;
      } else {
        console.log('Peripheral is NOT connected!');

        if (devId) {
          console.log('Sono entrato lo stesso!!!!');
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
                /* Test read current RSSI value */
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

  //will call for the first time we want to connect to a device
  const testPeripheral = peripheral => {
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
            });
          }, 900);
        })
        .catch(error => {
          console.log('Connection error', error);
        });
    }
  };

  return (
    <>
      <ManagerContext.Provider value={initialState}>
        {children}
      </ManagerContext.Provider>
    </>
  );

  // return <BleManagerContext.
}
