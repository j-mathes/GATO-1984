typedef unsigned char   undefined;

typedef unsigned char    byte;
typedef unsigned int    uint;
typedef unsigned long    ulong;
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



undefined DAT_1000_4b1e;
undefined DAT_1000_4b1c;
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
undefined2 UNK_0000_01fc;
undefined UNK_0000_01fe;
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
undefined2 UNK_1000_4b1a;
undefined2 UNK_1000_4b20;
int UNK_0000_0410;
undefined1 UNK_0000_0501;
int UNK_0000_051e;
undefined2 UNK_0000_007c;
undefined2 UNK_0000_007e;

// WARNING: Instruction at (ram,0x000101d6) overlaps instruction at (ram,0x000101d4)
// 
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used
// WARNING: This function may have set the stack pointer
// WARNING: Removing unreachable block (ram,0x000101fb)
// WARNING: Globals starting with '_' overlap smaller symbols at the same address

void __cdecl16near entry(void)

{
  byte *pbVar1;
  uint *puVar2;
  undefined2 uVar3;
  code *pcVar4;
  byte bVar5;
  undefined2 uVar6;
  byte bVar7;
  undefined2 uVar8;
  uint uVar9;
  int iVar10;
  int iVar11;
  char *pcVar12;
  int *piVar13;
  undefined2 *puVar14;
  undefined2 *puVar15;
  int *unaff_SI;
  undefined2 *puVar16;
  int unaff_DI;
  undefined1 *puVar17;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined2 in_FS;
  undefined1 uVar18;
  undefined1 uVar19;
  
  _DAT_1000_4b1e = 0x1000;
  _DAT_1000_4b1c = 0x1f;
  FUN_13f9_0000(uRam000001fe);
  _DAT_1000_4b1c = 0x13f9;
  uRam00014b1a = 0x2b;
  FUN_1016_181c(uRam000001fc,(undefined1)uRam000001fe);
  uRam00014b20 = 0x1016;
  _DAT_1000_4b1e = 0x32;
  FUN_1016_08ea();
  _DAT_1000_4b1e = 0x1016;
  _DAT_1000_4b1c = 0x37;
  FUN_1016_0789();
  _DAT_1000_4b1e = 0x1016;
  _DAT_1000_4b1c = 0x3f;
  FUN_1016_0a59();
  _DAT_1000_4b1e = 0x1016;
  _DAT_1000_4b1c = 0x47;
  FUN_1016_1ccd();
  puVar14 = (undefined2 *)0x200;
  while( true ) {
    uVar9 = 0;
    *(undefined2 *)((int)puVar14 + -2) = 0x1016;
    *(undefined2 *)((int)puVar14 + -4) = 0x4e;
    FUN_1016_0e57();
    *(undefined2 *)((int)puVar14 + -2) = 0x1016;
    *(undefined2 *)((int)puVar14 + -4) = 0x5b;
    FUN_1016_0e66();
    while( true ) {
      iVar10 = 1;
      puVar14[-1] = 0x1016;
      puVar14[-2] = 99;
      FUN_1016_0db6();
      uVar18 = iVar10 == -1;
      if ((bool)uVar18) break;
      puVar14[-1] = 0x1016;
      puVar14[-2] = 0x74;
      FUN_1016_19ee();
      puVar14[-1] = 0x1016;
      puVar14[-2] = 0x7c;
      FUN_1016_1836();
      puVar14[-1] = 0x1016;
      puVar14[-2] = 0x8d;
      FUN_1016_118d();
      puVar14[-1] = 0x1016;
      puVar14[-2] = 0x96;
      FUN_1016_0c3c();
      if ((bool)uVar18) {
        puVar14[-1] = 0x1016;
        puVar14[-2] = 0xa3;
        FUN_1016_0c67();
        puVar14[-2] = 0x1016;
        puVar14[-3] = 0xab;
        FUN_1016_0c81();
        puVar14[-2] = 0x1016;
        puVar14[-3] = 0xb0;
        FUN_1016_1ce3();
        puVar14[-2] = 0x1016;
        puVar14[-3] = 0xb8;
        FUN_1016_1aea();
        do {
          uVar19 = uVar18;
          puVar14[-2] = 0x1016;
          puVar14[-3] = 0xbd;
          FUN_1016_10bf();
          puVar14[-2] = 0x1016;
          puVar14[-3] = 0xc5;
          FUN_1016_0bcc();
          puVar14[-2] = 0x1016;
          puVar14[-3] = 0xce;
          FUN_1016_0c3c();
          uVar18 = 1;
        } while ((bool)uVar19);
        puVar14[-2] = 0x1016;
        puVar14[-3] = 0xd5;
        FUN_1016_0789();
        puVar14 = puVar14 + -1;
      }
      else {
        puVar14[-1] = 0x1016;
        puVar14[-2] = 0xdd;
        FUN_1016_1ce3();
        puVar14[-1] = 0x1016;
        puVar14[-2] = 0xe5;
        FUN_1016_1ad6();
        puVar14[-1] = 0x1016;
        puVar14[-2] = 0xed;
        FUN_1016_1aea();
      }
    }
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0xf5;
    FUN_1016_1ce3();
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0xfd;
    FUN_1016_1aea();
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0x102;
    FUN_1016_1ce3();
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0x107;
    FUN_1016_1aea();
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0x10c;
    FUN_1016_1ce3();
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0x114;
    FUN_1016_1aea();
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0x119;
    FUN_1016_1ce3();
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0x121;
    FUN_1016_1aea();
    do {
      uVar19 = uVar18;
      puVar14[-1] = 0x1016;
      puVar14[-2] = 0x126;
      FUN_1016_10bf();
      puVar14[-1] = 0x1016;
      puVar14[-2] = 0x12e;
      FUN_1016_0bcc();
      puVar14[-1] = 0x1016;
      puVar14[-2] = 0x137;
      FUN_1016_0c3c();
      uVar18 = 1;
    } while ((bool)uVar19);
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0x13e;
    FUN_1016_0de1();
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0x149;
    FUN_1016_0c3c();
    if (!(bool)uVar19) break;
    puVar14[-1] = 0x1016;
    puVar14[-2] = 0x153;
    FUN_1016_0789();
  }
  iVar11 = 0x90e;
  puVar14[-1] = 0x1016;
  puVar14[-2] = 0x15e;
  FUN_1016_185f();
  puVar14[-1] = 0x1016;
  puVar14[-2] = 0x163;
  uVar6 = FUN_1016_1702();
  pbVar1 = (byte *)((int)unaff_SI + 0x69);
  bVar5 = *pbVar1;
  bVar7 = (byte)uVar9;
  *pbVar1 = *pbVar1 + bVar7;
  puVar2 = (uint *)(unaff_DI + 0x6e);
  iVar10 = ((uint)puVar14 & 3) - (*puVar2 & 3);
  *puVar2 = *puVar2 + (uint)(0 < iVar10) * iVar10;
  if (CARRY1(bVar5,bVar7)) {
    pbVar1 = (byte *)(unaff_DI + 0x61);
    *pbVar1 = *pbVar1 & bVar7;
    bVar5 = *pbVar1;
    if (*pbVar1 == 0) {
      *(undefined2 *)(iVar11 + (int)unaff_SI) = unaff_ES;
      if (-1 < (char)bVar5) {
        puVar14[-1] = 0x1df;
        uVar9 = FUN_1016_002f();
        puVar14[-1] = CONCAT11((char)(uVar9 >> 8),*(undefined1 *)(ulong)((uVar9 & 0xff) + 0x47));
        puVar14[-2] = 0x1e9;
        FUN_1016_002f();
        bVar5 = (byte)puVar14[-1];
        *(byte *)0x50 = bVar5;
        *(byte *)0x4f = bVar5;
        uVar18 = 0x28;
        if ((1 < bVar5) && (uVar18 = 0x50, bVar5 == 7)) {
          *(undefined2 *)0x56 = 0xc0b;
        }
        *(undefined1 *)0x5c6 = uVar18;
        puVar14[-1] = 0x20a;
        FUN_1016_0418();
        puVar14[-1] = unaff_DS;
        uRam00000510 = unaff_DS;
        *(undefined2 *)0x5a6 = uRam00000000;
        *(undefined2 *)0x5a8 = uRam00000002;
        *(undefined2 *)0x5aa = uRam00000010;
        *(undefined2 *)0x5ac = uRam00000012;
        uRam00000000 = 0x15c3;
        uRam00000002 = 0x1016;
        uRam00000010 = 0x15cb;
        uRam00000012 = 0x1016;
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
        uRam00000090 = 0x354;
        uRam00000092 = 0x1016;
        uRam0000006c = 0x24b;
        uRam0000006e = 0x1016;
        uRam00000070 = 0x32d;
        uRam00000072 = 0x1016;
        uRam000003c0 = uRam00000020;
        uRam000003c2 = uRam00000022;
        uVar6 = puVar14[-1];
        piVar13 = (int *)0x5ae;
        *(undefined2 *)0x45 = 0x5ae;
        *(undefined2 *)0x5b2 = 4;
        iVar10 = 0x5ba;
        *(undefined2 *)0x5b0 = 0x5ba;
        puVar14[-1] = 0x2c2;
        FUN_1016_077d();
        *piVar13 = iVar10 + 4;
        puVar14[-1] = 0x1016;
        puVar14[-2] = 0x2cc;
        FUN_1016_0789();
        return;
      }
      uVar9 = uVar9 & 0xff00;
      iVar10 = *unaff_SI;
      puVar14[-1] = 0x1492;
      pcVar12 = (char *)CONCAT11((char)((uint)iVar11 >> 8) * '\x02' +
                                 ((long)(int)((long)iVar10 * -0x66) != (long)iVar10 * -0x66),
                                 (char)iVar11);
      puVar14[-2] = unaff_DS;
      puVar15 = puVar14 + -3;
      puVar14[-3] = unaff_ES;
    }
    else {
      puVar17 = (undefined1 *)*puVar14;
      puVar16 = (undefined2 *)puVar14[1];
      iVar10 = puVar14[2];
      pcVar12 = (char *)puVar14[4];
      uVar8 = puVar14[5];
      uVar9 = puVar14[6];
      uVar6 = puVar14[7];
      puVar15 = puVar14 + 8;
      uVar18 = in(uVar8);
      *puVar17 = uVar18;
      pbVar1 = puVar17 + 1;
      *pbVar1 = *pbVar1 & (byte)(uVar9 >> 8);
      (pcVar12 + (int)puVar16)[0x72] = (pcVar12 + (int)puVar16)[0x72] & (byte)uVar8;
      out(*puVar16,uVar8);
      uVar3 = in(uVar8);
      *(undefined2 *)(puVar17 + 1) = uVar3;
      pbVar1 = (byte *)(pcVar12 + (int)(puVar16 + 1) + 0x72);
      *pbVar1 = *pbVar1 & (byte)uVar8;
      out(puVar16[1],uVar8);
      if ((char)*pbVar1 < '\0') {
        out(puVar16[2],uVar8);
        (pcVar12 + (int)(puVar17 + 3))[0x42] = (pcVar12 + (int)(puVar17 + 3))[0x42] & (byte)uVar9;
        puVar14[7] = iVar10 + -1;
        puVar14[6] = puVar16 + 3;
        puVar14[5] = puVar17 + 3;
        pcVar4 = (code *)swi(0x10);
        (*pcVar4)();
        return;
      }
    }
    *pcVar12 = (char)uVar6 + (char)(uVar9 >> 8);
    *(undefined1 *)0xa = 0;
    *(undefined1 *)0xb = 0;
    *(undefined1 *)0x40 = 0;
    *(undefined1 *)0x88 = 0;
    *(undefined1 *)0x89 = 0;
    *(undefined1 *)0x8a = 0;
    *(undefined1 *)0x8e = 0;
    *(undefined1 *)0x8f = 3;
    *(undefined2 *)((int)puVar15 + -2) = 0x1cc;
    FUN_1016_2646();
    *(undefined1 *)0x8d = 4;
    *(undefined1 *)0x8b = 4;
  }
  else {
    *(char *)((int)unaff_SI + 0x289) = *(char *)((int)unaff_SI + 0x289) + (char)((uint)uVar6 >> 8);
  }
  *(undefined1 *)0x8c = 0x78;
  return;
}



void __cdecl16near FUN_1016_002f(void)

{
  code *pcVar1;
  
  pcVar1 = (code *)swi(0x10);
  (*pcVar1)();
  return;
}



void FUN_1016_003a(undefined2 param_1,undefined1 param_2)

{
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  *(undefined2 *)0xe = in_BX;
  FUN_1016_14ac(param_2);
  return;
}



void __cdecl16near FUN_1016_007a(void)

{
  byte bVar1;
  uint uVar2;
  undefined1 uVar3;
  int iVar4;
  int *piVar5;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  uVar2 = FUN_1016_002f();
  bVar1 = *(byte *)(ulong)((uVar2 & 0xff) + 0x47);
  FUN_1016_002f();
  *(byte *)0x50 = bVar1;
  *(byte *)0x4f = bVar1;
  uVar3 = 0x28;
  if ((1 < bVar1) && (uVar3 = 0x50, bVar1 == 7)) {
    *(undefined2 *)0x56 = 0xc0b;
  }
  *(undefined1 *)0x5c6 = uVar3;
  FUN_1016_0418();
  uRam00000510 = unaff_DS;
  *(undefined2 *)0x5a6 = uRam00000000;
  *(undefined2 *)0x5a8 = uRam00000002;
  *(undefined2 *)0x5aa = uRam00000010;
  *(undefined2 *)0x5ac = uRam00000012;
  uRam00000000 = 0x15c3;
  uRam00000002 = 0x1016;
  uRam00000010 = 0x15cb;
  uRam00000012 = 0x1016;
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
  uRam00000090 = 0x354;
  uRam00000092 = 0x1016;
  uRam0000006c = 0x24b;
  uRam0000006e = 0x1016;
  uRam00000070 = 0x32d;
  uRam00000072 = 0x1016;
  uRam000003c0 = uRam00000020;
  uRam000003c2 = uRam00000022;
  piVar5 = (int *)0x5ae;
  *(undefined2 *)0x45 = 0x5ae;
  *(undefined2 *)0x5b2 = 4;
  iVar4 = 0x5ba;
  *(undefined2 *)0x5b0 = 0x5ba;
  FUN_1016_077d();
  *piVar5 = iVar4 + 4;
  FUN_1016_0789();
  return;
}



void FUN_1016_017b(void)

{
  undefined2 unaff_DS;
  
  FUN_1000_02ea();
                    // WARNING: Could not recover jumptable at 0x000102e5. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)(ulong)*(uint *)0xc)();
  return;
}



void FUN_1016_0180(void)

{
  undefined2 unaff_DS;
  
  FUN_1000_02ea();
                    // WARNING: Could not recover jumptable at 0x000102e5. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)(ulong)*(uint *)0xc)();
  return;
}



void FUN_1016_0189(void)

{
  char cVar1;
  byte bVar2;
  undefined2 uVar3;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  bool bVar4;
  undefined1 in_stack_00000000;
  
  bVar4 = iRam0000051e != iRam00000410;
  iRam00000410 = iRam0000051e;
  FUN_1016_08f5();
  uVar3 = *(undefined2 *)0x4f;
  cVar1 = (char)uVar3;
  *(char *)0x50 = cVar1;
  if ((bVar4) || ((char)((uint)uVar3 >> 8) != cVar1)) {
    FUN_1016_002f();
    FUN_1016_0374();
  }
  uRam00000501 = in_stack_00000000;
  FUN_1016_02da();
  uVar3 = 0x706;
  if (*(char *)0x50 == '\a') {
    uVar3 = 0xc0b;
  }
  *(undefined2 *)0x56 = uVar3;
  FUN_1016_0413();
  bVar2 = in(0x21);
  out(0x21,bVar2 | 0x18);
  iRam00000410 = iRam0000051e;
  uRam00000412 = uRam00000520;
  uRam00000090 = uRam0000051a;
  uRam00000092 = uRam0000051c;
  uRam0000006c = uRam00000516;
  uRam0000006e = uRam00000518;
  uRam00000070 = uRam00000512;
  uRam00000072 = uRam00000514;
  uRam00000024 = uRam000003bc;
  uRam00000026 = uRam000003be;
  uRam00000000 = *(undefined2 *)0x5a6;
  uRam00000002 = *(undefined2 *)0x5a8;
  uRam00000010 = *(undefined2 *)0x5aa;
  uRam00000012 = *(undefined2 *)0x5ac;
  return;
}



