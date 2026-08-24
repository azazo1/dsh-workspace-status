# 列出可用的 recipe.
default:
    @just --list

# 安装依赖.
install:
    pnpm install

# 执行 TypeScript 类型检查.
typecheck:
    pnpm exec tsc --noEmit --pretty false

# 构建 Host 和 Client bundle.
build:
    pnpm run build

# 检查类型, 构建和 package 内容.
verify: typecheck build
    pnpm pack --dry-run

# 删除构建产物.
clean:
    rm -rf lib
