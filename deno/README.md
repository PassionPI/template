# Deno

### Init VsCode Env

1. 下载 `deno` 插件,并全局禁用
2. 打开 `deno` 项目,在该 `workspace` 下开启 `deno` 插件
3. `command` + `shift` + `p`
4. 输入 `deno` ,并选择 init

### Dev

```bash
deno run \
  --allow-read \
  --allow-net=0.0.0.0:7070 \
  --watch \
  src/main.ts
```

or

```bash
deno task start
```

### Build

```bash
deno bundle src/main.ts app.js
```

### Run Production App

```bash
deno run --allow-read --allow-net=0.0.0.0:7070 app.js
```

### Update Module

```bash
deno cache --reload xxx_module.ts
```
