"""Find far-call targets in the program body that are followed by constant inline operand bytes."""
import struct
import sys
from collections import Counter, defaultdict

import index_functions as x

b = x.analyze(x.Binary(sys.argv[1], {"Gato1": "Gato1.exe", "DEMO": "DEMO.EXE"}[sys.argv[1]]))
d = b.d
seg = d[b.prog_lo + 3:b.prog_lo + 5] if False else None
sites = defaultdict(list)
pos = b.prog_lo
for i in b.program_ins:
    if i.mnemonic == "lcall":
        off = struct.unpack_from("<H", i.bytes, 1)[0]
        sites[off].append(i.address + 5)
for off, ads in sorted(sites.items()):
    nxt = Counter(d[a] for a in ads)
    nxt2 = Counter(d[a + 1] for a in ads)
    top, n = nxt.most_common(1)[0]
    print(f"{off:04x} n={len(ads):3d} next={top:02x} ({n}/{len(ads)}) 2nd={nxt2.most_common(1)[0][0]:02x}")
