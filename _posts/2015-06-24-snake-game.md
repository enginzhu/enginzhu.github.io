---
layout: post
title: JavaScript 贪吃蛇游戏
categories: JavaScript
tags: game
---

端午节家里断网，用jQuery + CSS + HTML 写了一个[贪吃蛇小游戏](http://github.shanechu.com/snake/index.html)

游戏主循环通过在`setTimeout`回调函数中重复调用`setTimeout`实现(后来发现`setInterval`可以重复执行回调)

源码托管在github上：[贪吃蛇源码](http://github.com/enginzhu/snakegame)
