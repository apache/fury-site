---
order: -1
---
# <font size="6">项目新闻和博客</font>
------

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.4.1 Released</font>](/zh/blog/fury_0_4_1_release)

<font color="#888888">*2023年 12月9号*</font>
<font face="Lato,Roboto,Arial,sans-serif">
很高兴向大家发布Fury 0.4.1版本，本次发布重点新增了 Fury 行存 Rust 支持，同时对Fury 行存 C++支持进行了完善，支持可迭代类型，欢迎使用！
</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.4.0 Released</font>](/zh/blog/fury_0_4_0_release)

<font color="#888888">*2023年 11月29号*</font>
<font face="Lato,Roboto,Arial,sans-serif">
很高兴向大家发布Fury 0.4.0版本，本次发布重点支持了 Graalvm native image，基于编译时反射的C++ Row Format Encoder，Scala序列化兼容性改进，欢迎使用！
</font>


# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.3.1 Released</font>](/zh/blog/fury_0_3_1_release)

<font color="#888888">*2023年 11月21号*</font>
<font face="Lato,Roboto,Arial,sans-serif">
很高兴向大家发布Fury 0.3.1版本，本次发布支持了 Python 3.11 和 3.12，移除了对 Python 3.6的支持，同时包含了多项Scala JIT序列化以及Java序列化兼容性改进，欢迎使用！
</font>


# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.3.0 Released</font>](/zh/blog/fury_0_3_0_release)

<font color="#888888">*2023年 11月4号*</font>
<font face="Lato,Roboto,Arial,sans-serif">
很高兴向大家发布Fury 0.3.0版本，该版本主要全面支持了任意 Scala2/3 对象序列化，基于 Fury 的序列化协议提供更小的序列化体积；通过 Fury 的 JIT 框架提供高性能。支持**case/pojo/object/option/tuple/collecton/enum and other types**等任意类型，欢迎使用。
</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.2.1 Released</font>](/zh/blog/fury_0_2_1_release)

<font color="#888888">*2023年 10月19号*</font>
<font face="Lato,Roboto,Arial,sans-serif">
很高兴向大家发布FURY 0.2.1版本，本次发布提供了更加完善的JDK17+ record JIT支持，以及针对 private class 更好的JIT支持。
</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.2.0 Release</font>](/zh/blog/fury_0_2_0_release)

<font color="#888888">*2023年 10月09号*</font>
<font face="Lato,Roboto,Arial,sans-serif">
很高兴向大家宣布Fury 0.2.0的发布，`0.2.0`是一个非常重量级的版本，该版本性能提升一倍，序列化体积减少`30%~50%`，目前性能是Java序列化排行榜[JVM-Serializers](https://github.com/eishay/jvm-serializers/wiki)第一。同时我们全面支持了JDK17/21，支持了JDK17+ record JIT序列化，JDK9+ ImmutableList的JIT序列化, 具备极致的性能，并保持了JDK8~21跨版本之间的兼容性。同时该版本我们开源了Fury GoLang序列化框架，该框架是业界第一个支持循环引用和接口多态的golang序列化框架，欢迎使用。

</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.1.2 Release</font>](/zh/blog/fury_0_1_2_release)

<font color="#888888">*2023年 09月27号*</font>
<font face="Lato,Roboto,Arial,sans-serif">
很高兴向大家宣布Fury 0.1.2的发布，`0.1.2`是我们的第3个发布版本。该版本避免了JDK注解处理器反序列化方法`readObject`的调用`toString`的问题，同时使用`cloudpickle`进行局部函数序列化。
</font>


# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.1.1 Release</font>](/zh/blog/fury_0_1_1_release)

<font color="#888888">*2023年 09月01号*</font>
<font face="Lato,Roboto,Arial,sans-serif">
很高兴向大家宣布Fury 0.1.1的发布，`0.1.1`是我们的第二个发布版本. 该版本支持自定义序列化安全检查策略，提供了比类型注册检查更灵活的行为。同时跟Dubbo进行了集成，支持在Dubbo rpc框架当中使用fury：[fury integration](https://github.com/fury-project/dubbo-serialization-fury/releases/tag/v0.1.1). 除此之外一些小的优化和bugfix也包含在这个发布里面.
</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.1.0 正式发布</font>](/zh/blog/fury_0_1_0_release)

<font color="#888888">*2023年 07月31号*</font>
<font face="Lato,Roboto,Arial,sans-serif">
大家好，经过几个月的努力，Fury 0.1.0 版本正式对外发布。这是我们今年四月底正式在 GitHub 开发、7 月 15 号对外开源后发布的第一个版本。这一版本包含了大量特性，欢迎大家使用，希望能提供宝贵的反馈意见。本次发布包含了大量重要特性：生产环境可用的 Java 序列化，支持Java/Python/JavaScript/Rust的跨语言序列化，多语言高性能行存。
</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury - 一个基于JIT和零拷贝的高性能多语言序列化框架</font>](/zh/blog/fury_blazing_fast_multiple_language_serialization_framework)

<font color="#888888">*2023年 07月15号*</font>

<font face="Lato,Roboto,Arial,sans-serif">
Fury 是一个基于 JIT 动态编译和零拷贝的多语言序列化框架，支持 Java/Python/Golang/JavaScript/C++ 等语言，提供全自动的对象多语言 / 跨语言序列化能力，和相比 JDK 最高 170 倍的性能。
</font>


<br />
<br />
<br />
