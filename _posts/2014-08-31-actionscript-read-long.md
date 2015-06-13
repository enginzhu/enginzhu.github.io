---
layout: post
title:  "谈谈ActionScript从字节流中读写long数据"
date:   2014-08-31 18:12:23
categories: actionscript
---

### Actionscript通信的方式

TCP 协议的数据传输过程被抽象成一个 *流（Stream）*，其中分为 *字符流* 和 *字节流*。
ActionScript使用 *ByteArray* 作为流载体。对于前者，*ByteArray* 提供了 **readUTF / writeUTF** 和 **readUTFBytes / writeUTFBytes**。后者又称为 *比特流（Bit Stream）*，*Actionscript* 读写这一类数据流的原子单位是字节。原生的 *ByteArray* 对常用基础数据类型的读写都做了支持，比如`byte`，`short`，`integer`，`float`，都有现成的读写方法，对于其中的 *整数类型（Integral Types）*，也做了 `signed` 和 `unsigned` 的区分支持。 

---

### 如何读取一个long整型

*ByteArray* 没有直接的 `readLong` 方法。 考虑到 `long` 是一个64位的整型，*ActionScript* 里有读写32位 `integer` 的方法，所以我们可以分两次读取：即 **高32位的最高有效整数（most significant int）** 和 **低32位的最低有效整数（least significant int）**。 

{% highlight actionscript linenos %}
var msi:uint = readUnsignedInt();
var lsi:uint = readUnsignedInt();
//把高32位的int向左移32位，再加上低32位，就是原始的long数据
var long:Number = (msi << 32) + lsi;
{% endhighlight actionscript %}

由于符号位的原因，我们这两次读取 *int* 不能直接 ***readInt***，而应该用 
***readUnsignedInt***。 看似完美解决。能正常工作吗？

在*ActionScript* 里，*位移操作符（Bitwise Operator）*返回一个int，也就是32位整数。所以 `<<` 操作符只能用作32位以内的运算，否则会溢出。我们需要改成这样
{% highlight actionscript linenos %}
/**
 * 正确组合高位和低位的数字
 */
var long:Number = msi * 0x100000000 + lsi;
{% endhighlight actionscript %}
我们可以设计一个用例来测试这段解析代码 

{% highlight actionscript linenos %}
/**
 * 数据源为一个ByteArray，字节序为Big-Endian
 * 设64位long数据为0x0000 0000 0000 000f
 */
var ba:ByteArray = new ByteArray();
ba.writeUnsignedInt(0x00000000);
ba.writeUnsignedInt(0x0000000f);
ba.position = 0;
readLong(ba);
{% endhighlight actionscript %}
最终结果输出为15

---

### 当原始的long为负数

首先得弄清楚，计算机里是怎么表示负数的。 我们脑海里第一个想到的是使用符号位，比如二进制的+8是00001000，那么-8就是10001000。 但其实计算机内部储存负数不是这样的，而是用 [二补数（Two's Complement）](http://zh.wikipedia.org/wiki/%E4%BA%8C%E8%A3%9C%E6%95%B8)，原因涉及到计算电路的实现。对这部分内容有兴趣的可以通过 [关于2的补码](http://www.ruanyifeng.com/blog/2009/08/twos_complement.html) 了解，讲得很通俗。
使用上面的测试用例，当long为负数时，我们的代码不能正常工作了。

---

### 二补数的运算和逆运算

简单的说一下二补数，它通过将所有比特位取反再加一得到。 为了获得与二补数的等价运算，我们举例对一个 $8$ 位数 $xxxxxxxx$ 进行 二补数计算，则有 
$$1111 1111 - xxxx xxxx + 1$$
根据加法交换律，等价于 
$$0x100 - xxxxxxxx$$
同样地，对于二补数的逆运算过程为 
$$ \sim（xxxxxxxx - 1）$$
等价于
$$ 1111 1111 - （xxxxxxxx - 1）$$
和
$$0x100 - xxxxxxxx$$
由这条规则推导出： 

> 对于一个 $n$ 位数 $number$，不管 $number$ 是原始数还是二补数，它们之间的转化都可以通 $2^n - number$ 获得

### 64位二补数的还原

现在我们有一个64位的二补数，用两个32位int存储，表示为：
$$msi \times 0x100000000 + lsi$$
由上面公式可得原始数为：
$$2^{64} - (msi \times 0x100000000 + lsi)$$
将$2^{64}$作等价转化：
$$(0xFFFFFFFF \times 0x100000000 + 0x100000000)$$
最终得到：
原始数的$msi$为$(0xFFFFFFFF - msi)$，$lsi$为$(0x100000000 - lsi)$

---

### readLong方法对负数的兼容实现

假定 ba 为 *byteArray* 对象，其 *position* 指向了其中一个待解析的64位long数据

{% highlight actionscript linenos %}
var msi:Number = ba.readUnsignedInt();
var lsi:Number = ba.readUnsignedInt();	
var sign:Number = 1;
    
//负数的情况，用上面讲的64位二补数还原来计算
if ((msi & 0x80000000) != 0)
{
    msi = 0xFFFFFFFF - msi;
    lsi = 0x100000000 - lsi;
    sign = -1;
}
return sign * (msi * 0x100000000 + lsi);
{% endhighlight actionscript %}

---

### writeLong的实现

*writeInt* 的时候，如果write进的数大于32位，计算机只截取最低有效位的数据
假定 value 为原始的64位long数据

- long为正整数的情况，无需计算二补数，将原始数直接写入流

{% highlight actionscript linenos %}
var buffer:ByteArray = new ByteArray();
var msi:Number, lsi:Number;
msi = value / 0x100000000;
lsi = value % 0x100000000;
buffer.writeUnsignedInt(msi);
buffer.writeUnsignedInt(lsi);
{% endhighlight actionscript %}

- long为负整数的情况，沿用上面提到的方法计算二补数

{% highlight actionscript linenos %}
var buffer:ByteArray = new ByteArray();
var msi:Number, lsi:Number;
var abs:Number = Math.abs(value);

msi = 0xFFFFFFFF - int(abs / 0x100000000);
lsi = 0x100000000 - (abs % 0x100000000);

//低32位全部为0的时候，其二补数会产生进位1，将该进位加到高32位
if (lsi == 0x100000000)
	msi += 1;

buffer.writeUnsignedInt(msi);
buffer.writeUnsignedInt(lsi);
{% endhighlight actionscript %}

**到现在为止，我们有足够的前置条件来写一个测试函数**

{% highlight actionscript linenos %}
/**
 * 测试long数据的写入和读取
 */
private function test(number:Number):void
{
    var ba:ByteArray = new ByteArray();
    writeLong(ba, number);
    ba.position = 0;
    var ret:Number = readLong(ba);
    trace(ret);
}
{% endhighlight actionscript %}

**扔一堆数据用例进去**

{% highlight actionscript linenos %}
test(1);
test(-1);
test(1024);
test(-1024);
test(4294967296);
test(4294967297);
test(-4294967296);
test(-4294967297);
test(8589934592);
test(-8589934592);
{% endhighlight actionscript %}

**最后输出**

{% highlight actionscript linenos %}
1
-1
1024
-1024
4294967296
4294967297
-4294967296
-4294967297
8589934592
-8589934592
{% endhighlight actionscript %}



（欢迎转载本站文章，请注明[出处]( {{ site.url }} ))
