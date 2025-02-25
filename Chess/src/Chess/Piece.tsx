import { Chess, Position } from "chess.js";
import React, { useCallback, useState, useEffect } from "react";
import { StyleSheet, Image, View, Modal, Text, TouchableOpacity, Alert } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Vector } from "react-native-redash";

import { toTranslation, SIZE, toPosition, Dimensions_Width } from "./Notation";
import { ROOTGlobal } from "./GlobalState"

const generateStyles = (colorChess: any) => {
  return StyleSheet.create({
    piece: {
      width: SIZE,
      height: SIZE,
      transform: [{ scaleY: colorChess === 'white' ? 1 : -1 }]
    },
    piecePromotion: {
      width: SIZE,
      height: SIZE,
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalView: {
      margin: 20,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 35,
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
};
type Player = "b" | "w";
type Type = "q" | "r" | "n" | "b" | "k" | "p";
type Piece = `${Player}${Type}`;
type Pieces = Record<Piece, ReturnType<typeof require>>;
export const PIECES: Pieces = {
  br: require("./assets/br.png"),
  bp: require("./assets/bp.png"),
  bn: require("./assets/bn.png"),
  bb: require("./assets/bb.png"),
  bq: require("./assets/bq.png"),
  bk: require("./assets/bk.png"),
  wr: require("./assets/wr.png"),
  wn: require("./assets/wn.png"),
  wb: require("./assets/wb.png"),
  wq: require("./assets/wq.png"),
  wk: require("./assets/wk.png"),
  wp: require("./assets/wp.png"),
};

interface PieceProps {
  id: Piece;
  startPosition: Vector;
  chess: Chess;
  onTurn: (player: any, from: any, to: any, onTurnAction: any) => void;
  enabled: boolean;
  player: any;
  colorChess: any;
  pieceFrom: any;
  pieceTo: any;
}

const Piece = ({ id, startPosition, chess, onTurn, enabled, player, colorChess, pieceFrom, pieceTo }: PieceProps) => {
  const isGestureActive = useSharedValue(false);
  const [isShowModalPromotion, setIsShowModalPromotion] = useState(false);
  const [color, setColor] = useState(colorChess);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const translateX = useSharedValue(startPosition.x * SIZE);
  const translateY = useSharedValue(startPosition.y * SIZE);
  const initialPosition = { x: startPosition.x * SIZE, y: startPosition.y * SIZE };
  const styles = generateStyles(color);
  useEffect(() => {
    if (colorChess != '') {
      setColor(colorChess)
    }
  }, [colorChess]);
  // useEffect(() => {
  //   if (ROOTGlobal.count != 0) {
  //     offsetX.value = 0
  //     offsetY.value = 0
  //     translateX.value = startPosition.x * SIZE
  //     translateY.value = startPosition.y * SIZE
  //   }
  // }, [ROOTGlobal.count]);
  useEffect(() => {
    ROOTGlobal.socket.on("has_answer_new_game", (data: any) => {
      if (data.isAccept) {
        console.log("vào", startPosition.x * SIZE, startPosition.y * SIZE)
        offsetX.value = 0
        offsetY.value = 0
        translateX.value = startPosition.x * SIZE
        translateY.value = startPosition.y * SIZE
      }
    })
  }, [ROOTGlobal.socket]);
  useEffect(() => {
    ROOTGlobal.socket.on("has_move", (data: any) => {
      console.log("vào 1 : ")
      if (startPosition.x == data.x && startPosition.y == data.y) {
        console.log("vào 2", data)
        translateX.value = (data.translateX_value * Dimensions_Width) / data.SIZE_SEND_DEVICE
        translateY.value = (data.translateY_value * Dimensions_Width) / data.SIZE_SEND_DEVICE
        chess.move({ 'from': data.from, 'to': data.to });
        onTurn(data.player === 'w' ? 'b' : 'w', data.from, data.to, data.onTurnAction);
        console.log("translateX : ", (data.translateX_value * Dimensions_Width) / data.SIZE_SEND_DEVICE, (data.translateY_value * Dimensions_Width) / data.SIZE_SEND_DEVICE)
      }
    })
    ROOTGlobal.socket.on("has_move_promotion", (data: any) => {
      if (startPosition.x == data.x && startPosition.y == data.y) {
        translateX.value = (data.translateX_value * Dimensions_Width) / data.SIZE_SEND_DEVICE
        translateY.value = (data.translateY_value * Dimensions_Width) / data.SIZE_SEND_DEVICE
        chess.move({ 'from': data.from, 'to': data.to, 'promotion': data.promotion });
        onTurn(data.player === 'w' ? 'b' : 'w', data.from, data.to, data.onTurnAction);
      }
    })
  }, [ROOTGlobal.socket]);
  const movePiece = useCallback(
    (to: Position) => {
      const moves = chess.moves({ verbose: true });
      const from = toPosition({ x: offsetX.value, y: offsetY.value });
      const move = moves.find((m) => m.from === from && m.to === to);
      const { x, y } = toTranslation(move ? move.to : from);
      translateX.value = withTiming(
        x,
        {},
        () => (offsetX.value = translateX.value)
      );
      translateY.value = withTiming(y, {}, () => {
        offsetY.value = translateY.value;
        isGestureActive.value = false;
      });
      if (move) {
        const isPromotion = checkPromotionSquare(move)
        if (isPromotion) {
          setIsShowModalPromotion(true);
        } else {
          // chess.move({ from, to });
          // onTurn(player === 'w' ? 'b' : 'w', from, to);
          const position = toPosition({ x: translateX.value, y: translateY.value });
          const translation = toTranslation(position);
          ROOTGlobal.socket.emit("move", { 'translateX_value': translation.x, 'translateY_value': translation.y, 'x': startPosition.x, 'y': startPosition.y, 'SIZE_SEND_DEVICE': Dimensions_Width, 'from': from, 'to': to, 'player': player === 'w' ? 'b' : 'w', 'roomId': ROOTGlobal.roomId.toString(), 'onTurnAction': player === 'w' ? false : true })
        }
        console.log("translateXYZ : ", translateX.value, translateY.value)
      }
      if (chess.isGameOver() || chess.isDraw()) {
        Alert.alert("Trận đấu kết thúc")
      }
    },
    [chess, isGestureActive, offsetX, offsetY, onTurn, translateX, translateY]
  );
  function checkPromotionSquare(move: any) {
    const toSquare = move.to;
    const isWhite = move.color === 'w';

    // Đối với quân trắng, hàng cuối là hàng 8. Đối với quân đen, hàng cuối là hàng 1.
    const promotionRank = isWhite ? '8' : '1';

    if (toSquare[1] === promotionRank && move.piece === 'p') {
      setIsShowModalPromotion(true);
      return true;
      // Thực hiện các hành động hoặc xử lý logic khi quân tốt đến hàng cuối ở đây
    }
    return false
  }
  const onGestureEvent = useAnimatedGestureHandler({
    onStart: () => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
      isGestureActive.value = true;
    },
    onActive: ({ translationX, translationY }) => {
      translateX.value = offsetX.value + translationX;
      translateY.value = offsetY.value + (colorChess == 'white' ? translationY : -translationY);
    },
    onEnd: () => {
      runOnJS(movePiece)(
        toPosition({ x: translateX.value, y: translateY.value })
      );
    },
  });
  const style = useAnimatedStyle(() => ({
    position: "absolute",
    zIndex: isGestureActive.value ? 100 : 10,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));
  const original = useAnimatedStyle(() => {
    return {
      position: "absolute",
      width: SIZE,
      height: SIZE,
      zIndex: 0,
      backgroundColor: isGestureActive.value
        ? "rgba(255, 255, 0, 0.5)"
        : "transparent",
      transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
    };
  });
  const underlay = useAnimatedStyle(() => {
    const position = toPosition({ x: translateX.value, y: translateY.value });
    const translation = toTranslation(position);
    // const isPosition = pieceTo == position
    return {
      position: "absolute",
      width: SIZE,
      height: SIZE,
      zIndex: 0,
      backgroundColor: isGestureActive.value
        ? "rgba(255, 255, 0, 0.5)"
        : "transparent",
      transform: [{ translateX: translation.x }, { translateY: translation.y }],
    };
  });
  const SelectPromotion = (isCancel: boolean, idChess: Piece) => {
    const from = toPosition({ x: initialPosition.x, y: initialPosition.y });
    const to = toPosition({ x: translateX.value, y: translateY.value });
    const promotion = idChess ? [...idChess][1] : ''
    if (isCancel) {
      translateX.value = withTiming(initialPosition.x);
      translateY.value = withTiming(initialPosition.y);
    } else {
      // chess.move({ from, to, promotion });
      // onTurn(player === 'w' ? 'b' : 'w', from, to);
      const position = toPosition({ x: translateX.value, y: translateY.value });
      const translation = toTranslation(position);
      ROOTGlobal.socket.emit("move_promotion", { 'translateX_value': translation.x, 'translateY_value': translation.y, 'x': startPosition.x, 'y': startPosition.y, 'SIZE_SEND_DEVICE': Dimensions_Width, 'from': from, 'to': to, 'player': player === 'w' ? 'b' : 'w', 'promotion': promotion, 'roomId': ROOTGlobal.roomId.toString(), 'onTurnAction': player === 'w' ? false : true })
    }
    setIsShowModalPromotion(false);
  }
  const renderImagePromotion = (idChess: Piece) => {
    return (
      <TouchableOpacity onPress={() => SelectPromotion(false, idChess)} style={{ paddingHorizontal: 15 }}>
        <Image source={PIECES[idChess]} style={styles.piecePromotion} />
      </TouchableOpacity>
    )
  }
  return (
    <>
      <Animated.View style={original} />
      <Animated.View style={underlay} />
      <PanGestureHandler onGestureEvent={onGestureEvent} enabled={enabled} minDist={0}>
        <Animated.View style={style}>
          <Image source={PIECES[id]} style={styles.piece} />
        </Animated.View>
      </PanGestureHandler>
      <Modal
        style={styles.modalView}
        transparent={true}
        visible={isShowModalPromotion}>
        <View style={styles.centeredView}>
          <View style={{ backgroundColor: 'gray', maxWidth: 500, alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{ color: 'yellow' }}>{'Phong Tước'.toUpperCase()}</Text>
            {player == 'w' ?
              <View style={{ flexDirection: 'row', marginTop: 20 }}>
                {renderImagePromotion('wr')}
                {renderImagePromotion('wb')}
                {renderImagePromotion('wn')}
                {renderImagePromotion('wq')}
              </View> :
              <View style={{ flexDirection: 'row', marginTop: 20 }}>
                {renderImagePromotion('br')}
                {renderImagePromotion('bb')}
                {renderImagePromotion('bn')}
                {renderImagePromotion('bq')}
              </View>
            }
            <TouchableOpacity onPress={() => SelectPromotion(true)} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: 'white', marginTop: 20 }}>
              <Text style={{}}>Suy nghĩ lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};
export default Piece;