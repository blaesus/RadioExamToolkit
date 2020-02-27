import * as crypto from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { decode } from "iconv-lite";
import * as colors from "colors/safe";


import { SourceFileInfo, sourceFileInfoList } from "./data/meta";

const sourceRoot = `data`;
const generatedFileSubpath = `generated`;

const SEED_DELTA = 0;

const CSV_DELIMITER = '|';
const CSV_NEWLINE = '\n';

const SANE_BRANCH_COUNT = 4;

interface Item {
    serial: string,
    question: string,
    branches: string[],
    correctBranchIndex: number,
    reference: string,
    picture?: string,
}

interface Section {
    label: string,
    description: string,
    items: Item[],
}

interface Suite {
    level: string,
    region: string,
    version: string,
    randomSeed: number,
    sections: Section[],
}

interface RandomGenerator {
    seed: number,
    get(): number,
}

function getPrng(seed = 0): RandomGenerator {
    return {
        seed,
        get() {
            const m = Math.pow(2, 31);
            const a = 1103515245;
            const c = 12345
            const lastSeed = this.seed;
            const nextSeed = (a * this.seed + c) % m;
            this.seed = nextSeed;
            const denominator = Math.max(nextSeed, lastSeed);
            const nominator = Math.min(nextSeed, lastSeed);
            return nominator / denominator
        }
    }
}

function loadSource(sourceInfo: SourceFileInfo): string {
    const {regionRoot, filename, encoding} = sourceInfo;
    const fullPath = join(sourceRoot, regionRoot, filename)
    const content = readFileSync(fullPath);
    const text = decode(content, encoding);
    const unifiedText = text.replace(/\r\n/g, "\n").replace(/\u001e/g, "-");
    return unifiedText;
}

function warn(s: string): void {
    console.warn(colors.yellow(s));
}

function inform(s: string): void {
    console.info(colors.green(s));
}

function getDefaultItem(): Item {
    return {
        serial: '',
        question: '',
        branches: [],
        correctBranchIndex: 0,
        picture: undefined,
        reference: '',
    }
}

function getDefaultSection(): Section {
    return {
        label: "",
        description: "",
        items: [],
    }
}

function parse(content: string, region: SourceFileInfo['regionRoot']): Section[] {
    switch (region) {
        case "cn": {
            return parseCn(content);
        }
        case "us": {
            return parseUs(content);
        }
        case "tw": {
            return parseTw(content);
        }
        default: {
            throw new Error(`Missing parser for ${region}`);
        }

    }
}

function parseTw(content: string): Section[] {
    const lines = content.split("\n").map(s => s.trim());
    const sections: Section[] = [];
    let section = getDefaultSection();
    let item = getDefaultItem();
    for (const line of lines) {
        const sectionRegex = /^(.*)題庫/;
        const sectionMatch = sectionRegex.exec(line);
        if (sectionMatch) {
            if (section.label) {
                if (item.question) {
                    section.items.push(item);
                    item = getDefaultItem();
                }
                sections.push(section);
                section = getDefaultSection();
            }
            section.label = sectionMatch[1];
        }

        const regexTitle = /^[（(]\s?([0-9])\s?[）)]\s([0-9]*)\.\s(.*)/;
        const titleMatch = regexTitle.exec(line);
        if (titleMatch) {
            if (item.question) {
                section.items.push(item);
                item = getDefaultItem();
            }
            item.correctBranchIndex = +titleMatch[1] - 1;
            item.serial = titleMatch[2];
            item.question = titleMatch[3];

            const pictureRegex = /圖\s?([A-Z][0-9]?-[0-9])/;
            const pictureMatch = pictureRegex.exec(line);
            if (pictureMatch) {
                item.picture = pictureMatch[1];
            }
        }
        else {
            const branchRegex = /^[（(][0-9][)）]\s?(.*)/;
            const match = branchRegex.exec(line);
            if (match) {
                item.branches.push(match[1]);
            }
        }
    }
    sections.push(section);
    return sections;
}

