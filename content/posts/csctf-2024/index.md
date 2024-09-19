+++
title = "CyberSpace CTF 2024 Personal Writeup"
date = 2024-08-31T15:49:36+08:00
summary = "Not even qualified to be a beginner :("
math = true
draft = false
tags = ['Writeup', 'CSCTF']
categories = ['CTF']
+++

## Beginner

> ~~入门题~~

### key

虽然提示说用GDB，但是反编译后太简单了于是就手动解了

```python
from string import ascii_lowercase, ascii_uppercase, digits

alphabet = ascii_lowercase + ascii_uppercase + digits + '_{}'
v6 = [0] * 32

v6[0] = 67;
v6[1] = 164;
v6[2] = 65;
v6[3] = 174;
v6[4] = 66;
v6[5] = 252;
v6[6] = 115;
v6[7] = 176;
v6[8] = 111;
v6[9] = 114;
v6[10] = 94;
v6[11] = 168;
v6[12] = 101;
v6[13] = 242;
v6[14] = 81;
v6[15] = 206;
v6[16] = 32;
v6[17] = 188;
v6[18] = 96;
v6[19] = 164;
v6[20] = 109;
v6[21] = 70;
v6[22] = 33;
v6[23] = 64;
v6[24] = 32;
v6[25] = 90;
v6[26] = 44;
v6[27] = 82;
v6[28] = 45;
v6[29] = 94;
v6[30] = 45;
v6[31] = 196;

for i in range(32):
    for c in alphabet:
        if (i % 2 + 1) * (i ^ ord(c)) == v6[i]:
            print(c, end='')
            break
```

### encryptor

安卓逆向，简单调用了BlowFish加密，然后key也给了，直接解密即可

```java
import java.util.*;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import java.io.UnsupportedEncodingException;

public class sol {
    public static void main(String[] args) throws InvalidKeyException, UnsupportedEncodingException, NoSuchPaddingException, NoSuchAlgorithmException, IllegalBlockSizeException, BadPaddingException {
        Cipher cipher = Cipher.getInstance("Blowfish");
        if (cipher == null) {
            System.out.println("Failed to get Cipher");
            throw new Error();
        }
        SecretKeySpec secretKeySpec = new SecretKeySpec("encryptorencryptor".getBytes("UTF-8"), "Blowfish");
        cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
        String encryptedtext = "OIkZTMehxXAvICdQSusoDP6Hn56nDiwfGxt7w/Oia4oxWJE3NVByYnOMbqTuhXKcgg50DmVpudg=";
        byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedtext));
        String decryptedString = new String(decrypted);
        System.out.println(decryptedString);
    }
}
```

### cipher block block

> 这题有点神金，害我愣了一下。不过不知道为啥这么少解

题目
```python
import Crypto.Cipher.AES
import Crypto.Random
import Crypto.Util.Padding

f = b"CSCTF{placeholder}"
k = Crypto.Random.get_random_bytes(16)

def enc(pt):
    iv = Crypto.Random.get_random_bytes(32)
    ct = Crypto.Cipher.AES.new(iv, Crypto.Cipher.AES.MODE_CBC, k)
    return iv.hex(), ct.encrypt(Crypto.Util.Padding.pad(pt, 32)).hex()

iv0, ct0 = enc(f)
iv1, ct1 = enc(b"Lookie here, someone thinks that this message is unsafe, well I'm sorry to be the bearer of bad news but tough luck; the ciphertext is encrypted with MILITARY grade encryption. You're done kiddo.")

print(f"iv0: {iv0}\nct0: {ct0}\n")
print(f"iv1: {iv1}\nct1: {ct1}")
```

一开始看到这个padding以为是Padding Oracle并且需要自己构造一个Oracle，然后注意到iv是32bytes的，key是16bytes的，显然不合理啊。

> AES的标准中key = (16, 24, 32) bytes, iv 一定是 16 bytes 的

于是去看了下pycryptodome的源码，发现`new`的第一个参数是key.....所以出题人故意把key和iv写反了，解iv有手就行

```python
import Crypto.Cipher.AES
import Crypto.Random
import Crypto.Util.Padding

key0 = bytes.fromhex('b800f4bfd38030ff3ed82560a11e9ef67e9c3529ab52938c9458c7d8602d7a51')
ct0 = bytes.fromhex('5abb8490d872f101dcd89af421958c54204642e7d0f96a6393759f45c9630e9b6b16e87e9a96d00044fed28e295163c5fc6ed2a59839c4be433f74f8614fce54')
key1 = bytes.fromhex('667a704a5b4730f1954692ea0d924a7f9ea8fe478415fa2aad8ae59604f7950e')
ct1 = bytes.fromhex('6570f5f9b8c43a6622b1b4abc037fa09cd82be1570ec1f262538eff17374161673276cb82304676f7a37b658ae9c997e6c5b17987928f2dd292cc7ec2fcc6b9ed22994616848ee716bcf6142e0689b3aa1c5abbcd3c316a3329f8f51f378cf6e10cbeeefe54a3611dc878d23c606e78e114da6816fa384605f75f26299a1d9dca83ded23b1f7cdd1e8acced6fcb199fda34a3bc26d2e88bc3ce01466a74e44744e5a0e65cab25745c64f178cd7680e2b3c993286e236cd3c55e22cdd71aac279c749ddcf4f8137867b682c29f10d754da4f6b22603531a4885a5144f012c8f23')

iv1 = b"a" * 16
plainText = b"Lookie here, someone thinks that this message is unsafe, well I'm sorry to be the bearer of bad news but tough luck; the ciphertext is encrypted with MILITARY grade encryption. You're done kiddo."
aes2 = Crypto.Cipher.AES.new(key1, Crypto.Cipher.AES.MODE_CBC, iv1)
fakePlainText = aes2.decrypt(ct1)

# ct_blk0 = ct[:16] # first block of ciphertext
# fakePlainText = iv1 ^ F(ct_blk0)
# truePlainText = crackIV ^ F(ct_blk0)
# so we can get crackIV = fakePlainText ^ iv1 ^ plainText
crackIV = [int.to_bytes(fakePlainText[i] ^ iv1[i] ^ plainText[i]) for i in range(16)]

print(crackIV)
ct = Crypto.Cipher.AES.new(key0, Crypto.Cipher.AES.MODE_CBC, crackIV)
flag = Crypto.Util.Padding.unpad(ct.decrypt(ct0), 32)
print(flag)
```

### ZipZone

经典的zip软连接题目，只需要创建一个指向flag的软连接然后压缩上传即可
```bash
ln -s /tmp/flag.txt flag
zip -y flag.zip flag
```
上传`flag.zip`，再访问即可。

