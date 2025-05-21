+++
title = 'Towards Unified Analysis of GPU Consistency'
date = 2025-06-03T17:23:07+08:00
summary = ""
math = true
draft = true
categories = ['Security', 'Arch']
tags = ['Paper', 'GPU', 'Consistency']
+++

> #### Info
>
> 本文作者是University of Helsinki的Haining Tong。

这篇也是老板推荐看的, 学习一下GPU的Consistency Model。

这篇work用形式化(SMT)的方法对NV的PTX和Vulkan的Consistency Model进行分析, 
给出了一个魔改CPU Consistency分析的框架Dartagnan并用`.cat`语言描述GPU Consistency Model,
顺便用这个框架发现了两个bug.

~~读了好几遍才看懂, 要重修离散和OS了~~

## Introduction



## Motivation



## Background

需要的前置知识还挺多, 慢慢看

### .cat



### Program and Behavior



### Bounded Model Checking



