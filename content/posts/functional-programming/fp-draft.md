---
layout: section
---
# Functional Programming in Rust

Expression, Pattern Matching, Closure, Iterator and Monad

---
level: 2
---
# FP 101

What is functional programming?

<div grid="~ cols-2 gap-2" m="t-2">

<v-clicks depth=2>

- Expression and Statement are different
    - Expression returns a value `114 + 514`
    - Statement has no value `let x = 114 + 514;`

```rust
fn add(a: i32, b: i32) -> i32 {
    let c = a + b;
    c  // or `return c;`
}
```
</v-clicks>

<v-clicks depth=2>

- Variables are **IMMUTABLE**
    - Rust supports mutable `mut` but immutable is default, so half-functional

```rust
let x = 114;
x = 514;  // Error: cannot assign twice to immutable variable
let mut y = 114;
y = 514;  // OK
```
</v-clicks>

<v-clicks depth=2>

- Function is first-class citizen: can be passed as argument, returned as value, assigned to variable
    - Currying supported!
- And `map`, `filter`, `fold`, `zip` are implemented
    ```rust
    let sum = v.into_iter().reduce(|a, b| a + b);
    assert_eq!(Some(15), sum);
    ```

```rust
fn curry_add(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y
}

fn main() {
    let add_nine = curry_add(9);
    let result = add_nine(1);
    println!("Result: {}", result); // 10
}
```
</v-clicks>

</div>

---
level: 2
---
# Type Classes
No interfaces, no abstract classes

In pure functional programming language, like Haskell, type classes is must-have feature.

````md magic-move
```haskell
add_int :: Int -> Int -> Int
add_int x y = x + y

add_float :: Float -> Float -> Float
add_float x y = x + y

... -- So dump, so hard
```

```haskell
data Num = Int | Float | Double | ... -- Integers, Decimals are all numbers

class Num a where
    add :: a -> a -> a
    add x y = x + y
```
````
<br>
<v-click>
And you can define a Adhoc Polymorphism

```haskell
class Num a where
    showType :: a -> String

instance Num Int where
    showType _ = "Int"

instance Num Float where
    showType _ = "Float"

...
```
</v-click>

---
level: 2
---
# Type Classes: Generics & Trait
Rust is not a OOP language!

Similarly, Rust has the generics feature

````md magic-move
```rust
fn add_i8(a:i8, b:i8) -> i8 {
    a + b
}
fn add_i32(a:i32, b:i32) -> i32 {
    a + b
}
fn add_f64(a:f64, b:f64) -> f64 {
    a + b
}
```

```rust
fn add<T>(a:T, b:T) -> T {
    a + b
}
```

```rust
// Contrain T to Add trait
fn add<T: std::ops::Add<Output = T>>(a:T, b:T) -> T {
    a + b
}
```
````
<br>
<v-click>
And you can define a Adhoc Polymorphism in rust with `trait`

```rust
pub trait Num {
    fn show_type(&self) -> String;
}

impl Num for i32 {
    fn show_type(&self) -> String {
        format!("i32: {}", self)
    }
}
```

