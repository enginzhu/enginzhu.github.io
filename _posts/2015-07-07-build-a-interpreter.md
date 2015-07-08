---
layout: post
title:  "写一个简单的解释器"
date:   2015-07-07 09:32:58
categories: interpreter
---

> **"If you don't know how compilers work, then you don't know how computers work. If you're not 100% sure whether you know how compilers work, then you don't know how they work." — Steve Yegge**

原文地址：[Let's Build A Simple Interpreter](http://ruslanspivak.com/lsbasi-part1/)

## 为什么要学习解释器和编译器？

不管你是一个新手还是一个经验丰富的软件开发者，如果你不知道编译器和解释器是如何工作的，那么你也就不知道计算机如何工作。
为什么要学习解释器和编译器？我会给出以下三个理由：

- 写一个解释器或者编译器，要求你拥有大量的专业技能并将它们协同使用，它会帮助你改善这些技能使你成为更好的软件开发者。同时，你所学到的技能不仅可以用于开发解释器和编译器，对于开发任何软件都是有用的。
- 假如你确实想要了解计算机如何工作：很多时候解释器和编译器看起来就像一种魔法，但你不能对这种魔法熟视无睹。你应该揭开创建解释器或编译器的过程的神秘面纱，理解它们如何工作，并牢牢掌握。
- 假如你想要创建你自己的编程语言，或者特定领域语言（**Domain Specific Language**）：如果你创建了一门语言，那么你也需要为这门语言创建一个解释器或编译器。近年来创建新编程语言的兴趣开始复兴，几乎每天你都可以看到有新的编程语言冒出来：Elixir，Go，Rust等等

## 什么是解释器和编译器？

解释器和编译器的目标是将某种高级语言源代码翻译成其它形式。相当模糊不是吗？后面会讲到源代码究竟翻译成了什么。

现在你可能疑惑解释器和编译器的区别是什么。让我们同意这一点：如果一个翻译程序将源码翻译成机器语言，那么它是一个**编译器**。如果一个翻译程序不首先将源码翻译成机器语言而直接处理运行源码，那么它是一个**解释器**。看起来就像这样：
![compiler and interpreter]({{ site.url }}/image/lsbasi/lsbasi_part1_compiler_interpreter.png)

我希望现在你已确信你想学习并创建一个解释器和编译器。我们将为**Pascal**语言的子集创建一个简单的解释器。在本系列的最后，你将写出一个可以工作的Pascal解释器和一个代码级别的调试器，就像**python**的[pdb](https://docs.python.org/2/library/pdb.html)。

你也许会问为什么是Pascal？首先，它并不是我为了本系列文章而凭空想出来的语言：它是一个拥有很多重要语言结构的真实的编程语言。一些老的但依然有用的计算机科学图书使用Pascal编程语言作为它们的例子。有机会学习一个非主流的编程语言也是不错的。

这里是一个用**Pascal**写的`factorial`函数，最终你将能够用你自己的解释器去解释它，并且用你自己的交互式调试器去debug它：

```
program factorial;
function factorial(n: integer): longint;
begin
    if n = 0 then
        factorial := 1
    else
        factorial := n * factorial(n - 1);
end;
var
    n: integer;
begin
    for n := 0 to 16 do
        writeln(n, '! = ', factorial(n));
end.
```

Pascal解释器的实现将使用Python语言，当然你也可以使用其它任何语言。
作为你的第一个解释器，你将会是通过实现一个算术表达式（**arithmetic expression**）的解释器，也称为计算器。我们的目标相当简单：使你的计算器能够处理两个单位整数的加法，比如`3+5`。这是你的计算器（解释器）的源码：

```
# Token types
#
# EOF (end-of-file) token is used to indicate that
# there is no more input left for lexical analysis
INTEGER, PLUS, EOF = 'INTEGER', 'PLUS', 'EOF'


class Token(object):
    def __init__(self, type, value):
        # token type: INTEGER, PLUS, or EOF
        self.type = type
        # token value: 0, 1, 2. 3, 4, 5, 6, 7, 8, 9, '+', or None
        self.value = value

    def __str__(self):
        """String representation of the class instance.

        Examples:
            Token(INTEGER, 3)
            Token(PLUS '+')
        """
        return 'Token({type}, {value})'.format(
            type=self.type,
            value=repr(self.value)
        )

    def __repr__(self):
        return self.__str__()


class Interpreter(object):
    def __init__(self, text):
        # client string input, e.g. "3+5"
        self.text = text
        # self.pos is an index into self.text
        self.pos = 0
        # current token instance
        self.current_token = None

    def error(self):
        raise Exception('Error parsing input')

    def get_next_token(self):
        """Lexical analyzer (also known as scanner or tokenizer)

        This method is responsible for breaking a sentence
        apart into tokens. One token at a time.
        """
        text = self.text

        # is self.pos index past the end of the self.text ?
        # if so, then return EOF token because there is no more
        # input left to convert into tokens
        if self.pos > len(text) - 1:
            return Token(EOF, None)

        # get a character at the position self.pos and decide
        # what token to create based on the single character
        current_char = text[self.pos]

        # if the character is a digit then convert it to
        # integer, create an INTEGER token, increment self.pos
        # index to point to the next character after the digit,
        # and return the INTEGER token
        if current_char.isdigit():
            token = Token(INTEGER, int(current_char))
            self.pos += 1
            return token

        if current_char == '+':
            token = Token(PLUS, current_char)
            self.pos += 1
            return token

        self.error()

    def eat(self, token_type):
        # compare the current token type with the passed token
        # type and if they match then "eat" the current token
        # and assign the next token to the self.current_token,
        # otherwise raise an exception.
        if self.current_token.type == token_type:
            self.current_token = self.get_next_token()
        else:
            self.error()

    def expr(self):
        """expr -> INTEGER PLUS INTEGER"""
        # set current token to the first token taken from the input
        self.current_token = self.get_next_token()

        # we expect the current token to be a single-digit integer
        left = self.current_token
        self.eat(INTEGER)

        # we expect the current token to be a '+' token
        op = self.current_token
        self.eat(PLUS)

        # we expect the current token to be a single-digit integer
        right = self.current_token
        self.eat(INTEGER)
        # after the above call the self.current_token is set to
        # EOF token

        # at this point INTEGER PLUS INTEGER sequence of tokens
        # has been successfully found and the method can just
        # return the result of adding two integers, thus
        # effectively interpreting client input
        result = left.value + right.value
        return result


def main():
    while True:
        try:
            # To run under Python3 replace 'raw_input' call
            # with 'input'
            text = raw_input('calc> ')
        except EOFError:
            break
        if not text:
            continue
        interpreter = Interpreter(text)
        result = interpreter.expr()
        print(result)


if __name__ == '__main__':
    main()
```

将代码保存到`calc1.py`文件。在你深究代码之前，先在命令行上运行并测试这个计算器。

```
$ python calc1.py
calc> 3+4
7
calc> 3+5
8
calc> 3+9
12
calc>
```

为了使这个简单的计算器能够正确地工作并且不抛出异常，你的输入需要遵循下面的规则：

- 输入中只允许单位数的整数
- 唯一被支持的算数操作符是加号
- 字符与字符之间不允许有空格存在

上述约束是保持计算器足够简单的必要条件。
现在让我们看看你的解释器是如何对算术表达式进行求值的。

当你在命令行上输入表达式`3+5`时，你的解释器得到一个字符串`"3+5"`。为了让解释器知道如何处理对该字符串，首先需要将输入`"3+5"`打破成单个的组件（**Token**）。**Token**是一个有类型有值的对象。举例说明，字符串`"3"`的token类型是`INTEGER`，对应的值是数字3。

将输入字符串拆解成**token**的过程称为词法分析（**lexical analysis**）。因此你的解释器第一步要做的就是读取字符输入并将它转化为**token stream**。解释器中负责该部分的称为词法分析器（**lexical analyzer**），或者简称为**lexer**。你或许碰到过其它的名称，比如**scanner**，**tokenizer**.它们的意思都是一样的：即解释器或编译器中负责将字符输入转化成**token stream**的那部分程序。

**Interpreter**类中的`get_next_token`方法就是你的词法分析器。每次调用都会从输入字符流中得到下一个**token**并传递给解释器。让我们更进一步看看该方法是如何完成它将字符转化成**token**的工作的。解释器的输入字符串保存在**text**变量中，而**pos**是该字符串的一个索引。**pos**初始化为`0`并指向字符`'3'`。方法首先检查该字符是否为数字，如果是数字则增加`pos`的值并返回一个**token**实例（类型为`INTEGER`，值为数字`3`）。

![compiler and interpreter]({{ site.url }}/image/lsbasi/lsbasi_part1_lexer1.png)

`pos`现在指向`text`中的`'+'`字符。下一次调用该方法时，它首先检查`pos`所在位置的字符是否一个数字，接着检查字符是否一个加法符号。正好满足条件，因此该方法增加`pos`的值并返回一个新创建的**token**（类型为`PLUS`，值为`'+'`）：

![compiler and interpreter]({{ site.url }}/image/lsbasi/lsbasi_part1_lexer2.png)

`pos`现在指向了字符`'5'`。当你再一次调用`get_next_token`方法时，它检查接着的字符是否数字，正好是，因此继续增加`pos`的值并返回新的类型为`INTEGER`，值为数字`5`的**token**。

![compiler and interpreter]({{ site.url }}/image/lsbasi/lsbasi_part1_lexer3.png)

因为`pos`的索引现在正好经过字符串`"3+5"`的结尾，`get_next_token`返回**EOF token**。

![compiler and interpreter]({{ site.url }}/image/lsbasi/lsbasi_part1_lexer4.png)

自己试着敲一下代码，看看你的计算器的词法分析器部分是怎样工作的：

```
>>> from calc1 import Interpreter
>>>
>>> interpreter = Interpreter('3+5')
>>> interpreter.get_next_token()
Token(INTEGER, 3)
>>>
>>> interpreter.get_next_token()
Token(PLUS, '+')
>>>
>>> interpreter.get_next_token()
Token(INTEGER, 5)
>>>
>>> interpreter.get_next_token()
Token(EOF, None)
>>>
```

现在你的计算器可以从输入字符中访问token流了，解释器需要做一些事：找出从词法分析器得到的**token stream**中的结构。解释器期望找到这样的结构：**INTEGER->PLUS->INTEGER**。即是说，它试着找到这样的一个序列：整数后跟着加号，再跟着一个整数。

负责找到并解释该结构的方法是`expr`。该方法校验**token序列**是否与所期望的对应，如`INTEGER->PLUS->INTEGER`。当成功确定结构，则生成PLUS左边token的值与PLUS右边token的值相加的结果，从而成功解释你传递给解释器的算术表达式。

`expr`方法使用`eat`辅助方法来检验传递给它的**token type**是否匹配当前的**token type**。匹配完成后，`eat`方法获取下一个**token**并赋值给`current_token`变量，因此有效地吃掉当前已匹配的**token**，并推进**token stream**的指针。假如**token stream**的结构不满足期望的**INTEGER PLUS INTEGER**序列，`eat`方法会抛出异常。

让我们回顾下解释器对算术表达式求值的时候做了什么：

- 解释器接受一个输入字符串，比如`"3+5"`
- 解释器的词法分析器`get_next_token`分词后返回**token stream**，`expr`方法在**token stream**中找出预期结构（INTEGER PLUS INTEGER形式）。确认结构后解释输入：对两个**INTEGER token**的值进行相加，此时需要做什么对解释器来说已经很清晰，即对`3`和`5`两个整数相加

恭喜你自己。你已经学会如何创建一个最初的解释器原型！


## 接着做什么？

现在的解释器功能还远远不够，试下做接下来的练习去扩展它：

- 1.修改代码使它能够在输入中支持多位整数，比如`"12+3"`
- 2.添加一个方法跳过空格字符，以便使你的计算器能处理带有空格的输入，比如`" 12 + 3"`
- 3.修改你的代码，用'-'替换掉'+'，使它能对减法比如`"7-5"`求值