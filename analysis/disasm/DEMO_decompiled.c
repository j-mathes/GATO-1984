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



undefined DAT_2000_057e;
undefined DAT_2000_057c;
undefined1 UNK_0000_01fc;
undefined2 UNK_0000_01fe;
undefined2 UNK_2000_0578;
undefined2 UNK_2000_057a;
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
  
  _DAT_2000_057e = 0x1000;
  _DAT_2000_057c = 0x1f;
  FUN_1ca9_0000(uRam000001fe);
  uRam0002057a = 0x1ca9;
  uRam00020578 = 0x2b;
  _DAT_2000_057e = unaff_BP;
  FUN_15cb_2209(uRam000001fc);
  uRam0002057a = 0x15cb;
  uRam00020578 = 0x30;
  FUN_15cb_235f();
  pcVar1 = (code *)swi(3);
  (*pcVar1)();
  return;
}



void __cdecl16near FUN_15cb_01a3(void)

{
  int iVar1;
  
  iVar1 = 0x10;
  do {
    (*(code *)*(undefined2 *)(iVar1 + 0x44))();
    iVar1 = iVar1 + -2;
  } while (iVar1 != 0);
  return;
}



void __cdecl16near FUN_15cb_0623(void)

{
  code *pcVar1;
  
  pcVar1 = (code *)swi(0x10);
  (*pcVar1)();
  return;
}



void FUN_15cb_062e(undefined2 param_1,undefined1 param_2)

{
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  *(undefined2 *)0xe = in_BX;
  FUN_15cb_177f(param_2);
  return;
}



void __cdecl16near FUN_15cb_066e(void)

{
  byte bVar1;
  uint uVar2;
  undefined1 uVar3;
  int iVar4;
  int *piVar5;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  uVar2 = FUN_15cb_0623();
  bVar1 = *(byte *)(ulong)((uVar2 & 0xff) + 0x47);
  FUN_15cb_0623();
  *(byte *)0x50 = bVar1;
  *(byte *)0x4f = bVar1;
  uVar3 = 0x28;
  if ((1 < bVar1) && (uVar3 = 0x50, bVar1 == 7)) {
    *(undefined2 *)0x56 = 0xc0b;
  }
  *(undefined1 *)0x682 = uVar3;
  FUN_15cb_0a0c();
  uRam00000510 = unaff_DS;
  *(undefined2 *)0x662 = uRam00000000;
  *(undefined2 *)0x664 = uRam00000002;
  *(undefined2 *)0x666 = uRam00000010;
  *(undefined2 *)0x668 = uRam00000012;
  uRam00000000 = 0x1896;
  uRam00000002 = 0x15cb;
  uRam00000010 = 0x189e;
  uRam00000012 = 0x15cb;
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
  uRam00000090 = 0x948;
  uRam00000092 = 0x15cb;
  uRam0000006c = 0x83f;
  uRam0000006e = 0x15cb;
  uRam00000070 = 0x921;
  uRam00000072 = 0x15cb;
  uRam000003c0 = uRam00000020;
  uRam000003c2 = uRam00000022;
  piVar5 = (int *)0x66a;
  *(undefined2 *)0x45 = 0x66a;
  *(undefined2 *)0x66e = 4;
  iVar4 = 0x676;
  *(undefined2 *)0x66c = 0x676;
  FUN_15cb_0d71();
  *piVar5 = iVar4 + 4;
  FUN_15cb_0d7d();
  return;
}



void __cdecl16near FUN_15cb_0968(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x53 = 0x101;
  FUN_15cb_0979();
  return;
}



void __cdecl16near FUN_15cb_096d(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x53 = *(undefined2 *)0x53;
  FUN_15cb_0979();
  return;
}



undefined2 __cdecl16near FUN_15cb_0979(void)

{
  undefined2 in_AX;
  
  FUN_15cb_0983();
  return in_AX;
}



void __cdecl16near FUN_15cb_0983(void)

{
  FUN_15cb_0623();
  return;
}



void __cdecl16near FUN_15cb_09c7(void)

