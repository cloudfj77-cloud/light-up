# Light Up 团结引擎迁移记录

## 当前边界

2026-09-29：将原 `guangting` 仓库更名为 `light-up`，建立团结引擎团队工程。原交付包的“光庭”是网页原型名称，正式项目名为 Light Up。现有团队权限与提交历史保留。

使用本机已安装的团结引擎 1.6.4，编辑器 2022.3.61t5。旁边的旧“重建工程”是第一人称灰盒，其机制与本次网页交付不同，没有混入本工程。

## 导入清单

| 原文件 | 团结中的用途 | 状态 |
| --- | --- | --- |
| source-02.glb | 哥特建筑素材包 | glTFast 导入模型/材质/贴图 |
| source-03.glb | 原机关与灯体等模型 | glTFast 导入；不含网页代码生成的完整五关 |
| source-04.glb | 箱体、旗帜、植物等装饰 | glTFast 导入 |
| source-05/10/11.fbx | 人物/动画相关交付资源 | 第一关已接入移动、静止、携灯动作；派生动作去除水平位移，由角色控制器移动 |
| source-06/08/09.jpg、source-07.png | 贴图 | Texture2D 导入 |
| source-00/01.json | 原始设计/锚点数据 | TextAsset 导入，尚未解析为玩法配置 |
| level_04/05_spec.json | 第四、五关规格 | TextAsset 导入，尚未自动生成游戏场景 |
| JavaScript、HTML | 原玩法与界面参考 | 保留在 WebPrototype，引擎不执行 |

导入器固定为 Unity 官方 `com.unity.cloud.gltfast` 6.10.1。6.12.0 在本次环境中因运行时代码引用 NUnit 产生编译错误，未采用。`Packages/packages-lock.json` 记录实际解析结果。

原 `source-03.glb` 的 scene 1、2 没有节点，glTFast 会因空节点列表抛出异常。`tools/import_delivery.py` 仅从团结导入副本删除这两个空 scene 并重映射默认索引，保留 GLB 二进制块、所有网格、材质和非空场景。网页原件未改，双份 SHA-256 与处理记录见 `delivery-import-manifest.json`。所有 GLB 导入设置保留场景根节点。

原 FBX 的人物贴图由网页 main.js 动态绑定，直接导入会呈白色。团结工程新增共用 `Art/Derived/Hero.mat`，绑定原色图与法线图，并将原金属度 B 通道、粗糙度 G 通道转换为 Standard 材质的金属度 R、平滑度 A（1 - 粗糙度）。三份 FBX 没有可重映射的源材质槽，因此建立三个引用原 FBX 的人物 Prefab 变体，显式绑定该材质；正式场景使用 `Assets/_LightUp/Prefabs/source-05/10/11.prefab`。原始图片内容保留；可通过 `Light Up > Prepare Hero Material` 重新生成派生材质/贴图。

`DeliveryAssetReview.unity` 仅用于检查模型。各模型在展示父物体下统一缩放并分格摆放；这不是原关卡布局。多个 glTF scene、动画重定向、坐标/朝向、透明材质和灯光效果仍需在正式关卡迁移时逐项对齐。

## 玩法移植顺序

1. **共同基础**：输入、角色移动/碰撞、正交相机、携灯/放灯、重力落地、照射遮挡、RGB 位掩码与持续供能。
2. **第一关纵向验证**：原灯/晶石、门桥、落水复位、暂停重开、实际走到出口；以网页第一关 21 项用例逐项建立团结版验收。
3. **第二、三关**：混色汇光、复合光替换、双锁、光舟转场；明确坐标转换和场景切换边界。
4. **第四关**：连续资源替换、两段桥持续供能，依照 level_04_spec.json。
5. **第五关**：红绿交叉循环、平台载人与载灯、失电返航、门、避墙镜头，依照 level_05_spec.json。
6. **第六关**：网页版本也尚未接入，在前五关基线对齐后再开发。

每关由一个成员负责场景，其余成员以 Prefab/组件分工；每项完成后分别记录编辑器编译、Play Mode 行为和视觉对照。需要独立的 C# Play Mode 测试，不能直接复用网页结果。

## 验证方式

