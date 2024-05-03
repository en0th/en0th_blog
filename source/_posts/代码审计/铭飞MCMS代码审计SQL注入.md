---
title: 铭飞MCMS代码审计SQL注入
date: '2024-04-30 17:41:59'
updated: '2024-04-30 17:42:27'
---
<!--more--> 
## 0x00 前言
铭飞MCMS是政府、教育等其他行业常用的CMS，应用广泛，但是底层的代码中仍然遗留不少的问题。这篇文章主要针对SQL注入进行审计并探讨如何快速定位SQL注入漏洞，以及其他工具的应用。
> 铭飞MCMS，是完整开源的Java CMS！基于SpringBoot 2架构，前端基于vue、element ui。每两个月收集issues问题并更新版本，为开发者提供上百套免费模板,同时提供适用的插件（文章、商城、微信、论坛、会员、评论、支付、积分、工作流、任务调度等...），一套简单好用的开源系统、一整套优质的开源生态内容体系。铭飞的使命就是降低开发成本提高开发效率，提供全方位的企业级开发解决方案。

## 0x01 审计环境
Mingsoft MCMS v5.2.8
Mysql 8.0.29
Openjdk 19.0.1
代码下载地址：[https://gitee.com/mingSoft/MCMS/tree/5.2.8/](https://gitee.com/mingSoft/MCMS/tree/5.2.8/)
## 0x02 审计思路
现代做代码审计的工具市面上已经有很多了，在拿到源码的时候，第一时间当然是先使用工具进行扫描，节省人工时间。尽管有fortify、奇安信代码卫士这些工具在，但避免不一些纰漏，仍然需要人工经验的判断。
### 利用自动化代码审计工具
这里我们使用 fortify 工具对源码进行扫描，记录了我遇到的两个问题。该 fortify 工具为收费工具，本文不提供破解版的下载方式。
#### 1.反编译 jar 包
使用 fortify 导入MCMS 源码进行代码审计，但效果往往不如意。因为这一套源码使用 Maven 作为项目管理工具软件，其中包括依赖管理，MCMS项目依赖的jar包都是远程拉取的。其中net.mingsoft.ms-base、ms-basic、ms-mdiy为底层逻辑代码。拉取的时候是以jar包的形式存在的，而自动化工具不会对jar包进行扫描。
![image.png](../../images/posts/27210bb801175ee32f3a5c3a93640280.png)
我们可以将 jar 包重命名为 zip，然后解压就能获得 class 文件。但 fortify 同样不会扫描 class 文件，我们需要进一步反编译。这里我们可以使用 jadx 进行反编译。
jadx 工具下载地址：[https://github.com/skylot/jadx/releases/download/v1.4.5/jadx-gui-1.4.5-with-jre-win.zip](https://github.com/skylot/jadx/releases/download/v1.4.5/jadx-gui-1.4.5-with-jre-win.zip)
![image.png](../../images/posts/6214a359781bdacce50173b15bcd1487.png)
我们可以直接打开 jar 文件，通过快捷键 Control+S 将反编译后的资源进行保存。
![image.png](../../images/posts/c20be2bee619d717ed3e05e8cf213bde.png)
导出之后就是 java 文件，是可以被扫描的文件类型。
![image.png](../../images/posts/c2452501b9afdefbdadbe0f21ecf0c4b.png)
#### 2.不扫描 JS 文件
在扫描代码的实践中，我遇到 JS 文件数量过多情况，导致整体的扫描进度大幅度拉长，这不是我想要的。
找到 fortify/Core/config 目录下的 fortify-sca.properties
![image.png](../../images/posts/43195f1eacea50afdc22afda3aa52972.png)
其中 `com.fortify.sca.DefaultFileTypes` 一项规定了被扫描文件的类型。我们把其中的 `,js`删掉就可以了。 
![image.png](../../images/posts/dacbabc84515cff68a9f6280b3f86aa8.png)
### 人工审计SQL注入思路
造成SQL注入一般需要满足以下两个条件：
（1）输入参数内容用户可控。
（2）直接或间接拼入SQL语句执行。
且在执行SQL语句时有不同的方式：
（1）直接使用 JDBC 的类方法。
针对这种执行SQL语句的方式，我们可以全局搜索 SELECT、DELETE、UPDATE 等 SQL 关键词或者搜索 Statement、PreparedStatement方法名称来定位执行语句的地方。
（2）使用 MyBatis 持久化层作SQL语句执行代理。
MyBatis 持久化层中一般使用 `#{}` 在底层实现上使用 “？”作为占位符，是预编译的机制。在实践过程中，类似`order by`等不能使用单引号的地方都不可以使用预编译，转而使用 `${}`直接拼接到SQL语句中。一般这种情况需要手动增加内容的严格过滤步骤。所以尽管预编译很强大但也有用不上的地方，而这些地方就是我们的突破口。
## 0x03 审计过程
由上面的描述可以知道使用 `${}`的地方往往可能存在SQL注入风险，所以我们审计过程中可以直接全局搜索`${}`。
### 1. 底层映射存在注入漏洞引发多个前台注入
#### 原因
在SQL持久化层 `IBaseDao.xml` 文件中可以看到绑定id 为 sqlWhere 的 Sql 映射里使用了 `${}` 导致存在SQL注入的风险。
![image.png](../../images/posts/f96e1a7de212409a4211ac84cdf2f17c.png)
#### 第一处 GET类型
在 `IDictDao.xml` 中引入 `IBaseDao.xml` 映射语句。
![image.png](../../images/posts/dac6cc733d9251596a93089aa46ad14a.png)在 `IDictBiz` 这个业务层是继承了 `IBaseBiz` 从而有 query 确定返回类型为 DictEntity。
![image.png](../../images/posts/a84355cf802488bc5e6840303934b15a.png)
在控制层 web/DictAction.class 中可以看到这里请求数据包的数据变成了实体，然后直接传入 `dictBiz.query` 中。
![image.png](../../images/posts/610849379eafed88609fcf28b50f4e0b.png)
我们请求这个接口时，所有传入的参数与值会别当作 DictEntity，所以这里直接传 `sqlWhere` 即可。
![image.png](../../images/posts/fefe1c93c4a003aa0e4755f34f1390a3.png)
`sqlWhere` 的值为 `[{"action":"","field":"extractvalue(0x7e,concat(0x7e,(database())))","el":"eq","model":"contentTitle","name":"文章标题","type":"input","value":"a"}]`
#### 第二处 GET 类型
在 `IDictDao.xml` 中引入 `IBaseDao.xml` 映射语句。id 为 `queryExcludeApp`。
![image.png](../../images/posts/ecefe09e0da1fc3d29dbe1eb8f3b0cca.png)
在控制层 web/DictAction.class 中可以看到这里请求数据包的数据变成了实体，然后直接传入 `dictBiz.queryExcludeApp`中。
![image.png](../../images/posts/c98f7f3ecb57328589f456dc2b4d32dc.png)
同样的这里所有传入的参数与值会别当作 DictEntity，存在同样的问题。
![image.png](../../images/posts/2d002e1dca807b8ce2e22c0f3843a5a1.png)
#### 第三处 POST类型
在 `ICategoryDao.xml` 中引入 `IBaseDao.xml` 映射语句。
![image.png](../../images/posts/dde9fddcd87bdc4874e4ae53eed863e5.png)
在控制层 web/CategoryAction.java 中可以看到这里请求数据包的数据变成了实体，然后直接传入`categoryBiz.query` 中。
![image.png](../../images/posts/2e2d103c49ae9fb295afd6d8024087a6.png)
这里的实体类型有了变化，但不妨碍我们传入 `sqlWhere`导致漏洞的执行。
![image.png](../../images/posts/cfaffc71a6599ce2a9a33355528ecd97.png)
#### 第四处 POST类型
在 `IContentDao.xml`  中引入 `IBaseDao.xml` 映射语句。
![image.png](../../images/posts/552ba20c900e602fa083acc846ec541a.png)
在控制层 web/ContentAction.java 中可以看到这里请求数据包的数据变成了实体，然后直接传入`contentBiz.query` 中。
![image.png](../../images/posts/6c230979a717b4d0b54c3a776c55c0ef.png)
只要引入之后，如果没有过滤都是存在漏洞的。
![image.png](../../images/posts/0626ef12f6c2211fa1874f2c2f8ee72e.png)
### 2. 后台自定义模型任意SQL语句执行
在持久化层 `IBaseDao.xml` 中存在一处绑定了 id 为 `excuteSql` 的 SQL 操作语句。该地方直接执行了传入 SQL 语句。
![image.png](../../images/posts/6ec814a40b2efcc9d0e7d8a01d96940f.png)
持久化层代理 IBaseDao.class 写好了对应 IBaseDao.xml 的接口
![image.png](../../images/posts/fd6d82ac831c311237b299457bb2dea4.png)
IModelDao.class 继承了 IBaseDao 确定了类型为 ModelEntity
![image.png](../../images/posts/9d19ba14b90db411d42527bdbb909a7a.png)
![image.png](../../images/posts/c215ba13a3c17980ecdf89d328426604.png)
业务层 IModelBiz.class 定义了一些接口
![image.png](../../images/posts/8314c6c88763775b67ddfd27ecc67109.png)
业务实现层 ModelBizImpl.class 实现了 IModelBiz.class 接口，通过阅读代码，可以发现实际上在 importModel 函数里面使用了 IModelDao.class 中的 excuteSql 方法。
![image.png](../../images/posts/c5e3a75d52915c8f3f5a914bf7bc08be.png)
在控制层 ModelAction.class 中 importJson 函数里调用了 ModelBizImpl.class 的 importModel 函数。
![image.png](../../images/posts/d30f4ddf75c38698defd21ace54b0493.png)
该漏洞产生位置存在后台自定义模型的导入功能处，要使用该功能需要到 [https://code.mingsoft.net/](https://gitee.com/link?target=https%3A%2F%2Fcode.mingsoft.net%2F) 生成代码。
![image.png](../../images/posts/820a167ffae73f534abf059c2fe2de7d.png)
新建业务表单 ——> 拖动表单组件 ——> 填写字段名和默认值 ——> 生成代码
![image.png](../../images/posts/06c597a89e8cfd9a700301f0792a011c.png)
可以看到生成的自定义模型代码，我们复制出来将 sql 字段的 value 改成我们自定义的即可。
![image.png](../../images/posts/eb67023507529c6257075d9aaffabc44.png)
任意都行没有过滤和限制，语句的行是通过 `split(';')`来分割的。
![image.png](../../images/posts/091898df262fb8d26d0ebede6ee46f46.png)
这个其实是MCMS的核心业务，无法避免的使用，所以只要使用 MCMS 拥有自定义模型的导入功能的权限就可以利用SQL注入获取数据或者系统权限。
### 3.校验参数接口前台SQL注入
> 这节内容引用 [https://gitee.com/mingSoft/MCMS/issues/I5OWGU](https://gitee.com/mingSoft/MCMS/issues/I5OWGU)

因为使用了 mybatis 框架这里就全局搜使用 $ 进行拼接的，发现在/net/mingsoft/ms-base/2.1.13/ms-base-2.1.13.jar!/net/mingsoft/base/dao/IBaseDao.xml
![image.png](../../images/posts/d44e9acd5e22646e3cf609fb935086a6.png)
进一步跟进queryBySQL
![image.png](../../images/posts/ae975c5db70ce44fe40ffa21c5310025.png)
查看对应接口中的实现方法
![image.png](../../images/posts/5c6eb01dc272502ce4bb0a12406e96bf.png)
然后在/net/mingsoft/base/biz/impl/BaseBizImpl.java这里进行了重写queryBySQL，然后调用getDao().queryBySQL
![image.png](../../images/posts/de4832dc9c2cd47c33e1121238435241.png)
然后发现在/net/mingsoft/basic/action/BaseAction.class#validated 验证的时候进行调用
![image.png](../../images/posts/13bceee62d36f62f09afb1de4694eab7.png)
继续跟，这时候只要找到前端路由中能调用validated就可以了，然后发现在/net/mingsoft/ms-mdiy/2.1.13.1/ms-mdiy-2.1.13.1-sources.jar!/net/mingsoft/mdiy/action/PageAction.java#verify
调用了validated方法
![image.png](../../images/posts/2588eea7d099fe077bb81685b0200eb3.png)
寻找路由，通过分析我们这个是个GetMapping 然后参数fieldName、fieldValue、id、idName 随便构造一下，最开始我们看到的key对应的就是前端传进来的fieldName
![image.png](../../images/posts/347345173436b6c1116ea655ed38d657.png)
`http://127.0.0.1:8008/ms/mdiy/page/verify.do?fieldName=1;select/**/if(substring((select/**/database()),1,4)='mcms',sleep(5),1)/**/and/**/1&fieldValue=b&id=c&idName=1`
`fieldName`是传入了 `${key}`直接拼接到SQL语句导致SQL注入。
![image.png](../../images/posts/eb3706642075fe7ca7b80f6c2e380f5e.png)
## 0x04 总结
代码审计论证了预编译不是万能的，否则不会出现这么多的 SQL 注入漏洞。在不能使用预编译处理参数值，只能通过拼接进行操作的地方，除了手工写过匹配危险字符滤函数之外还有什么方法吗？我们还可以严格要求传入的参数类型，例如数字的地方将用户输入的内容进行强制转化成 int 不行就报错处理，这种称之为表单过滤层。如果我们的代码体积庞大无法花费大量人力去排查漏洞存在，可以购买安全公司的代码审计服务和WAF防火墙产品。
## 0x05 参考感谢

- [https://gitee.com/mingSoft/MCMS/issues/I5OWGU](https://gitee.com/mingSoft/MCMS/issues/I5OWGU)
- [https://gitee.com/mingSoft/MCMS/issues/I5X1U2](https://gitee.com/mingSoft/MCMS/issues/I5X1U2)
