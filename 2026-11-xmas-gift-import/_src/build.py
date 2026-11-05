from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SHELL = Path(r"D:\Obsidian\AILibrary\線上研發部\Skills\套後台樣式-GoX\程式碼與樣式")
sys.path.insert(0, str(SHELL))

from build_prototype import build_prototype

HEAD_NOTE = """<!--
  DemoShares 交接對照 | 聖誕小禮物批次匯入（重複匯入改為更新）
  改的是既有介面：聖誕傳情管理 — 小禮物管理（後台 GoX）  route /GoX/ChristmasConsole/Index?fun_id=3040
  這次要動的檔（改既有 6 支 ／ 新建 0 項 ／ 只參考 2 支）：
    [改既有] react-component-export src/pages/admin/christmas/ChristmasGiftManager.tsx
             匯入改成「預覽→確認」兩階段，新增統計卡與四分頁明細（將更新／新增／已認購不更動／內容相同）
    [改既有] react-component-export src/pages/admin/christmas/ProductContentEditorModal.tsx
             心願卡圖片預覽由 width=160 放大到 360，Modal 寬度配合改為 620
    [改既有] react-component-export src/network/endpoints/christmasConsole.ts
             新增 previewChristmasGiftImport（預覽），既有 importChristmasGifts 改為帶確認旗標的套用
    [改既有] fruit_web HuashanCRM/Areas/GoX/Controllers/ChristmasConsoleController.cs
             ImportChristmasGifts 拆成 Preview 與 Apply 兩個 action，Apply 要寫 ProductDetailModifyLog 並刷商品快取
    [改既有] fruit_web GreenBox.Domain/Services/BabyUnit/BabyService.cs
             ValidateChristmasProductsForImport 改為本檔活動內比對編號（不再用「編號＋品名」全名比全表）；
             整列皆空的資料列略過不驗；新增差異比對產生預覽結果
    [改既有] fruit_web GreenBox.Persistence/Data/Repository/BabyChristmasRepository.cs
             BulkInsertChristmasProducts 旁新增更新路徑（Product.Name／Picture／StartTime、ProductDetail.StartTime、
             ProductPicture.Url），新增與更新包在同一個交易裡
    [只參考] fruit_web HuashanCRM/Areas/GoX/Models/Excel/Tools/ExcelHelper.cs
             ExcelMapper 逐列 yield 的行為不動，空白列在呼叫端過濾（這裡只是行為來源）
    [只參考] fruit_web HuashanCRM/Areas/GoX/Controllers/SurveyBabyController.cs
             舊頁同功能入口，本次不改；新流程穩定後再評估移除  ⚠ 待工程定案
  （欄位名／API／commit sha 由 DemoShares-check-handoff 補滿）
-->
"""

content = (ROOT / "_src" / "import-content.html").read_text(encoding="utf-8")

html = build_prototype(
    title="聖誕小禮物批次匯入 — 後台 demo",
    breadcrumb=[("等家寶寶", None), ("聖誕傳情管理", None)],
    menu=[
        {"label": "帳號管理", "disabled": True},
        {"label": "會員管理", "disabled": True},
        {"label": "待辦事項", "disabled": True},
        {"label": "產品管理", "disabled": True},
        {"label": "訂單管理", "disabled": True},
        {"label": "等家寶寶", "open": True, "children": [
            {"label": "等家頁面管理", "href": "#"},
            {"label": "聖誕志工報名管理", "href": "#"},
            {"label": "聖誕傳情管理", "href": "#", "active": True},
            {"label": "聖誕小禮物批次匯入／重新上架", "href": "#"},
            {"label": "圓夢贊助管理", "href": "#"},
        ]},
        {"label": "網頁管理", "disabled": True},
        {"label": "留言管理", "disabled": True},
        {"label": "售後服務", "disabled": True},
    ],
    content_html=content,
    user_name="Glen Wen",
    antd="vendored",
)

# 檔頭註解要留在 <head> 最上方，套殼會重包模板，所以產完再插回去
marker = "<head>"
index = html.find(marker)
if index == -1:
    raise SystemExit("找不到 <head>，檔頭註解沒插進去")
html = html[: index + len(marker)] + "\n" + HEAD_NOTE + html[index + len(marker) :]

out = ROOT / "xmas-import-upsert(ChristmasGiftManager).html"
out.write_text(html, encoding="utf-8")
print(f"WROTE {out}  ({out.stat().st_size / 1024 / 1024:.1f} MB)")
