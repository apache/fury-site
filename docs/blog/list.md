---
order: -1
---
# <font size="6">Project News and Blog</font>
------

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.3.0 Released</font>](/blog/fury_0_3_1_release)

<font color="#888888">*21 Nov 2023*</font>
<font face="Lato,Roboto,Arial,sans-serif">
I'm pleased to announce the 0.3.1 release of the Fury. With this release, fury supports python 3.11&3.12, droped python 3.6 support.
Multiple scala serialization JIT optimization are included, and java serialization compatibility is improved too.
</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.3.0 Released</font>](/blog/fury_0_3_0_release)

<font color="#888888">*4 Nov 2023*</font>
<font face="Lato,Roboto,Arial,sans-serif">
I'm pleased to announce the 0.3.0 release of the Fury. With this release, fury supports all scala 2/3 objects serializaiton now, including: **case/pojo/object/option/tuple/collecton/enum and other types**. case/pojo/object are tightly integrated with fury JIT. Fury will generate highly-optimized serializer by generate serialize code at runtime to speed up serializaiton. The serialization for those objects will be extremely fast.
</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.2.1 Released</font>](/blog/fury_0_2_1_release)

<font color="#888888">*19 Oct 2023*</font>
<font face="Lato,Roboto,Arial,sans-serif">
I'm pleased to announce the 0.2.1 release of the Fury. This version provides beter jdk17+ record support and bettern jit for private classes.
</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.2.0 Released</font>](/blog/fury_0_2_0_release)

<font color="#888888">*09 Oct 2023*</font>
<font face="Lato,Roboto,Arial,sans-serif">
I'm so excited to announce the 0.2.0 release of the Fury. This a very exciting version of fury. With this version, we have 1X speedup, `30%~50%` smaller serialized size. And now we are the fastest serialization framework in the [JVM-Serializers](https://github.com/eishay/jvm-serializers/wiki). At the same time, fury has fully support for JDK17/21, I supported JDK17+ record JIT serialization, JDK9+ ImmutableList JIT serialization. The serialization is blazing fast, please try it out. And we also open sourced Fury GO, the first golang serialization framework which supports circular reference and interface polymorphismm, feel free to try it out and let me know if you have any issues.
</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.1.2 Released</font>](/blog/fury_0_1_2_release)

<font color="#888888">*27 Sep 2023*</font>
<font face="Lato,Roboto,Arial,sans-serif">
I'm pleased to announce the 0.1.2 release of the Fury. Fury 0.1.2 is our thrid release which made some improvements on v0.1.0. This version skipped `toString` in annotation invocation handler `readObject`, and uses `cloudpickle` for local function serialization. 
</font>


# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.1.1 Released</font>](/blog/fury_0_1_1_release)

<font color="#888888">*01 Sep 2023*</font>
<font face="Lato,Roboto,Arial,sans-serif">
I'm pleased to announce the 0.1.1 release of the Fury. Fury 0.1.1 is our second release which made some improvements on v0.1.0. This version supports customize serialization security strategy instead of using class registration check mechanism, and added [fury integration](https://github.com/fury-project/dubbo-serialization-fury/releases/tag/v0.1.1) for dubbo rpc framework. Some minor fix and improvements are also included.
</font>

# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury 0.1.0 Released</font>](/blog/fury_0_1_0_release)

<font color="#888888">*31 July 2023*</font>
<font face="Lato,Roboto,Arial,sans-serif">
I'm pleased to announce the 0.1.0 release of the Fury. Fury 0.1.0 is our first release since we started the development in github in 2023.04.28, and open sourced in 2023.07.15. This release includes many features: production-ready Java serialization, cross language serialization for Java/Python/JavaScript/Rust, row format support and so on.
</font>


# [<font color="#d74633" face="Lato,Roboto,Arial,sans-serif">Fury - A blazing fast multi-language serialization framework powered by jit and zero-copy</font>](/blog/fury_blazing_fast_multiple_language_serialization_framework)

<font color="#888888">*15 July 2023*</font>
<font face="Lato,Roboto,Arial,sans-serif">
Fury is a multi-language serialization framework powered by JIT dynamic compilation and zero copy. It supports Java/Python/Golang/JavaScript/Rust/C++, provide automatic multi-language objects serialization features, and 170x speedup compared to JDK serialization.
</font>


<br />
<br />
<br />
