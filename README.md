# dsh-workspace-status

为 DSH Web 侧边栏 workspace 图标显示会话状态.

- 活跃会话显示蓝色脉冲效果.
- 未读完成会话显示绿色静态光晕.
- 状态按 workspace 的 sessionIds 归属计算.
- workspace 收起后仍保持状态效果.

## 构建

```shell
just install
just verify
```

## 安装

将本包作为 DSH Web profile 的插件来源, 或通过 GitHub 仓库安装:

```shell
dsh plugin --profile web add OWNER/REPOSITORY
```
