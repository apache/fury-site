# Java Xlang 序列化基准测试

有关 fory-json、Jackson 和 Gson 的结果，请参阅 [Java JSON 基准测试报告](../../../json/java/README.md)。

本报告涵盖由 `benchmarks/java/run.sh` 生成的 xlang 基准测试组。它不沿用单独的 [Java 原生模式报告](../../native/java/README.md) 中记录的环境或原生模式工作负载。仓库中检入的 xlang 快照没有记录主机、Fory 提交或依赖版本；在使用这些结果进行当前对比之前，请重新运行基准测试。

新建或更新报告时所需的元数据，请参阅[基准测试方法](../../../methodology.md)。

## 工作负载

- `NumericStruct`：包含基本类型数值字段。
- `Sample`：[Kryo 基准测试套件](https://github.com/EsotericSoftware/kryo/blob/master/benchmarks/src/main/java/com/esotericsoftware/kryo/benchmarks/data/Sample.java)使用的模型。
- `MediaContent`：[jvm-serializers](https://github.com/eishay/jvm-serializers/blob/master/tpc/src/data/media/MediaContent.java) 中的媒体模型。
- `*List`：对应模型的列表。

## 运行基准测试

从 `benchmarks/java/run.sh` 运行。原始 JMH JSON 保留在已忽略的本地 `benchmarks/java/reports/` 目录中；`throughput.png` 和这份 xlang 报告发布在 `docs/benchmarks/object-serialization/xlang/java/` 下。

```bash
cd benchmarks/java
./run.sh
```

JMH 参数：`-f 1 -wi 3 -i 3 -t 1 -w 3s -r 3s -bm thrpt -tu s`。不要跳过预热。吞吐量越高越好。

## 结果

![Java Xlang 序列化吞吐量](throughput.png)

| 数据类型          | 操作     | Fory ops/sec | Protobuf ops/sec | Flatbuffer ops/sec | 最快 |
| ----------------- | -------- | ------------ | ---------------- | ------------------ | ---- |
| NumericStruct     | 序列化   | 46,787,647   | 33,024,161       | 9,612,018          | Fory |
| NumericStruct     | 反序列化 | 71,683,707   | 29,837,931       | 40,514,436         | Fory |
| Sample            | 序列化   | 17,406,902   | 2,071,963        | 3,153,672          | Fory |
| Sample            | 反序列化 | 17,772,123   | 1,867,967        | 4,179,494          | Fory |
| MediaContent      | 序列化   | 10,783,325   | 1,781,338        | 1,444,737          | Fory |
| MediaContent      | 反序列化 | 7,950,203    | 2,184,597        | 3,453,985          | Fory |
| NumericStructList | 序列化   | 21,263,673   | 2,511,081        | 3,047,836          | Fory |
| NumericStructList | 反序列化 | 19,249,877   | 2,067,204        | 8,168,569          | Fory |
| SampleList        | 序列化   | 4,580,165    | 401,280          | 696,268            | Fory |
| SampleList        | 反序列化 | 3,811,985    | 344,945          | 773,625            | Fory |
| MediaContentList  | 序列化   | 1,657,717    | 353,717          | 296,868            | Fory |
| MediaContentList  | 反序列化 | 1,111,043    | 435,956          | 516,192            | Fory |
