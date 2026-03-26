---
title: Kali 使用RDP连接Windows终端
date: '2026-03-26 09:41:13'
updated: '2026-03-26 10:25:39'
---
<!--more--> 
以前打攻防的时候有时会用到，但我没有记录下来，这次重新当备忘录记一下。

可以使用`xfreerdp`工具连接，具体如下：

```shell
xfreerdp /u:(username) /p:(password) /v:(Machine IP)
```

实战命令：

```shell
xfreerdp /u:client /p:hogehoge /v:192.168.1.1
```

