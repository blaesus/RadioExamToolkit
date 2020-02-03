# 中国业余无线电台操作证书考试题库Anki牌组工具

根据[官方考试题库文本](http://www.crac.org.cn/News/Detail?ID=1862)，产生json和csv（见`/generated`），用于导入Anki形成牌组。

原本题库永远是第一项（即「A」）正确，本工具生成CSV时会打乱题枝顺序，但JSON依照原顺序。

组好的牌组见：https://github.com/blaesus/RadioExamCNDeck/releases

## 开发
```bash
npm install
```

源文件只有一个： `radio.ts`.

## 资料来源
业余无线电台操作证书考试题库电子版文本下载（v171031） - http://www.crac.org.cn/News/Detail?ID=1862

## 本软件（radio.ts）授权
MIT

