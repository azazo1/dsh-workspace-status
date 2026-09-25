# dsh-workspace-status

为 DSH Web 侧边栏 workspace 图标显示会话状态.

- 活跃会话显示蓝色脉冲效果.
- 未读完成会话显示绿色静态光晕.
- 等待审核, 提权确认或用户回答时显示黄色呼吸闪烁.
- 会话有运行中或正在停止的后台任务时, 目录图标右上角叠加一个蓝色小圆点, 与上面三种状态同时成立.
- 同一个会话在会话列表行的时间左侧也显示这个蓝点.
- 状态按 workspace 的 sessionIds 归属计算.
- workspace 收起后仍保持状态效果.

## 已知限制

- 0.1.7-rc.2 新增的 `sidebar.session.row.leading` 只在该行主状态为 idle 时渲染, 与行自身的状态点互斥; 本插件的蓝点需要和三种行状态同时成立, 因此仍通过 DOM 注入. 行身份直接读会话行的 `data-row-key="session:<id>"`, 支持同名分叉, 改名和列表重排, 不按标题反查.
- 行键和行结构属于宿主 DOM 结构. 行键里的会话不在当前列表快照, 或是尚未产生内容的占位会话时不标记, 防止标错行; 宿主更换行键格式后需要重新验证.
- 只标记已渲染的普通非空白会话行, 搜索结果不注入蓝点. 本插件独立工作, 不依赖其他状态插件或其 DOM 标记.
- 会话活动状态未实时刷新时, 行蓝点可能滞后一帧到一次列表更新.
- 后台任务只镜像当前连接期间登记的任务, 与官方任务列表的数据源一致.

## 构建

```shell
just install
just verify
```

## 安装

Web 端装进 `web` profile:

```shell
dsh plugin --profile web add azazo1/dsh-workspace-status
```

装完重启 `dsh web`, 浏览器里刷新一次页面.

桌面端装进 `desktop` profile. 它由 Electron 应用独占管理, `dsh plugin` 会拒绝 `--profile desktop`, 所以要用应用内的插件管理器: 在插件页的安装入口填上面命令里对应的包名或本地目录. 装上后重启应用, 窗口刷新一次.

引擎版本线要求 `@deepseek-ai/dsh-*` 不低于 `0.1.7-rc.2`, 且仍在 `0.1.x` 上 (声明了 dsh 依赖时 peerDependencies 与 devDependencies 都写作 `>=0.1.7-rc.2 <0.2.0`). 更早的引擎线装不上这个版本.

web 与 desktop 两个 profile 跑的是同一套 Web 应用, 桌面端只是多起一个 Host 子进程并给 `<html>` 打上平台标记, 所以同一份包在两边通用, 不需要分别构建.
