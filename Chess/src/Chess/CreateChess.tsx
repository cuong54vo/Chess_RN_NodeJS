import React, { useCallback, useRef, useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, TextInput, TouchableOpacity, Text, Alert } from "react-native";
import { Chess } from "chess.js";

import Background from "./Background";
import Piece from "./Piece";
import { ROOTGlobal } from "./GlobalState"

const { width } = Dimensions.get("window");

const generateStyles = (colorChess: any) => {
    return StyleSheet.create({
        container: {
            width,
            height: width,
            transform: [{ scaleY: colorChess === 'white' ? 1 : -1 }]
        }
    });
};
interface CreateChess {
    navigation: {
        navigate: (screenName: string) => void;
        // Các phương thức và thuộc tính khác của đối tượng navigation
    };
}
const createGame = (navigation: any) => {
    let randomId = Math.random()
    ROOTGlobal.roomId = randomId
    ROOTGlobal.socket.emit('createGame', randomId.toString());
    navigation.navigate('src_ChessGame')
}
const joinGame = (navigation: any, roomIdValue: any) => {
    ROOTGlobal.roomId = roomIdValue
    ROOTGlobal.socket.emit('joinGame', { "roomId": roomIdValue, user: "cuong" });
    navigation.navigate('src_ChessGame')
}
const CreateChess = ({ navigation }: CreateChess) => {
    const [roomIdValue, setRoomIdValue] = useState('')

    useEffect(() => {
        ROOTGlobal.socket.on('gameStart', (roomId: any) => {
            console.log("vào start")
            Alert.alert("dsadasdasd")
        });
    }, [ROOTGlobal.socket]);
    return (
        <View style={{ flex: 1 }}>
            <TextInput
                placeholder={"Nhap ma room"}
                onChangeText={(value) => setRoomIdValue(value)}
            >
                {roomIdValue}
            </TextInput>
            <TouchableOpacity onPress={() => joinGame(navigation, roomIdValue)} style={{ marginTop: 10 }}>
                <Text>Vao room</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => createGame(navigation)} style={{ marginTop: 50 }}>
                <Text>Tao phong</Text>
            </TouchableOpacity>
        </View>
    );
};

export default CreateChess;