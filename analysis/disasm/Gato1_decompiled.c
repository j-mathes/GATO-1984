typedef unsigned char   undefined;

typedef unsigned char    undefined1;
typedef unsigned int    undefined2;
typedef unsigned long    undefined4;
typedef unsigned int    word;
typedef struct OLD_IMAGE_DOS_RELOC OLD_IMAGE_DOS_RELOC, *POLD_IMAGE_DOS_RELOC;

struct OLD_IMAGE_DOS_RELOC {
    word offset;
    word segment;
};

typedef struct OLD_IMAGE_DOS_HEADER OLD_IMAGE_DOS_HEADER, *POLD_IMAGE_DOS_HEADER;

struct OLD_IMAGE_DOS_HEADER {
    char e_magic[2]; // Magic number
    word e_cblp; // Bytes of last page
    word e_cp; // Pages in file
    word e_crlc; // Relocations
    word e_cparhdr; // Size of header in paragraphs
    word e_minalloc; // Minimum extra paragraphs needed
    word e_maxalloc; // Maximum extra paragraphs needed
    word e_ss; // Initial (relative) SS value
    word e_sp; // Initial SP value
    word e_csum; // Checksum
    word e_ip; // Initial IP value
    word e_cs; // Initial (relative) CS value
    word e_lfarlc; // File address of relocation table
    word e_ovno; // Overlay number
};



undefined DAT_2000_3afe;
undefined DAT_2000_3afc;
undefined1 UNK_0000_01fc;
undefined2 UNK_0000_01fe;
undefined2 UNK_2000_3af8;
undefined2 UNK_2000_3afa;
undefined2 UNK_0000_0000;
undefined2 UNK_0000_0002;
undefined2 UNK_0000_0010;
undefined2 UNK_0000_0012;
undefined2 UNK_0000_0020;
undefined2 UNK_0000_0022;
undefined2 UNK_0000_0024;
undefined2 UNK_0000_0026;
undefined2 UNK_0000_006c;
undefined2 UNK_0000_006e;
undefined2 UNK_0000_0070;
undefined2 UNK_0000_0072;
undefined2 UNK_0000_0090;
undefined2 UNK_0000_0092;
undefined2 UNK_0000_03bc;
undefined2 UNK_0000_03be;
undefined2 UNK_0000_03c0;
undefined2 UNK_0000_03c2;
undefined2 UNK_0000_0410;
undefined2 UNK_0000_0412;
undefined2 UNK_0000_0510;
undefined2 UNK_0000_0512;
undefined2 UNK_0000_0514;
undefined2 UNK_0000_0516;
undefined2 UNK_0000_0518;
undefined2 UNK_0000_051a;
undefined2 UNK_0000_051c;
undefined2 UNK_0000_051e;
undefined2 UNK_0000_0520;
undefined2 UNK_0000_000c;
undefined2 UNK_0000_000e;

// WARNING: This function may have set the stack pointer
// WARNING: Globals starting with '_' overlap smaller symbols at the same address

void entry(void)

{
  code *pcVar1;
  undefined2 unaff_BP;
  
  _DAT_2000_3afe = 0x1000;
  _DAT_2000_3afc = 0x1f;
  FUN_203d_0000(uRam000001fe);
  uRam00023afa = 0x203d;
  uRam00023af8 = 0x2b;
  _DAT_2000_3afe = unaff_BP;
  FUN_199b_24b3(uRam000001fc);
  uRam00023afa = 0x199b;
  uRam00023af8 = 0x30;
  FUN_199b_2609();
  pcVar1 = (code *)swi(3);
  (*pcVar1)();
  return;
}



void __cdecl16near FUN_199b_03f7(void)

{
  int iVar1;
  
  iVar1 = 0x10;
  do {
    (*(code *)*(undefined2 *)(iVar1 + 0x298))();
    iVar1 = iVar1 + -2;
  } while (iVar1 != 0);
  return;
}



void __cdecl16near FUN_199b_061f(void)

{
  code *pcVar1;
  
  pcVar1 = (code *)swi(0x10);
  (*pcVar1)();
  return;
}



void FUN_199b_062a(undefined2 param_1,undefined1 param_2)

{
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  *(undefined2 *)0xe = in_BX;
  FUN_199b_177b(param_2);
  return;
}



