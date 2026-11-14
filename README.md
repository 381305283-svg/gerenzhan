# 陈希一 · 个人作品集网站

React + Vite 搭建的单页作品集，暗色黑莓色系，PC 优先，版心 1700px。

## 运行

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # 产出 dist/
npm run preview    # 预览打包结果
```

## 页面结构

| 区块 | 组件 | 说明 |
| --- | --- | --- |
| 全屏首页 | `src/components/Hero.jsx` | 视频背景 + 大标题 + 导航 + 联系按钮 + 技能跑马灯 |
| 个人经历 | `src/components/About.jsx` | 角色图 / 个人信息 / 联系方式 / 项目数据 / 工作经历时间线 / CE 角色三视图 |
| 精选项目 | `src/components/Works.jsx` | 6 张大卡片，2 列栅格，16:9 画面（`contain`，不裁切作品） |
| 个人优势 | `src/components/Strengths.jsx` | 6 张能力卡片 + 工具清单 |
| 联系方式 | `src/components/Contact.jsx` | 整屏收尾页，邮箱复制、电话、状态、页脚 |

文案与数据集中在 `src/data/site.js`，改这一个文件就能更新全站内容。

## 素材替换

所有图片和视频放在 `public/media/`：

- `hero-loop.mp4` / `hero-poster.jpg`：首页背景视频。现用素材来自 `个人IP形象/02_创作小狗/动态表现.mp4`（CE 角色在工作室的动态表现），已抹掉原片左上角的「AI生成」水印，正放 + 倒放拼成 10 秒无缝循环，1280×720 / 24fps / 无音轨，约 1 MB。旧的程序生成版留在 `backup/media/hero-loop.procedural.mp4`，还原时覆盖回去即可。
- `works/work-01.jpg` … `work-06.jpg`：精选项目的成片截图，来自 `作品整理/简历更新/代表作品.docx`，用 `python scripts/import_works.py` 可重新导入（按文档中出现顺序导出，宽度统一到 1600px）。替换成新截图时保持同名即可，卡片用 `object-fit: contain`，不会裁掉画面内容。
- `character-ip-keyvisual.jpg`：个人经历（01）页面左侧的角色主视觉，来自 `个人IP形象/02_创作小狗/个人图.png`（原图 1536×2048，导出为 1200×1600 的 JPEG，约 450 KB）。版位按 3:4 裁切，换图时保持同名即可。
- `character-sheet.png` / `character-head.png`：来自 `个人IP形象/02_创作小狗/三视图.png` 的角色素材（`character-front.png` 是旧的正面设定图，目前已不在页面上使用）。
- `public/fonts/Inter-*.ttf`：自托管字体，中文回退到系统 Noto Sans SC / 苹方 / 微软雅黑。

素材生成脚本在 `scripts/`：

```bash
python scripts/import_works.py     # 从代表作品.docx 导出 work-01…06.jpg
python scripts/gen_media.py        # 重新生成角色图与首页视频帧（works 会生成 .png 占位图，站点已不使用）
python scripts/cut_character.py    # 角色抠图实验（保留作为参考）
python scripts/read_docx.py 文件路径.docx   # 查看 docx 正文与内嵌图片清单
```

`gen_media.py` 只生成视频帧，编码成 mp4 需要 ffmpeg：

```bash
ffmpeg -y -framerate 25 -i scripts/_frames/hero_%04d.jpg \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart \
  -an public/media/hero-loop.mp4
```

当前这版背景视频的命令（抹水印 + 正倒放拼循环）：

```bash
ffmpeg -y -i "动态表现.mp4" \
  -filter_complex "[0:v]delogo=x=4:y=4:w=104:h=54,split=2[a][b];[b]reverse[rev];\
[a]setpts=N/24/TB[af];[rev]trim=start_frame=1:end_frame=120,setpts=N/24/TB[rf];\
[af][rf]concat=n=2:v=1[out]" \
  -map "[out]" -an -r 24 -c:v libx264 -preset slow -crf 26 \
  -pix_fmt yuv420p -movflags +faststart public/media/hero-loop.mp4

ffmpeg -y -ss 1.2 -i public/media/hero-loop.mp4 -frames:v 1 -q:v 3 public/media/hero-poster.jpg
```

头图里视频默认压暗到 46% 并只铺满背景，左侧和顶部用 CSS `mask-image` 渐隐（见 `src/components/Hero.css` 的 `.hero__video`），这样视频自带的 CE 字样、标语不会跟页面标题和导航抢位置。

## 视觉规范

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--ink` | `#0a050a` | 页面底色 |
| `--berry` / `--berry-3` | `#2a0b24` / `#551542` | 黑莓色层次 |
| `--accent` | `#ff3da6` | 高亮（取自角色耳机与鞋子的品红） |
| `--text` / `--muted` | `#f4ecf2` / `#967f92` | 文字层级 |
| `--shell` | `1700px` | 版心宽度 |

字体：Inter（拉丁，自托管）+ 系统中文黑体；大号数字用 Bahnschrift。

## 截图检查

```bash
npm run dev
node scripts/shot.mjs http://127.0.0.1:5173/
```

结果写到 `scripts/shots/`，包含各屏与整页长图。
