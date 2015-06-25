---
layout: post
title: JavaScript 贪吃蛇游戏
categories: JavaScript
tags: game
thread: snakegame
---

## 源码

- 用`jQuery` + `CSS` + `HTML` 写了一个[贪吃蛇小游戏](http://github.shanechu.com/snake/index.html)
- 源码托管在github个人主页上：[贪吃蛇源码](https://github.com/enginzhu/enginzhu.github.io/tree/master/snake)

## 贪吃蛇原型功能

- 游戏主循环推进蛇的行动
- 键盘交互操作（四个方向键）
- 游戏中随机生成食物
- 对生成食物的随机点做检查，只能出现在空白区，否则重新生成
- 蛇不能撞到地图边界或者蛇自身，否则游戏结束

## 数据结构

- 蛇体使用队列存储多个节点元素，行进中遵循先进先出
- 地图是一个二维数组，节点可分为下述类型：
	- 可行走的路点（`way-point`）
	- 蛇体（`snake-body`）
	- 食物（`food`）

## 其它拓展玩法

- 地图生成随机障碍物，蛇撞到会缩短身体
- 游戏过程中速度的变化