void __cdecl16near FUN_199b_066a(void)

{
  byte bVar1;
  uint uVar2;
  undefined1 uVar3;
  int iVar4;
  int *piVar5;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  uVar2 = FUN_199b_061f();
  bVar1 = *(byte *)(ulong)((uVar2 & 0xff) + 0x47);
  FUN_199b_061f();
  *(byte *)0x50 = bVar1;
  *(byte *)0x4f = bVar1;
  uVar3 = 0x28;
  if ((1 < bVar1) && (uVar3 = 0x50, bVar1 == 7)) {
    *(undefined2 *)0x56 = 0xc0b;
  }
  *(undefined1 *)0x6d6 = uVar3;
  FUN_199b_0a08();
  uRam00000510 = unaff_DS;
  *(undefined2 *)0x6b6 = uRam00000000;
  *(undefined2 *)0x6b8 = uRam00000002;
  *(undefined2 *)0x6ba = uRam00000010;
  *(undefined2 *)0x6bc = uRam00000012;
  uRam00000000 = 0x1892;
  uRam00000002 = 0x199b;
  uRam00000010 = 0x189a;
  uRam00000012 = 0x199b;
  uRam0000051e = uRam00000410;
  uRam00000520 = uRam00000412;
  uRam0000051a = uRam00000090;
  uRam0000051c = uRam00000092;
  uRam00000516 = uRam0000006c;
  uRam00000518 = uRam0000006e;
  uRam00000512 = uRam00000070;
  uRam00000514 = uRam00000072;
  uRam000003bc = uRam00000024;
  uRam000003be = uRam00000026;
  uRam00000090 = 0x944;
  uRam00000092 = 0x199b;
  uRam0000006c = 0x83b;
  uRam0000006e = 0x199b;
  uRam00000070 = 0x91d;
  uRam00000072 = 0x199b;
  uRam000003c0 = uRam00000020;
  uRam000003c2 = uRam00000022;
  piVar5 = (int *)0x6be;
  *(undefined2 *)0x45 = 0x6be;
  *(undefined2 *)0x6c2 = 4;
  iVar4 = 0x6ca;
  *(undefined2 *)0x6c0 = 0x6ca;
  FUN_199b_0d6d();
  *piVar5 = iVar4 + 4;
  FUN_199b_0d79();
  return;
}



void __cdecl16near FUN_199b_0964(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x53 = 0x101;
  FUN_199b_0975();
  return;
}



void __cdecl16near FUN_199b_0969(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x53 = *(undefined2 *)0x53;
  FUN_199b_0975();
  return;
}



undefined2 __cdecl16near FUN_199b_0975(void)

{
  undefined2 in_AX;
  
  FUN_199b_097f();
  return in_AX;
}



void __cdecl16near FUN_199b_097f(void)

{
  FUN_199b_061f();
  return;
}



void __cdecl16near FUN_199b_09c3(void)

{
  long lVar1;
  uint uVar2;
  uint uVar3;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  uVar2 = FUN_199b_09f1();
  if (((bool)in_ZF) && (*(byte *)0x50 != 7)) {
    uVar3 = 0x800;
    if (1 < *(byte *)0x50) {
      uVar3 = 0x1000;
    }
    lVar1 = (ulong)(uVar2 & 0xff) * (ulong)uVar3;
    *(undefined2 *)0x44e = (int)lVar1;
  }
  return;
}



void __cdecl16near FUN_199b_09c8(void)

{
  long lVar1;
  uint uVar2;
  uint uVar3;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  uVar2 = FUN_199b_09f1();
  if (((bool)in_ZF) && (*(byte *)0x50 != 7)) {
    uVar3 = 0x800;
    if (1 < *(byte *)0x50) {
      uVar3 = 0x1000;
    }
    lVar1 = (ulong)(uVar2 & 0xff) * (ulong)uVar3;
    *(undefined2 *)0x44e = (int)lVar1;
  }
  return;
}



undefined2 __cdecl16near FUN_199b_09f1(void)

{
  undefined2 in_AX;
  
  return in_AX;
}



undefined2 __cdecl16near FUN_199b_0a08(void)

{
  undefined2 in_AX;
  
  FUN_199b_0969();
  FUN_199b_061f();
  return in_AX;
}



void __cdecl16near FUN_199b_0d6d(void)

