import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { SIZE, toPosition } from "./Notation";

const WHITE = "rgb(100, 133, 68)";
const BLACK = "rgb(230, 233, 198)";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "row",
    },
});
interface BackgroundProps {
    positionFrom: any;
}
interface BaseProps {
    white: boolean;
}

interface RowProps extends BaseProps {
    row: number;
}

interface SquareProps extends RowProps {
    col: number;
    positionFrom: any;
    positionTo: any;
}

const Square = ({ white, row, col, positionFrom, positionTo }: SquareProps) => {
    const backgroundColor = white ? WHITE : BLACK;
    const backgroundColorMove = (positionFrom != '' && positionFrom == toPosition({ x: col * SIZE, y: row * SIZE })) || (positionTo != '' && positionTo == toPosition({ x: col * SIZE, y: row * SIZE })) ? "rgba(255, 255, 0, 0.5)" : null
    const color = white ? BLACK : WHITE;
    const textStyle = { fontWeight: "500" as const, color };
    return (
        <View
            style={{
                flex: 1,
                backgroundColor,
            }}
        >
            <View style={{
                flex: 1,
                padding: 4,
                justifyContent: "space-between",
                backgroundColor: backgroundColorMove
            }}>
                <Text style={[textStyle, { opacity: col === 0 ? 1 : 0 }]}>
                    {"" + (8 - row)}
                </Text>
                {row === 7 && (
                    <Text style={[textStyle, { alignSelf: "flex-end" }]}>
                        {String.fromCharCode(97 + col)}
                    </Text>
                )}
            </View>
        </View>
    );
};

const Row = ({ white, row, positionFrom, positionTo }: RowProps) => {
    const offset = white ? 0 : 1;
    return (
        <View style={styles.container}>
            {new Array(8).fill(0).map((_, i) => (
                <Square row={row} col={i} key={i} white={(i + offset) % 2 === 1} positionFrom={positionFrom} positionTo={positionTo} />
            ))}
        </View>
    );
};

const Background = ({ positionFrom, positionTo }: BackgroundProps) => {
    return (
        <View style={{ flex: 1, backgroundColor: 'red' }}>
            {new Array(8).fill(0).map((_, i) => (
                <Row key={i} white={i % 2 === 0} row={i} positionFrom={positionFrom} positionTo={positionTo} />
            ))}
        </View>
    );
};

export default Background;