void __cdecl16near FUN_1000_02ea(void)

{
  char cVar1;
  byte bVar2;
  undefined2 uVar3;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  byte in_CF;
  bool bVar4;
  undefined1 in_stack_00000000;
  
  bVar4 = iRam0000051e != iRam00000410;
  iRam00000410 = iRam0000051e;
  FUN_1016_08f5();
  uVar3 = *(undefined2 *)0x4f;
  cVar1 = (char)uVar3;
  *(char *)0x50 = cVar1;
  if ((bVar4) || (((in_CF & 1) == 0 && ((char)((uint)uVar3 >> 8) != cVar1)))) {
    FUN_1016_002f();
    FUN_1016_0374();
  }
  uRam00000501 = in_stack_00000000;
  FUN_1016_02da();
  uVar3 = 0x706;
  if (*(char *)0x50 == '\a') {
    uVar3 = 0xc0b;
  }
  *(undefined2 *)0x56 = uVar3;
  FUN_1016_0413();
  bVar2 = in(0x21);
  out(0x21,bVar2 | 0x18);
  iRam00000410 = iRam0000051e;
  uRam00000412 = uRam00000520;
  uRam00000090 = uRam0000051a;
  uRam00000092 = uRam0000051c;
  uRam0000006c = uRam00000516;
  uRam0000006e = uRam00000518;
  uRam00000070 = uRam00000512;
  uRam00000072 = uRam00000514;
  uRam00000024 = uRam000003bc;
  uRam00000026 = uRam000003be;
  uRam00000000 = *(undefined2 *)0x5a6;
  uRam00000002 = *(undefined2 *)0x5a8;
  uRam00000010 = *(undefined2 *)0x5aa;
  uRam00000012 = *(undefined2 *)0x5ac;
  return;
}



undefined1 __cdecl16near FUN_1016_026a(void)

{
  undefined1 uVar1;
  undefined2 unaff_DS;
  
  LOCK();
  uVar1 = *(undefined1 *)0x10;
  *(undefined1 *)0x10 = 0;
  UNLOCK();
  return uVar1;
}



// WARNING: Removing unreachable block (ram,0x00010440)
// WARNING: Removing unreachable block (ram,0x00010449)
// WARNING: Removing unreachable block (ram,0x00010455)
// WARNING: Removing unreachable block (ram,0x0001045c)
// WARNING: Removing unreachable block (ram,0x00010489)

uint __cdecl16far FUN_1016_0273(void)

{
  int *piVar1;
  byte *pbVar2;
  code *pcVar3;
  undefined2 uVar4;
  uint uVar5;
  uint in_stack_00000010;
  
  FUN_1016_2a65();
  uVar4 = uRam00000510;
  if (*(int *)0x43 != 0) {
    piVar1 = (int *)0x43;
    *piVar1 = *piVar1 + -1;
    if (*piVar1 == 0) {
      FUN_1016_02b7();
    }
  }
  *(char *)0x42 = *(char *)0x42 + -1;
  pbVar2 = (byte *)0x42;
  *pbVar2 = *pbVar2 & 0x1f;
  if (*pbVar2 == 0) {
    pcVar3 = (code *)swi(0xf0);
    uVar5 = (*pcVar3)();
    return uVar5;
  }
  out(0x20,0x20);
  return in_stack_00000010;
}



undefined2 __cdecl16far FUN_1016_02b7(void)

{
  byte bVar1;
  undefined2 in_AX;
  undefined2 uVar2;
  undefined1 uVar3;
  undefined2 in_CX;
  undefined2 unaff_DS;
  
  if (*(int *)(*(int *)0x45 + 6) != 0) {
    uVar2 = FUN_1016_0746();
    out(0x42,(char)uVar2);
    uVar3 = (undefined1)((uint)uVar2 >> 8);
    out(0x42,uVar3);
    *(undefined2 *)0x43 = in_CX;
    *(undefined1 *)0x41 = 0;
    return CONCAT11(uVar3,uVar3);
  }
  if (*(char *)0x41 == '\0') {
    uVar2 = 0x5ae;
    if (*(int *)0x45 != 0x5ae) {
      FUN_1016_2518();
      *(undefined2 *)0x45 = uVar2;
    }
    in_AX = FUN_1016_077d();
    bVar1 = in(0x61);
    out(0x61,bVar1 & 0xfc);
    uRam00000020 = uRam000003c0;
    uRam00000022 = uRam000003c2;
    out(0x40,0);
    out(0x40,0);
    *(undefined2 *)0x43 = 0;
  }
  return in_AX;
}



void FUN_1016_02da(void)

{
  byte bVar1;
  undefined2 uVar2;
  undefined2 unaff_DS;
  
  *(undefined1 *)0x41 = 0;
  if (*(char *)0x41 == '\0') {
    uVar2 = 0x5ae;
    if (*(int *)0x45 != 0x5ae) {
      FUN_1016_2518();
      *(undefined2 *)0x45 = uVar2;
    }
    FUN_1016_077d();
    bVar1 = in(0x61);
    out(0x61,bVar1 & 0xfc);
    uRam00000020 = uRam000003c0;
    uRam00000022 = uRam000003c2;
    out(0x40,0);
    out(0x40,0);
    *(undefined2 *)0x43 = 0;
  }
  return;
}



void FUN_1016_036d(void)

{
  return;
}



void __cdecl16near FUN_1016_0373(void)

{
  return;
}



void FUN_1016_0374(void)

{
  FUN_1016_037d();
  return;
}



void FUN_1016_0379(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x53 = *(undefined2 *)0x53;
  FUN_1016_0385();
  return;
}



void __cdecl16near FUN_1016_037d(void)

{
  undefined2 in_DX;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x53 = in_DX;
  FUN_1016_0385();
  return;
}



undefined2 __cdecl16near FUN_1016_0385(void)

{
  undefined2 in_AX;
  
  FUN_1016_038f();
  return in_AX;
}



void __cdecl16near FUN_1016_038f(void)

{
  FUN_1016_002f();
  return;
}



void __cdecl16near FUN_1016_039d(void)

{
  FUN_1016_03b9();
  FUN_1016_002f();
  FUN_1016_03d8();
  return;
}



undefined1 __cdecl16near FUN_1016_03b9(void)

{
  FUN_1016_03d3();
  return 1;
}



void __cdecl16near FUN_1016_03d3(void)

