# 《光庭》五关完整版 — 团队交接说明

交接日期：2026-09-29　|　交付内容：源码 + 资源 + 构建/验证脚本（约 68 MB）

## 一、项目简介

《光庭》是纪念碑谷式固定俯视机位的光学解谜游戏，当前共五关（第一至第五关完整可玩，第六关仅建了 `chapter-six.js` 骨架，尚未接入）。

- 第一关：蓝光引导
- 第二、三关：灰晶石 / 方墩机关、双锁
- 第四关：绿光接替青光维持前桥，青光接替白光维持后桥，腾出的白光开启出口
- 第五关：红灯放绿台、绿灯放红台，利用不同高度接收器建立自动往复循环，再乘绿台抵达上层红门

## 二、本地运行

```sh
python3 -m http.server 8770 --bind 127.0.0.1
```

然后访问：

- 第五关试玩：http://127.0.0.1:8770/?chapter=5
- 第四关及转场：http://127.0.0.1:8770/?chapter=4
- 第三关转场：http://127.0.0.1:8770/?chapter=3

操作：WASD / 方向键移动，Shift 加速，E / F 拾取与放下灯具，鼠标或 ◎ 转向。

> 注意：浏览器无法直接访问 `file://`，必须起本地服务。

## 三、目录结构

| 文件 / 目录 | 说明 |
|---|---|
| `main.js` | 主流程、关卡调度、UI |
| `engine.js` | 引擎主体（含第一至三关逻辑，由 `tools/unpack.py` 一次性从原 `光庭.html` 提取） |
| `chapter-four.js` `chapter-five.js` `chapter-six.js` | 第四、五、六关关卡逻辑 |
| `mechanism.js` | 统一机关构件 `buildMechanism`（烛台 + 八面体晶石） |
| `orbits.js` | 左下角原光色环 `setColorOrbits()` |
| `app.js` | 构建产物，以上脚本拼接结果（已入库，便于克隆即可运行） |
| `shell.html` → `index.html` | 页面模板 → 构建产物 |
| `level_04_spec.json` `level_05_spec.json` | 关卡规格（Y-up，含故事、布局、尺寸） |
| `source-manifest.json` `online-baseline.json` | 资源清单与线上基线校验 |
| `assets/` | 模型与贴图（约 64 MB，含 51 MB 的 `source-02.glb`） |
| `tools/` | 构建与校验脚本 |
| `verify-fourth.js` `verify-fifth.js` | 第四、五关自动化用例 |

## 四、构建

```sh
python3 tools/build.py          # 生成 app.js、index.html、光庭_五关完整版.html
python3 tools/verify_package.py # 校验资源字节一致、原文件未被修改
node --check checked-standalone.mjs
```

**警告：不要重复运行 `tools/unpack.py`** —— 它是一次性导入工具，会覆盖提取后的 `engine.js` 与 `main.js`，丢失已有改造。

## 五、自动化验证

| 参数 | 用途 |
|---|---|
| `?verifyfour=1` | 第四关完整流程、错误顺序、失电、落水、落灯、固定俯视镜头 |
| `?verifyfour=1&verifyfive=1` | 四、五关联测（循环、18 个站位遮挡、灯具与角色随台、夹人保护、转角揭示、镜头避墙） |
| `?verifyfive=1&view=lower/upper/overview` | 检查机位，非正常试玩镜头 |

当前通过情况：第一关 21/21、第二关 18/18、第三关 18/18、第四关 23/23、第五关 32/32。

## 六、Git 建仓建议

1. `assets/` 共 64 MB，其中 `source-02.glb` 单个 51 MB，建议用 Git LFS（本机未安装）：
   ```sh
   brew install git-lfs
   git lfs install
   git lfs track "*.glb" "*.fbx" "*.png" "*.jpg"
   ```
2. 单文件 HTML（`光庭_*完整版.html`）与 `checked-standalone.mjs` 各约 87 MB，已在 `.gitignore` 中排除，需要时用 `tools/build.py` 重新生成。
3. 建议分支约定：`main` 存可运行版本，开发走 `feat/xxx` 后 PR 合并。

## 七、后续待办

- 第六关：骨架 `chapter-six.js` 已建，尚未接入调度与场景
- 第六关未完成，第三、四关完成后可登乘光舟前往下一关的转场需同步补齐
