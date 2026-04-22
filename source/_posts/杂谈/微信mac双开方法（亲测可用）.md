---
title: 微信mac双开方法（亲测可用）
date: '2026-04-22 10:41:08'
updated: '2026-04-22 10:42:37'
---
<!--more--> 
> 来自: [微信4.0.3版本mac双开方法（亲测可用） - 知乎](https://zhuanlan.zhihu.com/p/1896980501740376243)
>

20250704更新，有不会操作的，可以看这贴

[mac版微信双开4.0.6.17版（最详细教程）194 赞同 · 341 评论 文章](https://zhuanlan.zhihu.com/p/1924396537338922039)

---

**原理**：复制微信应用并修改签名，使系统识别为不同应用。

1. **复制微信应用**  
终端执行：

```plain
sudo cp -R /Applications/WeChat.app /Applications/WeChat2.app
```

2. **修改 **[**Bundle ID**](https://zhida.zhihu.com/search?content_id=256613363&content_type=Article&match_order=1&q=Bundle+ID&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NzY5OTgxNDgsInEiOiJCdW5kbGUgSUQiLCJ6aGlkYV9zb3VyY2UiOiJlbnRpdHkiLCJjb250ZW50X2lkIjoyNTY2MTMzNjMsImNvbnRlbnRfdHlwZSI6IkFydGljbGUiLCJtYXRjaF9vcmRlciI6MSwiemRfdG9rZW4iOm51bGx9.oT4y0sY55_MIPBqvctHZor9elZiilK4lYDrMh6UjcuM&zhida_source=entity)  
防止微信检测为同一应用：（直接复制下面两行的内容，不要分别复制）

```plain
sudo /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.tencent.xinWeChat2" /Applications/WeChat2.app/Contents/Info.plist
```

3. **重新签名应用**  
终端执行（需输入密码）：

```plain
sudo codesign --force --deep --sign - /Applications/WeChat2.app
```

4. **启动双开**
+ 手动打开第一个微信（原应用）
+ 终端启动第二个：

```plain
nohup /Applications/WeChat2.app/Contents/MacOS/WeChat >/dev/null 2>&1 &
```

+ 第二个终端应用启动后，可以选择右键在程序坞中保留，这样下次直接点程序坞的程序就可以运行了，不需要再次使用终端命令打开第二个微信。
+ 用此方法也不影响微信输入法的正常使用。

---

2025年5月16日更新了微信版本发现大家提出了一些问题，统一在下边的帖子里回答，大家自行查看。

[大白：微信4.0.5版本mac双开方法（亲测可用）13 赞同 · 87 评论 文章](https://zhuanlan.zhihu.com/p/1906658185441412726)