{
  long lVar1;
  uint uVar2;
  uint uVar3;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  uVar2 = FUN_1016_0401();
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



void __cdecl16near FUN_1016_03d8(void)

{
  long lVar1;
  uint uVar2;
  uint uVar3;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  uVar2 = FUN_1016_0401();
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



undefined2 __cdecl16near FUN_1016_0401(void)

{
  undefined2 in_AX;
  
  return in_AX;
}



undefined2 __cdecl16near FUN_1016_0413(void)

{
  undefined2 in_stack_00000000;
  
  FUN_1016_0379();
  FUN_1016_002f();
  return in_stack_00000000;
}



undefined2 __cdecl16near FUN_1016_0418(void)

{
  undefined2 in_stack_00000000;
  
  FUN_1016_0379();
  FUN_1016_002f();
  return in_stack_00000000;
}



undefined2 __cdecl16near FUN_1016_043c(void)

{
  undefined2 uVar1;
  undefined2 uVar2;
  undefined1 in_ZF;
  
  uVar2 = FUN_1016_0401();
  uVar1 = uRam0000007c;
  if (!(bool)in_ZF) {
    uRam0000007c = 0x58;
    FUN_1016_002f();
  }
  uRam0000007c = uVar1;
  return uVar2;
}



void __cdecl16near FUN_1016_0494(void)

{
  undefined1 in_CL;
  byte in_CH;
  int in_BX;
  int unaff_SI;
  int unaff_DI;
  undefined2 unaff_DS;
  
  if (in_CH <= (byte)in_BX) {
    *(undefined2 *)0x68 = 0;
    FUN_1016_15d3();
    return;
  }
  while( true ) {
    *(undefined1 *)(in_BX + unaff_DI) = in_CL;
    in_BX = in_BX + 1;
    if (in_CH == (byte)in_BX) break;
    in_CL = *(undefined1 *)(in_BX + unaff_SI);
  }
  *(undefined2 *)0x68 = 0;
  return;
}



void __cdecl16near FUN_1016_04a3(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x68 = 0;
  return;
}



undefined4
FUN_1016_04ad(undefined2 param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4,
             undefined2 param_5)

{
  undefined2 in_CX;
  int in_BX;
  int unaff_SI;
  int unaff_DI;
  undefined2 unaff_DS;
  undefined4 uVar1;
  
  *(undefined1 *)(in_BX + unaff_DI) = *(undefined1 *)(in_BX + unaff_SI);
  if ((byte)in_BX < (byte)((uint)in_CX >> 8)) {
    *(int *)0x68 = *(int *)0x68 + 1;
    return CONCAT22(param_2,param_5);
  }
  *(undefined2 *)0x68 = 0;
  uVar1 = FUN_1016_15d3();
  return uVar1;
}



undefined2 __cdecl16far FUN_1016_04af(void)

{
  undefined2 uVar1;
  undefined2 in_CX;
  int in_BX;
  int unaff_DI;
  undefined2 unaff_DS;
  undefined2 in_stack_0000000a;
  
  *(undefined1 *)(in_BX + unaff_DI) = (char)in_CX;
  if ((byte)in_BX < (byte)((uint)in_CX >> 8)) {
    *(int *)0x68 = *(int *)0x68 + 1;
    return in_stack_0000000a;
  }
  *(undefined2 *)0x68 = 0;
  uVar1 = FUN_1016_15d3();
  return uVar1;
}



void __cdecl16near FUN_1016_04c9(void)

{
  code *pcVar1;
  undefined2 unaff_DS;
  
  if ((*(char *)0x10 == '\0') && (*(int *)0x12 == 0)) {
    pcVar1 = (code *)swi(0x16);
    (*pcVar1)();
  }
  return;
}



uint __cdecl16near FUN_1016_04e2(void)

{
  int iVar1;
  code *pcVar2;
  uint uVar3;
  byte bVar5;
  uint uVar4;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  undefined1 uVar6;
  
  do {
    uVar6 = in_ZF;
    uVar3 = FUN_1016_04c9();
    in_ZF = 1;
  } while ((bool)uVar6);
  if (*(char *)0x10 != '\0') {
    *(undefined1 *)0x10 = 0;
    return CONCAT11((char)(uVar3 >> 8),3);
  }
  if (*(int *)0x12 == 0) {
    pcVar2 = (code *)swi(0x16);
    uVar3 = (*pcVar2)();
    bVar5 = (byte)(uVar3 >> 8);
    if ((char)uVar3 != '\0') {
      return uVar3;
    }
    if (bVar5 < 0x3b) {
      return uVar3;
    }
    if (0x44 < bVar5) {
      return uVar3;
    }
    uVar4 = (uint)(byte)((bVar5 - 0x3b) * '\x04');
    iVar1 = *(int *)(uVar4 + 0x16);
    *(int *)0x12 = iVar1;
    if (iVar1 == 0) {
      return uVar3;
    }
    *(undefined2 *)0x14 = *(undefined2 *)(uVar4 + 0x18);
  }
  uVar6 = *(undefined1 *)*(undefined2 *)0x14;
  *(int *)0x14 = *(int *)0x14 + 1;
  *(int *)0x12 = *(int *)0x12 + -1;
  return CONCAT11((char)(uVar3 >> 8),uVar6);
}



undefined4 __cdecl16near FUN_1016_054c(void)

{
  char cVar1;
  undefined2 in_AX;
  undefined2 in_DX;
  undefined2 extraout_DX;
  byte bVar3;
  undefined2 uVar2;
  undefined2 unaff_DS;
  
  uVar2 = *(undefined2 *)0x53;
  cVar1 = (char)in_AX;
  if (cVar1 == '\a') {
    FUN_1016_0627();
    goto LAB_1016_05a0;
  }
  if (cVar1 == '\x1d') {
    if ((1 < (byte)((uint)uVar2 >> 8)) || ((char)uVar2 != '\x01')) {
      FUN_1016_037d();
      goto LAB_1016_05a0;
    }
  }
  else {
    if (cVar1 == '\x1c') {
LAB_1016_0571:
      bVar3 = (char)((uint)uVar2 >> 8) + 1;
      uVar2 = CONCAT11(bVar3,(char)uVar2);
      if (bVar3 <= *(byte *)0x5c6) goto LAB_1016_059d;
    }
    else if ((cVar1 != '\r') && (cVar1 != '\n')) {
      if (cVar1 == '\f') {
        FUN_1016_0789();
        goto LAB_1016_05a0;
      }
      FUN_1016_05cc();
      uVar2 = extraout_DX;
      goto LAB_1016_0571;
    }
    if ((0x17 < (byte)uVar2) && (FUN_1016_039d(), 1 < *(byte *)0x650)) {
      *(char *)0x650 = *(char *)0x650 + -1;
      *(char *)0x652 = *(char *)0x652 + -1;
    }
  }
LAB_1016_059d:
  FUN_1016_037d();
LAB_1016_05a0:
  return CONCAT22(in_DX,in_AX);
}



void __cdecl16near FUN_1016_05cc(void)

{
  FUN_1016_0379();
  FUN_1016_002f();
  return;
}



// WARNING: Removing unreachable block (ram,0x000107c3)

uint __cdecl16near FUN_1016_0627(void)

{
  byte bVar1;
  undefined2 uVar2;
  undefined1 uVar3;
  uint uVar4;
  undefined2 uVar5;
  int iVar6;
  int iVar7;
  undefined2 unaff_DS;
  bool bVar8;
  
  FUN_1016_2ffe();
  uVar4 = 800;
  FUN_1016_06fc();
  bVar8 = uVar4 == 0;
  if (bVar8) {
    uVar5 = 0x200;
  }
  else {
    uVar5 = CONCAT11((char)(0x1234dc / (ulong)uVar4),(char)(0x1234dc / (ulong)uVar4 >> 8));
  }
  iVar7 = *(int *)0x45;
  iVar6 = *(int *)(iVar7 + 4);
  do {
    FUN_1016_026a();
    if (!bVar8) {
      uVar4 = FUN_1016_0273();
      return uVar4;
    }
    bVar8 = true;
  } while (iVar6 == *(int *)(iVar7 + 6));
  FUN_1016_0769();
  FUN_1016_0769();
  FUN_1016_0769();
  uVar2 = FUN_1016_0769();
  if ((*(char *)0x40 == '\0') || (*(int *)0x43 == 0)) {
    uRam00000020 = 0x281;
    uRam00000022 = 0x1016;
    out(0x40,0);
    out(0x40,8);
    if (*(char *)0x41 == '\0') {
      out(0x43,0xb6);
      bVar1 = in(0x61);
      out(0x61,bVar1 | 3);
    }
    uVar2 = FUN_1016_0746();
    out(0x42,(char)uVar2);
    uVar3 = (undefined1)((uint)uVar2 >> 8);
    uVar2 = CONCAT11(uVar3,uVar3);
    out(0x42,uVar3);
    *(undefined2 *)0x43 = uVar5;
    *(undefined1 *)0x41 = 0;
  }
  return uVar2;
}



uint __cdecl16near FUN_1016_0669(void)

{
  byte bVar1;
  uint uVar2;
  undefined2 uVar3;
  undefined1 uVar4;
  uint in_CX;
  undefined2 uVar5;
  int iVar6;
  int iVar7;
  undefined2 unaff_DS;
  bool bVar8;
  
  FUN_1016_06fc();
  bVar8 = in_CX == 0;
  if (bVar8) {
    uVar5 = 0x200;
  }
  else {
    uVar5 = CONCAT11((char)(0x1234dc / (ulong)in_CX),(char)(0x1234dc / (ulong)in_CX >> 8));
  }
  iVar7 = *(int *)0x45;
  iVar6 = *(int *)(iVar7 + 4);
  do {
    FUN_1016_026a();
    if (!bVar8) {
      uVar2 = FUN_1016_0273();
      return uVar2;
    }
    bVar8 = true;
  } while (iVar6 == *(int *)(iVar7 + 6));
  FUN_1016_0769();
  FUN_1016_0769();
  FUN_1016_0769();
  uVar2 = FUN_1016_0769();
  if ((*(char *)0x40 == '\0') || (*(int *)0x43 == 0)) {
    uRam00000020 = 0x281;
    uRam00000022 = 0x1016;
    out(0x40,0);
    out(0x40,8);
    if (*(char *)0x41 == '\0') {
      out(0x43,0xb6);
      bVar1 = in(0x61);
      out(0x61,bVar1 | 3);
    }
    uVar3 = FUN_1016_0746();
    out(0x42,(char)uVar3);
    uVar4 = (undefined1)((uint)uVar3 >> 8);
    uVar2 = CONCAT11(uVar4,uVar4);
    out(0x42,uVar4);
    *(undefined2 *)0x43 = uVar5;
    *(undefined1 *)0x41 = 0;
  }
  return uVar2;
}



void __cdecl16near FUN_1016_06fc(void)

{
  int *piVar1;
  int *unaff_SI;
  undefined2 unaff_DS;
  
  if (*(char *)0x40 == '\0') {
    do {
    } while (*(int *)(*(int *)0x45 + 6) != 0);
    while (*(int *)0x43 != 0) {
      *(undefined1 *)0x41 = 0xff;
    }
  }
  else if (*(int *)0x45 == 0x5ae) {
    FUN_1016_24d8();
    *(undefined2 *)0x45 = unaff_SI;
    unaff_SI[2] = 0x400;
    piVar1 = unaff_SI + 6;
    unaff_SI[1] = (int)piVar1;
    FUN_1016_077d();
    *unaff_SI = (int)(piVar1 + 0x200);
  }
  return;
}



undefined2 FUN_1016_0746(void)

{
  undefined1 uVar1;
  undefined1 uVar2;
  undefined2 *in_BX;
  undefined1 *puVar3;
  undefined2 unaff_DS;
  
  FUN_1016_0755();
  FUN_1016_0755();
  uVar2 = FUN_1016_0755();
  uVar1 = *(undefined1 *)in_BX[4];
  puVar3 = (undefined1 *)in_BX[4] + 1;
  if (puVar3 == (undefined1 *)*in_BX) {
    puVar3 = (undefined1 *)in_BX[1];
  }
  in_BX[4] = puVar3;
  in_BX[3] = in_BX[3] + -1;
  return CONCAT11(uVar2,uVar1);
}



undefined1 __cdecl16near FUN_1016_0755(void)

{
  undefined1 uVar1;
  undefined2 *in_BX;
  undefined1 *puVar2;
  undefined2 unaff_DS;
  
  uVar1 = *(undefined1 *)in_BX[4];
  puVar2 = (undefined1 *)in_BX[4] + 1;
  if (puVar2 == (undefined1 *)*in_BX) {
    puVar2 = (undefined1 *)in_BX[1];
  }
  in_BX[4] = puVar2;
  in_BX[3] = in_BX[3] + -1;
  return uVar1;
}



void __cdecl16near FUN_1016_0769(void)

{
  undefined1 in_AL;
  int *in_BX;
  undefined1 *puVar1;
  undefined2 unaff_DS;
  
  puVar1 = (undefined1 *)in_BX[5];
  *puVar1 = in_AL;
  puVar1 = puVar1 + 1;
  if (puVar1 == (undefined1 *)*in_BX) {
    puVar1 = (undefined1 *)in_BX[1];
  }
  in_BX[5] = (int)puVar1;
  in_BX[3] = in_BX[3] + 1;
  return;
}



void __cdecl16near FUN_1016_077d(void)

{
  undefined2 in_CX;
  int in_BX;
  undefined2 unaff_DS;
  
  *(undefined2 *)(in_BX + 8) = in_CX;
  *(undefined2 *)(in_BX + 10) = in_CX;
  *(undefined2 *)(in_BX + 6) = 0;
  return;
}



undefined2 __cdecl16far FUN_1016_0789(void)

{
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  
  *(BADSPACEBASE **)0x630 = register0x00000010;
  FUN_1016_03d3();
  FUN_1016_002f();
  FUN_1016_07d5();
  FUN_1016_098a();
  FUN_1016_0374();
  FUN_1016_03d8();
  return in_stack_00000000;
}



undefined2 __cdecl16far FUN_1016_07b1(void)

{
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  
  *(undefined2 *)0x51 = 0;
  FUN_1016_002f();
  FUN_1016_07d5();
  FUN_1016_098a();
  FUN_1016_0374();
  FUN_1016_03d8();
  return in_stack_00000000;
}



void __cdecl16near FUN_1016_07d5(void)

{
  byte bVar1;
  undefined2 unaff_DS;
  
  bVar1 = *(byte *)0x50;
  *(undefined2 *)0x5c0 = 100;
  if (bVar1 == 6) {
    *(undefined1 *)0x87 = 1;
    *(undefined2 *)0x5be = 0x140;
    return;
  }
  if ((bVar1 < 6) && (3 < bVar1)) {
    *(undefined1 *)0x87 = 2;
    *(undefined2 *)0x5be = 0xa0;
    return;
  }
  *(undefined1 *)0x87 = 0;
  return;
}



void __cdecl16near FUN_1016_08cf(void)

{
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  if ((char)((uint)in_BX >> 8) == '\0') {
    FUN_1016_0401();
    return;
  }
  *(undefined2 *)0x68 = 0;
  FUN_1016_15dc();
  return;
}



void __cdecl16near FUN_1016_08d3(void)

{
  FUN_1016_0401();
  return;
}



undefined4 __cdecl16near FUN_1016_08ea(void)

{
  undefined2 in_AX;
  char cVar1;
  int iVar2;
  undefined2 in_DX;
  char in_BL;
  int *piVar3;
  undefined2 unaff_DS;
  undefined4 uVar4;
  
  uVar4 = CONCAT22(in_DX,in_AX);
  if (in_BL != '\x02') {
    cVar1 = *(char *)0x11;
    *(char *)0x11 = in_BL;
    if (in_BL != cVar1) {
      uVar4 = FUN_1016_098a();
    }
    return uVar4;
  }
  FUN_1016_2ffe();
  piVar3 = (int *)0x16;
  cVar1 = '\n';
  do {
    FUN_1016_2a2e();
    FUN_1016_0941();
    FUN_1016_2a2e();
    for (iVar2 = *piVar3; iVar2 != 0; iVar2 = iVar2 + -1) {
      FUN_1016_2a2e();
    }
    uVar4 = FUN_1016_2a2e();
    piVar3 = piVar3 + 2;
    cVar1 = cVar1 + -1;
  } while (cVar1 != '\0');
  return uVar4;
}



void __cdecl16far FUN_1016_08f5(void)

{
  char cVar1;
  undefined2 unaff_DS;
  
  cVar1 = *(char *)0x11;
  *(undefined1 *)0x11 = 0;
  if (cVar1 != '\0') {
    FUN_1016_098a();
  }
  return;
}



undefined4 FUN_1016_0941(void)

{
  undefined4 uVar1;
  
  FUN_1016_2a2e();
  uVar1 = FUN_1016_2a2e();
  return uVar1;
}



undefined4 __cdecl16near FUN_1016_098a(void)

{
  byte bVar1;
  char cVar2;
  undefined2 in_CX;
  uint uVar3;
  uint uVar4;
  uint *puVar5;
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  
  FUN_1016_002f();
  if (*(char *)0x11 == '\0') {
    FUN_1016_002f();
  }
  else {
    FUN_1016_0401();
    puVar5 = (uint *)0x16;
    bVar1 = 0x31;
    cVar2 = '\x05';
    if (*(char *)0x5c6 != '(') {
      bVar1 = 0x31;
      cVar2 = '\n';
    }
    do {
      FUN_1016_0a29();
      uVar3 = *puVar5;
      uVar4 = uVar3;
      if (5 < uVar3) {
        uVar3 = 6;
        uVar4 = uVar3;
      }
      for (; uVar3 != 0; uVar3 = uVar3 - 1) {
        FUN_1016_0a23();
      }
      uVar3 = (uint)(byte)(7 - (char)uVar4);
      do {
        FUN_1016_0a29();
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
  FUN_1016_0379();
  return CONCAT22(in_CX,in_stack_00000000);
}



void FUN_1016_0a23(void)

{
  FUN_1016_002f();
  FUN_1016_002f();
  return;
}



void __cdecl16near FUN_1016_0a29(void)

{
  FUN_1016_002f();
  FUN_1016_002f();
  return;
}



undefined4 FUN_1016_0a59(void)

{
  char cVar1;
  undefined2 in_AX;
  byte extraout_AH;
  char cVar3;
  undefined2 uVar2;
  char cVar4;
  char cVar5;
  undefined2 in_DX;
  int iVar6;
  byte bVar7;
  undefined2 *unaff_SI;
  undefined2 *unaff_DI;
  undefined2 unaff_DS;
  bool bVar8;
  undefined4 uVar9;
  
  *(BADSPACEBASE **)0x630 = register0x00000010;
  FUN_1016_0b23();
  FUN_1016_0494();
  iVar6 = unaff_SI[1];
  if (extraout_AH < 3) {
    iVar6 = CONCAT11((char)iVar6,(char)iVar6);
  }
  cVar3 = *(char *)0x5c6;
  cVar4 = (char)*unaff_SI;
  cVar5 = (char)((uint)*unaff_SI >> 8);
  if (cVar4 == '\0') {
    bVar7 = (byte)((uint)iVar6 >> 8);
    if (((7 < bVar7) || (7 < (byte)iVar6)) || ((cVar3 == 'P' && ((3 < bVar7 || (3 < (byte)iVar6)))))
       ) {
LAB_1016_0ab3:
      *(undefined2 *)0x68 = 0;
      uVar9 = FUN_1016_15dc();
      return uVar9;
    }
    cVar1 = '\x02';
    if (cVar3 == '(') {
      cVar1 = '\x01';
      if (cVar5 == '\0') {
        cVar1 = '\0';
      }
    }
    else if (cVar5 != '\0') {
      cVar1 = '\x03';
    }
LAB_1016_0adf:
    *unaff_DI = *unaff_SI;
    unaff_DI[1] = unaff_SI[1];
    *(char *)0x5c6 = cVar3;
    uVar2 = *(undefined2 *)0x50;
    *(char *)0x50 = cVar1;
    *(int *)0x51 = iVar6;
    bVar8 = cVar1 == (char)uVar2;
    if (bVar8) goto LAB_1016_0b18;
    *(undefined2 *)0x7e = 7;
    *(undefined2 *)0x80 = 0x700;
    *(undefined1 *)0x82 = 7;
    uVar2 = FUN_1016_0401();
    if (!bVar8) {
      *(undefined1 *)0x82 = (char)uVar2;
    }
  }
  else {
    if (iVar6 != 0) goto LAB_1016_0ab3;
    if (*(char *)0x50 != '\a') {
      cVar1 = '\x06';
      cVar3 = 'P';
      if (cVar4 != '\x02') {
        cVar1 = '\x05';
        cVar3 = '(';
        if (cVar4 != '\x01') goto LAB_1016_0ab3;
        if (cVar5 == '\0') {
          cVar1 = '\x04';
          cVar3 = '(';
        }
      }
      goto LAB_1016_0adf;
    }
  }
  FUN_1016_07b1();
LAB_1016_0b18:
  FUN_1016_002f();
  return CONCAT22(in_DX,in_AX);
}



void __cdecl16near FUN_1016_0b23(void)

{
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  if ((char)((uint)in_BX >> 8) == '\0') {
    return;
  }
  *(undefined2 *)0x68 = 0;
  FUN_1016_15dc();
  return;
}



void __cdecl16near FUN_1016_0b27(void)

{
  return;
}



undefined2 __cdecl16near FUN_1016_0b91(void)

{
  byte bVar1;
  undefined2 in_AX;
  undefined2 uVar2;
  char cVar3;
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  cVar3 = (char)in_BX;
  if ((char)((uint)in_BX >> 8) != '\0') {
LAB_1016_0bc9:
    uVar2 = FUN_1016_15dc();
    return uVar2;
  }
  if (cVar3 != *(char *)0x5c6) {
    bVar1 = *(byte *)0x50;
    if ((cVar3 != 'P') && (cVar3 != '(')) goto LAB_1016_0bc9;
    if (bVar1 != 7) {
      *(char *)0x5c6 = cVar3;
      *(byte *)0x50 = bVar1 ^ 2;
      *(undefined2 *)0x51 = 0;
      FUN_1016_07b1();
    }
  }
  return in_AX;
}



void FUN_1016_0bcc(void)

{
  int *extraout_DX;
  int *piVar1;
  int *in_BX;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined1 in_CF;
  undefined2 in_stack_00000000;
  int in_stack_00000002;
  undefined2 in_stack_00000004;
  uint in_stack_00000006;
  int in_stack_00000008;
  int *piVar2;
  
  *(BADSPACEBASE **)0x630 = register0x00000010;
  piVar2 = in_BX;
  FUN_1016_20ce();
  piVar1 = extraout_DX;
  if (!(bool)in_CF) {
    FUN_1016_215c();
  }
  FUN_1016_2181((int)piVar2,in_stack_00000000,in_stack_00000002,in_stack_00000004,in_stack_00000006,
                in_stack_00000008);
  *piVar1 = *in_BX;
  piVar1[1] = in_BX[1];
  if (*in_BX != 0) {
    *(undefined2 *)(in_BX[1] + -2) = piVar1;
    FUN_1016_2124();
  }
  return;
}



void __cdecl16far FUN_1016_0bd0(undefined2 param_1,uint param_2,int param_3)

{
  int *extraout_DX;
  int *piVar1;
  int *in_BX;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined1 in_CF;
  undefined2 in_stack_00000000;
  int in_stack_00000002;
  int *piVar2;
  
  piVar2 = in_BX;
  FUN_1016_20ce();
  piVar1 = extraout_DX;
  if (!(bool)in_CF) {
    FUN_1016_215c();
  }
  FUN_1016_2181((int)piVar2,in_stack_00000000,in_stack_00000002,param_1,param_2,param_3);
  *piVar1 = *in_BX;
  piVar1[1] = in_BX[1];
  if (*in_BX != 0) {
    *(undefined2 *)(in_BX[1] + -2) = piVar1;
    FUN_1016_2124();
  }
  return;
}



void __cdecl16far FUN_1016_0c3c(void)

{
  char *pcVar1;
  char *pcVar2;
  uint *in_AX;
  uint uVar3;
  uint *in_BX;
  char *pcVar4;
  char *pcVar5;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  pcVar5 = (char *)in_BX[1];
  uVar3 = *in_BX;
  pcVar4 = (char *)in_AX[1];
  if (*in_AX < uVar3) {
    uVar3 = *in_AX;
  }
  do {
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar2 = pcVar5;
    pcVar5 = pcVar5 + 1;
    pcVar1 = pcVar4;
    pcVar4 = pcVar4 + 1;
  } while (*pcVar1 == *pcVar2);
  FUN_1016_211c();
  FUN_1016_211c();
  return;
}



void FUN_1016_0c67(void)

{
  FUN_1016_0cfc();
  FUN_1016_04af();
  return;
}



undefined4 FUN_1016_0c81(void)

{
  char cVar1;
  undefined2 in_AX;
  byte extraout_AH;
  byte bVar2;
  undefined2 uVar3;
  undefined2 in_DX;
  byte bVar4;
  int in_BX;
  int unaff_SI;
  undefined2 unaff_DS;
  undefined4 uVar5;
  
  *(BADSPACEBASE **)0x630 = register0x00000010;
  FUN_1016_0cfc();
  FUN_1016_0494();
  bVar2 = (byte)*(undefined2 *)(in_BX + unaff_SI);
  bVar4 = (byte)((uint)*(undefined2 *)(in_BX + unaff_SI) >> 8);
  if ((((bVar2 != 0) && (bVar2 < 0x1a)) && ((*(char *)0x11 == '\0' || (bVar2 < 0x19)))) &&
     ((bVar4 != 0 && (bVar4 <= *(byte *)0x5c6)))) {
    cVar1 = *(char *)(in_BX + 2 + unaff_SI);
    uVar3 = *(undefined2 *)(in_BX + 3 + unaff_SI);
    bVar2 = (byte)uVar3;
    if (bVar2 < 0x20) {
      if ((2 < extraout_AH) && (extraout_AH < 4)) {
        uVar3 = CONCAT11(bVar2,bVar2);
      }
      if ((byte)((uint)uVar3 >> 8) < 0x20) {
        *(char *)0x55 = cVar1;
        *(undefined2 *)0x56 = uVar3;
        if (1 < extraout_AH) {
          if (cVar1 == '\0') {
            FUN_1016_0418();
          }
          else {
            FUN_1016_0413();
          }
        }
        FUN_1016_037d();
        return CONCAT22(in_DX,in_AX);
      }
    }
  }
  *(undefined2 *)0x68 = 0;
  uVar5 = FUN_1016_15dc();
  return uVar5;
}



void __cdecl16near FUN_1016_0cfc(void)

{
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  if ((char)((uint)in_BX >> 8) == '\0') {
    return;
  }
  *(undefined2 *)0x68 = 0;
  FUN_1016_15dc();
  return;
}



void __cdecl16near FUN_1016_0d00(void)

{
  return;
}



undefined2 __cdecl16far FUN_1016_0db6(void)

{
  undefined2 in_AX;
  undefined2 unaff_DS;
  undefined2 uStack_2;
  
  *(undefined2 **)0x630 = &uStack_2;
  *(int *)0x630 = *(int *)0x630 + 2;
  uStack_2 = in_AX;
  FUN_1016_0f16();
  return uStack_2;
}



undefined2 __cdecl16far FUN_1016_0dd5(void)

{
  undefined2 uVar1;
  undefined1 in_ZF;
  
  uVar1 = FUN_1016_24ba();
  if ((bool)in_ZF) {
    return uVar1;
  }
  FUN_1016_0f16();
  return uVar1;
}



void __cdecl16far FUN_1016_0de1(void)

{
  undefined2 unaff_DS;
  
  *(BADSPACEBASE **)0x630 = register0x00000010;
  FUN_1016_0f5d();
  return;
}



void __cdecl16far FUN_1016_0e57(void)

{
  byte in_BL;
  undefined2 unaff_DS;
  
  *(char *)0x616 = '\x01' << (in_BL & 0x1f);
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 __cdecl16far FUN_1016_0e66(void)

{
  undefined2 in_AX;
  undefined2 uVar1;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  *(BADSPACEBASE **)0x630 = register0x00000010;
  FUN_1016_0e80();
  FUN_1016_24ba();
  if ((bool)in_ZF) {
    FUN_1016_0f21();
    return in_AX;
  }
  *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
  FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
  uVar1 = (*(code *)*(undefined2 *)0x62e)();
  return uVar1;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_1016_0e80(void)

{
  uint in_BX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  FUN_1016_0f7a();
  FUN_1016_211c();
  if ((in_BX == 0xffff) || ((in_BX != 0 && (in_BX < 0x80)))) {
    return;
  }
  *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
  FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x62e)();
  return;
}



void __cdecl16near FUN_1016_0ea7(void)

{
  int iVar1;
  
  iVar1 = 0x10;
  do {
    (*(code *)*(undefined2 *)(iVar1 + 0xd48))();
    iVar1 = iVar1 + -2;
  } while (iVar1 != 0);
  return;
}



void __cdecl16near FUN_1016_0eb9(void)

{
  int iVar1;
  
  iVar1 = 0x10;
  do {
    (*(code *)*(undefined2 *)(iVar1 + 0xd58))();
    iVar1 = iVar1 + -2;
  } while (iVar1 != 0);
  return;
}



void __cdecl16near FUN_1016_0ecd(void)

{
  FUN_1016_0f26();
  return;
}



undefined4 FUN_1016_0ee3(void)

{
  undefined2 unaff_DS;
  undefined4 uVar1;
  
  if (*(int *)0x642 == 0) {
    uVar1 = FUN_1016_1c6c();
    return uVar1;
  }
  uVar1 = FUN_1016_0ecd();
  return uVar1;
}



void FUN_1016_0ef4(void)

{
  undefined2 unaff_DS;
  
  if (*(int *)0x642 == 0) {
    thunk_FUN_1016_036d();
    return;
  }
  FUN_1016_0ecd();
  return;
}



void FUN_1016_0f05(void)

{
  undefined2 unaff_DS;
  
  if (*(int *)0x642 == 0) {
    FUN_1016_1cc4();
    return;
  }
  FUN_1016_0ecd();
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_1016_0f16(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  FUN_1016_24ba();
  if ((bool)in_ZF) {
    *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
    FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x62e)();
    return;
  }
  FUN_1016_0f26();
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_1016_0f21(void)

{
  int iVar1;
  char cVar2;
  undefined2 in_AX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if ((char)in_AX < '\0') {
    cVar2 = -(char)in_AX;
  }
  else {
    cVar2 = '\0';
  }
  iVar1 = *(int *)(cVar2 * 2 + 0xd38);
  if (iVar1 == 0) {
    *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
    FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x62e)();
    return;
  }
  *(undefined2 *)0x5c8 = *(undefined2 *)(iVar1 + (char)((uint)in_AX >> 8));
  (*(code *)*(undefined2 *)0x5c8)();
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_1016_0f26(void)

{
  int iVar1;
  char cVar2;
  undefined2 in_AX;
  int unaff_SI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if (*(char *)(unaff_SI + 0x2e) < '\0') {
    cVar2 = -*(char *)(unaff_SI + 0x2e);
  }
  else {
    cVar2 = '\0';
  }
  iVar1 = *(int *)(cVar2 * 2 + 0xd38);
  if (iVar1 == 0) {
    *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
    FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x62e)();
    return;
  }
  *(undefined2 *)0x5c8 = *(undefined2 *)(iVar1 + (char)((uint)in_AX >> 8));
  (*(code *)*(undefined2 *)0x5c8)();
  return;
}



void __cdecl16near FUN_1016_0f5d(void)

{
  undefined2 unaff_DS;
  
  while (*(int *)0x62c != 0) {
    FUN_1016_0dd5();
  }
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

char __cdecl16near FUN_1016_0f7a(void)

{
  byte *pbVar1;
  byte bVar2;
  byte *pbVar3;
  char cVar4;
  uint in_CX;
  int iVar5;
  uint uVar6;
  byte *unaff_SI;
  byte *pbVar7;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  ulong uVar8;
  
  *(undefined1 *)0x617 = 0;
  *(undefined1 *)0x618 = 0;
  uVar8 = FUN_1016_0ff9();
  cVar4 = (char)uVar8;
  *(char *)0x5ca = cVar4;
  if (-1 < cVar4) {
    cVar4 = '\0';
  }
  pbVar7 = (byte *)0x5cb;
  uVar6 = 0xb;
  if ((cVar4 == -4) || (cVar4 == -5)) {
    if (in_CX != 0) {
      uVar6 = in_CX;
      if (0x40 < in_CX) {
code_r0x00011783:
        *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
        FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
        cVar4 = (*(code *)*(undefined2 *)0x62e)();
        return cVar4;
      }
      for (; uVar6 != 0; uVar6 = uVar6 - 1) {
        pbVar3 = pbVar7;
        pbVar7 = pbVar7 + 1;
        pbVar1 = unaff_SI;
        unaff_SI = unaff_SI + 1;
        *pbVar3 = *pbVar1;
      }
    }
    *pbVar7 = 0;
    iVar5 = 0x40 - in_CX;
    if (iVar5 != 0) {
      uVar6 = (uint)iVar5 >> 8;
      for (; iVar5 != 0; iVar5 = iVar5 + -1) {
        pbVar1 = pbVar7;
        pbVar7 = pbVar7 + 1;
        *pbVar1 = (byte)uVar6;
      }
    }
  }
  else {
    do {
      while( true ) {
        if (in_CX == 0) {
          do {
            pbVar1 = pbVar7;
            pbVar7 = pbVar7 + 1;
            *pbVar1 = 0x20;
            uVar6 = uVar6 - 1;
          } while (uVar6 != 0);
          return cVar4;
        }
        in_CX = in_CX - 1;
        pbVar1 = unaff_SI;
        unaff_SI = unaff_SI + 1;
        bVar2 = *pbVar1;
        if (bVar2 < 0x20) goto code_r0x00011783;
        if (bVar2 != 0x2e) break;
        *(undefined1 *)0x617 = 0x2e;
        while( true ) {
          if ((uVar6 == 0xb) || (uVar6 < 3)) goto code_r0x00011783;
          if (uVar6 == 3) break;
          pbVar1 = pbVar7;
          pbVar7 = pbVar7 + 1;
          *pbVar1 = 0x20;
          uVar6 = uVar6 - 1;
        }
      }
      pbVar1 = pbVar7;
      pbVar7 = pbVar7 + 1;
      *pbVar1 = bVar2;
      uVar6 = uVar6 - 1;
    } while (uVar6 != 0);
  }
  return cVar4;
}



// WARNING: Instruction at (ram,0x00011781) overlaps instruction at (ram,0x00011780)
// 
// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

ulong __cdecl16near FUN_1016_0ff9(void)

{
  char *pcVar1;
  byte bVar2;
  undefined2 in_AX;
  undefined2 uVar3;
  undefined2 uVar4;
  int in_CX;
  int iVar5;
  undefined2 in_DX;
  char *unaff_SI;
  byte *pbVar7;
  byte *pbVar6;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined4 uVar8;
  ulong uVar9;
  
  iVar5 = in_CX;
  while( true ) {
    if (iVar5 == 0) {
      return CONCAT22(in_DX,in_AX) & 0xffffff00;
    }
    pcVar1 = unaff_SI;
    unaff_SI = unaff_SI + 1;
    in_AX = CONCAT11((char)((uint)in_AX >> 8),*pcVar1);
    if (*pcVar1 == ':') break;
    iVar5 = iVar5 + -1;
  }
  if (in_CX != iVar5) {
    if (in_CX - iVar5 == 1) {
      uVar4 = FUN_1016_1064();
      bVar2 = (byte)uVar4 - 0x40;
      uVar3 = CONCAT11((char)((uint)uVar4 >> 8),bVar2);
      if ((0x3f < (byte)uVar4) && (bVar2 < 0x1a)) {
LAB_1016_103f:
        return CONCAT22(in_DX,uVar3);
      }
    }
    else {
      pbVar6 = (byte *)0xd0d;
LAB_1016_1022:
      do {
        pbVar7 = pbVar6;
        pbVar6 = pbVar7 + 1;
        uVar8 = FUN_1016_1064();
        if ((*pbVar6 & 0x80) == 0) {
          if (*pbVar6 == (byte)uVar8) {
            if ((int)((ulong)uVar8 >> 0x10) != 1) goto LAB_1016_1022;
            pbVar6 = pbVar7 + 2;
            uVar3 = CONCAT11((char)((ulong)uVar8 >> 8),*pbVar6);
            if ((char)*pbVar6 < '\0') goto LAB_1016_103f;
          }
          for (; (*pbVar6 & 0x80) == 0; pbVar6 = pbVar6 + 1) {
          }
        }
      } while (pbVar6[1] != 0);
    }
  }
  *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
  FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
  uVar9 = (*(code *)*(undefined2 *)0x62e)();
  return uVar9;
}



void __cdecl16near FUN_1016_1064(void)

{
  return;
}



// WARNING: Removing unreachable block (ram,0x0001127f)

undefined2 __cdecl16far FUN_1016_10bf(void)

{
  undefined2 in_AX;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  undefined4 uVar1;
  uint uStack_4;
  
  FUN_1016_04c9();
  if ((bool)in_ZF) {
    return in_AX;
  }
  uStack_4 = FUN_1016_04e2();
  if ((bool)in_ZF) {
    *(BADSPACEBASE **)0x630 = register0x00000010;
  }
  else {
    *(BADSPACEBASE **)0x630 = register0x00000010;
    uStack_4 = uStack_4 & 0xff;
  }
  uVar1 = FUN_1016_209c();
  *(uint *)((ulong)uVar1 >> 0x10) = uStack_4;
  return (int)uVar1;
}



undefined2 __cdecl16far FUN_1016_118d(void)

{
  undefined2 unaff_DS;
  ulong uVar1;
  
  *(BADSPACEBASE **)0x630 = register0x00000010;
  uVar1 = FUN_1016_1248();
  return (int)uVar1;
}



ulong __cdecl16near FUN_1016_1248(void)

{
  uint in_AX;
  int in_DX;
  ulong uVar1;
  undefined4 uVar2;
  
  if (in_DX < 0) {
    uVar1 = FUN_1016_15dc();
    return uVar1;
  }
  if (in_DX == 0) {
    return (ulong)in_AX;
  }
  uVar2 = FUN_1016_215c();
  return CONCAT22(in_DX,(int)uVar2);
}



void __cdecl16far FUN_1016_14ac(undefined1 param_1)

{
  int in_AX;
  undefined2 in_CX;
  undefined2 unaff_BP;
  undefined2 unaff_DS;
  int in_stack_00000000;
  undefined2 in_stack_00000002;
  
  *(int *)0x620 = in_AX;
  *(int *)0x61c = in_AX + 0x81;
  *(undefined2 *)0x61e = in_CX;
  *(undefined2 *)0x622 = unaff_BP;
  *(undefined1 **)0x61a = &param_1;
  *(undefined2 *)0x634 = in_stack_00000002;
  *(int *)0x632 = in_stack_00000000 + -0x1f;
  *(undefined2 *)0x62e = 0x16a9;
  *(undefined2 *)0x62c = 0;
  *(undefined2 *)0x62a = 0;
  FUN_1016_1562();
  FUN_1016_007a();
  FUN_1016_0ea7();
  *(undefined2 *)0x90 = unaff_DS;
  return;
}



void __cdecl16far FUN_1016_1562(void)

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
  
  uVar3 = FUN_1016_15b4();
  puVar4 = (undefined1 *)
           CONCAT11((byte)((uint)uVar3 >> 8) | *(byte *)((int)unaff_BP + unaff_DI + 0x624),
                    (char)uVar3);
  FUN_1016_15b4();
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
  *(undefined2 *)0x62a = 0;
  FUN_1016_1588();
  FUN_1016_21c5();
  *(undefined2 *)0x90 = unaff_DS;
  return;
}



void __cdecl16near FUN_1016_1588(void)

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
  
  uVar4 = FUN_1016_15b4();
  bVar3 = (char)uVar4 + '-' + in_CF;
  cVar8 = '\0';
  unaff_SI[in_BX] = unaff_SI[in_BX] | bVar3;
  *(undefined2 *)0x628 = CONCAT11((char)((uint)uVar4 >> 8),bVar3);
  iVar5 = FUN_1016_15b4();
  *unaff_SI = *unaff_SI + in_DL + *(char *)(in_BX + 0x1ae8) + cVar8;
  for (iVar5 = iVar5 - (int)unaff_DI; iVar5 != 0; iVar5 = iVar5 + -1) {
    puVar1 = unaff_DI;
    unaff_DI = unaff_DI + 1;
    *puVar1 = 0;
  }
  puVar6 = (undefined1 *)0x638;
  for (iVar5 = 0x13; iVar5 != 0; iVar5 = iVar5 + -1) {
    puVar1 = puVar6;
    puVar6 = puVar6 + 1;
    *puVar1 = 0;
  }
  puVar7 = (undefined2 *)0x92;
  for (iVar5 = 10; iVar5 != 0; iVar5 = iVar5 + -1) {
    puVar2 = puVar7;
    puVar7 = puVar7 + 1;
    *puVar2 = 0xffff;
  }
  return;
}



undefined2 __cdecl16near FUN_1016_15b4(void)

{
  undefined2 unaff_DS;
  char *in_stack_00000000;
  
  return *(undefined2 *)((int)*(undefined4 *)0x632 + (int)*in_stack_00000000);
}



// WARNING (jumptable): Stack frame is not setup normally: Input value of stackpointer is not used
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void FUN_1016_15d3(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
  FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x62e)();
  return;
}



// WARNING (jumptable): Stack frame is not setup normally: Input value of stackpointer is not used
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void FUN_1016_15dc(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
  FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x62e)();
  return;
}



void FUN_1016_1702(void)

{
  undefined2 unaff_DS;
  undefined1 in_stack_00000002;
  undefined1 in_stack_00000004;
  undefined1 in_stack_00000006;
  undefined1 in_stack_00000008;
  undefined1 in_stack_0000000a;
  undefined1 in_stack_0000000c;
  undefined1 in_stack_0000000e;
  undefined1 in_stack_00000010;
  undefined1 in_stack_00000012;
  undefined1 in_stack_00000014;
  undefined1 in_stack_00000016;
  undefined1 in_stack_00000018;
  
  if (*(char *)0x649 != '\0') {
    FUN_1016_1768();
    FUN_1016_171a(in_stack_00000002,in_stack_00000004,in_stack_00000006,in_stack_00000008,
                  in_stack_0000000a,in_stack_0000000c,in_stack_0000000e,in_stack_00000010,
                  in_stack_00000012,in_stack_00000014,in_stack_00000016,in_stack_00000018);
  }
  FUN_1016_2a1a();
  FUN_1016_0f5d();
  FUN_1016_0eb9();
  FUN_1016_0180();
  return;
}



// WARNING: Unable to track spacebase fully for stack

void FUN_1016_171a(undefined1 param_1,undefined1 param_2,undefined1 param_3,undefined1 param_4,
                  undefined1 param_5,undefined1 param_6,undefined1 param_7,undefined1 param_8,
                  undefined1 param_9,undefined1 param_10,undefined1 param_11,undefined1 param_12)

{
  char cVar1;
  uint uVar2;
  int iVar3;
  undefined2 in_DX;
  int in_BX;
  int unaff_BP;
  undefined1 *unaff_SI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 uStack_2;
  
  uStack_2 = 0x187d;
  FUN_1016_15b4();
  cVar1 = unaff_SI[0x19];
  unaff_SI[0x19] = '\0';
  uVar2 = (uint)((char)(cVar1 << 7) < '\0');
  iVar3 = *(int *)(unaff_SI + in_BX) + -2;
  out(*unaff_SI,in_DX);
  *(int *)((int)register0x00000010 + uVar2 + iVar3 + 2) = *(int *)(unaff_BP + 0x20) * 0x696c;
  *(undefined2 *)((int)&uStack_2 + uVar2 + iVar3 + 2) = 0x1895;
  FUN_1016_178e((undefined1 *)*(undefined2 *)((int)register0x00000010 + uVar2 + iVar3 + 2),
                *(undefined2 **)(&param_1 + uVar2 + iVar3 + 2),
                *(int *)(&param_2 + uVar2 + iVar3 + 2),*(undefined2 *)(&param_3 + uVar2 + iVar3 + 2)
                ,*(undefined4 **)(&param_4 + uVar2 + iVar3 + 2),
                *(undefined2 *)(&param_5 + uVar2 + iVar3 + 2),(&param_6)[uVar2 + iVar3 + 2],
                (&param_7)[uVar2 + iVar3 + 2],*(undefined2 *)(&param_8 + uVar2 + iVar3 + 2),
                *(undefined2 *)(&param_9 + uVar2 + iVar3 + 2),
                *(undefined2 *)(&param_10 + uVar2 + iVar3 + 2),
                *(uint *)(&param_11 + uVar2 + iVar3 + 2),*(int *)(&param_12 + uVar2 + iVar3 + 2));
  *(undefined2 *)((int)&uStack_2 + uVar2 + iVar3 + 2) = 0x1898;
  FUN_1016_246c();
  FUN_1016_2a1a();
  return;
}



void FUN_1016_1768(void)

{
  byte *pbVar1;
  byte in_BL;
  byte *pbVar2;
  
  FUN_1016_2a1a();
  pbVar2 = (byte *)0x1264;
  while ((*pbVar2 != 0xff && (pbVar1 = pbVar2, pbVar2 = pbVar2 + 1, in_BL != *pbVar1))) {
    do {
      pbVar1 = pbVar2;
      pbVar2 = pbVar2 + 1;
    } while (*pbVar1 < 0x81);
  }
  FUN_1016_2a57();
  return;
}



// WARNING: This function may have set the stack pointer
// WARNING: Removing unreachable block (ram,0x0001194a)
// WARNING: Removing unreachable block (ram,0x0001196d)
// WARNING: Removing unreachable block (ram,0x0001196f)
// WARNING: Removing unreachable block (ram,0x00011997)

ulong __cdecl16near
FUN_1016_178e(undefined1 *param_1,undefined2 *param_2,int param_3,undefined2 param_4,
             undefined4 *param_5,undefined2 param_6,byte param_7,byte param_8,undefined2 param_9,
             undefined2 param_10,undefined2 param_11,uint param_12,int param_13)

{
  uint *puVar1;
  uint uVar2;
  undefined1 uVar3;
  undefined2 uVar4;
  uint in_AX;
  undefined2 in_DX;
  uint uVar5;
  uint uVar6;
  int unaff_BP;
  uint *unaff_SI;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 in_GS;
  bool bVar7;
  ulong uVar8;
  
  FUN_1016_15b4();
  uVar5 = CONCAT11((char)((uint)in_DX >> 8),(char)in_DX + *(char *)(unaff_BP + 0x1e8e));
  uVar6 = 0;
  while( true ) {
    puVar1 = unaff_SI + 1;
    uVar2 = *unaff_SI;
    if (uVar2 == 0) break;
    if ((uVar2 < in_AX) && (uVar6 <= uVar2)) {
      unaff_SI = unaff_SI + 2;
      uVar5 = *puVar1;
      uVar6 = uVar2;
    }
    else {
      unaff_SI = unaff_SI + 2;
    }
  }
  bVar7 = false;
  if (uVar6 != 0) {
    return (ulong)uVar5;
  }
  uVar8 = FUN_1016_2a65();
  out((char)*puVar1,(int)(uVar8 >> 0x10));
  if (in_AX == 1) {
    *(char *)(unaff_BP + 0x57) = *(char *)(unaff_BP + 0x57) + (char)(uVar8 >> 0x10);
    return uVar8;
  }
  if (bVar7) {
    return uVar8;
  }
  uVar3 = in(param_6);
  *param_1 = uVar3;
  param_1[0x73] = param_1[0x73] & param_8;
  out(*param_2,param_6);
  *(byte *)((int)param_2 + 0x6b) = *(byte *)((int)param_2 + 0x6b) & param_7;
  out(*(undefined1 *)(param_2 + 1),param_6);
  *(byte *)(param_3 + 0x75) = *(byte *)(param_3 + 0x75) & param_7;
  uVar4 = in(param_6);
  *(undefined2 *)(param_1 + 1) = uVar4;
  FUN_1016_2a1a();
  uVar8 = FUN_1016_017b();
  return uVar8;
}



// WARNING: Unable to track spacebase fully for stack

void FUN_1016_17e0(undefined2 param_1)

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
  FUN_1016_003a(*(undefined2 *)(puVar6 + -2),*puVar6);
  return;
}



void FUN_1016_181c(undefined2 param_1,undefined1 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined1 *)0xb0 = 5;
  *(undefined1 **)0xae = &param_2;
  return;
}



// WARNING: Instruction at (ram,0x00011769) overlaps instruction at (ram,0x00011768)
// 
// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

int __cdecl16far FUN_1016_185f(void)

{
  undefined2 *puVar1;
  undefined2 *puVar2;
  code *pcVar3;
  char cVar4;
  uint uVar5;
  int iVar6;
  int iVar7;
  undefined2 *puVar8;
  undefined2 *puVar9;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 uStack000a;
  int iStack000c;
  int in_stack_00000010;
  
  *(BADSPACEBASE **)0x630 = register0x00000010;
  FUN_1016_21ad();
  FUN_1016_211c();
  pcVar3 = (code *)swi(0x21);
  cVar4 = (*pcVar3)();
  if ((cVar4 == '\0') && (*(char *)0x84b != ' ')) {
    if (*(char *)0x853 == ' ') {
      *(undefined2 *)0x853 = 0x5845;
      *(undefined1 *)0x855 = 0x45;
    }
    pcVar3 = (code *)swi(0x21);
    cVar4 = (*pcVar3)();
    if (cVar4 == '\0') {
      *(undefined2 *)0x86b = 0;
      *(undefined2 *)0x86d = 0;
      *(undefined2 *)0x858 = 1;
      pcVar3 = (code *)swi(0x21);
      (*pcVar3)();
      pcVar3 = (code *)swi(0x21);
      (*pcVar3)();
      uVar5 = *(int *)0x838 + 0x1fU & 0xffe0;
      *(uint *)0x86b = uVar5;
      *(undefined2 *)0x858 = 0x10;
      iVar6 = *(int *)0x2;
      iStack000c = *(int *)0xe + 0x10;
      iVar7 = ((*(int *)0x834 + -1) * 0x20 - uVar5) + (*(int *)0x832 + 0xfU >> 4);
      *(int *)0x834 = iVar7;
      if (iVar7 + iStack000c + 0x20U <= iVar6 - 0x10U) {
        uStack000a = 0x1a68;
        FUN_1016_0f5d();
        uStack000a = 0x1a6b;
        FUN_1016_2a1a();
        uStack000a = 0x1a6e;
        FUN_1016_0eb9();
        uStack000a = 0x1a71;
        FUN_1016_0189();
        puVar8 = (undefined2 *)0x193f;
        puVar9 = (undefined2 *)0x0;
        for (iVar6 = 0x58; iVar6 != 0; iVar6 = iVar6 + -1) {
          puVar2 = puVar9;
          puVar9 = puVar9 + 1;
          puVar1 = puVar8;
          puVar8 = puVar8 + 1;
          *puVar2 = *puVar1;
        }
        puVar8 = (undefined2 *)0x830;
        for (iVar6 = 0x20; iVar6 != 0; iVar6 = iVar6 + -1) {
          puVar2 = puVar9;
          puVar9 = puVar9 + 1;
          puVar1 = puVar8;
          puVar8 = puVar8 + 1;
          *puVar2 = *puVar1;
        }
        return in_stack_00000010 + -0x20;
      }
    }
  }
  *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
  FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
  iVar6 = (*(code *)*(undefined2 *)0x62e)();
  return iVar6;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16far FUN_1016_19ee(void)

{
  char *unaff_SI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  *(BADSPACEBASE **)0x630 = register0x00000010;
  FUN_1016_24ba();
  if (((bool)in_ZF) || (*unaff_SI == '\x02')) {
    *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
    FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x62e)();
    return;
  }
  *(undefined2 *)0x642 = unaff_SI;
  *(undefined2 *)0x6f2 = 0x1a0d;
  return;
}



int FUN_1016_1ad6(void)

{
  undefined2 *puVar1;
  undefined2 uVar2;
  undefined2 *puVar3;
  char cVar4;
  int iVar5;
  undefined1 uVar6;
  undefined1 extraout_AH;
  uint uVar7;
  undefined2 *in_BX;
  int unaff_BP;
  int unaff_SI;
  undefined2 *puVar8;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined4 uVar9;
  undefined2 in_stack_00000000;
  undefined2 uStack0002;
  
  FUN_1016_1aef();
  FUN_1016_1aef();
  iVar5 = FUN_1016_1aef();
  *(byte *)(unaff_BP + unaff_SI) = *(byte *)(unaff_BP + unaff_SI) | (byte)iVar5;
  FUN_1016_1aef();
  FUN_1016_1aef();
  *(undefined2 *)0x6d2 = in_stack_00000000;
  FUN_1016_2ffe();
  uVar2 = *(undefined2 *)*(undefined2 *)0x6d2;
  *(undefined2 *)0x6d2 = uVar2;
  cVar4 = (char)uVar2;
  if (cVar4 == '\x03') {
    if (*(char *)0x64d != '\0') goto LAB_1016_1b47;
    if (*(char *)0x64c == '\0') {
      uStack0002 = 0x1cc2;
      FUN_1016_1bb4();
      uStack0002 = 0x1cc5;
      FUN_1016_2a71();
      uStack0002 = 0x1cc8;
      iVar5 = FUN_1016_211c();
      goto LAB_1016_1b3a;
    }
    uStack0002 = 0x1ccf;
    FUN_1016_0ee3();
    uStack0002 = 0x1cd2;
    FUN_1016_2a71();
    uStack0002 = 0x1cd5;
    FUN_1016_211c();
    uStack0002 = 0x1cda;
    uVar9 = FUN_1016_0ee3();
    uVar6 = (undefined1)((ulong)uVar9 >> 8);
LAB_1016_1b85:
    iVar5 = CONCAT11(uVar6,0x2c);
    if (*(char *)0x6d3 != '\x01') goto LAB_1016_1b3a;
  }
  else {
    if (cVar4 == '\x02') {
      *(undefined2 *)0xaa = in_BX;
    }
    else {
      puVar8 = (undefined2 *)(0xae - cVar4);
      for (uVar7 = (uint)(int)cVar4 >> 1; uVar7 != 0; uVar7 = uVar7 - 1) {
        puVar3 = puVar8;
        puVar8 = puVar8 + 1;
        puVar1 = in_BX;
        in_BX = in_BX + 1;
        *puVar3 = *puVar1;
      }
    }
    if (*(char *)0x64d != '\0') {
LAB_1016_1b47:
      uStack0002 = 0x1cab;
      iVar5 = (*(code *)*(undefined2 *)0x64e)();
      goto LAB_1016_1b3a;
    }
    uStack0002 = 0x1c85;
    FUN_1016_3199();
    if (*(char *)0x64c != '\0') {
      uStack0002 = 0x1ce5;
      FUN_1016_1bde();
      uVar6 = extraout_AH;
      goto LAB_1016_1b85;
    }
    uStack0002 = 0x1c92;
    FUN_1016_1bb4();
    uStack0002 = 0x1c95;
    FUN_1016_1bde();
  }
  uStack0002 = 0x1c9a;
  uVar9 = FUN_1016_0ee3();
  iVar5 = (int)uVar9;
LAB_1016_1b3a:
  if (*(byte *)0x6d3 == 0) {
    uStack0002 = 0x1cf3;
    FUN_1016_0ef4();
    uStack0002 = 0x1d06;
    uVar7 = FUN_1016_1bb4();
    iVar5 = uVar7 - 0xe;
    if (uVar7 < 0xe || iVar5 == 0) {
      return iVar5;
    }
    do {
      uStack0002 = 0x1d11;
      uVar9 = FUN_1016_0ee3();
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
    return (int)uVar9;
  }
  if (*(byte *)0x6d3 < 2) {
    return iVar5;
  }
  iVar5 = FUN_1016_29d3();
  return iVar5;
}



int FUN_1016_1aea(void)

{
  undefined2 *puVar1;
  undefined2 uVar2;
  undefined2 *puVar3;
  char cVar4;
  int iVar5;
  undefined1 uVar6;
  undefined1 extraout_AH;
  uint uVar7;
  undefined2 *in_BX;
  undefined2 *puVar8;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined4 uVar9;
  undefined2 in_stack_00000000;
  undefined2 uStack0002;
  
  FUN_1016_1aef();
  *(undefined2 *)0x6d2 = in_stack_00000000;
  FUN_1016_2ffe();
  uVar2 = *(undefined2 *)*(undefined2 *)0x6d2;
  *(undefined2 *)0x6d2 = uVar2;
  cVar4 = (char)uVar2;
  if (cVar4 == '\x03') {
    if (*(char *)0x64d != '\0') goto LAB_1016_1b47;
    if (*(char *)0x64c == '\0') {
      uStack0002 = 0x1cc2;
      FUN_1016_1bb4();
      uStack0002 = 0x1cc5;
      FUN_1016_2a71();
      uStack0002 = 0x1cc8;
      iVar5 = FUN_1016_211c();
      goto LAB_1016_1b3a;
    }
    uStack0002 = 0x1ccf;
    FUN_1016_0ee3();
    uStack0002 = 0x1cd2;
    FUN_1016_2a71();
    uStack0002 = 0x1cd5;
    FUN_1016_211c();
    uStack0002 = 0x1cda;
    uVar9 = FUN_1016_0ee3();
    uVar6 = (undefined1)((ulong)uVar9 >> 8);
LAB_1016_1b85:
    iVar5 = CONCAT11(uVar6,0x2c);
    if (*(char *)0x6d3 != '\x01') goto LAB_1016_1b3a;
  }
  else {
    if (cVar4 == '\x02') {
      *(undefined2 *)0xaa = in_BX;
    }
    else {
      puVar8 = (undefined2 *)(0xae - cVar4);
      for (uVar7 = (uint)(int)cVar4 >> 1; uVar7 != 0; uVar7 = uVar7 - 1) {
        puVar3 = puVar8;
        puVar8 = puVar8 + 1;
        puVar1 = in_BX;
        in_BX = in_BX + 1;
        *puVar3 = *puVar1;
      }
    }
    if (*(char *)0x64d != '\0') {
LAB_1016_1b47:
      uStack0002 = 0x1cab;
      iVar5 = (*(code *)*(undefined2 *)0x64e)();
      goto LAB_1016_1b3a;
    }
    uStack0002 = 0x1c85;
    FUN_1016_3199();
    if (*(char *)0x64c != '\0') {
      uStack0002 = 0x1ce5;
      FUN_1016_1bde();
      uVar6 = extraout_AH;
      goto LAB_1016_1b85;
    }
    uStack0002 = 0x1c92;
    FUN_1016_1bb4();
    uStack0002 = 0x1c95;
    FUN_1016_1bde();
  }
  uStack0002 = 0x1c9a;
  uVar9 = FUN_1016_0ee3();
  iVar5 = (int)uVar9;
LAB_1016_1b3a:
  if (*(byte *)0x6d3 == 0) {
    uStack0002 = 0x1cf3;
    FUN_1016_0ef4();
    uStack0002 = 0x1d06;
    uVar7 = FUN_1016_1bb4();
    iVar5 = uVar7 - 0xe;
    if (uVar7 < 0xe || iVar5 == 0) {
      return iVar5;
    }
    do {
      uStack0002 = 0x1d11;
      uVar9 = FUN_1016_0ee3();
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
    return (int)uVar9;
  }
  if (*(byte *)0x6d3 < 2) {
    return iVar5;
  }
  iVar5 = FUN_1016_29d3();
  return iVar5;
}



int __cdecl16near FUN_1016_1aef(void)

{
  undefined2 *puVar1;
  undefined2 uVar2;
  undefined2 *puVar3;
  char cVar4;
  int iVar5;
  undefined1 uVar6;
  undefined1 extraout_AH;
  uint uVar7;
  undefined2 *in_BX;
  undefined2 *puVar8;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined4 uVar9;
  undefined2 in_stack_00000000;
  undefined2 uStack0002;
  
  *(undefined2 *)0x6d2 = in_stack_00000000;
  FUN_1016_2ffe();
  uVar2 = *(undefined2 *)*(undefined2 *)0x6d2;
  *(undefined2 *)0x6d2 = uVar2;
  cVar4 = (char)uVar2;
  if (cVar4 == '\x03') {
    if (*(char *)0x64d != '\0') goto LAB_1016_1b47;
    if (*(char *)0x64c == '\0') {
      uStack0002 = 0x1cc2;
      FUN_1016_1bb4();
      uStack0002 = 0x1cc5;
      FUN_1016_2a71();
      uStack0002 = 0x1cc8;
      iVar5 = FUN_1016_211c();
      goto LAB_1016_1b3a;
    }
    uStack0002 = 0x1ccf;
    FUN_1016_0ee3();
    uStack0002 = 0x1cd2;
    FUN_1016_2a71();
    uStack0002 = 0x1cd5;
    FUN_1016_211c();
    uStack0002 = 0x1cda;
    uVar9 = FUN_1016_0ee3();
    uVar6 = (undefined1)((ulong)uVar9 >> 8);
LAB_1016_1b85:
    iVar5 = CONCAT11(uVar6,0x2c);
    if (*(char *)0x6d3 != '\x01') goto LAB_1016_1b3a;
  }
  else {
    if (cVar4 == '\x02') {
      *(undefined2 *)0xaa = in_BX;
    }
    else {
      puVar8 = (undefined2 *)(0xae - cVar4);
      for (uVar7 = (uint)(int)cVar4 >> 1; uVar7 != 0; uVar7 = uVar7 - 1) {
        puVar3 = puVar8;
        puVar8 = puVar8 + 1;
        puVar1 = in_BX;
        in_BX = in_BX + 1;
        *puVar3 = *puVar1;
      }
    }
    if (*(char *)0x64d != '\0') {
LAB_1016_1b47:
      uStack0002 = 0x1cab;
      iVar5 = (*(code *)*(undefined2 *)0x64e)();
      goto LAB_1016_1b3a;
    }
    uStack0002 = 0x1c85;
    FUN_1016_3199();
    if (*(char *)0x64c != '\0') {
      uStack0002 = 0x1ce5;
      FUN_1016_1bde();
      uVar6 = extraout_AH;
      goto LAB_1016_1b85;
    }
    uStack0002 = 0x1c92;
    FUN_1016_1bb4();
    uStack0002 = 0x1c95;
    FUN_1016_1bde();
  }
  uStack0002 = 0x1c9a;
  uVar9 = FUN_1016_0ee3();
  iVar5 = (int)uVar9;
LAB_1016_1b3a:
  if (*(byte *)0x6d3 == 0) {
    uStack0002 = 0x1cf3;
    FUN_1016_0ef4();
    uStack0002 = 0x1d06;
    uVar7 = FUN_1016_1bb4();
    iVar5 = uVar7 - 0xe;
    if (uVar7 < 0xe || iVar5 == 0) {
      return iVar5;
    }
    do {
      uStack0002 = 0x1d11;
      uVar9 = FUN_1016_0ee3();
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
    return (int)uVar9;
  }
  if (*(byte *)0x6d3 < 2) {
    return iVar5;
  }
  iVar5 = FUN_1016_29d3();
  return iVar5;
}



undefined2 __cdecl16near FUN_1016_1bb4(void)

{
  undefined2 in_AX;
  byte extraout_AH;
  byte extraout_AH_00;
  char extraout_AH_01;
  byte bVar1;
  
  FUN_1016_0f05();
  if (extraout_AH != 0xff) {
    if ((char)((uint)in_AX >> 8) == '\0') {
      bVar1 = extraout_AH;
      FUN_1016_0ef4();
      if ((extraout_AH_00 <= bVar1) && ((byte)in_AX <= (byte)(bVar1 - extraout_AH_00))) {
        return in_AX;
      }
    }
    FUN_1016_0ef4();
    if (extraout_AH_01 != '\0') {
      FUN_1016_29d3();
    }
    in_AX = 0;
  }
  return in_AX;
}



void __cdecl16near FUN_1016_1bde(void)

{
  char *pcVar1;
  char *unaff_SI;
  undefined2 unaff_DS;
  
  while (pcVar1 = unaff_SI, unaff_SI = unaff_SI + 1, *pcVar1 != '\0') {
    FUN_1016_0ee3();
  }
  return;
}



undefined4 __cdecl16near FUN_1016_1c6c(void)

{
  byte in_AL;
  byte extraout_AH;
  byte bVar2;
  char extraout_AH_00;
  char cVar3;
  undefined2 uVar1;
  undefined2 extraout_DX;
  undefined2 unaff_DS;
  undefined4 uVar4;
  
  if (in_AL != 0xd) {
    if (in_AL == 8) {
      FUN_1016_036d();
      FUN_1016_0373();
      goto LAB_1016_1cbe;
    }
    if (in_AL == 9) {
      do {
        FUN_1016_0ee3();
        FUN_1016_036d();
        bVar2 = extraout_AH;
        if (extraout_AH == 0xff) break;
        bVar2 = 0;
      } while ((extraout_AH & 7) != 0);
      return CONCAT22(extraout_DX,CONCAT11(bVar2,9));
    }
    if (in_AL < 0x20) goto LAB_1016_1cbe;
    FUN_1016_036d();
    cVar3 = extraout_AH_00;
    if ((*(char *)0x5c6 != -1) && (extraout_AH_00 == *(char *)0x5c6)) {
      uVar1 = FUN_1016_29d3();
      cVar3 = (char)((uint)uVar1 >> 8);
    }
    if (cVar3 == -1) goto LAB_1016_1cbe;
  }
  FUN_1016_0373();
LAB_1016_1cbe:
  uVar4 = FUN_1016_054c();
  return uVar4;
}



void thunk_FUN_1016_036d(void)

{
  FUN_1016_036d();
  return;
}



void __cdecl16near FUN_1016_1cc4(void)

{
  return;
}



void __cdecl16far FUN_1016_1ccd(void)

{
  FUN_1016_0b91();
  return;
}



void __cdecl16far FUN_1016_1ce3(void)

{
  undefined2 unaff_DS;
  
  *(undefined1 *)0x64c = 0;
  *(undefined2 *)0x642 = 0;
  *(undefined1 *)0x64d = 0;
  return;
}



char __cdecl16near FUN_1016_1f5a(void)

{
  char in_AH;
  char cVar1;
  char *pcVar2;
  
  pcVar2 = (char *)0x1d6d;
  cVar1 = '\x0e';
  do {
    if (in_AH == *pcVar2) {
      return pcVar2[1];
    }
    pcVar2 = pcVar2 + 2;
    cVar1 = cVar1 + -1;
  } while (cVar1 != '\0');
  return '\0';
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

uint __cdecl16near FUN_1016_1f77(void)

{
  char *pcVar1;
  byte bVar2;
  uint *puVar3;
  uint uVar4;
  uint in_AX;
  int *piVar5;
  int in_BX;
  int *piVar6;
  undefined2 unaff_SI;
  uint *puVar7;
  uint *puVar8;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  int in_stack_00000000;
  
  piVar6 = (int *)(in_BX + 1U & 0xfffe);
  pcVar1 = (char *)0x698;
  *pcVar1 = *pcVar1 + '\x01';
  if (*pcVar1 == '\0') {
    *(undefined1 *)0x698 = 0xff;
  }
LAB_1016_1f87:
  puVar8 = (uint *)*(undefined2 *)0x658;
  piVar5 = (int *)0x0;
  do {
    puVar7 = (uint *)((int)puVar8 + (int)piVar5);
    while( true ) {
      while( true ) {
        puVar8 = puVar7 + 1;
        piVar5 = (int *)*puVar7;
        if (((uint)piVar5 & 1) != 0) break;
        puVar7 = (uint *)((int)puVar8 + *piVar5 + 1 & 0xfffe);
      }
      if (piVar5 != (int *)0xffff) break;
      LOCK();
      bVar2 = *(byte *)0x698;
      *(byte *)0x698 = 0;
      UNLOCK();
      if (5 < bVar2) {
        puVar8 = (uint *)*(undefined2 *)0x61e;
        *(undefined2 *)0x658 = puVar8;
        piVar5 = piVar6;
        goto LAB_1016_1fe1;
      }
      FUN_1016_200c(unaff_SI,in_AX,in_stack_00000000);
      puVar7 = (uint *)*(undefined2 *)0x658;
      if ((int *)*puVar7 < piVar6) {
        *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
        FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
        uVar4 = (*(code *)*(undefined2 *)0x62e)();
        return uVar4;
      }
    }
    piVar5 = (int *)((int)piVar5 - 1);
    if (piVar6 <= piVar5) {
      *(undefined2 *)0x658 = (int *)((int)puVar8 + (int)piVar6);
      if ((int)piVar5 - (int)piVar6 != 0) {
        *(int *)((int)puVar8 + (int)piVar6) = ((int)piVar5 - (int)piVar6) + -1;
      }
      return in_AX;
    }
  } while( true );
LAB_1016_1fe1:
  puVar7 = (uint *)CONCAT11((char)((uint)piVar5 >> 8),0xff);
  while( true ) {
    puVar3 = puVar8 + 1;
    piVar5 = (int *)*puVar8;
    if (piVar5 == (int *)0xffff) goto LAB_1016_1f87;
    if (((uint)piVar5 & 1) == 0) break;
    if ((char)puVar7 == -1) {
      puVar8 = (uint *)((int)puVar3 + (int)piVar5 + -1);
      puVar7 = puVar3;
    }
    else {
      puVar8 = (uint *)((int)puVar3 + (int)piVar5 + -1);
      puVar7[-1] = (int)piVar5 + puVar7[-1] + 1;
    }
  }
  puVar8 = (uint *)((int)puVar3 + *piVar5 + 1 & 0xfffe);
  goto LAB_1016_1fe1;
}



// WARNING: Removing unreachable block (ram,0x0001222c)
// WARNING: Removing unreachable block (ram,0x00012234)
// WARNING: Removing unreachable block (ram,0x0001227b)

undefined2 __cdecl16near FUN_1016_200c(undefined2 param_1,uint param_2,int param_3)

{
  uint *puVar1;
  uint *puVar2;
  int iVar3;
  undefined2 in_AX;
  int *piVar4;
  uint uVar5;
  undefined2 uVar6;
  int in_BX;
  undefined2 *unaff_SI;
  uint *puVar7;
  uint *puVar8;
  uint *puVar9;
  undefined1 *in_EDI;
  uint *puVar10;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined4 uVar11;
  int in_stack_00000000;
  
  piVar4 = (int *)0x1;
  puVar8 = (uint *)*(undefined2 *)0x61e;
  puVar10 = (uint *)CONCAT22((int)((ulong)in_EDI >> 0x10),puVar8);
LAB_1016_2019:
  uVar5 = (int)piVar4 - 1;
  do {
    puVar7 = (uint *)((int)puVar8 + uVar5);
    while( true ) {
      puVar8 = puVar7 + 1;
      piVar4 = (int *)*puVar7;
      puVar9 = (uint *)puVar10;
      if (piVar4 == (int *)0xffff) {
        if (3 < (uint)((int)puVar8 - (int)puVar9)) {
          *puVar9 = ((int)puVar8 - (int)puVar9) - 3;
        }
        *(undefined2 *)0x658 = puVar9;
        return in_AX;
      }
      if (((uint)piVar4 & 1) != 0) goto LAB_1016_2019;
      puVar2 = puVar9 + 1;
      uVar6 = (undefined2)((ulong)puVar10 >> 0x10);
      puVar10 = (uint *)CONCAT22(uVar6,puVar2);
      *puVar9 = (uint)piVar4;
      iVar3 = *piVar4;
      if (puVar8 != (uint *)piVar4[1]) {
        FUN_1016_2070((undefined1 *)in_EDI,unaff_SI,in_BX,in_AX,in_stack_00000000,param_1,param_2,
                      param_3);
        uVar11 = FUN_1016_2a65();
        *(byte *)((int)puVar7 + 0x77) = *(byte *)((int)puVar7 + 0x77) & (byte)((ulong)uVar11 >> 8);
        out((char)*puVar8,(int)((ulong)uVar11 >> 0x10));
        *(byte *)(puVar10 + 0x17) = (byte)puVar10[0x17] & (byte)uVar11;
        FUN_1016_2a1a();
        uVar6 = FUN_1016_017b();
        return uVar6;
      }
      if (puVar8 == puVar2) break;
      piVar4[1] = (int)puVar2;
      for (uVar5 = iVar3 + 1U >> 1; puVar7 = puVar8, uVar5 != 0; uVar5 = uVar5 - 1) {
        puVar7 = (uint *)puVar10;
        puVar10 = (uint *)CONCAT22((int)((ulong)puVar10 >> 0x10),puVar7 + 1);
        puVar1 = puVar8;
        puVar8 = puVar8 + 1;
        *puVar7 = *puVar1;
      }
    }
    uVar5 = iVar3 + 1U & 0xfffe;
    puVar10 = (uint *)CONCAT22(uVar6,(uint *)((int)puVar2 + uVar5));
  } while( true );
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack
// WARNING: Removing unreachable block (ram,0x00012205)
// WARNING: Removing unreachable block (ram,0x00012207)
// WARNING: Removing unreachable block (ram,0x00011751)

int __cdecl16near
FUN_1016_2070(undefined1 *param_1,undefined2 *param_2,int param_3,undefined2 param_4,int param_5,
             undefined2 param_6,uint param_7,int param_8)

{
  uint *puVar1;
  undefined2 *puVar2;
  char *pcVar3;
  undefined1 uVar4;
  undefined2 *puVar5;
  char cVar6;
  undefined1 *puVar7;
  int in_CX;
  uint uVar8;
  char *in_BX;
  int iVar9;
  undefined1 *unaff_SI;
  undefined2 *puVar10;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 in_CF;
  bool bVar11;
  undefined4 uVar12;
  long lVar13;
  undefined2 in_stack_00000012;
  int in_stack_00000014;
  undefined2 in_stack_00000016;
  uint in_stack_00000018;
  int in_stack_0000001a;
  
  FUN_1016_2a1a();
  uVar12 = FUN_1016_2a65();
  iVar9 = (int)uVar12;
  out(*unaff_SI,(int)((ulong)uVar12 >> 0x10));
  if (in_CX == 1) {
    uVar8 = 0;
    do {
      if (uVar8 == 0) break;
      uVar8 = uVar8 - 1;
      pcVar3 = in_BX;
      in_BX = in_BX + 1;
    } while (*pcVar3 != '\0');
    iVar9 = ~uVar8 - 1;
  }
  else if (!(bool)in_CF) {
    uVar4 = in(param_6);
    *param_1 = uVar4;
    param_1[0x73] = param_1[0x73] & (byte)param_8;
    puVar7 = (undefined1 *)(param_8 + -0x5320);
    lVar13 = ZEXT24(param_1 + 1) << 0x10;
    if (puVar7 != (undefined1 *)0x0) {
      lVar13 = (long)*(int *)(param_3 + 0x67) * 0x5320;
      if ((int)lVar13 == lVar13) {
        puVar1 = (uint *)(param_1 + 0x21);
        iVar9 = 2 - (*puVar1 & 3);
        *puVar1 = *puVar1 + (uint)(0 < iVar9) * iVar9;
        iVar9 = param_5 + 1;
        out(*param_2,param_6);
        if (iVar9 == 0) {
          do {
                    // WARNING: Do nothing block with infinite loop
          } while( true );
        }
        cVar6 = (char)((uint)iVar9 >> 8) * '\x02';
        bVar11 = cVar6 == '\0';
        uVar8 = CONCAT11(cVar6,(char)iVar9);
        while( true ) {
          if (!bVar11) {
            puVar7 = FUN_1016_2121(in_stack_00000012,in_stack_00000014,in_stack_00000016,
                                   in_stack_00000018,in_stack_0000001a);
          }
          if (0x697 < uVar8 + 4) break;
          bVar11 = *(int *)(uVar8 + 6) == -1;
          uVar8 = uVar8 + 4;
        }
        return (int)puVar7;
      }
      lVar13 = FUN_1016_209c();
      param_7 = param_7 + 1;
    }
    puVar10 = (undefined2 *)((ulong)lVar13 >> 0x10);
    for (uVar8 = param_7 >> 1; uVar8 != 0; uVar8 = uVar8 - 1) {
      puVar5 = puVar10;
      puVar10 = puVar10 + 1;
      puVar2 = param_2;
      param_2 = param_2 + 1;
      *puVar5 = *puVar2;
    }
    return (int)lVar13;
  }
  return iVar9;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_1016_209c(void)

{
  int *piVar1;
  int in_BX;
  int iVar2;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if (in_BX == 0) {
    return;
  }
  if (*(int *)0x65a == 0) {
    *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
    FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x62e)();
    return;
  }
  iVar2 = in_BX;
  FUN_1016_1f77();
  piVar1 = (int *)*(int *)0x65a;
  *(int *)0x65a = *piVar1;
  *piVar1 = in_BX;
  *(int *)(iVar2 + -2) = (int)piVar1;
  piVar1[1] = iVar2;
  return;
}



void __cdecl16near FUN_1016_20ce(void)

{
  uint in_BX;
  
  if (in_BX < 0x698) {
    return;
  }
  return;
}



int __cdecl16near FUN_1016_20da(void)

{
  char *pcVar1;
  uint uVar2;
  char *in_BX;
  undefined2 unaff_ES;
  
  uVar2 = 0xffff;
  do {
    if (uVar2 == 0) break;
    uVar2 = uVar2 - 1;
    pcVar1 = in_BX;
    in_BX = in_BX + 1;
  } while (*pcVar1 != '\0');
  return ~uVar2 - 1;
}



void FUN_1016_20ed(void)

{
  undefined2 *puVar1;
  undefined2 *puVar2;
  uint uVar3;
  undefined2 *in_DX;
  undefined2 *extraout_DX;
  int in_BX;
  undefined2 *puVar4;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  FUN_1016_209c();
  puVar4 = extraout_DX;
  for (uVar3 = in_BX + 1U >> 1; uVar3 != 0; uVar3 = uVar3 - 1) {
    puVar2 = puVar4;
    puVar4 = puVar4 + 1;
    puVar1 = in_DX;
    in_DX = in_DX + 1;
    *puVar2 = *puVar1;
  }
  return;
}



void FUN_1016_2104(void)

{
  undefined2 in_BX;
  uint uVar1;
  undefined2 unaff_DS;
  int in_stack_00000000;
  undefined2 in_stack_00000002;
  uint in_stack_00000004;
  int in_stack_00000006;
  
  uVar1 = 0x65c;
  do {
    if (*(int *)(uVar1 + 2) != -1) {
      FUN_1016_2121(in_BX,in_stack_00000000,in_stack_00000002,in_stack_00000004,in_stack_00000006);
    }
    uVar1 = uVar1 + 4;
  } while (uVar1 < 0x698);
  return;
}



undefined1 * __cdecl16near FUN_1016_211c(void)

{
  undefined2 uVar1;
  undefined1 *puVar2;
  undefined2 *in_BX;
  undefined2 unaff_DS;
  undefined1 in_CF;
  int in_stack_00000000;
  undefined2 in_stack_00000002;
  int in_stack_00000004;
  undefined2 in_stack_00000006;
  uint in_stack_00000008;
  int in_stack_0000000a;
  
  uVar1 = FUN_1016_20ce();
  if ((bool)in_CF) {
    puVar2 = FUN_1016_2181(in_stack_00000000,in_stack_00000002,in_stack_00000004,in_stack_00000006,
                           in_stack_00000008,in_stack_0000000a);
    LOCK();
    uVar1 = *(undefined2 *)0x65a;
    *(undefined2 *)0x65a = in_BX;
    UNLOCK();
    *in_BX = uVar1;
    in_BX[1] = 0xffff;
    return puVar2;
  }
  return (undefined1 *)uVar1;
}



undefined1 *
FUN_1016_2121(undefined2 param_1,int param_2,undefined2 param_3,uint param_4,int param_5)

{
  undefined2 uVar1;
  undefined1 *puVar2;
  undefined2 *in_BX;
  undefined2 unaff_DS;
  int in_stack_00000000;
  
  puVar2 = FUN_1016_2181(in_stack_00000000,param_1,param_2,param_3,param_4,param_5);
  LOCK();
  uVar1 = *(undefined2 *)0x65a;
  *(undefined2 *)0x65a = in_BX;
  UNLOCK();
  *in_BX = uVar1;
  in_BX[1] = 0xffff;
  return puVar2;
}



undefined2 __cdecl16near FUN_1016_2124(void)

{
  undefined2 uVar1;
  undefined2 in_AX;
  undefined2 *in_BX;
  undefined2 unaff_DS;
  
  LOCK();
  uVar1 = *(undefined2 *)0x65a;
  *(undefined2 *)0x65a = in_BX;
  UNLOCK();
  *in_BX = uVar1;
  in_BX[1] = 0xffff;
  return in_AX;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined4 __cdecl16near FUN_1016_2134(uint param_1,int param_2)

{
  uint *puVar1;
  undefined2 uVar2;
  undefined2 in_DX;
  uint uVar3;
  int in_BX;
  uint uVar4;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined4 uVar5;
  undefined2 in_stack_00000000;
  
  uVar2 = FUN_1016_200c(in_stack_00000000,param_1,param_2);
  uVar4 = in_BX + 1U & 0xfffe;
  puVar1 = (uint *)*(int *)0x658;
  uVar3 = *puVar1 - uVar4;
  if (*puVar1 < uVar4) {
    *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
    FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
    uVar5 = (*(code *)*(undefined2 *)0x62e)();
    return uVar5;
  }
  *puVar1 = uVar3;
  *(undefined2 *)((int)puVar1 + uVar3 + 1) = 0xffff;
  *(int *)0x620 = (int)puVar1 + uVar3 + 2;
  return CONCAT22(in_DX,uVar2);
}



undefined4 __cdecl16near FUN_1016_215c(void)

{
  undefined2 *puVar1;
  undefined2 *puVar2;
  undefined2 in_AX;
  int in_CX;
  int iVar3;
  uint uVar4;
  int in_DX;
  undefined2 *extraout_DX;
  int in_BX;
  undefined2 *puVar5;
  undefined2 *puVar6;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  iVar3 = in_DX;
  FUN_1016_209c();
  puVar5 = (undefined2 *)(in_CX + *(int *)(in_BX + 2));
  FUN_1016_211c();
  puVar6 = extraout_DX;
  for (uVar4 = iVar3 + 1U >> 1; uVar4 != 0; uVar4 = uVar4 - 1) {
    puVar2 = puVar6;
    puVar6 = puVar6 + 1;
    puVar1 = puVar5;
    puVar5 = puVar5 + 1;
    *puVar2 = *puVar1;
  }
  return CONCAT22(in_DX,in_AX);
}



undefined1 * __cdecl16near
FUN_1016_2181(int param_1,undefined2 param_2,int param_3,undefined2 param_4,uint param_5,int param_6
             )

{
  int *piVar1;
  uint uVar2;
  undefined1 *in_AX;
  undefined1 *puVar3;
  int *in_BX;
  undefined2 unaff_DS;
  undefined2 *in_stack_00000000;
  
  uVar2 = in_BX[1];
  if ((uVar2 < *(uint *)0x61e) || (*(uint *)0x620 < uVar2)) {
    return in_AX;
  }
  LOCK();
  piVar1 = (int *)*(uint *)(uVar2 - 2);
  *(uint *)(uVar2 - 2) = *in_BX + 1U | 1;
  UNLOCK();
  if (piVar1 == in_BX) {
    return in_AX;
  }
  FUN_1016_2070(in_AX,in_stack_00000000,param_1,param_2,param_3,param_4,param_5,param_6);
  FUN_1016_2a1a();
  puVar3 = (undefined1 *)FUN_1016_017b();
  return puVar3;
}



undefined4 __cdecl16near FUN_1016_21ad(void)

{
  undefined2 in_DX;
  int in_BX;
  undefined2 unaff_DS;
  undefined4 uVar1;
  
  uVar1 = FUN_1016_215c();
  *(undefined1 *)(*(int *)(in_BX + 2) + (int)((ulong)uVar1 >> 0x10) + -1) = 0;
  return CONCAT22(in_DX,(int)uVar1);
}



void __cdecl16near FUN_1016_21c5(void)

{
  int *piVar1;
  int iVar2;
  int iVar3;
  int *piVar4;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  piVar1 = (int *)*(int *)0x61e;
  *(int *)0x658 = (int)piVar1;
  iVar2 = (*(int *)0x620 + 1U & 0xfffe) - (int)piVar1;
  *piVar1 = iVar2 + -3;
  *(undefined2 *)((int)piVar1 + iVar2 + -2) = 0xffff;
  iVar3 = 0xf;
  *(undefined2 *)0x65a = 0x65c;
  iVar2 = 0x660;
  piVar1 = (int *)0x65c;
  do {
    piVar4 = piVar1;
    *piVar4 = iVar2;
    piVar4[1] = -1;
    iVar2 = iVar2 + 4;
    iVar3 = iVar3 + -1;
    piVar1 = piVar4 + 2;
  } while (iVar3 != 0);
  *piVar4 = 0;
  *(undefined1 *)0x698 = 0;
  return;
}



void __cdecl16near FUN_1016_230b(void)

{
  char *pcVar1;
  uint uVar2;
  ulong uVar3;
  byte bVar5;
  uint uVar4;
  undefined2 in_CX;
  uint uVar6;
  uint uVar7;
  uint uVar8;
  undefined1 uVar9;
  char cVar10;
  uint extraout_DX;
  int iVar11;
  uint uVar12;
  uint uVar13;
  uint *puVar14;
  byte *pbVar15;
  char *pcVar16;
  uint uVar17;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  bool bVar18;
  bool bVar19;
  
  if (*(byte *)0x6d2 < 4) {
    uVar9 = 0x20;
    if (*(int *)0xaa != 0) {
      if (*(int *)0xaa < 0) {
        uVar9 = 0x2d;
      }
      *(undefined1 *)0x69a = uVar9;
      FUN_1016_243f();
      FUN_1016_23b3();
      return;
    }
  }
  else {
    iVar11 = 0x99;
    if (*(byte *)0x6d2 != 4) {
      iVar11 = 0xb9;
    }
    bVar5 = *(byte *)0xad;
    if (bVar5 != 0) {
      iVar11 = iVar11 - (uint)bVar5;
      uVar9 = 0x20;
      if ((*(byte *)0xac & 0x80) != 0) {
        uVar9 = 0x2d;
      }
      *(undefined1 *)0x69a = uVar9;
      bVar5 = *(char *)(*(char *)(iVar11 + 0x1c2) * 8 + 0x373) + bVar5;
      if (*(char *)0x6d2 == '\x04') {
        FUN_1016_3526();
        uVar6 = bVar5 & 7;
        if ((bVar5 & 7) != 0) {
          do {
            uVar6 = uVar6 - 1;
          } while (uVar6 != 0);
        }
        pbVar15 = (byte *)0x6be;
      }
      else {
        FUN_1016_38ef();
        uVar17 = CONCAT11((char)iVar11,(char)((uint)in_CX >> 8));
        uVar13 = CONCAT11(0xa6,(char)((uint)iVar11 >> 8));
        uVar12 = 0;
        uVar4 = CONCAT11((char)in_CX,(char)(extraout_DX >> 8));
        uVar7 = bVar5 & 7;
        uVar6 = extraout_DX;
        if ((bVar5 & 7) != 0) {
          do {
            cVar10 = (char)uVar6;
            uVar6 = (uint)(byte)(cVar10 << 1);
            uVar3 = (ulong)CONCAT12(cVar10 < '\0',uVar4) << 1;
            uVar4 = (uint)uVar3 | (uint)(cVar10 < '\0');
            bVar19 = (uVar3 & 0x10000) != 0;
            uVar3 = (ulong)CONCAT12(bVar19,uVar17) << 1;
            uVar17 = (uint)uVar3 | (uint)bVar19;
            bVar19 = (uVar3 & 0x10000) != 0;
            uVar3 = (ulong)CONCAT12(bVar19,uVar13) << 1;
            uVar13 = (uint)uVar3 | (uint)bVar19;
            uVar12 = uVar12 << 1 | (uint)((uVar3 & 0x10000) != 0);
            uVar7 = uVar7 - 1;
          } while (uVar7 != 0);
        }
        if ((0x80 < (byte)uVar6) || ((0x7f < (byte)uVar6 && ((uVar4 & 1) != 0)))) {
          bVar18 = 0xfffe < uVar4;
          uVar4 = uVar4 + 1;
          bVar19 = CARRY2(uVar17,(uint)bVar18);
          uVar17 = uVar17 + bVar18;
          uVar6 = (uint)bVar19;
          bVar19 = CARRY2(uVar13,uVar6);
          uVar13 = uVar13 + uVar6;
          uVar12 = uVar12 + bVar19;
        }
        pbVar15 = (byte *)0x6be;
        puVar14 = (uint *)0x104;
        uVar6 = 0xb;
        do {
          do {
            uVar8 = uVar6;
            bVar19 = uVar4 < *puVar14;
            uVar4 = uVar4 - *puVar14;
            uVar6 = (uint)bVar19;
            bVar19 = uVar17 < puVar14[1];
            uVar7 = uVar17 - puVar14[1];
            uVar17 = uVar7 - uVar6;
            uVar6 = (uint)(bVar19 || uVar7 < uVar6);
            bVar19 = uVar13 < puVar14[2];
            uVar7 = uVar13 - puVar14[2];
            uVar13 = uVar7 - uVar6;
            uVar7 = (uint)(bVar19 || uVar7 < uVar6);
            bVar19 = puVar14[3] <= uVar12;
            uVar2 = uVar12 - puVar14[3];
            uVar12 = uVar2 - uVar7;
            bVar5 = (byte)(uVar8 >> 8);
            uVar6 = CONCAT11(bVar5 + 1,(char)uVar8);
          } while (bVar19 && uVar7 <= uVar2);
          bVar19 = CARRY2(uVar4,*puVar14);
          uVar4 = uVar4 + *puVar14;
          uVar6 = (uint)bVar19;
          bVar19 = CARRY2(uVar17,puVar14[1]);
          uVar7 = uVar17 + puVar14[1];
          uVar17 = uVar7 + uVar6;
          uVar6 = (uint)(bVar19 || CARRY2(uVar7,uVar6));
          bVar19 = CARRY2(uVar13,puVar14[2]);
          uVar7 = uVar13 + puVar14[2];
          uVar13 = uVar7 + uVar6;
          uVar12 = uVar12 + puVar14[3] + (uint)(bVar19 || CARRY2(uVar7,uVar6));
          puVar14 = puVar14 + 4;
          *pbVar15 = bVar5 | 0x30;
          pbVar15 = pbVar15 + 1;
          uVar6 = (uVar8 & 0xff) - 1;
        } while (uVar6 != 0);
      }
      FUN_1016_243f();
      FUN_1016_244f();
      pcVar16 = (char *)0x6be;
      pbVar15 = pbVar15 + -0x6be;
      do {
        if (pbVar15 == (byte *)0x0) {
          return;
        }
        pbVar15 = pbVar15 + -1;
        pcVar1 = pcVar16;
        pcVar16 = pcVar16 + 1;
      } while (*pcVar1 == '0');
      return;
    }
  }
  *(undefined1 *)0x69a = 0x20;
  *(undefined1 *)0x6be = 0x30;
  return;
}



void __cdecl16near FUN_1016_23b3(void)

{
  char *pcVar1;
  int iVar2;
  int unaff_DI;
  char *pcVar3;
  undefined2 unaff_ES;
  
  pcVar3 = (char *)0x6be;
  iVar2 = unaff_DI + -0x6be;
  do {
    if (iVar2 == 0) {
      return;
    }
    iVar2 = iVar2 + -1;
    pcVar1 = pcVar3;
    pcVar3 = pcVar3 + 1;
  } while (*pcVar1 == '0');
  return;
}



void FUN_1016_243f(void)

{
  uint *puVar1;
  uint in_AX;
  uint uVar2;
  uint *unaff_DI;
  undefined2 unaff_ES;
  
  if (9999 < in_AX) {
    uVar2 = in_AX / 10000;
    in_AX = in_AX % 10000;
    puVar1 = unaff_DI;
    unaff_DI = (uint *)((int)unaff_DI + 1);
    *(char *)puVar1 = (char)uVar2 + '0';
  }
  uVar2 = 0;
  if (99 < in_AX) {
    uVar2 = in_AX / 100;
    in_AX = in_AX % 100;
    uVar2 = uVar2 & 0xff;
    uVar2 = CONCAT11((char)(uVar2 % 10),(char)(uVar2 / 10));
  }
  *unaff_DI = uVar2 | 0x3030;
  unaff_DI[1] = CONCAT11((char)(in_AX % 10),(char)(in_AX / 10)) | 0x3030;
  return;
}



void __cdecl16near FUN_1016_244f(void)

{
  uint uVar1;
  uint in_DX;
  uint *unaff_DI;
  undefined2 unaff_ES;
  
  uVar1 = 0;
  if (99 < in_DX) {
    uVar1 = in_DX / 100;
    in_DX = in_DX % 100;
    uVar1 = uVar1 & 0xff;
    uVar1 = CONCAT11((char)(uVar1 % 10),(char)(uVar1 / 10));
  }
  *unaff_DI = uVar1 | 0x3030;
  unaff_DI[1] = CONCAT11((char)(in_DX % 10),(char)(in_DX / 10)) | 0x3030;
  return;
}



undefined4 __cdecl16near FUN_1016_246c(void)

{
  int in_CX;
  undefined4 uVar1;
  
  FUN_1016_243f();
  FUN_1016_23b3();
  do {
    uVar1 = FUN_1016_2a2e();
    in_CX = in_CX + -1;
  } while (in_CX != 0);
  return uVar1;
}



void __cdecl16near FUN_1016_247c(void)

{
  byte *pbVar1;
  char in_AL;
  byte bVar2;
  uint uVar3;
  uint in_CX;
  int unaff_SI;
  byte *pbVar4;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  uVar3 = (uint)in_AL;
  pbVar4 = (byte *)(unaff_SI + in_CX);
  if (uVar3 < in_CX) {
    pbVar4 = pbVar4 + -(in_CX - uVar3);
    LOCK();
    bVar2 = *pbVar4;
    *pbVar4 = 0x30;
    UNLOCK();
    in_CX = uVar3;
    if (0x34 < bVar2) {
      for (; in_CX != 0; in_CX = in_CX - 1) {
        pbVar4 = pbVar4 + -1;
        bVar2 = *pbVar4 + 1;
        if (bVar2 < 0x3a) goto LAB_1016_24a6;
      }
      in_CX = 1;
      bVar2 = 0x31;
LAB_1016_24a6:
      pbVar1 = pbVar4;
      pbVar4 = pbVar4 + 1;
      *pbVar1 = bVar2;
    }
  }
  do {
    pbVar4 = pbVar4 + -1;
    if (in_CX == 0) {
      return;
    }
    in_CX = in_CX - 1;
  } while (*pbVar4 == 0x30);
  return;
}



void __cdecl16near FUN_1016_24ba(void)

{
  char in_BL;
  char in_BH;
  char *pcVar1;
  undefined2 unaff_DS;
  
  if (in_BH == '\0') {
    pcVar1 = (char *)0x62e;
    do {
      pcVar1 = *(char **)(pcVar1 + -2);
      if (pcVar1 == (char *)0x0) {
        return;
      }
    } while (pcVar1[-5] != in_BL);
    if (*pcVar1 == '\0') {
      FUN_1016_251b();
    }
  }
  return;
}



undefined4 __cdecl16near FUN_1016_24d8(void)

{
  undefined2 *puVar1;
  undefined2 in_AX;
  uint uVar2;
  undefined2 in_DX;
  uint in_BX;
  int iVar3;
  undefined2 *puVar4;
  undefined2 *puVar5;
  int unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  puVar5 = (undefined2 *)0x62c;
  do {
    puVar4 = puVar5;
    puVar5 = (undefined2 *)puVar4[-1];
    if (puVar5 == (undefined2 *)0x0) {
      iVar3 = in_BX + 6;
      FUN_1016_2134(in_BX,unaff_DI);
      puVar5 = (undefined2 *)(iVar3 + 6);
      *(uint *)(iVar3 + 2) = in_BX;
      goto LAB_1016_2507;
    }
  } while ((uint)puVar5[-2] < in_BX);
  puVar4[-1] = puVar5[-1];
  in_BX = puVar5[-2];
LAB_1016_2507:
  for (uVar2 = in_BX >> 1; uVar2 != 0; uVar2 = uVar2 - 1) {
    puVar1 = puVar5;
    puVar5 = puVar5 + 1;
    *puVar1 = 0;
  }
  if ((in_BX & 1) != 0) {
    *(undefined1 *)puVar5 = 0;
  }
  return CONCAT22(in_DX,in_AX);
}



void __cdecl16near FUN_1016_2518(void)

{
  undefined2 uVar1;
  int unaff_SI;
  undefined2 unaff_DS;
  
  uVar1 = *(undefined2 *)0x62a;
  *(int *)0x62a = unaff_SI;
  *(undefined2 *)(unaff_SI + -2) = uVar1;
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_1016_251b(void)

{
  int iVar1;
  undefined2 uVar2;
  int unaff_SI;
  int iVar3;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  iVar1 = 0x62e;
  do {
    iVar3 = iVar1;
    iVar1 = *(int *)(iVar3 + -2);
    if (iVar1 == 0) {
      *(undefined2 *)(*(int *)0x630 + -2) = 0x1805;
      FUN_1016_2104();
                    // WARNING: Could not recover jumptable at 0x00011805. Too many branches
                    // WARNING: Treating indirect jump as call
      (*(code *)*(undefined2 *)0x62e)();
      return;
    }
  } while (iVar1 != unaff_SI);
  *(undefined2 *)(iVar3 + -2) = *(undefined2 *)(unaff_SI + -2);
  uVar2 = *(undefined2 *)0x62a;
  *(int *)0x62a = unaff_SI;
  *(undefined2 *)(unaff_SI + -2) = uVar2;
  return;
}



void __cdecl16near FUN_1016_2646(void)

{
  byte in_AL;
  undefined2 unaff_DS;
  
  if (in_AL < 4) {
    if ((*(byte *)0x87 & 1) != 0) {
      *(char *)0x6d4 = -(in_AL & 1);
      return;
    }
    *(char *)0x6d4 = in_AL * 'U';
  }
  return;
}



undefined2 __cdecl16near FUN_1016_29d3(void)

{
  char *pcVar1;
  undefined2 in_AX;
  int iVar2;
  undefined2 unaff_DS;
  
  pcVar1 = (char *)*(undefined2 *)0x642;
  if ((pcVar1 == (char *)0x0) || ((pcVar1[0x2e] & 0x80U) != 0)) {
    FUN_1016_0ee3();
  }
  else {
    if ((*pcVar1 == '\x04') && (*(char *)0x64c != '\0')) {
      for (iVar2 = (*(int *)(pcVar1 + 0xb3) - *(int *)(pcVar1 + 0xba)) + -2; iVar2 != 0;
          iVar2 = iVar2 + -1) {
        FUN_1016_0ee3();
      }
    }
    FUN_1016_0ee3();
    FUN_1016_0ee3();
  }
  return in_AX;
}



undefined2 __cdecl16near FUN_1016_2a1a(void)

{
  undefined2 uVar1;
  undefined2 in_AX;
  undefined2 unaff_DS;
  
  uVar1 = *(undefined2 *)0x642;
  *(undefined2 *)0x642 = 0;
  FUN_1016_29d3();
  *(undefined2 *)0x642 = uVar1;
  return in_AX;
}



undefined4 __cdecl16near FUN_1016_2a2e(void)

{
  undefined2 uVar1;
  undefined2 unaff_DS;
  undefined4 uVar2;
  
  uVar1 = *(undefined2 *)0x642;
  *(undefined2 *)0x642 = 0;
  uVar2 = FUN_1016_0ee3();
  *(undefined2 *)0x642 = uVar1;
  return uVar2;
}



void __cdecl16near FUN_1016_2a57(void)

{
  byte *pbVar1;
  byte bVar2;
  byte *unaff_SI;
  
  do {
    pbVar1 = unaff_SI;
    unaff_SI = unaff_SI + 1;
    bVar2 = *pbVar1;
    FUN_1016_2a2e();
  } while ((bVar2 & 0x80) == 0);
  return;
}



void FUN_1016_2a65(void)

{
  code *in_stack_00000000;
  
  FUN_1016_2a57();
                    // WARNING: Could not recover jumptable at 0x00012bcf. Too many branches
                    // WARNING: Treating indirect jump as call
  (*in_stack_00000000)();
  return;
}



undefined4 __cdecl16near FUN_1016_2a71(void)

{
  undefined2 in_AX;
  int iVar1;
  undefined2 in_DX;
  int *in_BX;
  undefined2 unaff_DS;
  undefined4 uVar2;
  
  iVar1 = *in_BX;
  if (iVar1 == 0) {
    return CONCAT22(in_DX,in_AX);
  }
  do {
    uVar2 = FUN_1016_0ee3();
    iVar1 = iVar1 + -1;
  } while (iVar1 != 0);
  return uVar2;
}



void FUN_1016_2fde(void)

{
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  
  *(undefined2 *)0x6f0 = in_stack_00000000;
                    // WARNING: Could not recover jumptable at 0x0001315a. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x6f0)();
  return;
}



undefined2 __cdecl16far FUN_1016_2ffe(void)

{
  undefined2 unaff_DI;
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  undefined1 auStack_7ffe [32762];
  
  *(undefined2 *)0x6f0 = in_stack_00000000;
  *(int *)0x630 = (int)register0x00000010 + 2;
  (*(code *)*(undefined2 *)0x6f0)();
  return unaff_DI;
}



int * __cdecl16near FUN_1016_3199(void)

{
  undefined1 *puVar1;
  int *piVar2;
  char cVar3;
  int iVar4;
  int in_CX;
  byte extraout_DL;
  byte bVar5;
  undefined2 uVar6;
  undefined1 *unaff_SI;
  int *unaff_DI;
  int *piVar7;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  FUN_1016_230b();
  uVar6 = 0xf907;
  if (4 < *(byte *)0x6d2) {
    uVar6 = 0xf010;
  }
  FUN_1016_247c();
  if (((char)extraout_DL < (char)((uint)uVar6 >> 8)) ||
     (cVar3 = extraout_DL + (char)in_CX, (char)uVar6 < cVar3)) {
    piVar7 = (int *)((int)unaff_DI + 1);
    *(undefined1 *)unaff_DI = *unaff_SI;
    in_CX = in_CX + -1;
    bVar5 = extraout_DL;
    if (in_CX != 0) {
      piVar2 = piVar7;
      piVar7 = unaff_DI + 1;
      *(undefined1 *)piVar2 = 0x2e;
      bVar5 = extraout_DL + (char)in_CX;
      for (; unaff_SI = unaff_SI + 1, in_CX != 0; in_CX = in_CX + -1) {
        piVar2 = piVar7;
        piVar7 = (int *)((int)piVar7 + 1);
        *(undefined1 *)piVar2 = *unaff_SI;
      }
    }
    iVar4 = 0x2b45;
    if ((char)bVar5 < '\0') {
      bVar5 = -bVar5;
      iVar4 = 0x2d45;
    }
    if (*(char *)0x6d2 == '\b') {
      iVar4 = iVar4 + -1;
    }
    *piVar7 = iVar4;
    unaff_DI = piVar7 + 2;
    piVar7[1] = CONCAT11(bVar5 % 10,bVar5 / 10) | 0x3030;
  }
  else {
    iVar4 = (int)cVar3;
    if (iVar4 < 1) {
      iVar4 = -iVar4;
    }
    else {
      do {
        piVar2 = unaff_DI;
        unaff_DI = (int *)((int)unaff_DI + 1);
        puVar1 = unaff_SI;
        unaff_SI = unaff_SI + 1;
        *(undefined1 *)piVar2 = *puVar1;
        in_CX = in_CX + -1;
        iVar4 = iVar4 + -1;
      } while (iVar4 != 0 && in_CX != 0);
      for (; iVar4 != 0; iVar4 = iVar4 + -1) {
        piVar2 = unaff_DI;
        unaff_DI = (int *)((int)unaff_DI + 1);
        *(undefined1 *)piVar2 = 0x30;
      }
      iVar4 = 0;
      if (in_CX == 0) goto LAB_1016_31d6;
    }
    *(undefined1 *)unaff_DI = 0x2e;
    for (; unaff_DI = (int *)((int)unaff_DI + 1), iVar4 != 0; iVar4 = iVar4 + -1) {
      *(undefined1 *)unaff_DI = 0x30;
    }
    for (; in_CX != 0; in_CX = in_CX + -1) {
      piVar2 = unaff_DI;
      unaff_DI = (int *)((int)unaff_DI + 1);
      puVar1 = unaff_SI;
      unaff_SI = unaff_SI + 1;
      *(undefined1 *)piVar2 = *puVar1;
    }
  }
LAB_1016_31d6:
  *(undefined1 *)unaff_DI = 0;
  return unaff_DI + -0x34d;
}



int __cdecl16near FUN_1016_3526(void)

{
  long lVar1;
  long lVar2;
  byte in_CL;
  byte in_BL;
  uint unaff_SI;
  uint unaff_DI;
  
  lVar2 = (ulong)(uint)(in_BL | 0x80) * (ulong)unaff_DI +
          ((ulong)unaff_SI * (ulong)unaff_DI >> 0x10);
  lVar1 = (ulong)(uint)(in_CL | 0x80) * (ulong)unaff_SI;
  return (uint)(in_BL | 0x80) * (uint)(in_CL | 0x80) +
         (int)((ulong)lVar2 >> 0x10) + (int)((ulong)lVar1 >> 0x10) +
         (uint)CARRY2((uint)lVar2,(uint)lVar1);
}



void __cdecl16near FUN_1016_38ef(void)

{
  int unaff_SI;
  int unaff_DI;
  undefined2 unaff_DS;
  
  *(uint *)0x81a = (uint)(*(byte *)(unaff_SI + 6) | 0x80);
  *(uint *)0x81c = (uint)(*(byte *)(unaff_DI + 6) | 0x80);
  return;
}



void FUN_13f9_0000(undefined2 param_1)

{
  undefined2 *puVar1;
  undefined2 *puVar2;
  int iVar3;
  undefined2 *puVar4;
  undefined2 *puVar5;
  
  puVar4 = (undefined2 *)0x0;
  puVar5 = (undefined2 *)0x0;
  for (iVar3 = 0x58; iVar3 != 0; iVar3 = iVar3 + -1) {
    puVar2 = puVar5;
    puVar5 = puVar5 + 1;
    puVar1 = puVar4;
    puVar4 = puVar4 + 1;
    *puVar2 = *puVar1;
  }
  FUN_1016_17e0(param_1);
  return;
}


