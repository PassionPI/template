# Deno

### Todo

- [x] app state
- [x] app cookie
- [x] scope route
- [x] 数据校验「静态类型安全 + 运行时安全」
- [ ] 权限「JWT」
- [ ] 定时任务
- [ ] 缓存
- [ ] 稳定性「高可用?」
- [ ] 接入第三方接口
- [ ] open api
- [ ] 日志
- [ ] 监控埋点
- [ ] 单元测试「纯函数 & 接口」
- [ ] 配置功能「静态 & 动态」
- [ ] 环境变量
- [ ] web worker「多线程、锁等异步问题」
  - 数量池
  - 可复用
  - 共享内存

### 启动顺序

1. 获取本地 ENV or config file
2. 链接各个依赖的 service {例如各个数据库}
3. 读取接口 config {用于热更新的配置}
4. 运行当前应用服务框架
5. 监听端口，启动服务

### Init VsCode Env

1. 下载 `deno` 插件,并全局禁用
2. 打开 `deno` 项目,在该 `workspace` 下开启 `deno` 插件
3. `command` + `shift` + `p`
4. 输入 `deno` ,并选择 init

### Dev

```bash
deno run -A --watch --check src/main.ts
```

or

```bash
deno task start
```

### Run Production App

```bash
deno bundle src/main.ts app.js
deno run -A app.js
```

or

```bash
deno run -A --check src/main.ts
```

### Update Module

```bash
deno cache --reload src/main.ts
```
