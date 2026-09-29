# Light Up

团队正式开发工程，使用 **团结引擎 1.6.4 / Editor 2022.3.61t5**。

目前完成：标准团结工程、交付素材导入、素材检查场景、Git LFS 和团队协作配置。原网页五关保存在 `WebPrototype/`，作为玩法与视觉参考。**网页玩法尚未移植为 C#；素材检查场景不是五关游戏。**

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
5. 打开 `Assets/_LightUp/Scenes/DeliveryAssetReview.unity`。这是六份模型的检查展台，显示比例只作用于展台父物体；原素材尺寸保留；灯体 GLB 的两个空场景已在导入副本中清理，网格和材质未改。
6. 菜单 `Light Up > Validate Delivery Import` 检查资源，详细结果写入本地 `artifacts/tuanjie-import.json`。

## 目录约定

| 路径 | 用途 |
| --- | --- |
| `Assets/_LightUp/Art/Delivery/` | 交付素材的导入副本，保留原名；GLB 兼容处理见迁移记录 |
| `Assets/_LightUp/Design/` | 第四、第五关原规格 |
| `Assets/_LightUp/Prefabs/` | 已绑定完整贴图的人物 Prefab 变体，正式场景优先使用 |
| `Assets/_LightUp/Scenes/` | 团结场景，当前为素材检查场景 |
| `Assets/_LightUp/Editor/` | 导入验证与检查场景生成工具 |
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

网页访问 http://127.0.0.1:8770/ ，五关浏览器回归操作见 [网页说明](WebPrototype/README.md)。网页基线曾通过 112/112 项回归，**这不代表团结版玩法已实现或通过测试**。

GitHub Actions 检查项目结构、meta、原始资源一致性，并构建/校验网页基线。团结编辑器导入检查需使用相同版本在本地执行；CI 尚未配置带许可的团结运行器。

仓库为公开仓库，写入由受邀团队成员控制。保留原交付基线标签 `delivery-20260929`。历史文档 `docs/DELIVERY_*.md` 和 `docs/PROJECT_REVIEW.md` 记录早期网页交付状态，以当前 README 为开发入口。项目名称为 **Light Up**；原型中“光庭”的名称保留用于来源追溯。

仓库未授予统一开源许可证；素材及内嵌第三方库依各自来源许可使用。
