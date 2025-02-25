/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useCallback, useRef, useState, useEffect } from "react";
import type { PropsWithChildren } from 'react';
import {
  SafeAreaView, ScrollView, Alert, StyleSheet, Text, useColorScheme, View, Dimensions, TouchableOpacity
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Background from "./Background";
import Board from './Board';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Chess } from "chess.js";
import { ROOTGlobal } from "./GlobalState"

type SectionProps = PropsWithChildren<{
  title: string;
}>;
const { width } = Dimensions.get("window");

function Section({ children, title }: SectionProps): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}
function useConst<T>(initialValue: T | (() => T)): T {
  const ref = useRef<{ value: T }>();
  if (ref.current === undefined) {
    // Box the value in an object so we can tell if it's initialized even if the initializer
    // returns/is undefined
    ref.current = {
      value:
        typeof initialValue === "function"
          ? // eslint-disable-next-line @typescript-eslint/ban-types
          (initialValue as Function)()
          : initialValue,
    };
  }
  return ref.current.value;
}
interface ChessGameProps {

}
const ChessGame = ({ }: ChessGameProps) => {
  const isDarkMode = useColorScheme() === 'dark';
  // const chess = useConst(() => new Chess());
  const [chess, setChess] = useState(new Chess());
  const [colorChess, setColorChess] = useState('');
  const [roomId, setRoomId] = useState('');
  const [onTurn, setOnTurn] = useState(false);
  useEffect(() => {
    ROOTGlobal.socket.on("receive_new_game", (count: any) => {
      Alert.alert('Thông Báo', 'Đối thủ muốn làm trận mới', [
        {
          text: 'Dứt',
          onPress: () => {
            // NewGame()
            ROOTGlobal.socket.emit("answer_new_game", { 'isAccept': true, 'roomId': ROOTGlobal.roomId, 'isReceiveAnswerNewGame': colorChess == 'white' ? true : false })
          },
        },
        {
          text: 'Cút',
          onPress: () => {
            ROOTGlobal.socket.emit("answer_new_game", { 'isAccept': false, 'roomId': ROOTGlobal.roomId, 'isReceiveAnswerNewGame': colorChess == 'white' ? true : false })
          },
        },
      ]);
    })
    ROOTGlobal.socket.on("has_answer_new_game", (data: any) => {
      console.log("vào newgame 1")
      if (data.isAccept) {
        // setTimeout(() => {
        NewGame()
        // }, 1000);
      } else {
        Alert.alert("Đối thủ không đồng ý")
      }
    })
    ROOTGlobal.socket.on("connect", () => {
      ROOTGlobal.socket.emit('request-color');
    })
    ROOTGlobal.socket.on('assign-color', (data: any) => {
      setColorChess(data.color) // Nhận màu từ server và lưu vào state
      console.log("data :", data)
      if (data.color == 'white') {
        console.log("vào")
        setOnTurn(true)
      } else {
        setOnTurn(false)
      }
    });
    ROOTGlobal.socket.on('gameRoomId', (data: any) => {
      console.log("gameRoomId : ", data.roomId)
      setRoomId(data.roomId);
    });
  }, [ROOTGlobal.socket]);
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const NewGame = () => {
    console.log("vào newGame")
    setChess(new Chess());
  }
  const ResetBoard = () => {
    sendMessage()
    // NewGame()
  }
  const sendMessage = () => {
    ROOTGlobal.socket.emit("new_game", { 'roomId': roomId, 'isReceiveNewGame': colorChess == 'white' ? true : false })
  }
  return (
    <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', backgroundColor: 'brown' }}>
      <View style={{ height: width }}>
        <Board chess={chess} colorChess={colorChess} onTurnAction={onTurn} />
        <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'white', marginTop: 30 }} onPress={() => { ResetBoard() }}>
          <Text>Trận mới</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default ChessGame;
