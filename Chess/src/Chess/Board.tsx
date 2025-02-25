import React, { useCallback, useRef, useState, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
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
interface BoardProps {
    chess: Chess;
    colorChess: any;
    onTurnAction: boolean;
}
const Board = ({ chess, colorChess, onTurnAction }: BoardProps) => {
    // console.log("ches : ", chess)
    const [color, setColor] = useState(colorChess);
    const [state, setState] = useState({
        player: "w",
        board: chess.board(),
        from: '',
        to: '',
        onTurnAction: onTurnAction,
    });
    const styles = generateStyles(color);
    useEffect(() => {
        if (colorChess != '') {
            setColor(colorChess)
        }
    }, [colorChess]);
    useEffect(() => {
        setState({
            ...state,
            onTurnAction: onTurnAction
        })
    }, [onTurnAction]);
    useEffect(() => {
        ROOTGlobal.socket.on("has_answer_new_game", (data: any) => {
            if (data.isAccept) {
                console.log("vào newgame")
                setState({
                    ...state,
                    board: chess.board(),
                });
            }
        })
    }, [ROOTGlobal.socket]);
    const onTurn = useCallback((player: any, from: any, to: any, onTurnAction: boolean) => {
        console.log("onTurnAction cb : ", onTurnAction)
        setState({
            player: player === "w" ? "b" : "w",
            board: chess.board(),
            from: from,
            to: to,
            onTurnAction: onTurnAction
        });
    }, [chess, state.player]);
    console.log("chess : ", chess)
    return (
        <View style={styles.container}>
            <Background positionFrom={state.from} positionTo={state.to} />
            {state.board.map((row, y) =>
                row.map((piece, x) => {
                    if (piece !== null) {
                        return (
                            <Piece
                                key={`${x}-${y}`}
                                id={`${piece.color}${piece.type}` as const}
                                startPosition={{ x, y }}
                                chess={chess}
                                onTurn={onTurn}
                                enabled={state.player === piece.color && state.onTurnAction}
                                player={state.player}
                                colorChess={colorChess}
                                pieceFrom={state.from}
                                pieceTo={state.to}
                            />
                        );
                    }
                    return null;
                })
            )}
        </View>
    );
};

export default Board;