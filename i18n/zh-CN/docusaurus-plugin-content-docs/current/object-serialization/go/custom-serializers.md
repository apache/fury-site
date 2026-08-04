---
title: 自定义序列化器
sidebar_position: 11
id: custom-serializers
license: |
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
---

自定义序列化器允许精确定义类型的序列化和反序列化方式，适用于需要特殊处理、优化或跨语言兼容的类型。

## 何时使用自定义序列化器

- **特殊编码**：需要特定二进制格式的类型
- **第三方类型**：Fory 无法自动处理的外部库类型
- **优化**：能够比默认快速序列化器路径更高效地序列化时
- **跨语言兼容性**：互操作需要精确控制二进制格式时

## ExtensionSerializer 接口

自定义序列化器实现 `ExtensionSerializer` 接口：

```go
type ExtensionSerializer interface {
    // WriteData serializes the value to the buffer.
    // Only write the data - Fory handles type info and references.
    // Use ctx.Buffer() to access the ByteBuffer.
    // Use ctx.SetError() to report errors.
    WriteData(ctx *WriteContext, value reflect.Value)

    // ReadData deserializes the value from the buffer into the provided value.
    // Only read the data - Fory handles type info and references.
    // Use ctx.Buffer() to access the ByteBuffer.
    // Use ctx.SetError() to report errors.
    ReadData(ctx *ReadContext, value reflect.Value)
}
```

## 基本示例

下面是包含整数字段的类型所使用的简单自定义序列化器：

```go
import (
    "reflect"
    "github.com/apache/fory/go/fory"
)

type MyExt struct {
    Id int32
}

type MyExtSerializer struct{}

func (s *MyExtSerializer) WriteData(ctx *fory.WriteContext, value reflect.Value) {
    myExt := value.Interface().(MyExt)
    ctx.Buffer().WriteVarint32(myExt.Id)
}

func (s *MyExtSerializer) ReadData(ctx *fory.ReadContext, value reflect.Value) {
    id := ctx.Buffer().ReadVarint32(ctx.Err())
    value.Set(reflect.ValueOf(MyExt{Id: id}))
}

// Register the custom serializer
f := fory.New(fory.WithXlang(true))
err := f.RegisterExtension(MyExt{}, 100, &MyExtSerializer{})
```

## 上下文方法

`WriteContext` 和 `ReadContext` 提供对序列化资源的访问：

| 方法             | 说明                            |
| ---------------- | ------------------------------- |
| `Buffer()`       | 返回用于读写的 `*ByteBuffer`    |
| `Err()`          | 返回用于延迟错误检查的 `*Error` |
| `SetError(err)`  | 在上下文中设置错误              |
| `HasError()`     | 如果已设置错误则返回 true       |
| `TypeResolver()` | 返回嵌套类型的类型解析器        |
| `RefResolver()`  | 返回用于引用支持的引用解析器    |

## ByteBuffer 方法

`ByteBuffer` 提供读写原始类型的方法：

### 写入方法

| 方法                       | 说明                     |
| -------------------------- | ------------------------ |
| `WriteBool(v bool)`        | 写入布尔值               |
| `WriteInt8(v int8)`        | 写入有符号 8 位整数      |
| `WriteInt16(v int16)`      | 写入有符号 16 位整数     |
| `WriteInt32(v int32)`      | 写入有符号 32 位整数     |
| `WriteInt64(v int64)`      | 写入有符号 64 位整数     |
| `WriteFloat32(v float32)`  | 写入 32 位浮点数         |
| `WriteFloat64(v float64)`  | 写入 64 位浮点数         |
| `WriteVarint32(v int32)`   | 写入变长有符号 32 位整数 |
| `WriteVarint64(v int64)`   | 写入变长有符号 64 位整数 |
| `WriteBinary(data []byte)` | 写入原始字节             |

### 读取方法

所有读取方法都接受 `*Error` 参数，用于延迟错误检查：

| 方法                                        | 说明                     |
| ------------------------------------------- | ------------------------ |
| `ReadBool(err *Error) bool`                 | 读取布尔值               |
| `ReadInt8(err *Error) int8`                 | 读取有符号 8 位整数      |
| `ReadInt16(err *Error) int16`               | 读取有符号 16 位整数     |
| `ReadInt32(err *Error) int32`               | 读取有符号 32 位整数     |
| `ReadInt64(err *Error) int64`               | 读取有符号 64 位整数     |
| `ReadFloat32(err *Error) float32`           | 读取 32 位浮点数         |
| `ReadFloat64(err *Error) float64`           | 读取 64 位浮点数         |
| `ReadVarint32(err *Error) int32`            | 读取变长有符号 32 位整数 |
| `ReadVarint64(err *Error) int64`            | 读取变长有符号 64 位整数 |
| `ReadBinary(length int, err *Error) []byte` | 读取指定长度的原始字节   |