{
  undefined2 in_CX;
  int in_BX;
  undefined2 unaff_DS;
  
  *(undefined2 *)(in_BX + 8) = in_CX;
  *(undefined2 *)(in_BX + 10) = in_CX;
  *(undefined2 *)(in_BX + 6) = 0;
  return;
}



undefined2 __cdecl16far FUN_199b_0d79(void)

{
  undefined2 in_AX;
  undefined2 unaff_DS;
  
  *(BADSPACEBASE **)0x6f6 = register0x00000010;
  FUN_199b_09c3();
  FUN_199b_061f();
  FUN_199b_0dc5();
  FUN_199b_0f7a();
  FUN_199b_0964();
  FUN_199b_09c8();
  return in_AX;
}



void __cdecl16near FUN_199b_0dc5(void)

{
  byte bVar1;
  undefined2 unaff_DS;
  
  bVar1 = *(byte *)0x50;
  *(undefined2 *)0x6d0 = 100;
  if (bVar1 == 6) {
    *(undefined1 *)0x87 = 1;
    *(undefined2 *)0x6ce = 0x140;
    return;
  }
  if ((bVar1 < 6) && (3 < bVar1)) {
    *(undefined1 *)0x87 = 2;
    *(undefined2 *)0x6ce = 0xa0;
    return;
  }
  *(undefined1 *)0x87 = 0;
  return;
}



undefined4 __cdecl16near FUN_199b_0f7a(void)

{
  byte bVar1;
  undefined2 in_AX;
  char cVar2;
  uint uVar3;
  uint uVar4;
  undefined2 in_DX;
  uint *puVar5;
  undefined2 unaff_DS;
  
  FUN_199b_061f();
  if (*(char *)0x11 == '\0') {
    FUN_199b_061f();
  }
  else {
    FUN_199b_09f1();
    puVar5 = (uint *)0x16;
    bVar1 = 0x31;
    cVar2 = '\x05';
    if (*(char *)0x6d6 != '(') {
      bVar1 = 0x31;
      cVar2 = '\n';
    }
    do {
      FUN_199b_1019();
      uVar3 = *puVar5;
      uVar4 = uVar3;
      if (5 < uVar3) {
        uVar3 = 6;
        uVar4 = uVar3;
      }
      for (; uVar3 != 0; uVar3 = uVar3 - 1) {
        FUN_199b_1013();
      }
      uVar3 = (uint)(byte)(7 - (char)uVar4);
      do {
        FUN_199b_1019();
        uVar3 = uVar3 - 1;
      } while (uVar3 != 0);
      puVar5 = puVar5 + 2;
      bVar1 = bVar1 + 1;
      if (0x39 < bVar1) {
        bVar1 = 0x30;
      }
      cVar2 = cVar2 + -1;
    } while (cVar2 != '\0');
  }
  FUN_199b_0969();
  return CONCAT22(in_DX,in_AX);
}



void FUN_199b_1013(void)

{
  FUN_199b_061f();
  FUN_199b_061f();
  return;
}



void __cdecl16near FUN_199b_1019(void)

{
  FUN_199b_061f();
  FUN_199b_061f();
  return;
}



void __cdecl16far FUN_199b_177b(undefined1 param_1)

{
  int in_AX;
  undefined2 in_CX;
  undefined2 unaff_BP;
  undefined2 unaff_DS;
  int in_stack_00000000;
  undefined2 in_stack_00000002;
  
  *(int *)0x6e6 = in_AX;
  *(int *)0x6e2 = in_AX + 0x81;
  *(undefined2 *)0x6e4 = in_CX;
  *(undefined2 *)0x6e8 = unaff_BP;
  *(undefined1 **)0x6e0 = &param_1;
  *(undefined2 *)0x6fa = in_stack_00000002;
  *(int *)0x6f8 = in_stack_00000000 + -0x1f;
  *(undefined2 *)0x6f4 = 0x1978;
  *(undefined2 *)0x6f2 = 0;
  *(undefined2 *)0x6f0 = 0;
  FUN_199b_1831();
  FUN_199b_066a();
  FUN_199b_03f7();
  *(undefined2 *)0x98 = unaff_DS;
  return;
}



void __cdecl16far FUN_199b_1831(void)

