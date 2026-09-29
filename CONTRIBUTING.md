# Light Up 团队协作

## 统一环境

- 团结引擎 **1.6.4 / 2022.3.61t5**，升级版本应单独开 PR，由全员一起切换。
- 提交 `Packages/manifest.json` 和 `Packages/packages-lock.json`，保持依赖一致。
- 根目录是正式团结工程，`WebPrototype/` 是网页玩法参考。

## 日常流程

1. 拉取最新 `main`，执行 `git lfs pull`，再打开团结工程。
2. 使用 `feat/xxx`、`fix/xxx` 分支；尽量每次只修改一个功能或关卡。
3. 在引擎 Project 窗口内移动/重命名资源，保证 `.meta` 和 GUID 随资源保留。通过脚本移动时也必须一起移动 `.meta`。
4. 执行 `python3 tools/verify_project.py`，打开相同版本编辑器确认无编译错误，运行 `Light Up > Validate Delivery Import`。
5. 检查 Git diff，只提交有效资源、代码、场景和配置；不要提交 `Library/Temp/Logs/UserSettings`。
6. 推送分支，创建 PR，写清修改行为、场景/素材影响和验证证据，由另一位成员审阅再合并。

这些是团队约定，是否强制取决于仓库分支规则。公开仓库可被其他人查看或提出 PR，但不会自动给他人写权限。

## 场景与 Prefab

启用 Visible Meta Files 和 Force Text。场景及 Prefab 仍可能产生逻辑冲突，同一场景尽量同一时间由一人负责；多人功能优先拆成独立 Prefab。不要把整个 `.unity`、`.prefab`、`.asset` 或 `.meta` 全局纳入 LFS，以免失去文本审查能力。

## 美术资源

模型、贴图和音频已配置 LFS。原始 `Assets/_LightUp/Art/Delivery/` 用于与网页清单对照，不原地覆盖；正式制作的新资源放在另一个业务目录。每次新增资源保留出处/许可记录。二进制资源同一时间尽量由一人编辑。

项目锁定 glTFast 6.10.1 来导入 GLB；不要手工转换模型或升级导入器后直接提交大量 `.meta` 变化，先检查材质、层级、尺寸和动画。

## 玩法迁移

JavaScript 和 Three.js 不会在团结引擎中作为游戏逻辑执行。关卡移植使用 C# 组件、场景和 Prefab；依照 `docs/TUANJIE_MIGRATION.md` 分阶段验证，不能将网页的 112 项测试标记为团结版通过。

若改动网页参考，先在 `WebPrototype/` 运行构建和校验，把重新生成的 `app.js` 与 `index.html` 一起提交。
