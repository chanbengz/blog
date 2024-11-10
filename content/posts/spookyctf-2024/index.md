+++
title = 'SpookyCTF 2024 Personal Writeup'
date = 2024-10-26T15:53:49+08:00
summary = "Recover from the no-time-for-CTF blues and rebuild the skills"
math = true
draft = false
tags = ['Writeup', 'SpookyCTF']
categories = ['CTF']
+++

School days are busy.

## Web
### cryptid-hunters

Simple SQLi. Login with `admin` and password `' or 1=1; #` and you will get the flag.

### paranormal-picture

Simple SSRF. By pass the verification and resolve to `127.0.0.1`

```python
def verifyBlog(url):
    blog_list = ["blog","cryptid","real","666",".org"]
    for word in blog_list:
        if word not in url:
            return False
    return True
```

So the payload would be `http://real.666.blog.cryptid.org@127.0.0.1/flag` and that's it.

## Crypto
### the-moth-flies-at-dawn

Easy hash cracking. Hint already gives that its a SHA256. So the script

```python
import hashlib

cipher = open('hash.txt', 'r').read().strip()
wordlist = open('wordList.txt', 'r').read().strip().split('\n')

for word in wordlist:
    if hashlib.sha256(word.encode()).hexdigest() == cipher:
        print(word)
        break
```

### encryption-activated

At first I thought it was to decrypt the ciphertext. Well, the results were weird, so I read the description again and found it to encrypt the weird text. Modify the given `encrypt.py` could get the flag. A bit of brute force.

```python
from string import printable
alphabet = printable

def mycipher(myinput):
    global myletter
    rawdecrypt = list(myinput)
    for iter in range(0,len(rawdecrypt)):
        rawdecrypt[iter] = chr(rawdecrypt[iter] + ord(myletter))
        myletter = chr(ord(myletter) + 1)
    encrypted = "".join(rawdecrypt)
    print("NICC{" + encrypted + "}")

cipher = open('flag.output', 'rb').read().strip()
for i in alphabet:
    myletter = i
    mycipher(cipher)
```

Dumb me, forgot to strip the newline character from the `flag.output`.

## Misc
### Well-Met

> Interesting, I found some weired text and it turns out to be Cthuvian, nothing helpful though.

Yet another hide-and-seek challenge. Open the inspect element and search for flag, you will get two parts

```html
<p class="redacted" id="spookyflag_part1">NICC{StOr</p>
<img class="img-fluid" src="/files/img/nah4real.png" width="400" height="400" id="spookyflag_p2" alt="IeS_DoNt_M">
```

Search for `}` you will see the fourth part. And the flag is wrapped in `<p4>` tag, so I immediately know that the third flag should have been in `<p3>` tag. So the rest parts

```html
<!--<p4>oO_cTfY_rIgHt?}</p4> -->
<span class="p-l redacted" id="p3">aKe_ThE_cTf_T</span>
```
