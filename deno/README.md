# Deno

### Todo

- [x] app state
- [x] app cookie
- [ ] app config
- [x] scope route「route 返回中间件」
- [ ] 数据校验「静态类型安全 + 运行时安全」
- [ ] typeORM
- [ ] log
- [ ] 单元测试
- [ ] cors 中间件
- [ ] web worker
  - 数量池
  - 可复用
  - 共享内存
- [ ] ***
- [ ] 权限 JWT
- [ ] 稳定性
- [ ] open api
- [ ] 第三方接口「登陆」
- [ ] 日志
- [ ] 监控埋点
- [ ] 单元测试
- [ ] 配置功能
- [ ] 环境变量

### 启动顺序

1. 获取本地 ENV or config file
2. 链接各个依赖的 service {例如各个数据库}
3. 读取接口 config {用于热更新的配置}
4. 注册当前应用
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
