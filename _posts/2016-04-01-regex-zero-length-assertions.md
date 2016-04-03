---
layout: post
title: 关于正则表达式的零宽断言
comments: true
categories: 笔记
tags: reading-notes
---

![regex]({{ site.url }}/image/regex/regex.jpg)

## 字符匹配

在正则表达式引擎中，用来匹配字符至少有以下几种方式：

- **字面字符**（`literal character`）：最基本的正则匹配，比如`a`，匹配字符串中第一个出现的`a`字符。对于正则表达式的12个**元字符**（`metacharacter`）：`\*^$.|?+[]()`，如果需要当成字面量匹配，则要在字符前加反斜杠。
- **字符组**(`character classes`)：如`[0-9]`匹配0到9之间的单个数字。
- **排除型字符组**（`negated character classes`）：如`[^0-9\r\n]`匹配除数字和换行符以外的其他字符，包括不可见字符。
- **点**（`dot`）：匹配除换行符以外的任意字符


## 锚点匹配

**锚点**（`Anchors`）属于另外一种匹配类型，与上述的几种方式不同，它**不会匹配任何字符**，其作用只是在字符串中定位到某个位置。锚点有如下几种：

- **句首匹配**：*脱字号*（`caret sign`）定位到字符串的开头位置（第一个字符之前），如`^a`在`abc`中可以匹配到`a`，而`^b`匹配不到任何字符。
- **句尾匹配**：*美元号*（`dollar sign`）定位到字符串的结尾位置（最后一个字符之后），如`c$`在`abc`中匹配到`c`。
- **单词边界**：元字符`\b`用来定位到**单词边界**（`word boundary`），**单词边界**通常位于**单词字符**（`word character`）和**非单词字符**之间。**单词字符**是指能够用来组成单词的字符。大多数情况下`\w`匹配到的字符就可以视为单词字符，但也有例外：在`Java`中，`Unicode字符`不能被`\w`匹配，但在`\b`定位中却被视为单词字符。有三种位置可以判定为单词边界：
	- 句首第一个字符之前，且第一个字符是单词字符。
	- 句尾最后一个字符之后，且最后一个字符是单词字符。
	- 句中两个字符之间，且其中一个是单词字符，另外一个不是。

由单个`anchor`组成的正则表达式只能得到零宽匹配（`zero-length matches`）。



## 什么是零宽断言

**零宽断言**（`zero-length assertions`）与上述的**锚点匹配**类似，用来定位到某个位置，得到的结果也是**零宽匹配**。唯一的区别在于**零宽断言**会去确确实实地去匹配字符，但并不消费句中任何字符，只是在最后根据匹配与否返回断言结果。这也是为什么称之为断言（`assertion`）的原因。零宽断言分为**预测先行**（`lookahead`）和**回顾后发**（`lookbehind`），两者合称为**环视**（`lookaround`），*环视*有以下几种类型：

- **正向预测先行**（`positive lookahead`）：`(?=exp)`断言*指定位置的后面*能够匹配表达式*exp*。如`x(?=y)`，当*x*后面跟着*y*时，匹配该*x*，但不将*y*作为匹配的一部分。
- **负向预测先行**（`negative lookahead`）`(?!)`断言*指定位置的后面*不满足表达式*exp*。如`x(?!y)`，只有当*x*后面跟着的不是*y*时，才匹配该*x*。
- **正向回顾后发**（`positive lookbehind`）：`(?<=)`断言*指定位置的前面*能够匹配表达式*exp*。如`(?<=x)y`，只有当*y*的前面是*x*时，才匹配该*y*。
- **负向回顾后发**（`negative lookbehind`）：`(?<!)`断言*指定位置的前面*不满足表达式*exp* ，如`(?<!x)y`，只有当*y*的前面不是*x*时，才匹配该*y*。

正则表达式有多种引擎实现，根据正则引擎的语法和行为，可以分为多种**正则表达式流派**（`regular expression flavor`）。不同的正则引擎之间并不完全兼容，比如**在`JavaScript`中，正则表达式引擎支持完整的`lookahead`，但却不支持任何的`lookbehind`**。


## 零宽断言的内部实现
让我们将正则表达式`(?<=a)b`应用到字符串`thingamabob `，在正则引擎内部，两边同时开始读入，一边是`lookbehind`断言，一边是首字符*t*。此时，`lookbehind`会告诉引擎往后回退一个字符，看看是否有个*a*可以匹配。然而引擎无法在第一个字符的位置回退，因为前面没有任何字符，所以第一次 `lookbehind`失败。

正则引擎接着读到第二个字符*h*，往后回退一个字符查看是否是*a*，然而发现是*t*，第二次`lookbehind`依然失败。引擎继续往前读取，直到遇到字符*m*，引擎在回退后终于发现有个*a*，此时`lookbehind`断言完成匹配，**由于是零宽匹配（`zero-length`），指针仍然停留在*m*这个位置**，正则表达式接下来的`token`是字符*b*，*m*无法完成匹配。

最后当引擎读到字符串中第一个*b*的时候，回退后发现`lookbehind`能够匹配*a*，而接着的字符*b*也能够匹配*b*，此时整个正则表达式都完成了匹配。


### 参考链接：
- [http://stackoverflow.com/questions/3569104/positive-look-behind-in-javascript-regular-expression](http://stackoverflow.com/questions/3569104/positive-look-behind-in-javascript-regular-expression)
- [http://www.regular-expressions.info/lookaround.html](http://www.regular-expressions.info/lookaround.html)
- [http://www.regular-expressions.info/javascript.html](http://www.regular-expressions.info/javascript.html)
- [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