{
  long lVar1;
  uint uVar2;
  uint uVar3;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  uVar2 = FUN_15cb_09f5();
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



void __cdecl16near FUN_15cb_09cc(void)

{
  long lVar1;
  uint uVar2;
  uint uVar3;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  uVar2 = FUN_15cb_09f5();
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



undefined2 __cdecl16near FUN_15cb_09f5(void)

{
  undefined2 in_AX;
  
  return in_AX;
}



undefined2 __cdecl16near FUN_15cb_0a0c(void)

{
  undefined2 in_AX;
  
  FUN_15cb_096d();
  FUN_15cb_0623();
  return in_AX;
}



void __cdecl16near FUN_15cb_0d71(void)

{
  undefined2 in_CX;
  int in_BX;
  undefined2 unaff_DS;
  
  *(undefined2 *)(in_BX + 8) = in_CX;
  *(undefined2 *)(in_BX + 10) = in_CX;
  *(undefined2 *)(in_BX + 6) = 0;
  return;
}



undefined2 __cdecl16far FUN_15cb_0d7d(void)

{
  undefined2 in_AX;
  undefined2 unaff_DS;
  
  *(BADSPACEBASE **)0x6a2 = register0x00000010;
  FUN_15cb_09c7();
  FUN_15cb_0623();
  FUN_15cb_0dc9();
  FUN_15cb_0f7e();
  FUN_15cb_0968();
  FUN_15cb_09cc();
  return in_AX;
}



void __cdecl16near FUN_15cb_0dc9(void)

{
  byte bVar1;
  undefined2 unaff_DS;
  
  bVar1 = *(byte *)0x50;
  *(undefined2 *)0x67c = 100;
  if (bVar1 == 6) {
    *(undefined1 *)0x87 = 1;
    *(undefined2 *)0x67a = 0x140;
    return;
  }
  if ((bVar1 < 6) && (3 < bVar1)) {
    *(undefined1 *)0x87 = 2;
    *(undefined2 *)0x67a = 0xa0;
    return;
  }
  *(undefined1 *)0x87 = 0;
  return;
}



undefined4 __cdecl16near FUN_15cb_0f7e(void)

{
  byte bVar1;
  undefined2 in_AX;
  char cVar2;
  uint uVar3;
  uint uVar4;
  undefined2 in_DX;
  uint *puVar5;
  undefined2 unaff_DS;
  
  FUN_15cb_0623();
  if (*(char *)0x11 == '\0') {
    FUN_15cb_0623();
  }
  else {
    FUN_15cb_09f5();
    puVar5 = (uint *)0x16;
    bVar1 = 0x31;
    cVar2 = '\x05';
    if (*(char *)0x682 != '(') {
      bVar1 = 0x31;
      cVar2 = '\n';
    }
    do {
      FUN_15cb_101d();
      uVar3 = *puVar5;
      uVar4 = uVar3;
      if (5 < uVar3) {
        uVar3 = 6;
        uVar4 = uVar3;
      }
      for (; uVar3 != 0; uVar3 = uVar3 - 1) {
        FUN_15cb_1017();
      }
      uVar3 = (uint)(byte)(7 - (char)uVar4);
      do {
        FUN_15cb_101d();
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
  FUN_15cb_096d();
  return CONCAT22(in_DX,in_AX);
}



void FUN_15cb_1017(void)

{
  FUN_15cb_0623();
  FUN_15cb_0623();
  return;
}



void __cdecl16near FUN_15cb_101d(void)

{
  FUN_15cb_0623();
  FUN_15cb_0623();
  return;
}



void __cdecl16far FUN_15cb_177f(undefined1 param_1)

{
  int in_AX;
  undefined2 in_CX;
  undefined2 unaff_BP;
  undefined2 unaff_DS;
  int in_stack_00000000;
  undefined2 in_stack_00000002;
  
  *(int *)0x692 = in_AX;
  *(int *)0x68e = in_AX + 0x81;
  *(undefined2 *)0x690 = in_CX;
  *(undefined2 *)0x694 = unaff_BP;
  *(undefined1 **)0x68c = &param_1;
  *(undefined2 *)0x6a6 = in_stack_00000002;
  *(int *)0x6a4 = in_stack_00000000 + -0x1f;
  *(undefined2 *)0x6a0 = 0x197c;
  *(undefined2 *)0x69e = 0;
  *(undefined2 *)0x69c = 0;
  FUN_15cb_1835();
  FUN_15cb_066e();
  FUN_15cb_01a3();
  *(undefined2 *)0x98 = unaff_DS;
  return;
}



void __cdecl16far FUN_15cb_1835(void)

{
  undefined1 *puVar1;
  char cVar2;
  undefined2 uVar3;
  undefined1 *puVar4;
  int in_CX;
  undefined2 *puVar5;
  undefined2 *unaff_BP;
  int unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 auStack_102 [128];
  
  uVar3 = FUN_15cb_1887();
  puVar4 = (undefined1 *)
           CONCAT11((byte)((uint)uVar3 >> 8) | *(byte *)((int)unaff_BP + unaff_DI + 0x696),
                    (char)uVar3);
  FUN_15cb_1887();
  puVar5 = auStack_102 + 0x80;
  cVar2 = '\x02';
  do {
    unaff_BP = unaff_BP + -1;
    puVar5 = puVar5 + -1;
    *puVar5 = *unaff_BP;
    cVar2 = cVar2 + -1;
  } while ('\0' < cVar2);
  for (; in_CX != 0; in_CX = in_CX + -1) {
    puVar1 = puVar4;
    puVar4 = puVar4 + 1;
    *puVar1 = 0;
  }
  *(undefined2 *)0x69c = 0;
  FUN_15cb_185b();
  FUN_15cb_4446();
  *(undefined2 *)0x98 = unaff_DS;
  return;
}



void __cdecl16near FUN_15cb_185b(void)

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
  
  uVar4 = FUN_15cb_1887();
  bVar3 = (char)uVar4 + '-' + in_CF;
  cVar8 = '\0';
  unaff_SI[in_BX] = unaff_SI[in_BX] | bVar3;
  *(undefined2 *)0x69a = CONCAT11((char)((uint)uVar4 >> 8),bVar3);
  iVar5 = FUN_15cb_1887();
  *unaff_SI = *unaff_SI + in_DL + *(char *)(in_BX + 0x1ae8) + cVar8;
  for (iVar5 = iVar5 - (int)unaff_DI; iVar5 != 0; iVar5 = iVar5 + -1) {
    puVar1 = unaff_DI;
    unaff_DI = unaff_DI + 1;
    *puVar1 = 0;
  }
  puVar6 = (undefined1 *)0x6aa;
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



undefined2 __cdecl16near FUN_15cb_1887(void)

{
  undefined2 unaff_DS;
  char *in_stack_00000000;
  
  return *(undefined2 *)((int)*(undefined4 *)0x6a4 + (int)*in_stack_00000000);
}



// WARNING: Unable to track spacebase fully for stack

void FUN_15cb_21cd(undefined2 param_1)

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
  FUN_15cb_062e(*(undefined2 *)(puVar6 + -2),*puVar6);
  return;
}



void __cdecl16far FUN_15cb_2209(undefined1 param_1)

{
  undefined2 unaff_DS;
  
  *(undefined1 *)0xb8 = 5;
  *(undefined1 **)0xb6 = &param_1;
  return;
}



void __cdecl16far FUN_15cb_235f(void)

{
  int iVar1;
  undefined1 *puVar2;
  int *piVar3;
  undefined2 unaff_DS;
  
  puVar2 = (undefined1 *)0x6c5;
  iVar1 = 0x69;
  do {
    *puVar2 = 0;
    puVar2 = puVar2 + 1;
    iVar1 = iVar1 + -1;
  } while (iVar1 != 0);
  *(undefined1 *)0x6c4 = 0;
  piVar3 = (int *)0x72e;
  *(undefined2 *)0x732 = 0x2a;
  iVar1 = 0x73a;
  *(undefined2 *)0x730 = 0x73a;
  FUN_15cb_0d71();
  *piVar3 = iVar1 + 0x2a;
  uRam0000000c = 0x245d;
  uRam0000000e = 0x15cb;
  uRam00000024 = 0x24b7;
  uRam00000026 = 0x15cb;
  *(undefined2 *)0x6a8 = 0x249d;
  *(undefined2 *)0x122 = 0x2608;
  *(undefined2 *)0x124 = 0x260b;
  *(undefined2 *)0x126 = 0x2516;
  *(undefined2 *)0x128 = 0x252a;
  *(undefined2 *)0x0 = 0x25f7;
  *(undefined2 *)0x6 = 0x235f;
  *(undefined2 *)0x8 = 0x15cb;
  return;
}



void __cdecl16near FUN_15cb_4446(void)

{
  int *piVar1;
  int iVar2;
  int iVar3;
  int *piVar4;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  piVar1 = (int *)*(int *)0x690;
  *(int *)0x8d0 = (int)piVar1;
  iVar2 = (*(int *)0x692 + 1U & 0xfffe) - (int)piVar1;
  *piVar1 = iVar2 + -3;
  *(undefined2 *)((int)piVar1 + iVar2 + -2) = 0xffff;
  iVar3 = 0xf;
  *(undefined2 *)0x8d2 = 0x8d4;
  iVar2 = 0x8d8;
  piVar1 = (int *)0x8d4;
  do {
    piVar4 = piVar1;
    *piVar4 = iVar2;
    piVar4[1] = -1;
    iVar2 = iVar2 + 4;
    iVar3 = iVar3 + -1;
    piVar1 = piVar4 + 2;
  } while (iVar3 != 0);
  *piVar4 = 0;
  *(undefined1 *)0x910 = 0;
  return;
}



void FUN_1ca9_0000(undefined2 param_1)

{
  undefined2 *puVar1;
  undefined2 *puVar2;
  int iVar3;
  undefined2 *puVar4;
  undefined2 *puVar5;
  
  puVar4 = (undefined2 *)0x0;
  puVar5 = (undefined2 *)0x0;
  for (iVar3 = 0xb00; iVar3 != 0; iVar3 = iVar3 + -1) {
    puVar2 = puVar5;
    puVar5 = puVar5 + 1;
    puVar1 = puVar4;
    puVar4 = puVar4 + 1;
    *puVar2 = *puVar1;
  }
  FUN_15cb_21cd(param_1);
  return;
}


