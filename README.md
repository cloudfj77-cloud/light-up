# Light Up

团队正式开发工程，使用 **团结引擎 1.6.4 / Editor 2022.3.61t5**。

目前完成：标准团结工程、交付素材导入、Git LFS、团队协作配置，以及**可通关的第一关 C# 场景**。原网页五关保存在 `WebPrototype/`，作为玩法与视觉参考；第二至第五关尚未移植。

## 团队第一次打开

1. 安装上述版本的团结引擎以及 Git LFS。
2. 克隆并获取大文件：

   ```sh
   git lfs install
   git clone https://github.com/cloudfj77-cloud/light-up.git
   cd light-up
   git lfs pull
   ```

3. 在团结 Hub 中选择“添加本地项目”，选中仓库根目录（同时包含 `Assets`、`Packages`、`ProjectSettings`），使用 `2022.3.61t5` 打开。
4. 等待 Package Manager 恢复依赖和资源首次导入。`com.unity.cloud.gltfast` 已固定为 `6.10.1`，不要由成员各自升级。
5. 打开 `Assets/_LightUp/Scenes/ChapterOne.unity`，点击 Play，从“静水前庭”开始。该场景也是默认构建入口。
6. 素材展示另见 `Assets/_LightUp/Scenes/DeliveryAssetReview.unity`；菜单 `Light Up > Validate Delivery Import` 检查资源，结果写入本地 `artifacts/tuanjie-import.json`。

## 第一关试玩与开发

- WASD / 方向键按当前画面方向移动（W 向画面上方，A/D 向画面左/右），旋转镜头后仍一致。Shift 奔跑；E / F 拾起、放下灯。
- 携灯时移动鼠标瞄准；空格对准接收晶体。右键拖动旋转视角，滚轮缩放。
- 灯落地后自动朝向晶体；无遮挡的持续照射使门打开、桥升起。留下灯，走过桥抵达对岸才能通关。
- Esc 暂停，R 重置；落水会回到出生点，已放置的灯保留，落入水中的灯回到原位。

编辑保存的场景即可继续开发。`ChapterOneGame.cs` 管理交互与机关，`CourtCamera.cs` 管理镜头，`HeroPose.cs` 播放交付动画。`Art/ChapterOne/` 存放派生动作、材质和晶体网格；生成工具不会覆盖已有场景。第一关目前是可玩的迁移初版，装饰、光照、动画过渡和 UI 仍需要美术/设计验收；尚未加入光舟及后续关卡。

在非 Play 状态执行 `Light Up > Run Chapter One Checks`，自动进入 Play Mode 检查完整走路通关路径、遮挡、断电、碰撞、暂停和复位，结果和场景截图写入 `artifacts/`。该检查会切换到第一关场景，请先保存正在编辑的其他场景。

若 Game 视图模糊或 HUD 被裁切，执行 `Light Up > Fit Sharp Game Preview`：恢复 Free Aspect、原生分辨率和居中的 1× 预览，并关闭 Low Resolution Aspect Ratios。Game 工具栏的 Scale 只放大已有像素；要拉近角色请在游戏中用滚轮缩放相机。当前桌面 Ultra 档使用 4× MSAA，建筑贴图使用 8× 各向异性过滤。

## 目录约定

| 路径 | 用途 |
| --- | --- |
| `Assets/_LightUp/Art/Delivery/` | 交付素材的导入副本，保留原名；GLB 兼容处理见迁移记录 |
| `Assets/_LightUp/Design/` | 第四、第五关原规格 |
| `Assets/_LightUp/Prefabs/` | 已绑定完整贴图的人物 Prefab 变体，正式场景优先使用 |
| `Assets/_LightUp/Scenes/` | 可玩的第一关和素材检查场景 |
| `Assets/_LightUp/Scripts/` | 第一关运行时代码与水面 Shader |
| `Assets/_LightUp/Editor/` | 导入验证、场景生成和 Play Mode 检查工具 |
| `Packages/` | 团队共用依赖及锁定文件 |
| `ProjectSettings/` | 统一引擎、输入、渲染、产品名称和版本控制设置 |
| `WebPrototype/` | 原网页源码、资源、测试、构建工具；迁移参考，不在引擎中执行 |
| `tools/verify_project.py` | 无需引擎的目录、meta、依赖及资源一致性检查 |
| `docs/TUANJIE_MIGRATION.md` | 已导入内容、未迁移内容和后续分工建议 |

日常源码提交 `Assets`（连同 `.meta`）、`Packages`、`ProjectSettings`；不提交 `Library`、`Temp`、`Logs`、`UserSettings` 和本机构建产物。场景、Prefab 和设置使用文本序列化，二进制美术资源使用 Git LFS。详见 [协作指南](CONTRIBUTING.md)。

## 验证与网页参考

```sh
python3 tools/verify_project.py
cd WebPrototype
python3 tools/build.py
python3 tools/verify_package.py
python3 -m http.server 8770 --bind 127.0.0.1
```

网页访问 http://127.0.0.1:8770/ ，五关浏览器回归操作见 [网页说明](WebPrototype/README.md)。网页基线曾通过 112/112 项回归，与团结版的独立检查分开记录。

GitHub Actions 检查项目结构、meta、原始资源一致性，并构建/校验网页基线。团结编辑器导入检查需使用相同版本在本地执行；CI 尚未配置带许可的团结运行器。

仓库为公开仓库，写入由受邀团队成员控制。保留原交付基线标签 `delivery-20260929`。历史文档 `docs/DELIVERY_*.md` 和 `docs/PROJECT_REVIEW.md` 记录早期网页交付状态，以当前 README 为开发入口。项目名称为 **Light Up**；原型中“光庭”的名称保留用于来源追溯。

仓库未授予统一开源许可证；素材及内嵌第三方库依各自来源许可使用。
