---
title: Java object graph serialization
order: 1
---

When only java object serialization needed, this mode will have better performance compared to cross-language object graph serialization.

```java
import io.fury.Fury;
import java.util.List;
import java.util.Arrays;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // Note that Fury instances should be reused between
    // multiple serializations of different objects.
    {
      Fury fury = Fury.builder().withLanguage(Fury.Language.JAVA)
        .withRefTracking(true)
        // Allow to deserialize objects unknown types,
        // more flexible but less secure.
        // .withSecureMode(false)
        .build();
      // Registering types can reduce class name serialization overhead, but not mandatory.
      // If secure mode enabled, all custom types must be registered.
      fury.register(SomeClass.class);
      byte[] bytes = fury.serialize(object);
      System.out.println(fury.deserialize(bytes));
    }
    {
      ThreadSafeFury fury = Fury.builder().withLanguage(Fury.Language.JAVA)
        // Allow to deserialize objects unknown types,
        // more flexible but less secure.
        // .withSecureMode(false)
        .withRefTracking(true)
        .buildThreadSafeFury();
      byte[] bytes = fury.serialize(object);
      System.out.println(fury.deserialize(bytes));
    }
    {
      ThreadSafeFury fury = new ThreadSafeFury(() -> {
        Fury fury = Fury.builder().withLanguage(Fury.Language.JAVA)
          .withClassRegistrationRequired(false)
          .withRefTracking(true).build();
        fury.register(SomeClass.class);
        return fury;
      });
      byte[] bytes = fury.serialize(object);
      System.out.println(fury.deserialize(bytes));
    }
  }
}
```
