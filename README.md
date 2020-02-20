# Amateur Radio Exam Question Pool Toolkit (CN+US)

Parse radio exam question pools of China and the United States and generate JSON and CSVs for Anki import or other programmatic uses.

## 1. 中国业余无线电台操作证书考试题库

根据[官方考试题库文本](http://www.crac.org.cn/News/Detail?ID=1862)，产生json和csv（见`/generated`），用于导入Anki形成牌组。

原本题库永远是第一项（即「A」）正确，本工具生成CSV时会打乱题枝顺序，但JSON依照原顺序。

组好的牌组见：https://github.com/blaesus/RadioExamCNDeck/releases

## 2. FCC Amateur Radio Exam

Three levels are handled:
- Technical (aka element 2), based on 

## Development
```bash
npm install
```

Then edit `radio.ts`.

## 本软件（radio.ts）授权
MIT


