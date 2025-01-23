---
title: 解决 Excel 工作表保护密码
date: '2025-01-23 15:39:36'
updated: '2025-01-23 16:52:53'
---
<!--more--> 
> 参考 ：[https://www.youtube.com/watch?v=2a1cwbmlEIY](https://www.youtube.com/watch?v=2a1cwbmlEIY)
>

# 0x00 前言
本文使用图文的方式介绍了一种通过解压修改XML的方法解决解决 Excel 工作表保护密码的问题，该方法仅适用于2007-2019版本的Excel软件生成带有工作表保护密码的表格文件。

注意，如果是需要密码才能打开文件的，此方法不适用。

# 0x01 解除工作表保护密码
为了实验，我新建了一个工作表，并通过下面的操作添加了保护密码。

![](../../images/posts/9bcd3fca67ec75cd827ea587a8ad8533.png)

## 打开表格
当提示修改表格需要取消工作表保护才能编辑。

![](../../images/posts/b8eb9746045bd56641d207144da18b52.png)

查看文档信息，点击取消保护，提示需要密码进行确认，但我们不知道密码。

![](../../images/posts/1931e283257a637b7e1bbab96489cb44.png)

## 解压缩
复制表格并修改后缀名为zip。

![](../../images/posts/90a422a50d29873fb9b7348139666278.png)

将zip解压缩，进入工作表目录`1\xl\worksheets`

![](../../images/posts/30d4d1f5c5578322759d1b2701fa5dac.png)

## 修改
通过notepad（记事本）打开文本，找到XML标记语言中的`sheetProtection`部分并删除保存。

![](../../images/posts/0f49b2abad8123dd7ec08082a6be5ec2.png)

## 压缩成zip
将文件夹重新压缩成zip后修改后缀为`xlsx`

![](../../images/posts/1b6373b46087c8c17b2f02953fd8a66f.png)

## 打开修改后的表格
此时我们再去修改已经没有阻拦了。

![](../../images/posts/9eb03f0ff57393c3d8cbee710d918b56.png)

# 0x02 显示已经隐藏的工作表
我创建了一个表格，携带两张工作表，其中一张工作表被隐藏了。

![](../../images/posts/1840950a227c98aa64a8f3843f9dec86.png)

## 查看被隐藏的工作表
打开表格，鼠标右键Sheet1，点击查看代码。

![](../../images/posts/5d37c184707b0671778bf49798bd926a.png)

此时我们看到Sheet2的Visible属性是0，表示隐藏了。

![](../../images/posts/6dfd2315022255fe29e91e80aa59a844.png)

这里尝试修改成-1（显示），因为结构锁定的原因，提示不能修改。

![](../../images/posts/06dcd7260532eae44ddea7a0f404cd6e.png)

## 删除隐藏属性
通过解压缩得到XML文件后，找到`12\xl\workbook.xml`文件。

![](../../images/posts/b4bac0da661110ba716b04d21dc6e8a5.png)

右键记事本打开，找到`state="hidden"`直接删除。

![](../../images/posts/aaa247c8eeeb97c843f65de9f5561a78.png)

## 打开修改后的表格
尽管还提示保护。

![](../../images/posts/5238ffeb09c0bf9d8a882734928ef729.png)

可以看到被隐藏的工作表了。

![](../../images/posts/bc28c8b7734acb05e13481c418df78e4.png)

# 0x03 后记
写这个是因为最近碰到了类似的文件，通过这种方式查看到了隐藏的信息。如果是用只能输入密码打开表格的，没有办法只能暴力破解。