{
  undefined1 *puVar1;
  char cVar2;
  undefined2 uVar3;
  undefined1 *puVar4;
  int in_CX;
  undefined2 in_DX;
  undefined2 *puVar5;
  undefined2 *unaff_BP;
  int unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 auStack_102 [128];
  
  uVar3 = FUN_199b_1883();
  puVar4 = (undefined1 *)
           CONCAT11((byte)((uint)uVar3 >> 8) | *(byte *)((int)unaff_BP + unaff_DI + 0x6ea),
                    (char)uVar3);
  FUN_199b_1883();
  puVar5 = auStack_102 + 0x80;
  cVar2 = '\x02';
  do {
    unaff_BP = unaff_BP + -1;
    puVar5 = puVar5 + -1;
    *puVar5 = *unaff_BP;
    cVar2 = cVar2 + -1;
  } while ('\0' < cVar2);
  in(in_DX);
  for (; in_CX != 0; in_CX = in_CX + -1) {
    puVar1 = puVar4;
    puVar4 = puVar4 + 1;
    *puVar1 = 0;
  }
  *(undefined2 *)0x6f0 = 0;
  FUN_199b_1857();
  FUN_199b_4482();
  *(undefined2 *)0x98 = unaff_DS;
  return;
}



void __cdecl16near FUN_199b_1857(void)

{
  undefined1 *puVar1;
  undefined2 *puVar2;
  byte bVar3;
  undefined2 uVar4;
  int iVar5;
  char in_DL;
  int in_BX;
  char *unaff_SI;
  undefined1 *unaff_DI;
  undefined1 *puVar6;
  undefined2 *puVar7;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  char in_CF;
  char cVar8;
  
  uVar4 = FUN_199b_1883();
  bVar3 = (char)uVar4 + '-' + in_CF;
  cVar8 = '\0';
  unaff_SI[in_BX] = unaff_SI[in_BX] | bVar3;
  *(undefined2 *)0x6ee = CONCAT11((char)((uint)uVar4 >> 8),bVar3);
  iVar5 = FUN_199b_1883();
  *unaff_SI = *unaff_SI + in_DL + *(char *)(in_BX + 0x1ae8) + cVar8;
  for (iVar5 = iVar5 - (int)unaff_DI; iVar5 != 0; iVar5 = iVar5 + -1) {
    puVar1 = unaff_DI;
    unaff_DI = unaff_DI + 1;
    *puVar1 = 0;
  }
  puVar6 = (undefined1 *)0x6fe;
  for (iVar5 = 0x13; iVar5 != 0; iVar5 = iVar5 + -1) {
    puVar1 = puVar6;
    puVar6 = puVar6 + 1;
    *puVar1 = 0;
  }
  puVar7 = (undefined2 *)0x9a;
  for (iVar5 = 10; iVar5 != 0; iVar5 = iVar5 + -1) {
    puVar2 = puVar7;
    puVar7 = puVar7 + 1;
    *puVar2 = 0xffff;
  }
  return;
}



undefined2 __cdecl16near FUN_199b_1883(void)

{
  undefined2 unaff_DS;
  char *in_stack_00000000;
  
  return *(undefined2 *)((int)*(undefined4 *)0x6f8 + (int)*in_stack_00000000);
}



// WARNING: Unable to track spacebase fully for stack

void FUN_199b_2477(undefined2 param_1)

{
  undefined1 *puVar1;
  undefined2 *puVar2;
  undefined1 *puVar3;
  undefined2 *puVar4;
  uint uVar5;
  undefined1 *puVar6;
  undefined1 *puVar7;
  undefined1 *puVar8;
  int in_CX;
  int in_DX;
  int iVar9;
  int unaff_BP;
  undefined2 *unaff_SI;
  undefined2 *unaff_DI;
  undefined1 *puVar10;
  undefined2 unaff_ES;
  undefined2 uVar11;
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  
  for (; in_CX != 0; in_CX = in_CX + -1) {
    puVar4 = unaff_DI;
    unaff_DI = unaff_DI + 1;
    puVar2 = unaff_SI;
    unaff_SI = unaff_SI + 1;
    *puVar4 = *puVar2;
  }
  uVar5 = unaff_BP - in_DX;
  if (0xfff < uVar5) {
    uVar5 = 0x1000;
  }
  iVar9 = unaff_BP - uVar5;
  puVar6 = (undefined1 *)(uVar5 * 0x10);
  *(undefined2 *)(puVar6 + -2) = param_1;
  *(undefined2 *)(puVar6 + -4) = in_stack_00000000;
  puVar7 = puVar6 + -0x201;
  *(undefined1 **)(puVar6 + -6) = puVar7;
  *(int *)(puVar6 + -8) = iVar9;
  uVar11 = *(undefined2 *)(puVar6 + -8);
  puVar10 = puVar7;
  for (puVar8 = puVar6 + -0x200; puVar8 != (undefined1 *)0x0; puVar8 = puVar8 + -1) {
    puVar3 = puVar10;
    puVar10 = puVar10 + -1;
    puVar1 = puVar7;
    puVar7 = puVar7 + -1;
    *puVar3 = *puVar1;
  }
  *(int *)(puVar6 + -8) = iVar9;
  FUN_199b_062a(*(undefined2 *)(puVar6 + -2),*puVar6);
  return;
}



