import { readFileSync, writeFileSync, existsSync } from "fs";
import { decode } from "iconv-lite";

const CSV_DELIMITER = '|';
const CSV_NEWLINE = '\n';

type ExamLevel = "A" | "B" | "C"

const missingPictureLabels: {[key in string]: string} = {
    LK0938: 'LK0938.jpg'
}

interface Item {
    serial: string,
    question: string,
    branches: string[],
    correctBranchIndex: number,
    picture?: string,
}

interface Suite {
    level: ExamLevel,
    items: Item[],
}

function loadFile(level: ExamLevel): string {
    const filename = getSourceFileName(level);
    const content = readFileSync(filename);
    const text = decode(content, 'gbk');
    return text;
}

function getDefaultItem(): Item {
    return {
        serial: '',
        question: '',
        branches: [],
        correctBranchIndex: 0,
        picture: undefined,
    }
}

function getSourceFileName(level: ExamLevel): string {
    switch (level) {
        case "A": {
            return "data/radioa.txt";
        }
        case "B": {
            return "data/radiob.txt";
        }
        case "C": {
            return "data/radioc.txt";
        }
    }
}

function parse(content: string): Item[] {
    const lines = content.split('\r\n');

    const items: Item[] = [];

    let item = getDefaultItem();

    for (const line of lines) {
        const regex = /\[(\w)](.*)/;
        const match = regex.exec(line);
        if (!match) {
            continue
        }
        const marker = match[1];
        const body = match[2];
        if (marker === 'I') {
            item = getDefaultItem();
        }

        switch (marker) {
            case 'I': {
                item.serial = body;
                break;
            }
            case 'Q': {
                item.question = body;
                break;
            }
            case 'P': {
                item.picture = body;
                items.push(item);
                break;
            }
            default: {
                item.branches.push(body);
            }
        }

    }

    return items
}

function shuffle<T>(array: T[]): void {
    let i = array.length;
  
    while (i !== 0) {
        const randomIndex = Math.floor(Math.random() * i);
        i -= 1;
    
        const temporaryValue = array[i];
        array[i] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
}

function shuffleBranches(suite: Suite): void {
    for (const qa of suite.items) {
        const correctBranchBody = qa.branches[qa.correctBranchIndex]
        shuffle(qa.branches)
        qa.correctBranchIndex = qa.branches.indexOf(correctBranchBody)
    }
}

function toCsv(suite: Suite): string {

    function optionIndexLetter(index: number): string {
        return String.fromCharCode('A'.charCodeAt(0) + index)
    }

    function prependOption(branches: string[]): string[] {
        return branches.map((branch, index) => `[${optionIndexLetter(index)}]${branch}`);
    }

    function getImageHtml(pictureFile?: string): string {
        if (pictureFile) {
            return `<img src='${pictureFile}'/>`
        }
        else {
            return ''
        }
    }

    const lines = [];
    for (const item of suite.items) {
        const segments = [
            item.serial,
            item.question,
            optionIndexLetter(item.correctBranchIndex),
            getImageHtml(item.picture),
            ...prependOption(item.branches)
        ]
        lines.push(
            segments.join(CSV_DELIMITER)
        )
    }
    return lines.join(CSV_NEWLINE);

}

// For example, as of Feb 2020, LK0938 has an image but the `[P]` field is empty
function fixMissingPictureLabels(suite: Suite): void {
    for (const item of suite.items) {
        if (!item.picture) {
            const possiblePath = `data/images/${item.serial}.jpg`
            if (existsSync(possiblePath)) {
                item.picture = `${item.serial}.jpg`
                console.warn(`Fixing item ${item.serial} missing link to picture`)
            }
        }
    }
}

function generate(level: ExamLevel): void {
    console.info(`\nTransforming for level ${level}`)
    const fileContent = loadFile(level);
    const suite = {
        level,
        items: parse(fileContent),
    };
    fixMissingPictureLabels(suite);

    const jsonPath = 'generated/' + level + '.json';
    console.info(`Exporting JSON to ${jsonPath}`)
    writeFileSync(jsonPath, JSON.stringify(suite, null, 4));

    const csvPath = 'generated/' + level + '.csv';
    shuffleBranches(suite);
    const csvContent = toCsv(suite);
    console.info(`Exporting CSV to ${csvPath}`)
    writeFileSync('generated/' + level + '.csv', csvContent);

    console.info(`Done.`)
}

function main() {
    generate("A");
    generate("B");
    generate("C");
}

main()