function parseUs(content: string): Section[] {
    const lines = content.split("\n").map(s => s.trim());
    const sections: Section[] = [];
    let section = getDefaultSection();
    let item = getDefaultItem();
    let parseBranch = false;
    for (const line of lines) {
        const sectionRegex = /^([TGE][0-9][A-Z])\s[–-]?\s?(.*)/;
        const sectionMatch = sectionRegex.exec(line);
        if (sectionMatch) {
            if (section.label) {
                if (item.question) {
                    section.items.push(item);
                    item = getDefaultItem();
                }
                sections.push(section);
                section = getDefaultSection();
            }
            section.label = sectionMatch[1];
            section.description = sectionMatch[2];
        }
        if (line.startsWith('~')) {
            parseBranch = false;
            section.items.push(item);
            item = getDefaultItem();
        }
        else {
            const titleRegex = /^(\w+)\s\((\w)\)(\s\[(.+)\])?/;
            const match = titleRegex.exec(line);
            if (match) {
                if (parseBranch) {
                    warn("Unexpected new title while parsing of an existing is ongoing. Missing tilde?");
                    warn("Current item:\n" + JSON.stringify(item, null, 4));
                }
                parseBranch = true;
                item.serial = match[1];
                item.correctBranchIndex = match[2].charCodeAt(0) - "A".charCodeAt(0);
                item.reference = match[4];
            }
            else if (parseBranch) {
                const branchRegex = /^([ABCD]\.)\s(.*)/;
                const match = branchRegex.exec(line);
                if (match) {
                    item.branches.push(match[2]);
                }
                else {
                    item.question = line;
                    const figureRegex = /[Ii]n [Ff]igure\s([A-Z0-9-]*)\s?/g
                    const match = figureRegex.exec(line);
                    if (match) {
                        item.picture = match[1]
                    }
                }
            }
        }
    }
    sections.push(section);
    return sections;
}

function parseCn(content: string): Section[] {
    const lines = content.split("\n");

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

    // Chinese pool is not sectioned
    const section: Section = {
        label: "Sole",
        description: "",
        items,
    }
    return [section];
}

