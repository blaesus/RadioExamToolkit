const readline = require('readline');

// According to ITU "Phonetic alphabet and figure code"
const dict: {[key in string]: string} = {
    A: "Alfa",
    B: "Bravo",
    C: "Charlie",
    D: "Delta",
    E: "Echo",
    F: "Foxtrot",
    G: "Golf",
    H: "Hotel",
    I: "India",
    J: "Juliett",
    K: "Kilo",
    L: "Lima",
    M: "Mike",
    N: "November",
    O: "Oscar",
    P: "Papa",
    Q: "Quebec",
    R: "Romeo",
    S: "Sierra",
    T: "Tango",
    U: "Uniform",
    V: "Victor",
    W: "Whiskey",
    X: "X-ray",
    Y: "Yankee",
    Z: "Zulu",
    0: "Nadazero",
    1: "Unaone",
    2: "Bissotwo",
    3: "Terrathree",
    4: "Kartefour",
    5: "Pantafive",
    6: "Soxisix",
    7: "Setteseven",
    8: "Oktoeight",
    9: "Novenine",
    ".-decimal": "Decimal",
    ".-stop": "Stop",
}

function randomCharacter(): string {
    const code = "A".charCodeAt(0) + Math.floor(Math.random() * 26);
    return String.fromCharCode(code);
}

function test() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const word = Array.from(Array(5)).map(() => randomCharacter()).join('')
    const correct = word.split("").map(c => dict[c]).join(" ")

    const t0 = Date.now();
    rl.question(word + '\n', (answer: string) => {
        const tEnd = Date.now();
        const answerUpper = answer.toUpperCase();
        const correctUpper = correct.toUpperCase();
        if (correctUpper === answerUpper) {
            console.info(`Correct in ${tEnd - t0}ms`);
        }
        else {
            console.warn("Wrong!");
            console.info("CORRECT:", correctUpper);
        }
        rl.close();
        test();
    });
}

function main() {
    test();
}

main()
