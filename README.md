# Kanota

跨平台桌面看板便签应用，基于 Electron 构建。

一边管理看板任务，一边把任意卡片拖到桌面变成浮动便签。

## 功能

- **看板管理**：待办 / 进行中 / 已完成三列看板，右键快速更换颜色、删除
- **桌面便签**：拖动卡片到看板外自动创建便签，支持折叠、展开、固定、拖拽移动
- **颜色主题**：8 种便签底色，看板卡片和桌面便签颜色实时同步
- **右键菜单**：原生菜单，支持更换颜色、状态流转、桌面移除
- **回收站**：删除的便签进入回收站，支持恢复
- **系统托盘**：关闭窗口时选择最小化到托盘或退出
- **深色模式**：自动适配系统主题

## 开发

```bash
# 安装依赖
npm install

# 启动开发模式
npm start

# 打包
npm run build
```

## 技术栈

- Electron
- 原生 HTML / CSS / JS（无框架）
- IPC 通信
- JSON 本地持久化

## 项目结构

```
kanban-app/
├── main.js          # Electron 主进程
├── preload.js       # 看板窗口 preload
├── preload-sticky.js # 便签窗口 preload
├── index.html       # 看板主界面
├── sticky.html      # 桌面便签界面
├── icon.svg         # 应用图标源文件
├── build-icon.js    # 图标生成脚本
└── package.json
```

## License

MIT
