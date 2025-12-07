---
title: VMware Fusion 13.6 安装 Kali Linux 2025.2 ARM 报错
date: '2025-12-07 21:32:02'
updated: '2025-12-07 21:46:28'
---
<!--more--> 
原文：[https://www.layer23-switch.com/blog/vmware-funsion-install-kali-error.html](https://www.layer23-switch.com/blog/vmware-funsion-install-kali-error.html)

# <font style="color:rgb(45, 55, 72);">先说结论</font>
<font style="color:rgb(45, 55, 72);">在安装程序第一步选择语言时</font>**<font style="color:rgb(45, 55, 72);">不要选择中文</font>**<font style="color:rgb(45, 55, 72);">  
</font>

<font style="color:rgb(45, 55, 72);">在苹果 Mac M4 设备上使用 VMware Fusion 安装 Kali Linux ARM 版本来是一件很平常的事，但当我尝试安装最新的 </font>**<font style="color:rgb(45, 55, 72);">Kali Linux 2025.2 for ARM</font>**<font style="color:rgb(45, 55, 72);"> 时，他卡在了“</font>**<font style="color:rgb(45, 55, 72);">Select and Install Software</font>**<font style="color:rgb(45, 55, 72);">”步骤一直报错</font>

![](../../images/posts/60f164871cd6fb33ab4978c93849f446.webp)

## <font style="color:rgb(49, 130, 206);">问题背景</font>
<font style="color:rgb(45, 55, 72);">我的设备环境如下：</font>

+ **<font style="color:rgb(45, 55, 72);">硬件</font>**<font style="color:rgb(45, 55, 72);">：Mac M4 芯片</font>
+ **<font style="color:rgb(45, 55, 72);">虚拟化平台</font>**<font style="color:rgb(45, 55, 72);">：VMware Fusion 13.6</font>
+ **<font style="color:rgb(45, 55, 72);">系统镜像</font>**<font style="color:rgb(45, 55, 72);">：Kali Linux 2025.2 ARM 最新版</font>

<font style="color:rgb(45, 55, 72);">在安装过程中，当安装流程进行到</font><font style="color:rgb(45, 55, 72);"> </font>**<font style="color:rgb(45, 55, 72);">“Select and Install Software”</font>**<font style="color:rgb(45, 55, 72);"> </font><font style="color:rgb(45, 55, 72);">步骤时，安装程序直接报错并终止。这一问题导致我无法完成最新版本的安装。</font>

## <font style="color:rgb(49, 130, 206);">尝试过的常规解决方法</font>
<font style="color:rgb(45, 55, 72);">在查阅了 Google 上的相关帖子后，我尝试了以下常规方法，但全部无效：</font>

1. **<font style="color:rgb(45, 55, 72);">扩大虚拟硬盘容量</font>**<font style="color:rgb(45, 55, 72);">（增加磁盘空间，防止安装过程空间不足）</font>
2. **<font style="color:rgb(45, 55, 72);">增加虚拟机内存与 CPU 核心数</font>**
3. **<font style="color:rgb(45, 55, 72);">调整 VMware 虚拟机硬件配置</font>**

![](../../images/posts/8344a3e68c47a26820b59a032baa7fce.webp)

<font style="color:rgb(45, 55, 72);">遗憾的是，所有这些调整都无法解决</font><font style="color:rgb(45, 55, 72);"> </font>**<font style="color:rgb(45, 55, 72);">“Select and Install Software”</font>**<font style="color:rgb(45, 55, 72);"> </font><font style="color:rgb(45, 55, 72);">报错的问题。</font>

## <font style="color:rgb(49, 130, 206);">尝试跳过安装步骤</font>
<font style="color:rgb(45, 55, 72);">有些解决方案建议</font>**<font style="color:rgb(45, 55, 72);">跳过 “Select and Install Software”</font>**<font style="color:rgb(45, 55, 72);">，先安装 GRUB 引导程序，然后再回到软件安装步骤继续。但我在执行这个方法时，发现：</font>

+ <font style="color:rgb(45, 55, 72);">在安装 GRUB 阶段依旧会报错</font>
+ <font style="color:rgb(45, 55, 72);">磁盘分区检查正常，没有异常</font>
+ <font style="color:rgb(45, 55, 72);">问题依旧无法绕过</font>

## <font style="color:rgb(49, 130, 206);">最终的有效解决方案</font>
![](../../images/posts/93cf6a8ad92eea63d7547168ce7cd264.webp)

1. **<font style="color:rgb(45, 55, 72);">在安装Kali时系统语言选择英文！</font>**
2. <font style="color:rgb(45, 55, 72);">或者</font>**<font style="color:rgb(45, 55, 72);">安装较旧版本的 Kali Linux ARM</font>**<font style="color:rgb(45, 55, 72);">。下载</font>**<font style="color:rgb(45, 55, 72);">Kali Linux 2025.1C ARM 版本</font>**<font style="color:rgb(45, 55, 72);">，并在 VMware Fusion 13.6 中进行安装。</font>

<font style="color:rgb(45, 55, 72);">没错就是这么简单。无语。</font>

## <font style="color:rgb(49, 130, 206);">可能的原因分析</font>
<font style="color:rgb(45, 55, 72);">虽然官方暂未明确 2025.2 版本在 ARM + VMware Fusion 环境下的安装问题，但结合社区反馈和我的测试经验，可能的原因包括：</font>

+ <font style="color:rgb(45, 55, 72);">2025.2 ARM 版本的安装程序存在兼容性 bug</font>
+ <font style="color:rgb(45, 55, 72);">部分软件源在安装阶段出现依赖或者编码相关冲突</font>

## <font style="color:rgb(49, 130, 206);">建议与总结</font>
<font style="color:rgb(45, 55, 72);">如果你在</font><font style="color:rgb(45, 55, 72);"> </font>**<font style="color:rgb(45, 55, 72);">VMware Fusion 13.6 + Mac M4</font>**<font style="color:rgb(45, 55, 72);"> </font><font style="color:rgb(45, 55, 72);">环境中安装</font><font style="color:rgb(45, 55, 72);"> </font>**<font style="color:rgb(45, 55, 72);">Kali Linux 2025.2 ARM</font>**<font style="color:rgb(45, 55, 72);"> </font><font style="color:rgb(45, 55, 72);">时遇到</font><font style="color:rgb(45, 55, 72);"> </font>**<font style="color:rgb(45, 55, 72);">“Select and Install Software”</font>**<font style="color:rgb(45, 55, 72);"> </font><font style="color:rgb(45, 55, 72);">报错，建议：</font>

1. **<font style="color:rgb(45, 55, 72);">尝试旧版本</font>**<font style="color:rgb(45, 55, 72);">：直接使用 Kali Linux 2025.1C 或更早的 ARM 版本</font>
2. **<font style="color:rgb(45, 55, 72);">安装时Kali系统语言选择英文</font>**
3. **<font style="color:rgb(45, 55, 72);">关注官方更新</font>**<font style="color:rgb(45, 55, 72);">：密切关注 Kali 官方发行说明或 bug 修复</font>

<font style="color:rgb(45, 55, 72);">目前，在我的环境中，</font>**<font style="color:rgb(45, 55, 72);">Kali Linux 2025.1C</font>**<font style="color:rgb(45, 55, 72);"> </font><font style="color:rgb(45, 55, 72);">是稳定可行的解决方案。</font>

[<font style="color:rgb(49, 130, 206);">Kali Linux 2025.1c Download</font>](http://old.kali.org/kali-images/kali-2025.1c/)

