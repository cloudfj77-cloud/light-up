# Light Up 网页原型（原名：光庭）

浏览器 3D 光学解谜游戏，采用 Three.js r180、正交相机、光色混合与持续供能机关。第一至第五关已接入；第六关代码为未接入草稿。

## 开始开发

需要 Git、Git LFS、Python 3.9+；语法检查需要 Node.js 22。

```sh
git lfs install
git clone https://github.com/cloudfj77-cloud/light-up.git
cd light-up/WebPrototype
git lfs pull
python3 tools/build.py
python3 -m http.server 8770 --bind 127.0.0.1
```

浏览器访问 http://127.0.0.1:8770/ 。WASD / 方向键移动，Shift 加速，E / F 拾取或放下灯具，鼠标转向，拖动画面旋转镜头，滚轮缩放。可以用 `?chapter=2` 至 `?chapter=5` 直达关卡。当前进度保存在浏览器 localStorage。

无需 npm 安装，运行资源均来自仓库。若模型加载失败，先运行 `git lfs pull`，检查资源是否仍是 LFS 指针文本。请通过 HTTP 服务运行。

## 源码与生成文件

| 路径 | 用途 |
| --- | --- |
| `main.js` | 游戏入口、关卡调度、输入、UI、相机 |
| `engine.js` | 打包后的 Three.js、加载器、前三关及其测试；后续逐步拆分 |
| `chapter-four.js` / `chapter-five.js` | 第四、第五关 |
| `chapter-six.js` | 第六关草稿，未参与构建或主流程 |
| `mechanism.js` / `orbits.js` | 共用机关、光色 UI |
| `shell.html` | 页面源模板 |
| `assets/` | 12 份资源；模型和图片使用 Git LFS |
| `level_04_spec.json` / `level_05_spec.json` | 第四、第五关规格 |
| `verify-fourth.js` / `verify-fifth.js` | 浏览器内回归用例 |
| `tools/` | 构建、完整性校验、历史导入工具 |
| `app.js` / `index.html` | 已跟踪的生成文件，修改源码后重新构建并一起提交 |

`tools/build.py` 还生成约 91 MB 的 `光庭_五关完整版.html`，只作为交付产物，不入 Git。

## 检查

```sh
python3 tools/build.py
python3 tools/verify_package.py
node --input-type=module --check < app.js
node --input-type=module --check < chapter-six.js
node --check checked-standalone.mjs
```

校验以 `source-manifest.json` 为准，检查本地资源和单文件内嵌资源的大小、SHA-256 与机关约定，不依赖交付者电脑。更换资源时需审查并更新清单。原始 `光庭.html` 未包含在交付包中；若持有该文件，可额外运行 `python3 tools/verify_package.py --source /path/to/光庭.html` 进行历史来源校验。默认会明确报告未执行这项可选检查。

运行本地服务后，分别打开：

- `http://127.0.0.1:8770/?verify=1&campaign=1&third=1`：第一至三关。
- `http://127.0.0.1:8770/?verifyfour=1&verifyfive=1`：第四、第五关。

测试结果写入隐藏的 `pre` 元素，可在浏览器控制台读取：

```js
[...document.querySelectorAll('pre')].map(el => ({ id: el.id, ...JSON.parse(el.textContent) }))
```

2026-09-29 本机 Chromium 实测：21/21、18/18、18/18、23/23、32/32，共 112/112。自动用例不等于完整人工验收；实体手机性能和单文件 file 协议尚未验证。

GitHub Actions 自动执行构建、资源完整性、语法和生成文件同步检查；浏览器回归目前需手动运行。

## 团队协作

`main` 保存通过检查的版本，功能开发使用 `feat/xxx`，修复使用 `fix/xxx`，通过 PR 合并。详见 [协作指南](../CONTRIBUTING.md) 和 [接手评估](../docs/PROJECT_REVIEW.md)。

交付基线标签为 `delivery-20260929`；原交付说明保存在 `docs/DELIVERY_*.md`，仅供历史参考，以本 README 为当前操作入口。`online-baseline.json` 也是交付时的历史记录，不代表当前部署。

`tools/unpack.py` 是一次性历史导入工具，会覆盖游戏源码，不用于日常开发；必须显式传入源文件和 `--force` 才能执行。

仓库公开便于查看，但项目未授予统一的开源许可证；素材及内嵌第三方代码的权利与许可需按各自来源核对，公开仓库不代表可任意再分发。
