export interface SourceFileInfo {
    level: string,
    regionRoot: string,
    filename: string,
    encoding: string,
    pictureExt: string | null,
    version: string,
}

export const sourceFileInfoList: SourceFileInfo[] = [
    {
        level: "A",
        regionRoot: "cn",
        filename: "a2017.txt",
        encoding: "gbk",
        pictureExt: null,
        version: "v171031",
    },
    {
        level: "B",
        regionRoot: "cn",
        filename: "b2017.txt",
        encoding: "gbk",
        pictureExt: null,
        version: "v171031",
    },
    {
        level: "C",
        regionRoot: "cn",
        filename: "c2017.txt",
        encoding: "gbk",
        pictureExt: null,
        version: "v171031",
    },
    {
        level: "Technician",
        regionRoot: "us",
        filename: "t2018.txt",
        encoding: "utf-8",
        pictureExt: "jpg",
        version: "2018-2022",
    },
    {
        level: "General",
        regionRoot: "us",
        filename: "g2019.txt",
        encoding: "utf-8",
        pictureExt: "jpg",
        version: "2019-2023",
    },
    {
        level: "Extra",
        regionRoot: "us",
        filename: "e2020.txt",
        encoding: "utf-8",
        pictureExt: "png",
        version: "2020-2024",
    },
];

