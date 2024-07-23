+++
title = "Neovim/Nvchad Beginner's Guide"
date = 2024-06-27T00:26:29+08:00
draft = false
summary = "Throw VS Code Away! Get yourself A modern vim editor if you consider yourself a programmer."
tags = ['Vim']
categories = ['Tools']
+++

> **Warning**
> 本文主要为Mac用户提供Neovim/Nvchad的安装，配置和使用食用指北。请Windows 用户老老实实用VS Code，不要折腾。如果想体验VIM，可以尝试安装Linux虚拟机/物理机。讲得不清楚的地方请直接指出。

> **Info**
> 本文在Macbook Pro 2017 Intel和Mac mini M1上编写，系统版本分别为Ventura和Sonoma, Neovim 版本为0.10.0。

## Preface

使用Neovim 应该有两三年了，折腾来折腾去最终还是选择了[NvChad](https://github.com/NvChad/NvChad)这个配置。最近在[Monad](https://blog.monadx.com) 神的启发下，决定再重新配置一下Neovim 顺便改掉一些用Vim的坏习惯。从Neovim 0.9 到 0.10 遇到了一些坑，然后还发现NvChad又有大更新导致以前的config全滚挂了~~我\*\*~~。网上关于NvChad的教程也比较少，于是决定写一篇NvChad的新手指南。废话不多说，直接开始食用吧。

## Concepts

有一些概念需要给小白科普一下，不然后面看不懂，懂哥直接跳过。

### Vi/Vim/Neovim

`vi` 是Linux 上最常见的编辑器之一，而vim 是vi 的升级版。vim 用户可以通过 vimscript 来自定义vim, aka 客制化。但是vimscript 有点古老，性能和学习成本比较高，于是Neovim 诞生了。Neovim 是vim 的一个分支，它保留了vim 的所有功能，同时还加入了一些现代化的特性，具体就不展开了，有兴趣可以去[官网](https://neovim.io)看看。最重要的是，Neovim 主要用Lua 来配置，游戏开发者应该对Lua 不陌生。

那么问题来了，why vim/neovim? VS Code 不香吗?

你说的对，但是VS Code 在我那台古老的Macbook Pro 非常卡。~~有点想剁手换电脑了~~ 而且经常用终端，切换来切换去也麻烦，不想摸鼠标的时候就着想要是有眼球追踪的鼠标就好了，但不太现实。所以这一切的解决办法就是，vim，编辑器之神！~~再说了Vim 不酷炫吗？~~

综上所述，Vim 的优势就在于：快捷键方便，无鼠标操作，以及高度可定制化。当然，Vim 也有缺点，比如学习成本高，不太适合初学者，而且有时候配置起来也比较麻烦。但是有了NvChad 这个配置，可以简化许多操作。~~当然我用NvChad 只是因为懒得自己配置。~~

### NvChad

NvChad 是一套开箱即用的Neovim 配置，相当于别人写好了拿过来直接用或者稍微改一下就好了，本质上就是依托插件集合和各种设置集合。UI 界面和功能也比较强大，足以媲美IDE(或者说对大部分人而言IDE 很多功能用不到)。

## Installation

安装Neovim 和NvChad 非常简单，只需要几行命令就可以搞定。如果不知道什么是命令行请屏蔽本文。

### Install GCC & MAKE

有些插件需要编译，所以需要安装gcc 和make：

```bash
sudo xcode-select --install
```

### Install Homebrew

[`Homebrew`](https://brew.sh/) 是Mac 上的包管理器，类似于Linux 上的`apt` 和 `pacman`。安装Homebrew 只需要一行命令：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Install Neovim

Mac 自带Vim，但是我们要安装Neovim，只需要一行命令：

```bash
brew install neovim
```

### Install Nerd-Font

[Nerd Font](https://www.nerdfonts.com/) 是一套特殊字体，可以显示一些特殊的图标，比如文件夹，文件等等。NvChad 也需要这个字体，只需要一行命令(Homebrew 真好用)：

```bash
brew install font-hack-nerd-font
```

然后记得在终端设置字体为`Hack Nerd Font`。说到终端，由于自带的终端不支持真彩色，所以推荐换成iTerm2 或者 whatever you like。

### Install Nvchad

终于到了最后一步，安装NvChad：

```bash
git clone https://github.com/NvChad/starter ~/.config/nvim && nvim
```

这个命令会自动打开Neovim，然后安装插件，等待一会就好了。

卸载NvChad

```bash
rm -rf ~/.config/nvim
rm -rf ~/.local/state/nvim
rm -rf ~/.local/share/nvim
```

## Vim Basics

这里就不得不提一个笑话了:

> 如何生成一个随机字符串？
> 
> 让新手退出Vim

在配置之前先来了解vim 的基本操作，然后就可以用vim 来编写vim 配置文件了, 完美！本节内容需要多加练习，不然很快就忘记了。

### Editing Your First File

打开终端，输入

```bash
nvim /path/to/your/file
```
把`/path/to/your/file` 替换成你的文件路径，然后就可以开始编辑了。如果文件不存在，会自动创建一个新文件。

### Move Around

Vim 非常忌惮鼠标以及方向键，所以我们要用键盘来移动光标：

- `h` 向左移动
- `j` 向下移动
- `k` 向上移动
- `l` 向右移动

当然也可以改成WASD，我没意见。有时候想快速移动，可以用

- `gg` 移动到文件开头
- `G` 移动到文件结尾
- `0` 移动到行首
- `$` 移动到行尾
- `w` 移动到下一个单词
- `b` 移动到上一个单词开头
- `e` 移动到下一个单词结尾
- `Ctrl-d` 向下翻页
- `Ctrl-u` 向上翻页

### Editing Text

Vim 有三种模式，可以在左下角看到当前模式，通俗来讲就是(虽然有点啰嗦但是必须要懂):

- Normal: 默认模式, 就是一开始使用的模式, 用来移动光标，删除字符，输入命令。
- Insert: 输入模式，用来输入文本。
- Visual: 可视模式，用来选中文本。

由于很多快捷键都是单字母，为了避免冲突以及拓展功能，所以整了这么三个模式(个人理解)。这三种模式间的切换:

```plain
          i              v
Insert <-----> Normal <-----> Visual
         Esc            Esc
```

`Normal` 到 `Insert` 还有很多快捷键，`Visual` 模式也有三种，并且`Visual` 可以直接切换到 `Insert`，这里就不展开了，有兴趣的可以去看看Vim 的文档。

说了这么多，其实就按`i` 就可以开始输入，然后按`Esc` 就可以退出输入模式。

### Save and Quit

回到最开始的笑话，该怎么退出Vim 呢？答案是用Vim 命令。在`Normal` 模式下，输入`:` 就进入命令模式，然后输入`q` 就可以退出Vim 了。如果文件有修改，需要加`!` 强制退出，文件不会保存。

输入`:w` 就可以保存文件，`:wq` 保存并退出。

看到这里你就已经超过了全国99%的Vim 用户了，めでたしめでたし。

### NvChad Functions

> **Tips** \<leader\> 是一个特殊的按键，一般是空格键，可以在`chadrc.lua` 中修改。
>
> \<M\> 或者 \<Meta\> 或者 \<A\> 在Mac 上是`Option` 键，Windows 上是`Alt` 键。
>
> Vim 不会用到 command 键

有时候不想退出Nvim 直接打开项目的其他文件，可以用nvimtree，快捷键是:

```plain
<leader> e
```

打开了多个文件后，用`Tab` 可以切换下一个文件，`Shift + Tab` 切换上一个，用`<leader> x` 可以关闭当前文件。

如果打开了多个窗口(nvimtree窗口和文件窗口)，可以用`Ctrl + h/j/k/l` 来切换窗口。

有的同学没了补全(Completion) 就不会写代码了，所以这个功能很重要。在提示框中按`Tab` 就可以选择提示，`Enter` 就可以确认。

文件太多了想快速查找，可以用`Telescope` 插件，快捷键是:

```plain
<leader> ff
```

偶尔想换个主题，NvChad 自带了很多主题，可以用`<leader> th` 来切换主题。

懒得列举全部了，按`<leader> ch` 就可以查看Cheatsheet。

### What's More

Vim 还有很多功能，比如搜索，替换，折叠等等，还有很多插件和命令。不过这些都要靠自己去学习，这里只是一个入门指南。推荐几个教程:

- [Neovim Documentation](https://neovim.io/doc/user/): Neovim 官方文档, 速查手册。
- [Learn Vim (the Smart Way)](https://learnvim.irian.to/basics/buffers_windows_tabs): Vim 新手教程，很详细。
- [vim-hardtime](https://github.com/takac/vim-hardtime): 魔鬼模式，禁止使用方向键，让你更快适应Vim。

## Configuration

这一节虽然是进阶教程，但是要用得舒服或者说要取代VS Code，还是需要稍微折腾一下的。~~一点都不折腾怎么能叫计系学生~~

### Lua

前置知识就是[Lua](https://www.lua.org/) 语言。有必要了解一下基础语法，可以快速浏览一下 [Learn Lua in Y minutes](https://learnxinyminutes.com/docs/lua/) 了解大概。应该挺快的。

### Config Files

NvChad 的配置文件在`~/.config/nvim` 目录下，文件结构如下：

```plain
nvim
├── LICENSE
├── init.lua # 别碰
├── lazy-lock.json
└── lua
    ├── chadrc.lua # 多碰
    ├── configs # 别碰
    │   ├── conform.lua
    │   ├── lazy.lua
    │   └── lspconfig.lua
    ├── mappings.lua # 多碰
    ├── options.lua # 别碰
    └── plugins
        └── init.lua # 多碰

4 directories, 10 files
```

我们主要关注这三个文件:

- `chadrc.lua`: 主要配置文件，设置NvChad 自带的插件和功能。
- `mappings.lua`: 快捷键设置文件，用来自定义快捷键，让输入更舒服。
- `plugins/init.lua`: 插件设置文件，添加插件以及修改设置。

剩下的文件等熟悉Nvim 配置之后再碰。

### Setup Dashboard

NvChad 自带了一个Dashboard，在打开Nvim 的时候显示类似VS Code 的欢迎页面，可以用来快速打开文件。默认是关闭的，需要在`chadrc.lua` 中打开:

```lua
M.ui = {
	theme = "gatekeeper",

  nvdash = {
    load_on_startup = true,
  },
}
```

下面的状态栏叫`statusline`, 可以在`chadrc.lua` 中自定义:

```lua
M.ui = {
  tabufline = {
    --  more opts
    order = { "treeOffset", "buffers", "tabs", "btns", 'abc' },
    modules = {
      -- You can add your custom component
      abc = function()
        return "hi"
      end,
    }
  },

  statusline = {
    -- more opts
    order = {...}, -- check stl/utils.lua file in ui repo 
    modules = {
      -- The default cursor module is override
      cursor = function()
        return "%#BruhHl#" .. " bruh " -- the highlight group here is BruhHl,
      end
    }
  }
}
```

### Modify Keybindings

Vim 的快捷键可谓是灵魂，而自定义让灵魂升华。在`mappings.lua` 中可以自定义快捷键，比如:

```lua
map("n", ";", ":", { desc = "CMD enter command mode" })
map("i", "jk", "<ESC>")
map({ "n", "i", "v" }, "<C-j>", "9j") -- in normal, insert and visual mode
map({ "n", "i", "v" }, "<C-k>", "9k")
```

这里的`map` 函数有三个参数，第一个是模式，第二个是快捷键，第三个是要执行的命令或者快捷键组合。还有一个可选参数`desc` 是描述，用来显示在Cheatsheet 中。

我强烈建议新手屏蔽以下快捷键:

```lua
-- disable arrow keys
map({ "n", "i", "v" }, "<Left>", "<Nop>")
map({ "n", "i", "v" }, "<Right>", "<Nop>")
map({ "n", "i", "v" }, "<Up>", "<Nop>")
map({ "n", "i", "v" }, "<Down>", "<Nop>")

-- deactivating mouse
vim.opt.mouse = ""
```

### Add Plugins

NvChad 使用[`lazy.nvim`](https://github.com/folke/lazy.nvim) 管理插件，这个管理器可以延迟加载插件，提高启动速度。比如有一些插件只在特定文件类型下才会用到，就可以不加载来节约资源 (点名批评VS Code 内存泄漏非常严重)。我们在`plugins/init.lua` 中添加插件:

```lua
  {
    "github/copilot.vim",
    lazy = false,
  },

  {
    "kaarmu/typst.vim" ,
    lazy = false,
    ft = "typ",
  },

  {
    "lervag/vimtex",
    ft = "tex",
  },
```

~~这个语法应该挺好懂的。~~ 第一行是作者和插件名称，直接从Github Repo的左上角复制就行，或者作者一般会提供安装方法。这里的`lazy` 设置是否延迟加载，`false` 表示全局加载，剩下的选项不常用~~我也不会~~。`ft` 是文件类型，只有在这个文件类型下才会加载。

是的你没有看错，Neovim 有 `copilot` 插件。~~那我还有什么理由用VS Code。~~

### Add LSP

此LSP 非老蛇皮，而是`Language Server Protocol`。LSP 是一种通信协议，用来连接编辑器和语言服务器，提供代码补全，语法检查等功能。NvChad 使用[`mason.nvim`](https://github.com/williamboman/mason.nvim) 管理LSP，可以自动安装和配置LSP。我们只需要在Nvim 中输入命令

```plain
:MasonInstall <lsp>
```

即可安装LSP，其中LSP 的名字在 `:Mason` 命令中查看。比如安装lua的LSP `lua-language-server`:

```plain
:MasonInstall lua-language-server
```

## Epilogue

心血来潮终于写完了这篇文章，希望对想入门的朋友有所帮助。~~绝对不是在水文章填充我这松弛的Blog~~。Vim 是一个非常强大的编辑器，虽然学习成本很高，多练习多查文档，慢慢就会熟练起来。每次觉得某个操作好麻烦啊，就去网上查一下有没有更快的方法，快捷键或者插件什么的，常用常新~~不比npy有趣得多？~~

俗话说工欲善其事必先利其器，捣鼓这些稀奇古怪的玩意也是一种乐趣。最后祝大家都能成为Vim 大师，~~然后把VS Code 扔掉~~。