## 复杂类型示例

包含多个字段的类型所使用的自定义序列化器：

```go
type Point3D struct {
    X, Y, Z float64
    Label   string
}

type Point3DSerializer struct{}

func (s *Point3DSerializer) WriteData(ctx *fory.WriteContext, value reflect.Value) {
    p := value.Interface().(Point3D)
    buf := ctx.Buffer()
    buf.WriteFloat64(p.X)
    buf.WriteFloat64(p.Y)
    buf.WriteFloat64(p.Z)
    // Write string as length + bytes
    labelBytes := []byte(p.Label)
    buf.WriteVarint32(int32(len(labelBytes)))
    buf.WriteBinary(labelBytes)
}

func (s *Point3DSerializer) ReadData(ctx *fory.ReadContext, value reflect.Value) {
    buf := ctx.Buffer()
    err := ctx.Err()
    x := buf.ReadFloat64(err)
    y := buf.ReadFloat64(err)
    z := buf.ReadFloat64(err)
    labelLen := buf.ReadVarint32(err)
    labelBytes := buf.ReadBinary(int(labelLen), err)
    value.Set(reflect.ValueOf(Point3D{
        X:     x,
        Y:     y,
        Z:     z,
        Label: string(labelBytes),
    }))
}

f := fory.New(fory.WithXlang(true))
f.RegisterExtension(Point3D{}, 101, &Point3DSerializer{})
```

## 处理指针

类型包含指针时，请显式处理 nil 值：

```go
type OptionalValue struct {
    Value *int64
}

type OptionalValueSerializer struct{}

func (s *OptionalValueSerializer) WriteData(ctx *fory.WriteContext, value reflect.Value) {
    ov := value.Interface().(OptionalValue)
    buf := ctx.Buffer()
    if ov.Value == nil {
        buf.WriteBool(false) // nil flag
    } else {
        buf.WriteBool(true) // not nil
        buf.WriteInt64(*ov.Value)
    }
}

func (s *OptionalValueSerializer) ReadData(ctx *fory.ReadContext, value reflect.Value) {
    buf := ctx.Buffer()
    err := ctx.Err()
    hasValue := buf.ReadBool(err)
    if !hasValue {
        value.Set(reflect.ValueOf(OptionalValue{Value: nil}))
        return
    }
    v := buf.ReadInt64(err)
    value.Set(reflect.ValueOf(OptionalValue{Value: &v}))
}
```

## 错误处理

使用 `ctx.SetError()` 报告错误：

```go
func (s *MySerializer) ReadData(ctx *fory.ReadContext, value reflect.Value) {
    buf := ctx.Buffer()
    version := buf.ReadInt8(ctx.Err())
    if ctx.HasError() {
        return
    }
    if version != 1 {
        ctx.SetError(fory.DeserializationErrorf("unsupported version: %d", version))
        return
    }
    // Continue reading...
    value.Set(reflect.ValueOf(result))
}
```

## 注册选项

### 按 ID 注册

序列化更紧凑，但需要跨语言协调 ID：

```go
f.RegisterExtension(MyType{}, 100, &MySerializer{})
```

### 按名称注册

更灵活，但序列化成本更高，序列化数据中会包含类型名称：

```go
f.RegisterExtensionByName(MyType{}, "myapp.MyType", &MySerializer{})
```

## 最佳实践

1. **保持简单**：只序列化所需内容
2. **使用变长整数**：对通常较小的整数使用 `WriteVarint32`/`WriteVarint64`
3. **显式处理 nil**：检查 nil 指针和切片
4. **为格式添加版本**：考虑添加版本字节以支持未来兼容性
5. **测试往返**：始终验证 `Read(Write(value)) == value`
6. **匹配读写顺序**：严格按照写入字段的顺序读取
7. **检查错误**：读取后使用 `ctx.HasError()` 妥善处理错误
8. **使用前部署**：发送由已注册序列化器生成的数据前，始终将该序列化器部署到所有服务。如果服务收到未注册序列化器的数据，反序列化将失败

## 测试自定义序列化器

```go
func TestMySerializer(t *testing.T) {
    f := fory.New(fory.WithXlang(true))
    f.RegisterExtension(MyType{}, 100, &MySerializer{})

    original := MyType{Field: "test"}

    // Serialize
    data, err := f.Serialize(original)
    require.NoError(t, err)

    // Deserialize
    var result MyType
    err = f.Deserialize(data, &result)
    require.NoError(t, err)

    assert.Equal(t, original, result)
}
```

## 相关主题

- [类型注册](type-registration.md)
- [支持的类型](supported-types.md)
- [跨语言序列化](xlang.md)