[Read More](https://course.rs/basic/trait/trait.html)
</v-click>

---
level: 2
layout: two-cols
layoutClass: gap-4
---
# Functor
Boxing and Unboxing

<v-click>

Functor is a data structure that can transfter Type A to Type B. `a` and `b` are in the same type class `f`

```haskell
class Functor f where
    fmap :: (a -> b) -> f a -> f b
```

Functor unboxes the type `a`, do some calculation and re-boxes to `b`. In Haskell, we have `Maybe` functor

```haskell
Maybe a = Just a | Nothing
```

Useful when dealing a nullable value or error handling

```haskell
sqrt x | x >= 0 = Just $ ...
       | otherwise = Nothing

-- sqrt 4 = Just 2
-- sqrt -1 = Nothing
```
</v-click>

::right::

<v-click>

In Rust, we have `Option` and `Result` as Functor. The value is boxed, and you need to unbox(unwrap) it to get the value.

````md magic-move
```rust
fn sqrt(x: f64) -> Option<f64> {
    if x >= 0.0 {
        Some(x.sqrt())
    } else {
        None
    }
}

fn main() {
    let x = 4.0;

    let need_unbox = Some(x);
    println!("Unboxed: {:?}", need_unbox.unwrap());

    let result = sqrt(x);
    match result {
        Some(v) => println!("Result: {}", v),
        None => println!("Error: negative number")
    }
}
```

```rust
enum MathError {
    NegativeSquareRoot
}

fn sqrt(x: f64) -> Result<f64, MathError> {
    if x >= 0.0 {
        Ok(x.sqrt())
    } else {
        Err(MathError::NegativeSquareRoot)
    }
}

fn main() {
    let x = 4.0;
    let result = sqrt(x);
    match result {
        Ok(v) => println!("Result: {}", v),
        Err(e) => println!("Error: {:?}", e)
    }
}
```
````

</v-click>

---
level: 2
---
# Applicative


---
level: 2
---
# Monad


---
level: 2
---
# Implement Functor, Applicative, Monad
It's feasible and worthy in Rust


---
level: 2
---
# Pattern Matching
Not the switch-case

`match` must be exhaustive. You can match several things with `X | Y` and match in a FP style.

````md magic-move
```rust
enum Direction { East, West, North, South, }

fn main() {
    let dire = Direction::South;
    match dire {
        Direction::East => println!("East"),
        Direction::North | Direction::South => {
            println!("South or North");
        },
        _ => println!("West"), // _ matches the rest, like default
    };
}
```

```rust
enum Direction { East, West, North, South, }

fn direction_to_string(self: Option<Direction>) -> &'static str {
    match self {
        Some(Direction::East) => "East",
        Some(other) => "Other",
        None => "Not A Direction",
    };
}
```
````

<v-switch>

<template #1>

You see, `Some(x)` is a pattern, it's similar when defining a function with pattern matching

```haskell
directionToString :: Maybe Direction -> String
directionToString (Just East) = "East"
directionToString (Just _) = "Other"
```
</template>

<template #2>

Sometimes dealing with one case with `match` is verbose, we can use `if let` to simplify

```rust
if let Some(Direction::East) = d {
    println!("East");
}
```

</template>

<template #3>

Too many cases? Match a range!

```rust
match x {
    'a'..='z' => println!("Lowercase"),
    'A'..='Z' => println!("Uppercase"),
    _ => println!("something else"),
}
```

</template>
</v-switch>

---
level: 2
---
# Pattern Matching: Deconstruct
Anything has a pattern

Like Python's tuple unpacking, Rust has a similar feature

````md magic-move
```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x: a, y: b } = p;
    assert_eq!(0, a);
    assert_eq!(7, b);
}
```

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let ((feet, inches), Point {x, y}) = ((3, 10), p);
    assert_eq!(3, feet);
    assert_eq!(10, inches);
}
```
````

---
level: 2
---
# Pattern Matching: Ignore
Anything has a pattern

You can ignore everything you don't care with `_` and `..`

````md magic-move
```rust
let arr: &[u16] = &[114, 514];
let arr2: &[u16] = &[1919, 810, 334, 114, 514];

if let [x, ..] = arr2 {
    assert_eq!(x, &1919);
}

if let &[_, y] = arr {
    assert_eq!(y, 514);
}
```

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, .., last) => {
            println!("Some numbers: {}, {}", first, last);
        },
    }
}
```
````

<v-click>

[Read More](https://course.rs/basic/match-pattern/all-patterns.html)

</v-click>

---
level: 2
---
# Closure
A you-dont-know-its-name function

<v-switch>

<template #0>

Closure is a special function that can capture the environment. You've seen it before.

```rust
fn main() {
    let x = 1;
    let sum = |y| x + y;

    fn sum_wrong(y: i32) -> i32 {
        x + y
    }

    assert_eq!(3, sum(2));
    assert_eq!(3, sum_wrong(2)); // Error: cannot find value `x` in this scope
}
```

</template>

<template #1>

Suppose we need to design a cache where we can calculate and store the result and forbid the user to modify

```rust
struct Cacher<T>
where
    T: Fn(u32) -> u32,
{
    query: T,
    value: Option<u32>,
}
```

Sample test

```rust
#[test]
fn call_with_different_values() {
    let mut c = Cacher::new(|a| a);

    let v1 = c.value(1);
    let v2 = c.value(2);

    assert_eq!(v2, 1);
}
```

</template>

<template #2>

We can use closure to implement the cache with the `Fn` trait.

```rust
impl<T> Cacher<T> where T: Fn(u32) -> u32 {
    fn new(query: T) -> Cacher<T> {
        Cacher {
            query,
            value: None,
        }
    }

    fn value(&mut self, arg: u32) -> u32 {
        match self.value {
            Some(v) => v,
            None => {
                let v = (self.query)(arg);
                self.value = Some(v);
                v
            }
        }
    }
}
```

</template>

<template #3>

Closure has a unique type even with the same signature.

```rust
fn factory(x:i32) -> impl Fn(i32) -> i32 {
    let num = 5;

    if x > 1 {
        move |x| x + num
    } else {
        move |x| x - num
    }
}
```

It will trigger a compile error since the return type is different.

</template>

</v-switch>

---
level: 2
---
# Iterator
Nothing to worry about the loop


When you need to iterate over a array and multiply each element by 2, normally you will write a loop.

Nothing wrong, but it's a bit verbose.

We can use the `map` function to simplify the code


````md magic-move
```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];
    let mut v2 = Vec::new();

    for i in &v {
        v2.push(i * 2);
    }

    assert_eq!(v2, vec![2, 4, 6, 8, 10]);
}
```

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];
    let v2: Vec<i32> = v.iter().map(|x| x * 2).collect();

    assert_eq!(v2, vec![2, 4, 6, 8, 10]);
}
```
````

