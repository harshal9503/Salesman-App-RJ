import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, UIManager, findNodeHandle } from 'react-native';
import { Portal } from 'react-native-paper';

export default function TypeDropdown() {
  const [typeDrop, setTypeDrop] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [value, setValue] = useState('');
  const inputRef = useRef();

  const toggleDropdown = () => {
    if (!typeDrop) {
      UIManager.measure(
        findNodeHandle(inputRef.current),
        (x, y, width, height, pageX, pageY) => {
          setDropdownPos({ top: pageY + height, left: pageX });
          setTypeDrop(true);
        }
      );
    } else {
      setTypeDrop(false);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={toggleDropdown}>
        <TextInput
          ref={inputRef}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 8,
            borderRadius: 4,
            width: 150,
          }}
          placeholder="Type"
          value={value}
          editable={false} // prevent manual typing if you want only dropdown selection
        />
      </TouchableOpacity>

      {typeDrop && (
        <Portal>
          <View
            style={{
              position: 'absolute',
              top: dropdownPos.top,
              left: dropdownPos.left,
              backgroundColor: '#f0f0f0',
              borderRadius: 6,
              padding: 6,
              elevation: 10, // Android shadow
              zIndex: 9999, // iOS layering
            }}
          >
            {['24k', '22k', '20k', '18k'].map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setValue(item);
                  setTypeDrop(false);
                }}
              >
                <Text style={{ padding: 6 }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Portal>
      )}
    </View>
  );
}
