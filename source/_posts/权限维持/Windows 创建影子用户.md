---
title: Windows 创建影子用户
date: '2024-09-23 21:52:10'
updated: '2024-09-23 21:54:17'
abbrlink: 4cdf26d7
---
<!--more--> 
# 0x01普通隐藏用户
> 需要管理员权限
>

通过在用户名后面添加 `$` 做到新建隐藏用户

`net user qax$ qaxnb@#123 /add` 

添加后再将用户添加到管理员组

`net localgroup administrators qax$ /add`

这两个命令可以直接用 `&&` 做一个无缝衔接。

![](../../images/posts/d2bfcc5ae75c7148053e97e6c0f45cd2.png)

执行成功后，`net user` 获取用户列表是看不到我们创建的用户的。但是可以在控制面板的用户管理或者 `C:\User\qax$`看到相关的一些信息

我们还可以通过`net user qax$` 命令查看我们创建的用户。通过工具查看。

![](../../images/posts/3eef7389466cb0d596d5b4746620292b.png)

# 0x02 创建克隆用户
### 上机操作方法：
`win + R`打开运行，输入 `regedit` 打开注册表

![](../../images/posts/0bd348330d6632b19e5f4fe351e1ff78.png)

打开注册表后我们找到 SAM 目录

![](../../images/posts/da748cacc8e20b9de4e664774bb4587f.png)

这个情况下我们没法读取，右键SAM文件夹打开权限。给 administrator 用户添加权限。

![](../../images/posts/d6e6672f2acb162895d2263c5b3c5a1a.png)

![](../../images/posts/e4c8de47fc0b6e769209247426612767.png)

点击确认后，我们关闭注册表编辑页面，重新通过运行进行打开。

再次找到后我们可以访问 SAM 目录了。

![](../../images/posts/a27b2bd465660f475b970e8e533fc131.png)

Users 文件夹下的文件和 Names 内的文件顺序对应。

![](../../images/posts/4e91844e6522d6fd4d241466c4b22f48.png)

分别对这三个文件夹进行导出。

我打出命名为

+ 000001FA  -> a.reg
+ 000003EC -> q1.reg
+ qax$ -> q.reg

![](../../images/posts/4ba5598bf55988f2a84daeb33a23df7f.png)

**并将注册表中的 **`**qax$**`**和 **`**000003EC**`** 删除**

**在 cmd 输入 **`**net user qax$ /del**`** 进行删除**

**这两步很关键，做完之后锁屏也发现不了我们的用户。**

![](../../images/posts/b4497749b66b3f5cc326df4bbeb5f80d.png)

将 q1.reg 中的 F 替换成 a.reg 中的 F 值。可以整段复制进行替换。

![](../../images/posts/8bc8f780207bb22822963860650d6d77.png)

替换后将文本保存，然后将 `q1.reg` 和 `q.reg`双击进行添加。再次通过工具查看，发现已经克隆完毕。

![](../../images/posts/2630c89d2feabdcc12c8283060a6f685.png)