function shuffle<T>(array: T[], rng: () => number): void {
    let i = array.length;
  
    while (i !== 0) {
        const randomIndex = Math.floor(rng() * i);
        i -= 1;
    
        const temporaryValue = array[i];
        array[i] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
}

// A branch that include all other branches
function isBranchCatchAll(branch?: string): boolean {
    return !!branch &&
           (
               branch === `All these choices are correct`
               || branch === `All of these choices are correct`
               || branch === `三项都可能`
               || branch === `以上三项全部正确`
               || branch === `其他三项全部正确`
           );
}

function shuffleBranches(suite: Suite, rng: () => number): void {
    for (const section of suite.sections) {
        for (const item of section.items) {
            const correctBranchBody = item.branches[item.correctBranchIndex];
            const catchAll: string | undefined = item.branches.filter(isBranchCatchAll)[0];
            shuffle(item.branches, rng);
            if (catchAll) {
                item.branches = item.branches.filter(branch => branch !== catchAll);
                item.branches.push(catchAll);
                // We only handle one catch-all branch
            }
            item.correctBranchIndex = item.branches.indexOf(correctBranchBody)
        }
    }
}

function toCsv(suite: Suite, picturePrefix?: string, pictureExt: string | null = null): string {

    function sha256(content: string): string {
        return crypto.createHash("sha256").update(content).digest().toString("hex");
    }

    function hashItem(item: Item): string {
        const content = item.question + item.branches.map(s => s).sort().join();
        return sha256(content).slice(0, 12);
    }

    function optionIndexLetter(index: number): string {
        return String.fromCharCode('A'.charCodeAt(0) + index)
    }

    function getPictureField(pictureFilename?: string, prefix?: string, suffix: string | null = null): string {
        if (!pictureFilename) {
            return "";
        }
        if (prefix) {
            pictureFilename = prefix + pictureFilename;
        }
        if (suffix) {
            pictureFilename = pictureFilename + suffix;
        }
        return `<img src='${pictureFilename}'/>`
    }

    const lines = [];
    for (const section of suite.sections) {
        for (const item of section.items) {
            const segments = [
                item.serial,
                hashItem(item),
                item.question,
                optionIndexLetter(item.correctBranchIndex),
                getPictureField(item.picture, picturePrefix, pictureExt),
                item.reference,
                ...item.branches,
            ]
            lines.push(
                segments.join(CSV_DELIMITER)
            )
        }
    }
    return lines.join(CSV_NEWLINE);

}

// For example, as of Feb 2020, LK0938 has an image but the `[P]` field is empty
function fixMissingPictureLabels(suite: Suite): void {
    for (const section of suite.sections) {
        for (const item of section.items) {
            if (!item.picture) {
                const possiblePath = `${sourceRoot}/cn/images/${item.serial}.jpg`
                if (existsSync(possiblePath)) {
                    item.picture = `${item.serial}.jpg`
                    console.info(`Fixing item ${item.serial} missing link to picture`)
                }
            }
        }
    }
}

function reportItemSanity(item: Item): boolean {
    let sane = true;
    if (!item.question) {
        sane = false;
        warn(`Item ${item.serial} has empty question`);
    }
    if (!item.branches.length) {
        sane = false;
        warn(`Item ${item.serial} has no branches`);
    }
    if (item.branches.length !== SANE_BRANCH_COUNT) {
        sane = false;
        warn(`Item ${item.serial} has unexpected branch count: ${item.branches.length}`);
    }
    else {
        for (const branch of item.branches) {
            if (!branch) {
                sane = false;
                warn(`Item ${item.serial} has empty branch`);
            }
        }
        if (!item.branches[item.correctBranchIndex]) {
            sane = false;
            console.info(item.branches, item.correctBranchIndex)
            warn(`Item ${item.serial} has abnormal correct branch index ${item.correctBranchIndex}`);
        }
    }
    return sane;
}

function reportSuiteSanity(suite: Suite): boolean {
    let sane = true;
    if (!suite.version) {
        sane = false;
        warn(`Suite ${suite.level}: Missing version`);
    }
    if (!suite.region) {
        sane = false;
        warn(`Suite ${suite.level}: Missing region`);
    }
    if (!suite.level) {
        sane = false;
        warn(`Suite ${suite.level}: Missing level`);
    }
    if (!suite.sections.length) {
        sane = false;
        warn(`Suite ${suite.level}: No sections`);
    }
    else {
        for (const section of suite.sections) {
            const itemSerials = section.items.map(item => item.serial);
            for (let index = 0; index < itemSerials.length; index += 1) {
                const serial = itemSerials[index];
                if (itemSerials.indexOf(serial) !== index) {
                    sane = false;
                    warn(`Duplicated item serial ${serial} in section ${section.label}`)
                }
            }
            for (const item of section.items) {
                let itemSane = reportItemSanity(item);
                if (!itemSane) {
                    sane = false;
                }
            }
        }
    }

    if (!sane) {
        warn(`Suite ${suite.level} has abnormal structure!`);
    }
    else {
        inform(`Suite ${suite.level} is normal.`);
    }

    return sane;
}

function transform(sourceInfo: SourceFileInfo): void {
    const { level, regionRoot, version } = sourceInfo;
    console.info(`\nTransforming for level ${level} of ${regionRoot}`)
    const fileContent = loadSource(sourceInfo);
    const seed = level.charCodeAt(0) + SEED_DELTA;
    const suite: Suite = {
        level,
        region: sourceInfo.regionRoot,
        version: sourceInfo.version,
        randomSeed: seed,
        sections: parse(fileContent, regionRoot),
    };
    fixMissingPictureLabels(suite);

    reportSuiteSanity(suite);
    const totalItems = suite.sections.map(section => section.items.length).reduce((n, sum) => n + sum);
    console.info(`Collected ${totalItems} items in ${suite.sections.length} sections`)

    const outputBasename = `${regionRoot.toUpperCase()}-${level}-${version}`

    const jsonPath = join(sourceRoot, regionRoot, generatedFileSubpath, outputBasename + '.json');
    console.info(`Exporting JSON to ${jsonPath}`)
    writeFileSync(jsonPath, JSON.stringify(suite, null, 4));

    const csvPath = join(sourceRoot, regionRoot, generatedFileSubpath, outputBasename + '.csv');
    const prng = getPrng(suite.randomSeed);
    shuffleBranches(suite, () => prng.get());
    const csvContent = toCsv(suite, sourceInfo.picturePrefix, sourceInfo.pictureSuffix);
    console.info(`Exporting CSV to ${csvPath}`)
    writeFileSync(csvPath, csvContent);

    console.info(`Done.`)
}

function main() {
    for (const info of sourceFileInfoList) {
        transform(info);
    }
}

main()
