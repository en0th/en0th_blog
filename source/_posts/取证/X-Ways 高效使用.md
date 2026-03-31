---
title: X-Ways 高效使用
date: '2025-05-03 20:01:15'
updated: '2026-03-26 09:32:59'
abbrlink: 8a4bbb7a
---
<!--more--> 
学习资源&参考：

1. 微信公众号：金星路406取证人、WXF技术相关

# 基础使用
## 语言修改
打开文件后，可以修改成中文。

![](../../images/posts/ec6ef28f17dd6fdad3d38b31ef8d8a5f.png)

## 新建案件
案件数据，选择创建案件

![](../../images/posts/c947335723997dfc312eb4972220ea31.png)

只需要修改案件名称就可以了。

![](../../images/posts/81786ce9a05fba8b2e2ab671f137f60b.png)

默认是按电脑语言来的，最好换成UTF-8。

![](../../images/posts/3f3a6ec9042a5fc0fdaef557f6993cdd.png)

然后点击添加镜像文件（如E01），这是最常用的。

![](../../images/posts/63c69c56b618c84a0a7814808bb8bbe7.png)

点击这里可以查看当前镜像存在的SID，即用户。

![](../../images/posts/0908193e995b14479b56f83cceadd1f1.png)

可以方便看到SID和用户名对应。

![](../../images/posts/0a44bf666ec937eb6f92170116ceeb93.png)

## 高效配置
1. 常规设置

![](../../images/posts/c03f4cce71466665bbe7c7bdbd8432f7.png)

2. 添加多个字符集查看，建议添加UTF-8、UTF-16小端序、GBK

![](../../images/posts/dc6885beb5b29e70c6047471c6b58d09.png)

GBK需要打开代码页进行添加。

![](../../images/posts/12533fa68f4a9165c867281eed684fa5.png)

3. 配置查看器

![](../../images/posts/66b621b83179b3940150abd949836f6b.png)

添加一些基本的查看工具，自定义查看器添加后，可以在右键菜单中看到。

![](../../images/posts/5c2e32dae37f963701e8b7514832fb6e.png)

软件会导出文件后用关联的程序进行打开查看。

![](../../images/posts/98134f158d1a9a1f2d27654dacff195c.png)

4. 数据解释器

可以方便展示选中的hax进行进制转换。

![](../../images/posts/775d86fa09e2983c4417764d3a8e591c.png)

右键弹出选项。

![](../../images/posts/4d79205f43da2fa83b7402920664172a.png)

可以将常用的勾选上，IP address也常用。

![](../../images/posts/f7b5263d254ded7662d281280d8ac4dd.png)

这样就会显示的比较全面。

![](../../images/posts/f49f2e6c179baa9255bc6a49465cad5a.png)

## 手动磁盘分析
为了搜索能够全面，可以手动进行磁盘快照。

![](../../images/posts/04453712183ff3af4ff9ef5ebed98f5a.png)

勾选需要的选项。 

![](../../images/posts/b63482f5f023608cdb842e2dee9bd44c.png)

不熟悉所以点击默认了。

![](../../images/posts/be9b28557c43af79638bfe562a262756.png)

这里也是默认，下面有个选项是利用收集的密码尝试解密，是在案件设置里的。

![](../../images/posts/63aeb7e9e8c6d0a78e311de02b1a09ec.png)

![](../../images/posts/1b7a7de0d58b2bc858963ba4064b757b.png)

也可以通过选中指定文件进行磁盘快照。

![](../../images/posts/48108771367a99ccc75e32fa05f7ef53.png)

分析完成后可以快速预览压缩包内的信息

![](../../images/posts/fa3363d1adb839e6816833e7b7ebe999.png)

点击游览进入后可以看到里面的内容。

![](../../images/posts/179cdc02cd4cfc0e9da49002f6767ddd.png)

## 查看磁盘信息
磁盘右键点击属性即可。

![](../../images/posts/114f17ebcedcc34d39390442b39497ce.png)

详细可以看案件描述。

![](../../images/posts/9a5337d4527b725a914d3c567c4440b6.png)

## 查找丢失的分区
可以在磁盘工具里找到。

![](../../images/posts/1d6928925ec77e4e58946a613830d446.png)

Windows一般只选第一个，安卓可以选Ext2。只推荐选一个，不建议多选。

![](../../images/posts/b370f1b8a0de5974c9b8be93453ea649.png)

## 过滤
右键分区，点击游览递归，可以查看子目录的文件。

![](../../images/posts/a102ffae1c15ab93dca5884ec3c62b02.png)

1. 导入过滤方法

点击文件游览器的右边箭头。如果要保存，点击箭头旁边的存储按钮，可以保存settings文件。

![](../../images/posts/1c8baa8678afd83fc9ebc79e153f15fc.png)

选择settings文件。

![](../../images/posts/75711695e102729179039a8b04d2da81.png)

点击打开后就可以筛选出来了。

![](../../images/posts/abdea38654eae8cda3cd6499a83dd9c7.png)

2. 手动过滤

点击想要过滤器图标按钮，在过滤类型中选择想要找到的文件类型，最后点击激活。

如果要取消过滤，同样的点击图片按钮，再点击禁用即可。

![](../../images/posts/b1ba74881493697f3f5e260f1da49e0d.png)

点击之后可以看到因为过滤规则不一样，搜索出来的注册表也不一样。

![](../../images/posts/4cccdefc995a9574572733574f3d04da.png)

3. 取消所有过滤条件

![](../../images/posts/bc12737746665b9e8075213cf18bbc55.png)

4. 简单查找加密容器

容器一般大于1G，也可以不勾选大于条件或者大于条件设置为大于1M，但这样会造成广泛筛选出很多文件。

为什么是mod 1048576？因为VeraCrypt创建加密容器设置容量大小时要求输入整数倍数字。

这里显示出了两个，很明显vhdx是一个容器卷。

![](../../images/posts/762fd87afe5b7e3dc84b6f1a85002053.png)

右键进行磁盘快照。

![](../../images/posts/45e1ed91ae430750aacebb4698413f42.png)

然后选择加密算法检测。

![](../../images/posts/4e1f028c68c20b086e9adcf5474889b6.png)

VeraCrypt创建加密容器。

![](../../images/posts/adf549bda1cf84f1fa0622ae3e108892.png)

需要设置容量大小的，这里的大小都是整数倍。

![](../../images/posts/580c32a697be9c7a8f19a1e75af81f5a.png)

5. 设置显示字段

点击地址栏的地方

![](../../images/posts/c30d45a176463bffee9e49dd0e7e2197.png)

点击更换状态是是否启用，为0是不启用状态。

![](../../images/posts/c3b028b7e9c4d38827271dda60d9c7cc.png)

## 同步搜索
参考：[07 - Quick Guide to X-Ways Forensics: Recover/Copy](https://www.youtube.com/watch?v=An430_P-3nc&list=PLB0pU0wP67A9LezmyZO5I6DnHPEWjgjOD&index=7)

全局进行搜索，可以再搜索菜单里点击同步搜索。

![](../../images/posts/b761d9bd299f5fb147e8adff303bedd0.png)

红色框内的选项根据实际情况进行修改。

![](../../images/posts/0a12211dbac8d0ec4be71e5afc6be9a8.png)

搜索时，可以点击这个图片按钮查看已经查找到的文件。

![](../../images/posts/cd6e0ab0db8163aa79154826762068f3.png)

