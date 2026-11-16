"""Disassemble the first runtime routines (arithmetic stubs) of Gato1.exe: python rt_dump.py <start-hex> <end-hex>"""
import sys

import capstone

import index_functions as x

b = x.analyze(x.Binary("Gato1", "Gato1.exe"))
rt = b.hdr + (b.runtime_seg - x.GHIDRA_BASE_SEG) * 16
a, e = int(sys.argv[1], 16), int(sys.argv[2], 16)
md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_16)
for i in md.disasm(b.d[rt + a:rt + e], a):
    print(f"{i.address:04x} {i.mnemonic} {i.op_str}")