void __cdecl16far FUN_199b_24b3(undefined1 param_1)

{
  undefined2 unaff_DS;
  
  *(undefined1 *)0xb8 = 5;
  *(undefined1 **)0xb6 = &param_1;
  return;
}



void __cdecl16far FUN_199b_2609(void)

{
  int iVar1;
  undefined1 *puVar2;
  int *piVar3;
  undefined2 unaff_DS;
  
  puVar2 = (undefined1 *)0x71d;
  iVar1 = 0x69;
  do {
    *puVar2 = 0;
    puVar2 = puVar2 + 1;
    iVar1 = iVar1 + -1;
  } while (iVar1 != 0);
  *(undefined1 *)0x71c = 0;
  piVar3 = (int *)0x786;
  *(undefined2 *)0x78a = 0x2a;
  iVar1 = 0x792;
  *(undefined2 *)0x788 = 0x792;
  FUN_199b_0d6d();
  *piVar3 = iVar1 + 0x2a;
  uRam0000000c = 0x2707;
  uRam0000000e = 0x199b;
  uRam00000024 = 0x2761;
  uRam00000026 = 0x199b;
  *(undefined2 *)0x6fc = 0x2747;
  *(undefined2 *)0x134 = 0x28b2;
  *(undefined2 *)0x136 = 0x28b5;
  *(undefined2 *)0x138 = 0x27c0;
  *(undefined2 *)0x13a = 0x27d4;
  *(undefined2 *)0x0 = 0x28a1;
  *(undefined2 *)0x6 = 0x2609;
  *(undefined2 *)0x8 = 0x199b;
  return;
}



void __cdecl16near FUN_199b_3f0b(void)

{
  return;
}



void __cdecl16near FUN_199b_4482(void)

{
  int *piVar1;
  int iVar2;
  int iVar3;
  int *piVar4;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  piVar1 = (int *)*(int *)0x6e4;
  *(int *)0x928 = (int)piVar1;
  iVar2 = (*(int *)0x6e6 + 1U & 0xfffe) - (int)piVar1;
  *piVar1 = iVar2 + -3;
  *(undefined2 *)((int)piVar1 + iVar2 + -2) = 0xffff;
  iVar3 = 0xf;
  *(undefined2 *)0x92a = 0x92c;
  iVar2 = 0x930;
  piVar1 = (int *)0x92c;
  do {
    piVar4 = piVar1;
    *piVar4 = iVar2;
    piVar4[1] = -1;
    iVar2 = iVar2 + 4;
    iVar3 = iVar3 + -1;
    piVar1 = piVar4 + 2;
  } while (iVar3 != 0);
  *piVar4 = 0;
  *(undefined1 *)0x968 = 0;
  return;
}



void FUN_203d_0000(undefined2 param_1)

{
  undefined2 *puVar1;
  undefined2 *puVar2;
  int iVar3;
  undefined2 *puVar4;
  undefined2 *puVar5;
  
  puVar4 = (undefined2 *)0x0;
  puVar5 = (undefined2 *)0x0;
  for (iVar3 = 0x880; iVar3 != 0; iVar3 = iVar3 + -1) {
    puVar2 = puVar5;
    puVar5 = puVar5 + 1;
    puVar1 = puVar4;
    puVar4 = puVar4 + 1;
    *puVar2 = *puVar1;
  }
  FUN_199b_2477(param_1);
  return;
}


