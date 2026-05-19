# Demo Shares

> 建立日期：2026-05-18
> 最後更新：2026-05-19
> 類型：參考資料
> 適用對象：自己 / 同事看 demo

---

內部 demo 與原型頁面集中區。把資料夾推上 GitHub，透過 GitHub Pages 對外。**沒有首頁清單，需要哪個 demo 就直接分享該 demo 的網址。**

## 網址規則

```
https://glenwen-soohoo.github.io/DemoShares/{資料夾名}/
```

範例：<https://glenwen-soohoo.github.io/DemoShares/2026-05-familymart-store-close/>

## 怎麼新增一個 demo

1. 在這個 repo 根目錄建一個資料夾，命名格式 `YYYY-MM-專案名`，例如 `2026-05-greenbox-lp`
2. 資料夾裡放 `index.html`（必要）+ 任何其他資源（images、css、js）
3. `git add . && git commit -m "add 2026-05-greenbox-lp" && git push`
4. 等 1–2 分鐘 GitHub Pages 部署完，網址就會通

## 資料夾命名建議

- 開頭用 `YYYY-MM-`：好排序、好找
- 後面用短英文 slug，避免中文（網址會被 encode 變醜）
- 範例：`2026-05-greenbox-lp`、`2026-06-dreamer-prototype`

## 第一次設定 GitHub Pages

1. GitHub repo 頁面 → Settings → Pages
2. Source 選 `Deploy from a branch`
3. Branch 選 `main`、folder 選 `/ (root)`
4. 存檔，等 1–2 分鐘

## 不該放的東西

- 公司機密資料（這是 public repo）
- 大型二進位檔（影片、超過 10MB 的圖）→ 改用雲端連結
- API key、密碼、token
