---
title: EXIF漏洞
date: '2023-12-01 16:37:34'
updated: '2026-04-22 10:56:09'
---
<!--more--> 
## 漏洞描述
我们都知道，在使用手机拍照后，可以通过相册APP分类图片拍摄的地址来筛选我们在某个地方拍的相片，图片在存储这些额外的信息时使用了 Exif 图像文件格式，用于记录数码照片的属性信息和拍摄数据。我们统一把这些额外的信息称之为图片的 Exif 数据。

在一些摄影网站、查看 Exif 网站、网盘网站等上传图片，获取图片 Exif 数据并且将其返回至前端的功能实现，往往可能存在着EXIF XSS漏洞。根据是否存储图片来判断反射型 XSS 和存储型 XSS。

国外参考描述

[https://shahjerry33.medium.com/xss-via-exif-data-the-p2-elevator-d09e7b7fe9b9](https://shahjerry33.medium.com/xss-via-exif-data-the-p2-elevator-d09e7b7fe9b9)

## 漏洞复现
我们需要使用 exiftool 来修改我们图片的 exif 数据 [https://exiftool.org/](https://exiftool.org/)

我们的素材可以通过微信**原图**传输使用原相机拍照的图片到电脑上。

![](../../images/posts/3ff7342730c4f6a58ba36af9a0adc3d3.png)

进入CMD，直接使用命令exiftool.exe a.jpg即可查看图片的 Exif 数据。

![](../../images/posts/99b44106c82ba24fac330793c6113329.png)

使用命令exiftool.exe -Software="<img/src/onerror=alert(document.cookie)>" a.jpg

![](../../images/posts/bcee57569b2d278b91c88e28f86d7351.png)

我找到一个《在线Exif查看、相片相机品牌拍摄参数查看》的网站：

[http://tu.chacuo.net/imageexif](http://tu.chacuo.net/imageexif)

当我们上传图片后就会弹出 Cookie。

![](../../images/posts/fe6d042a8203accddc5b10d010b0707e.png)

XSS 定位

![](../../images/posts/f5e7acd106931ef1813adce680f4111c.png)

## 漏洞案例
### Nextcloud网盘存储
[https://hackerone.com/reports/896511](https://hackerone.com/reports/896511)

![](../../images/posts/47395266783986225a107d378ed79519.png)

![](../../images/posts/76102973c102621a2c81099bdb0ef95b.png)

修复

![](../../images/posts/fb438af8c79ac4d2337cf6b1026bebda.png)

### GitLib 图片解析 RCE
[https://hackerone.com/reports/1154542](https://hackerone.com/reports/1154542)

CVE-2021-22204 [https://github.com/exiftool/exiftool/blob/11.70/lib/Image/ExifTool/DjVu.pm#L233](https://github.com/exiftool/exiftool/blob/11.70/lib/Image/ExifTool/DjVu.pm#L233)

文件lib/Image/ExifTool/DjVu.pm

![](../../images/posts/7d8357b44808b0470b72e35c507ac078.png)

[https://github.com/LazyTitan33/ExifTool-DjVu-exploit/blob/main/CVE-2021-22204.py](https://github.com/LazyTitan33/ExifTool-DjVu-exploit/blob/main/CVE-2021-22204.py)

![](../../images/posts/28583906816dea1918af26ed04e9903b.png)

详细：[https://devcraft.io/2021/05/04/exiftool-arbitrary-code-execution-cve-2021-22204.html](https://devcraft.io/2021/05/04/exiftool-arbitrary-code-execution-cve-2021-22204.html)

DJVU示例文件： [https://github.com/exiftool/exiftool/blob/12.23/t/images/DjVu.djvu](https://github.com/exiftool/exiftool/blob/12.23/t/images/DjVu.djvu)

JPG转DJVU [https://convertio.co/zh/jpg-djvu/](https://convertio.co/zh/jpg-djvu/)

## 检测工具
Chrome插件： [https://github.com/yuLinnnn/ExifScan](https://github.com/yuLinnnn/ExifScan)

![](../../images/posts/5d60165da562f15c2074b8b9dffd9dec.png)

### 原理
![](../../images/posts/5b8b1af1908d704cbe3a3d4619c8958d.png)

[https://gist.github.com/yepitschunked/9d2e73d9228f5a0b300d75babe2c3796](https://gist.github.com/yepitschunked/9d2e73d9228f5a0b300d75babe2c3796)

![](../../images/posts/fabac62e78644c171b605a41d51963b8.png)

详细的标记查询。

[https://www.media.mit.edu/pia/Research/deepview/exif.html](https://www.media.mit.edu/pia/Research/deepview/exif.html)

![](../../images/posts/57120ae54b8754e120a3461e5206d42e.png)

![](../../images/posts/adf694691944b997d551ce190e464f1d.png)

