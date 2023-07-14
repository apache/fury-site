---
title: Fury - A blazing fast multi-language serialization framework powered by jit and zero-copy

order: 0
---
> Fury is a multi-language serialization framework powered by JIT dynamic compilation and zero copy. It supports Java/Python/Golang/JavaScript/C++, provide automatic multi-language objects serialization features, and 170x speedup. 

The GitHub address of fury repository is: https://github.com/alipay/fury 

<img alt="fury banner" src="/fury_banner.png">

# Background
Serialization is basic components of system communication, and is widly used in big data, AI framework, cloud native and other distributed systems. When the object needs cto being transfered between processes/languages/nodes, or needs persistence, state read/write, copy, they all need serialization. Its performance and ease-of-use affect runtime and development efficiency.

Static serialization frameworks such as · cannot be directly used for cross-language development of domain objects due to their inability to support object reference and polymorphism, as well as the need for pre-generating code. Dynamic serialization frameworks such as JDK serialization, Kryo, Fst, Hessian, Pickle provide ease-of-use and dynamics, but do not support cross-language and have significant performance issues, which cannot meet the demands of high throughput, low latency, and large-scale data transmission scenarios.

Therefore, we developed a new multi-language serialization framework [Fury](https://github.com/alipay/fury), which is now open-sourced on [Github](https://github.com/alipay/fury). Through highly optimized serialization primitives, combined with JIT dynamic compilation and Zero-Copy technologies, Fury meets the requirements of performance, functionality, and ease-of-use simultaneously, achives automatic cross-language serialization of any object and provides ultimate performance.

<p>
<img width=44% alt="serialization" src="/case1.png">
<img  width=44% alt="deserialization" src="/case2.png">
</p>

