---
title: 解决GitHub Action 计费错误
date: '2026-03-31 11:53:05'
updated: '2026-03-31 11:56:56'
---
<!--more--> 
今天想要自动Action拉去一下语雀博客内容，发现提示需要收费！

![](../../images/posts/5146d798e4efe07d70e83bfb928913d1.png)

从GitHub的文档发现，原来设置成私密仓库执行Action超出免费额度是要计费的！！！

[https://docs.github.com/en/billing/concepts/product-billing/github-actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions?utm_source=chatgpt.com)

![](../../images/posts/8ff96b3d3f39bd8ccc485a1641cd9f83.png)

解决办法就是去修改仓库为Public就行了。

![](../../images/posts/5c1060abefd944872b6dffe7a062fed2.png)

