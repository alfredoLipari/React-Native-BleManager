/* eslint-disable prettier/prettier 
/* eslint-disable react-native/no-inline-styles 
import React from 'react';
import {TouchableHighlight, View, Text} from 'react-native';

const deviceList = ({item, testPeripheral}) => {
  return (
    <TouchableHighlight onPress={() => testPeripheral(item)}>
      <View style={{backgroundColor: 'white'}}>
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

export default deviceList;
*/