- `python3 tools/verify_project.py`：项目结构、版本、meta/GUID、锁定依赖、原素材哈希与文本序列化设置。
- 团结菜单 `Light Up > Validate Delivery Import`：六个模型均有 Renderer，材质/Shader 非空，四张贴图和四个 JSON 可被编辑器识别。
- 批处理 `-executeMethod LightUp.Editor.DeliveryImport.Validate`：同样检查，可用于将来的团结 CI 运行器。
- `artifacts/tuanjie-import.json`：本地详细导入结果，缓存输出不纳入 Git。

官方资料：[团结资源导入器](https://docs.unity.cn/cn/tuanjiemanual/Manual/BuiltInImporters.html)、[Unity glTFast 编辑器导入](https://github.com/Unity-Technologies/com.unity.cloud.gltfast/blob/main/Packages/com.unity.cloud.gltfast/Documentation~/ImportEditor.md)。

## 本次实测结果

- 本机编辑器完成编译、六份模型/四张贴图/四份设计数据导入检查。
- 新建仅含 `Assets`、`Packages`、`ProjectSettings` 的临时副本，在没有 `Library` 缓存的情况下重新导入并通过同一检查；人物 Prefab 的原色、法线、金属平滑贴图引用均恢复。
- 引擎实际渲染检查场景成功，人物不再是无贴图白模。导入结果见 [验证记录](validation/tuanjie-import-20260929.json)。
- 网页 `app.js` 和 `index.html` 与 `delivery-20260929` 标签逐字节一致，移动目录未改变网页玩法。
- 素材导入阶段不包含五关移植；第一关后续进展见下方，第二至第五关仍为网页参考。

## 第一关 C# 迁移初版

入口为 `Assets/_LightUp/Scenes/ChapterOne.unity`。保存的场景直接引用交付建筑与人物素材，并包含角色控制器、原灯体、接收晶体、滑动门、三段升降桥、水面和对岸终点。场景为团队可直接编辑的文本资产，不在启动时临时生成。

规则以当前网页 `main.js` 和 `mechanism.js` 为准：灯可自由放到地面，落地后自动水平朝向接收晶体，光线被实体挡住即断电。持续供能时门在 1.1 秒、桥在 1.3 秒内升起；通关必须走到对岸。灯落水回到原位，角色落水保留场上的灯并回到出生点。移动、碰撞、暂停、重开、拾放和镜头均为原生 C# 实现。

本阶段保留的差异：接收器为派生八面体；水面使用独立 Shader；建筑装饰只迁移主要模块；未接入旗帜风动、音效、网页后处理、光舟和其他关卡。相机使用右键拖动，空格提供对准晶体的辅助操作；角色动作已有映射，但动作混合及手部精确持灯还需打磨。此阶段验证玩法闭环，不宣称与网页逐像素一致或覆盖原版全部 21 项视觉/行为用例。

原生验证从真实场景进入 Play Mode，直接调用与键盘共用的角色运动和交互逻辑，包含不传送的出生点到出口完整路径。它验证模拟与场景，不替代键鼠人工试玩和 UI 验收。命令行运行时不要带 `-quit`（检查完成自行退出）：

```sh
"/Applications/Tuanjie/Hub/Editor/2022.3.61t5/Tuanjie.app/Contents/MacOS/Tuanjie" \
  -batchmode -projectPath "$PWD" \
  -executeMethod LightUp.Editor.ChapterOneChecks.Start \
  -logFile /tmp/light-up-chapter-one.log
```

需要图形设备以输出截图，勿加 `-nographics`。结果写入 `artifacts/chapter-one-checks.json`；截图为 `chapter-one-start.png` 与 `chapter-one-powered.png`。GitHub CI 当前只执行可移植检查，原生检查使用已安装并激活的同版本团结编辑器执行。

2026-09-29 本机实测：**21/21 项原生 Play Mode 检查通过**，包含角色骨骼姿态变化和真实角色控制器完成通关路径。详情见 [第一关验证记录](validation/chapter-one-20260929.json)。该 21 项是本工程的独立检查，并非网页原版 21 项用例的逐项复刻。已检查引擎渲染的初始/供能截图；尚未执行键鼠人工试玩或桌面 Player 打包验收。
