# JavaScript 基准性能报告

_生成于 2026-05-08 17:55:12_

## 如何生成本报告

```bash
cd benchmarks/javascript
./run.sh
```

## 基准语义

计时的序列化器循环使用各序列化器原生的类型化值。Fory 接收其 schema 使用的预归一化 Fory 值，protobuf 接收预构造的 protobuf 形态值，JSON 接收基准 JavaScript 对象。Protobuf 耗时不包含 `toProto`、`fromProto`、`protobufjs.create` 或 `toObject` 转换工作。

## 基准图表

图表展示吞吐量（ops/sec）；数值越高越好。

![Throughput](throughput.png)

## 硬件与操作系统信息

| 键                        | 值                    |
| -------------------------- | ------------------------ |
| 操作系统                         | Darwin 24.6.0            |
| 机器架构                    | arm64                    |
| 处理器                  | arm                      |
| CPU 核心数（物理）       | 12                       |
| CPU 核心数（逻辑）        | 12                       |
| 总内存（GB）             | 48.0                     |
| 基准日期             | 2026-05-08T08:07:36.073Z |
| CPU 核心数（基准采集） | 12                       |
| Node.js                    | v22.20.0                 |
| V8                         | 12.4.254.21-node.33      |

## 基准结果

### 延迟结果（纳秒）

| 数据类型          | 操作   | fory (ns) | protobuf (ns) | json (ns) | 最快  |
| ----------------- | ---- | --------- | ------------- | --------- | -------- |
| NumericStruct     | 序列化   | 76.0      | 613.0         | 496.0     | fory     |
| NumericStruct     | 反序列化 | 56.9      | 94.8          | 333.0     | fory     |
| Sample            | 序列化   | 318.0     | 2016.6        | 1409.3    | fory     |
| Sample            | 反序列化 | 496.0     | 902.5         | 1609.6    | fory     |
| MediaContent      | 序列化   | 494.1     | 1358.5        | 803.5     | fory     |
| MediaContent      | 反序列化 | 539.3     | 628.3         | 1134.3    | fory     |
| NumericStructList | 序列化   | 195.3     | 3019.3        | 2013.5    | fory     |
| NumericStructList | 反序列化 | 183.7     | 606.9         | 1944.0    | fory     |
| SampleList        | 序列化   | 1681.9    | 19346.7       | 11870.3   | fory     |
| SampleList        | 反序列化 | 2571.9    | 5730.6        | 9074.5    | fory     |
| MediaContentList  | 序列化   | 2785.9    | 7616.6        | 3611.5    | fory     |
| MediaContentList  | 反序列化 | 3709.7    | 3018.6        | 5294.5    | protobuf |

### 吞吐结果（ops/sec）

| 数据类型          | 操作   | fory TPS   | protobuf TPS | json TPS  | 最快  |
| ----------------- | ---- | ---------- | ------------ | --------- | -------- |
| NumericStruct     | 序列化   | 13,162,466 | 1,631,271    | 2,016,097 | fory     |
| NumericStruct     | 反序列化 | 17,568,418 | 10,543,763   | 3,002,971 | fory     |
| Sample            | 序列化   | 3,144,194  | 495,893      | 709,593   | fory     |
| Sample            | 反序列化 | 2,015,942  | 1,108,010    | 621,285   | fory     |
| MediaContent      | 序列化   | 2,023,719  | 736,097      | 1,244,512 | fory     |
| MediaContent      | 反序列化 | 1,854,348  | 1,591,617    | 881,572   | fory     |
| NumericStructList | 序列化   | 5,121,376  | 331,201      | 496,645   | fory     |
| NumericStructList | 反序列化 | 5,444,504  | 1,647,728    | 514,414   | fory     |
| SampleList        | 序列化   | 594,551    | 51,688       | 84,244    | fory     |
| SampleList        | 反序列化 | 388,820    | 174,503      | 110,199   | fory     |
| MediaContentList  | 序列化   | 358,954    | 131,293      | 276,891   | fory     |
| MediaContentList  | 反序列化 | 269,561    | 331,275      | 188,876   | protobuf |

### 序列化数据大小（字节）

| 数据类型          | fory | protobuf | json |
| ----------------- | ---- | -------- | ---- |
| NumericStruct     | 78   | 93       | 159  |
| Sample            | 445  | 377      | 724  |
| MediaContent      | 388  | 307      | 596  |
| NumericStructList | 255  | 475      | 817  |
| SampleList        | 1978 | 1900     | 3642 |
| MediaContentList  | 1661 | 1550     | 3009 |
