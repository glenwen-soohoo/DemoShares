# 封存區 — 不要照這裡面的檔案施工

> 建立日期：2026-09-07
> 類型：參考資料
> 適用對象：接手這份 demo 的人（PM、工程）
> 資料來源：`D:\Project\DemoShares\2026-08-gift-voucher\` 各版本的汰換紀錄

---

這個資料夾放**已經被取代的 demo 版本**，留著只為了回頭比對「當初長怎樣」。

**現役版本一律以上一層 `index.html` 的入口為準。** 這個專案踩過一次雷：看檔名叫 `new2` 就以為是最新版，結果改到已棄用的檔（見禮物券專案 `_工作筆記` 的踩雷紀錄）。**判斷哪份是現行，不能看檔名，要看 `index.html` 指向哪一份。**

---

## 命名慣例

| 後綴 | 意思 |
|---|---|
| `-before-<日期><事由>` | 某次改動前的快照，用來對照那次改了什麼 |
| `-superseded-by-<版本>` | 整份被另一個檔取代，不再維護 |

---

## 檔案清單

### 被整份取代的

| 檔案 | 被誰取代 | 為什麼 |
|---|---|---|
| `member-baby-profile-superseded-by-b.html` | `member-baby-profile-b.html` | 2026-09-04。舊版是在既有 `VolunteersChange` 版面上修補，標題層級、分段邏輯、段落排序都被舊骨架綁死，改了三輪都不行，最後整頁重寫 |
| `member-center-b-superseded-by-c.html` | `member-center-c.html` | 2026-09-03。同一份內容的早期排版方案，C 版多做了等級切換與預設頭像 |
| `member-center-new2-superseded-by-c.html` | `member-center-c.html` | 同上。**檔名的 new2 沒有時序意義**，它比 C 版舊 |
| `admin-order-create-gift-superseded-by-b.html` | `admin-order-create-gift-b.html` | 2026-09-07。第一版是六區版面，b 版收成四區並加上金額自動計算。一度保留在索引上供對照排版差異，定案後封存 |
| `admin-order-create-gift-b-superseded-by-c.html` | `admin-order-create-gift-c.html` | 2026-09-10。客服回饋改版：會員身分三選項、依收件地區判定配送方式、複製訂單、匯入文字檔補實作 |
| `admin-member-gift-superseded-by-b.html` | `admin-member-gift-b.html` | 2026-09-10。客服回饋改版：會員等級分色徽章＋年度消費、收件時間對齊前台、兩個備註欄正名、購物金原因常用詞 |

### 改動前的快照

| 檔案 | 那次改了什麼 |
|---|---|
| `admin-gift-detail-before-0831fix.html` | 0831 對齊修正前 |
| `checkout-cart-before-0831fix.html` | 0831 對齊修正前 |
| `member-center-c-before-0903level.html` | 0903 加會員等級 icon 與進度條前 |
| `member-center-new2-before-0903level.html` | 同上（當時誤改到 new2，後已還原） |
| `member-center-v0-current.html` | 最初照當時正式站抓下來的版本 |
| `member-center-v1.html` | 第一版優化 |
