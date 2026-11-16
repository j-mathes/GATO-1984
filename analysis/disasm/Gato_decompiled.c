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



undefined DAT_1000_934e;
undefined DAT_1000_934c;
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
undefined2 UNK_1000_9342;
undefined2 UNK_1000_9344;
undefined2 UNK_1000_9346;
undefined2 UNK_1000_9348;
undefined2 UNK_1000_934a;
byte UNK_1000_b07c;
char UNK_1000_b852;
byte UNK_1000_b919;
int UNK_0000_0410;
undefined1 UNK_0000_0501;
int UNK_0000_051e;
undefined2 UNK_0000_007c;
undefined2 UNK_0000_007e;
int DAT_1000_0004;

// WARNING: Instruction at (ram,0x00010a88) overlaps instruction at (ram,0x00010a86)
// 
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used
// WARNING: This function may have set the stack pointer
// WARNING: Removing unreachable block (ram,0x00010aad)
// WARNING: Globals starting with '_' overlap smaller symbols at the same address

void __cdecl16near entry(void)

{
  byte *pbVar1;
  uint *puVar2;
  int iVar3;
  code *pcVar4;
  code *pcVar5;
  undefined2 uVar6;
  uint uVar7;
  byte bVar8;
  int iVar9;
  undefined2 uVar10;
  undefined2 uVar11;
  byte bVar12;
  int iVar13;
  undefined2 uVar14;
  int iVar15;
  char *pcVar16;
  int *piVar17;
  undefined1 *puVar18;
  undefined1 *puVar19;
  int *piVar20;
  int *piVar21;
  undefined1 *puVar22;
  undefined2 *puVar23;
  undefined2 *puVar24;
  undefined2 unaff_BP;
  undefined2 *puVar25;
  undefined1 *puVar26;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined2 in_FS;
  undefined1 uVar27;
  undefined1 uVar28;
  undefined1 uVar29;
  
  _DAT_1000_934e = 0x1000;
  _DAT_1000_934c = 0x1f;
  FUN_1586_0000(uRam000001fe);
  _DAT_1000_934c = 0x1586;
  uRam0001934a = 0x2b;
  _DAT_1000_934e = unaff_BP;
  FUN_10a1_169a((undefined1)uRam000001fe);
  _DAT_1000_934c = 0x10a1;
  uRam0001934a = 0x32;
  FUN_10a1_08ec();
  uRam0001934a = 0x10a1;
  uRam00019348 = 0x39;
  FUN_10a1_0efd();
  *(byte *)0x410 = *(byte *)0x410 & 0xcf | 0x10;
  uRam0001934a = 0x10a1;
  uRam00019348 = 100;
  FUN_10a1_0a41();
  uRam0001934a = 0x10a1;
  uRam00019348 = 0x6b;
  FUN_10a1_0a41();
  uRam0001934a = 0x10a1;
  uRam00019348 = 0x70;
  FUN_10a1_0a41();
  uRam0001934a = 0x10a1;
  uRam00019348 = 0x75;
  FUN_10a1_0a5b();
  uRam0001934a = 0x10a1;
  uRam00019348 = 0x7c;
  FUN_10a1_0a5b();
  uRam0001934a = 0x10a1;
  uRam00019348 = 0x84;
  FUN_10a1_2621();
  uRam0001934a = 0x10a1;
  uRam00019348 = 0x89;
  FUN_10a1_0bdc();
  uRam00019348 = 0x10a1;
  uRam00019346 = 0x8e;
  FUN_10a1_0bdc();
  uRam00019346 = 0x10a1;
  uRam00019344 = 0x96;
  FUN_10a1_0bce();
  uRam00019346 = 0x10a1;
  uRam00019344 = 0x9e;
  FUN_10a1_0bce();
  uRam00019346 = 0x10a1;
  uRam00019344 = 0xa6;
  FUN_10a1_0be8();
  uRam00019346 = 0x10a1;
  uRam00019344 = 0xab;
  FUN_10a1_078b();
  uRam00019346 = 0x10a1;
  uRam00019344 = 0xb3;
  FUN_10a1_0a41();
  uRam00019346 = 0x10a1;
  uRam00019344 = 0xbc;
  FUN_10a1_0a5b();
  uRam00019346 = 0x10a1;
  uRam00019344 = 0xc6;
  FUN_10a1_18f5();
  uVar27 = 0;
  uVar29 = 1;
  uRam00019346 = 0x10a1;
  uRam00019344 = 0xd3;
  FUN_10a1_193d();
  uRam00019344 = 0x10a1;
  uRam00019342 = 0xdd;
  FUN_10a1_18f5();
  uRam00019344 = 0x10a1;
  uRam00019342 = 0xeb;
  FUN_10a1_1904();
  uRam00019344 = 0x10a1;
  uRam00019342 = 0xf5;
  FUN_10a1_18f5();
  uRam00019344 = 0x10a1;
  uRam00019342 = 0x100;
  FUN_10a1_1904();
  uRam00019344 = 0x10a1;
  uRam00019342 = 0x108;
  FUN_10a1_16ce();
  puVar18 = (undefined1 *)0x1f6;
  while( true ) {
    *(undefined2 *)(puVar18 + -2) = 0x10a1;
    *(undefined2 *)(puVar18 + -4) = 0x1f7;
    FUN_10a1_16b4();
    *(undefined2 *)(puVar18 + -2) = 0x10a1;
    puVar19 = puVar18 + -4;
    *(undefined2 *)(puVar18 + -4) = 0x201;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    *(undefined2 *)(puVar18 + -2) = 0x10a1;
    *(undefined2 *)(puVar18 + -4) = 0x118;
    FUN_10a1_1983();
    *(undefined2 *)(puVar18 + -4) = 0x10a1;
    *(undefined2 *)(puVar18 + -6) = 0x120;
    thunk_FUN_10a1_162c();
    *(undefined2 *)(puVar18 + -4) = 0x10a1;
    *(undefined2 *)(puVar18 + -6) = 0x128;
    FUN_10a1_1bdd();
    *(undefined2 *)(puVar18 + -4) = 0x10a1;
    *(undefined2 *)(puVar18 + -6) = 0x131;
    FUN_10a1_1bdd();
    *(undefined2 *)(puVar18 + -4) = 0x10a1;
    *(undefined2 *)(puVar18 + -6) = 0x136;
    FUN_10a1_1ee4();
    *(undefined2 *)(puVar18 + -4) = 0x10a1;
    *(undefined2 *)(puVar18 + -6) = 0x13e;
    thunk_FUN_10a1_162c();
    *(undefined2 *)(puVar18 + -4) = 0x10a1;
    *(undefined2 *)(puVar18 + -6) = 0x146;
    FUN_10a1_1bdd();
    *(undefined2 *)(puVar18 + -4) = 0x10a1;
    *(undefined2 *)(puVar18 + -6) = 0x14f;
    FUN_10a1_1bdd();
    *(undefined2 *)(puVar18 + -4) = 0x10a1;
    *(undefined2 *)(puVar18 + -6) = 0x154;
    FUN_10a1_1ee4();
    uVar27 = 0;
    uVar29 = 1;
    *(undefined2 *)(puVar18 + -4) = 0x10a1;
    *(undefined2 *)(puVar18 + -6) = 0x161;
    FUN_10a1_1983();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x169;
    thunk_FUN_10a1_162c();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x171;
    FUN_10a1_1bdd();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x17a;
    FUN_10a1_1bdd();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x17f;
    FUN_10a1_1ee4();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x187;
    thunk_FUN_10a1_162c();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 399;
    FUN_10a1_1bdd();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x198;
    FUN_10a1_1bdd();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x19d;
    FUN_10a1_1ee4();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x1a5;
    FUN_10a1_0bce();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x1ad;
    FUN_10a1_0be8();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x1b2;
    FUN_10a1_2637();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x1ba;
    FUN_10a1_22d7();
    *(undefined2 *)(puVar18 + -6) = 0x10a1;
    *(undefined2 *)(puVar18 + -8) = 0x1c2;
    FUN_10a1_16ce();
    while( true ) {
      *(undefined2 *)(puVar19 + -2) = 0x10a1;
      *(undefined2 *)(puVar19 + -4) = 0x1d8;
      FUN_10a1_16b4();
      *(undefined2 *)(puVar19 + -2) = 0x10a1;
      *(undefined2 *)(puVar19 + -4) = 0x1e2;
      FUN_10a1_146c();
      if (!(bool)uVar27 && !(bool)uVar29) break;
      *(undefined2 *)(puVar19 + -2) = 0x10a1;
      *(undefined2 *)(puVar19 + -4) = 0x1d0;
      FUN_10a1_1210();
      puVar19 = puVar19 + -2;
    }
    *(undefined2 *)(puVar19 + -2) = 0x10a1;
    *(undefined2 *)(puVar19 + -4) = 0x1ef;
    FUN_10a1_1210();
    puVar18 = puVar19 + -2;
  }
  uVar27 = 0;
  uVar29 = 1;
  *(undefined2 *)(puVar18 + -2) = 0x10a1;
  *(undefined2 *)(puVar18 + -4) = 0x213;
  FUN_10a1_1983();
  *(undefined2 *)(puVar18 + -4) = 0x10a1;
  *(undefined2 *)(puVar18 + -6) = 0x21b;
  FUN_10a1_1ee4();
  *(undefined2 *)(puVar18 + -4) = 0x10a1;
  *(undefined2 *)(puVar18 + -6) = 0x223;
  FUN_10a1_16ce();
  puVar26 = puVar18 + -2;
  while( true ) {
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x259;
    FUN_10a1_16b4();
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x263;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x231;
    FUN_10a1_18f5();
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x23b;
    FUN_10a1_2435();
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x248;
    FUN_10a1_193d();
    *(undefined2 *)(puVar26 + -4) = 0x10a1;
    *(undefined2 *)(puVar26 + -6) = 0x251;
    FUN_10a1_1210();
    puVar26 = puVar26 + -4;
  }
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x273;
  FUN_10a1_1983();
  *(undefined2 *)(puVar26 + -4) = 0x10a1;
  *(undefined2 *)(puVar26 + -6) = 0x27b;
  FUN_10a1_16ce();
  piVar20 = (int *)(puVar26 + -2);
  while( true ) {
    *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -4) = 0x2e3;
    FUN_10a1_16b4();
    *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -4) = 0x2ed;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -4) = 0x289;
    FUN_10a1_18f5();
    *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -4) = 0x294;
    FUN_10a1_11fb();
    *(undefined2 *)((int)piVar20 + -4) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -6) = 0x299;
    FUN_10a1_2480();
    *(undefined2 *)((int)piVar20 + -4) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -6) = 0x2a6;
    FUN_10a1_18fb();
    *(undefined2 *)((int)piVar20 + -4) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -6) = 0x2b1;
    FUN_10a1_18f5();
    *(undefined2 *)((int)piVar20 + -4) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -6) = 700;
    FUN_10a1_1210();
    *(undefined2 *)((int)piVar20 + -6) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -8) = 0x2c3;
    FUN_10a1_2480();
    *(undefined2 *)((int)piVar20 + -6) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -8) = 0x2d2;
    FUN_10a1_18fb();
    *(undefined2 *)((int)piVar20 + -6) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -8) = 0x2db;
    FUN_10a1_1210();
    piVar20 = (int *)((int)piVar20 + -6);
  }
  *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar20 + -4) = 0x2f7;
  FUN_10a1_16ce();
  while( true ) {
    *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -4) = 0x30d;
    FUN_10a1_16b4();
    *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -4) = 0x317;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar20 + -4) = 0x305;
    FUN_10a1_1210();
    piVar20 = (int *)((int)piVar20 + -2);
  }
  *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar20 + -4) = 0x324;
  FUN_10a1_18f5();
  *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar20 + -4) = 0x332;
  FUN_10a1_1904();
  *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar20 + -4) = 0x33a;
  FUN_10a1_0bce();
  *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar20 + -4) = 0x342;
  FUN_10a1_0be8();
  *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar20 + -4) = 0x347;
  FUN_10a1_2637();
  *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar20 + -4) = 0x34f;
  FUN_10a1_22c3();
  *(undefined2 *)((int)piVar20 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar20 + -4) = 0x357;
  FUN_10a1_16ce();
  while( true ) {
    piVar20[-1] = 0x10a1;
    piVar20[-2] = 0x36d;
    FUN_10a1_16b4();
    piVar20[-1] = 0x10a1;
    piVar20[-2] = 0x377;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    piVar20[-1] = 0x10a1;
    piVar20[-2] = 0x365;
    FUN_10a1_1210();
    piVar20 = piVar20 + -1;
  }
  piVar20[-1] = 0x10a1;
  piVar20[-2] = 0x37e;
  FUN_10a1_078b();
  piVar20[-1] = 0x10a1;
  piVar20[-2] = 0x386;
  FUN_10a1_0a5b();
  piVar20[-1] = 0x10a1;
  piVar20[-2] = 0x38e;
  FUN_10a1_0822();
  piVar20[-1] = 0x10a1;
  piVar20[-2] = 0x39b;
  FUN_10a1_1983();
  piVar20[-2] = 0x10a1;
  piVar20[-3] = 0x3a3;
  FUN_10a1_1ee4();
  piVar20[-2] = 0x10a1;
  piVar20[-3] = 0x3b3;
  FUN_10a1_1d5c(piVar20[-2],piVar20[-1],*piVar20);
  piVar20[-3] = 0x10a1;
  piVar20[-4] = 0x3c0;
  FUN_10a1_1983();
  piVar20[-4] = 0x10a1;
  piVar20[-5] = 0x3c8;
  FUN_10a1_1ee4();
  piVar20[-4] = 0x10a1;
  piVar20[-5] = 0x3d8;
  FUN_10a1_1d5c(piVar20[-4],piVar20[-3],piVar20[-2]);
  piVar20[-5] = 0x10a1;
  piVar20[-6] = 0x3e5;
  FUN_10a1_1983();
  piVar20[-6] = 0x10a1;
  piVar20[-7] = 0x3ed;
  FUN_10a1_1ee4();
  piVar20[-6] = 0x10a1;
  piVar20[-7] = 0x3fd;
  FUN_10a1_1d5c(piVar20[-6],piVar20[-5],piVar20[-4]);
  uVar27 = 0;
  uVar29 = 1;
  piVar20[-7] = 0x10a1;
  piVar20[-8] = 0x40a;
  FUN_10a1_1983();
  piVar20[-8] = 0x10a1;
  piVar20[-9] = 0x412;
  FUN_10a1_1ee4();
  piVar20[-8] = 0x10a1;
  piVar20[-9] = 0x422;
  FUN_10a1_1d5c(piVar20[-8],piVar20[-7],piVar20[-6]);
  piVar20[-9] = 0x10a1;
  piVar20[-10] = 0x42a;
  FUN_10a1_0bce();
  piVar20[-9] = 0x10a1;
  piVar20[-10] = 0x432;
  FUN_10a1_0be8();
  piVar20[-9] = 0x10a1;
  piVar20[-10] = 0x437;
  FUN_10a1_2637();
  piVar20[-9] = 0x10a1;
  piVar20[-10] = 0x43f;
  FUN_10a1_22d7();
  piVar20[-9] = 0x10a1;
  piVar20[-10] = 0x44a;
  FUN_10a1_16b7();
  piVar20[-9] = 0x10a1;
  piVar20[-10] = 0x452;
  FUN_10a1_16ce();
  piVar21 = piVar20 + -8;
  do {
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x487;
    FUN_10a1_16b4();
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x48f;
    FUN_10a1_19fc();
    if ((bool)uVar27) {
      *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
      *(undefined2 *)((int)piVar21 + -4) = 0x49e;
      FUN_10a1_146c();
      uVar28 = 1;
      if ((bool)uVar27) break;
    }
    else {
      *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
      *(undefined2 *)((int)piVar21 + -4) = 0x4ae;
      FUN_10a1_146c();
      uVar28 = uVar27;
      if (!(bool)uVar27 && !(bool)uVar29) break;
    }
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x45f;
    FUN_10a1_2435();
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x46a;
    FUN_10a1_18f5();
    uVar27 = 0;
    uVar29 = 1;
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x476;
    FUN_10a1_18fb();
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x47f;
    FUN_10a1_1210();
    piVar21 = (int *)((int)piVar21 + -2);
  } while( true );
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x4b8;
  FUN_10a1_16ce();
  while( true ) {
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x4ed;
    FUN_10a1_16b4();
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x4f7;
    FUN_10a1_146c();
    if (!(bool)uVar28 && !(bool)uVar29) break;
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x4c5;
    FUN_10a1_2435();
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x4d0;
    FUN_10a1_18f5();
    uVar28 = 0;
    uVar29 = 1;
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x4dc;
    FUN_10a1_18fb();
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x4e5;
    FUN_10a1_1210();
    piVar21 = (int *)((int)piVar21 + -2);
  }
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x501;
  FUN_10a1_16ce();
  while( true ) {
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x517;
    FUN_10a1_16b4();
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x521;
    FUN_10a1_146c();
    if (!(bool)uVar28 && !(bool)uVar29) break;
    *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
    *(undefined2 *)((int)piVar21 + -4) = 0x50f;
    FUN_10a1_1210();
    piVar21 = (int *)((int)piVar21 + -2);
  }
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x52b;
  FUN_10a1_0bce();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x533;
  FUN_10a1_0be8();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x538;
  FUN_10a1_2637();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x540;
  FUN_10a1_22d7();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x548;
  FUN_10a1_0bce();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x550;
  FUN_10a1_0be8();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x555;
  FUN_10a1_2637();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x55d;
  FUN_10a1_22d7();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x565;
  FUN_10a1_0bce();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x56d;
  FUN_10a1_0be8();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x572;
  FUN_10a1_2637();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x57a;
  FUN_10a1_22d7();
  *(undefined2 *)((int)piVar21 + -2) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -4) = 0x58b;
  FUN_10a1_2086();
  *(undefined2 *)((int)piVar21 + -4) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -6) = 0x593;
  FUN_10a1_0bce();
  *(undefined2 *)((int)piVar21 + -4) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -6) = 0x59b;
  FUN_10a1_0be8();
  *(undefined2 *)((int)piVar21 + -4) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -6) = 0x5a0;
  FUN_10a1_2637();
  *(undefined2 *)((int)piVar21 + -4) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -6) = 0x5a8;
  FUN_10a1_22d7();
  *(undefined2 *)((int)piVar21 + -4) = 0x10a1;
  *(undefined2 *)((int)piVar21 + -6) = 0x5b0;
  FUN_10a1_16ce();
  puVar22 = (undefined1 *)((int)piVar21 + -2);
  while( true ) {
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x5c6;
    FUN_10a1_16b4();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x5d0;
    FUN_10a1_146c();
    if (!(bool)uVar28 && !(bool)uVar29) break;
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x5be;
    FUN_10a1_1210();
    puVar22 = puVar22 + -2;
  }
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x5da;
  FUN_10a1_16ce();
  while( true ) {
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x60f;
    FUN_10a1_16b4();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x619;
    FUN_10a1_146c();
    if (!(bool)uVar28 && !(bool)uVar29) break;
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x5e7;
    FUN_10a1_2435();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x5f2;
    FUN_10a1_18f5();
    uVar28 = 0;
    uVar29 = 1;
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x5fe;
    FUN_10a1_18fb();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x607;
    FUN_10a1_1210();
    puVar22 = puVar22 + -2;
  }
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x626;
  FUN_10a1_16b7();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x62e;
  FUN_10a1_16ce();
  do {
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x663;
    FUN_10a1_16b4();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x66b;
    FUN_10a1_19fc();
    if ((bool)uVar28) {
      *(undefined2 *)(puVar22 + -2) = 0x10a1;
      *(undefined2 *)(puVar22 + -4) = 0x67a;
      FUN_10a1_146c();
      uVar27 = 1;
      if ((bool)uVar28) break;
    }
    else {
      *(undefined2 *)(puVar22 + -2) = 0x10a1;
      *(undefined2 *)(puVar22 + -4) = 0x68a;
      FUN_10a1_146c();
      uVar27 = uVar28;
      if (!(bool)uVar28 && !(bool)uVar29) break;
    }
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x63b;
    FUN_10a1_2435();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x646;
    FUN_10a1_18f5();
    uVar28 = 0;
    uVar29 = 1;
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x652;
    FUN_10a1_18fb();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x65b;
    FUN_10a1_1210();
    puVar22 = puVar22 + -2;
  } while( true );
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x694;
  FUN_10a1_16ce();
  while( true ) {
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x6c9;
    FUN_10a1_16b4();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x6d3;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x6a1;
    FUN_10a1_2435();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x6ac;
    FUN_10a1_18f5();
    uVar27 = 0;
    uVar29 = 1;
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x6b8;
    FUN_10a1_18fb();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x6c1;
    FUN_10a1_1210();
    puVar22 = puVar22 + -2;
  }
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x6dd;
  FUN_10a1_0822();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x6e5;
  FUN_10a1_0bce();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x6ed;
  FUN_10a1_0be8();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x6f2;
  FUN_10a1_2637();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x6fa;
  FUN_10a1_22d7();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x702;
  FUN_10a1_0bce();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x70a;
  FUN_10a1_0be8();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x712;
  FUN_10a1_16ce();
  while( true ) {
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x735;
    FUN_10a1_16b4();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x73f;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x71a;
    FUN_10a1_2637();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x722;
    FUN_10a1_22d7();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x72d;
    FUN_10a1_1210();
    puVar22 = puVar22 + -2;
  }
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x749;
  FUN_10a1_16ce();
  while( true ) {
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x75f;
    FUN_10a1_16b4();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x769;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x757;
    FUN_10a1_1210();
    puVar22 = puVar22 + -2;
  }
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x773;
  FUN_10a1_16ce();
  while( true ) {
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x796;
    FUN_10a1_16b4();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x7a0;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x77b;
    FUN_10a1_2637();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x783;
    FUN_10a1_22d7();
    *(undefined2 *)(puVar22 + -2) = 0x10a1;
    *(undefined2 *)(puVar22 + -4) = 0x78e;
    FUN_10a1_1210();
    puVar22 = puVar22 + -2;
  }
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x7aa;
  FUN_10a1_0808();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x7af;
  FUN_10a1_0822();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x7b8;
  FUN_10a1_18f5();
  *(undefined2 *)(puVar22 + -2) = 0x10a1;
  *(undefined2 *)(puVar22 + -4) = 0x7c6;
  FUN_10a1_193d();
  uVar27 = 0;
  uVar29 = 1;
  *(undefined2 *)(puVar22 + -4) = 0x10a1;
  *(undefined2 *)(puVar22 + -6) = 0x7d3;
  FUN_10a1_1983();
  *(undefined2 *)(puVar22 + -6) = 0x10a1;
  *(undefined2 *)(puVar22 + -8) = 0x7db;
  FUN_10a1_1ee4();
  *(undefined2 *)(puVar22 + -6) = 0x10a1;
  *(undefined2 *)(puVar22 + -8) = 0x7e9;
  FUN_10a1_1983();
  *(undefined2 *)(puVar22 + -8) = 0x10a1;
  *(undefined2 *)(puVar22 + -10) = 0x7f1;
  FUN_10a1_1ee4();
  *(undefined2 *)(puVar22 + -8) = 0x10a1;
  *(undefined2 *)(puVar22 + -10) = 0x7f9;
  FUN_10a1_1ee4();
  *(undefined2 *)(puVar22 + -8) = 0x10a1;
  *(undefined2 *)(puVar22 + -10) = 0x804;
  FUN_10a1_18f5();
  iVar13 = 0x82;
  iVar9 = 3;
  *(undefined2 *)(puVar22 + -8) = 0x10a1;
  *(undefined2 *)(puVar22 + -10) = 0x812;
  FUN_10a1_18fb();
  *(undefined2 *)(puVar22 + -8) = 0x10a1;
  *(undefined2 *)(puVar22 + -10) = 0x81a;
  FUN_10a1_16ce();
  puVar26 = puVar22 + -6;
  while( true ) {
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x84d;
    FUN_10a1_16b4();
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x857;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x825;
    FUN_10a1_2435();
    uVar27 = 0xff9f < (uint)(iVar13 / 0x50);
    uVar29 = iVar13 / 0x50 == 0xffa0;
    iVar9 = 3;
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x83a;
    FUN_10a1_1983();
    *(undefined2 *)(puVar26 + -4) = 0x10a1;
    *(undefined2 *)(puVar26 + -6) = 0x845;
    FUN_10a1_1210();
    puVar26 = puVar26 + -4;
  }
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x861;
  FUN_10a1_0bce();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x869;
  FUN_10a1_0be8();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x86e;
  FUN_10a1_2637();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x876;
  FUN_10a1_22d7();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x87e;
  FUN_10a1_0bce();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x886;
  FUN_10a1_0be8();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x88b;
  FUN_10a1_2637();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x893;
  FUN_10a1_22d7();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x89b;
  FUN_10a1_0bce();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8a3;
  FUN_10a1_0be8();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8a8;
  FUN_10a1_2637();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8b0;
  FUN_10a1_22d7();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8b8;
  FUN_10a1_0bce();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8c0;
  FUN_10a1_0be8();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8c5;
  FUN_10a1_2637();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8cd;
  FUN_10a1_22d7();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8d5;
  FUN_10a1_0bce();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8dd;
  FUN_10a1_0be8();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8e2;
  FUN_10a1_2637();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8ea;
  FUN_10a1_22d7();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8f2;
  FUN_10a1_0bce();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8fa;
  FUN_10a1_0be8();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x8ff;
  FUN_10a1_2637();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x907;
  FUN_10a1_22d7();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x90f;
  FUN_10a1_0bce();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x917;
  FUN_10a1_0be8();
  uVar14 = 0xd5e;
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x91f;
  FUN_10a1_1b5b();
  bVar12 = (char)uVar14 + cRam0001b852;
  bRam0001b919 = bRam0001b919 | bVar12;
  bRam0001b07c = bRam0001b07c | bVar12;
  pbVar1 = (byte *)(CONCAT11((char)((uint)uVar14 >> 8),bVar12) + 0x8c2);
  uVar27 = 0;
  *pbVar1 = *pbVar1 | (byte)*(undefined2 *)0x7410;
  uVar29 = *pbVar1 == 0;
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x947;
  FUN_10a1_1757();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x952;
  FUN_10a1_146c();
  if ((bool)uVar29) {
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x95f;
    FUN_10a1_1757();
  }
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x96a;
  FUN_10a1_146c();
  if ((bool)uVar29) {
    *(undefined2 *)(puVar26 + -2) = 0x10a1;
    *(undefined2 *)(puVar26 + -4) = 0x974;
    FUN_10a1_111b();
  }
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x97c;
  FUN_10a1_1757();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x984;
  FUN_10a1_1ee4();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x98c;
  FUN_10a1_1ee4();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x994;
  thunk_FUN_10a1_162c();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x99c;
  FUN_10a1_1bdd();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x9a5;
  FUN_10a1_1bdd();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x9aa;
  FUN_10a1_1ee4();
  iVar13 = 0x1e;
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x9b5;
  FUN_10a1_18f5();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x9bd;
  FUN_10a1_2435();
  iVar15 = 0x78;
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x9ca;
  FUN_10a1_18fb();
  *(undefined2 *)(puVar26 + -2) = 0x10a1;
  *(undefined2 *)(puVar26 + -4) = 0x9d2;
  FUN_10a1_16ce();
  puVar24 = (undefined2 *)puVar26;
  while( true ) {
    puVar24[-1] = 0x10a1;
    puVar24[-2] = 0xa04;
    FUN_10a1_16b4();
    puVar24[-1] = 0x10a1;
    puVar24[-2] = 0xa0e;
    FUN_10a1_146c();
    if (!(bool)uVar27 && !(bool)uVar29) break;
    puVar24[-1] = 0x10a1;
    puVar24[-2] = 0x9dd;
    iVar13 = iVar15;
    FUN_10a1_2435();
    puVar24[-1] = 0x10a1;
    puVar24[-2] = 0x9e7;
    iVar15 = iVar13;
    FUN_10a1_2435();
    puVar24[-1] = 0x10a1;
    puVar24[-2] = 0x9f1;
    FUN_10a1_1983();
    puVar24[-2] = 0x10a1;
    puVar24[-3] = 0x9fc;
    FUN_10a1_1210();
    puVar24 = puVar24 + -2;
  }
  puVar24[-1] = 0x10a1;
  puVar24[-2] = 0xa15;
  uVar14 = FUN_10a1_1112();
  pbVar1 = (byte *)0x92b;
  bVar12 = *pbVar1;
  bVar8 = (byte)iVar13;
  *pbVar1 = *pbVar1 + bVar8;
  puVar2 = (uint *)0x116e;
  iVar3 = ((uint)puVar24 & 3) - (*puVar2 & 3);
  *puVar2 = *puVar2 + (uint)(0 < iVar3) * iVar3;
  if (!CARRY1(bVar12,bVar8)) {
    *(char *)(iVar9 + 0xb4b) = *(char *)(iVar9 + 0xb4b) + (char)((uint)uVar14 >> 8);
    goto code_r0x00010a86;
  }
  pbVar1 = (byte *)0x1161;
  *pbVar1 = *pbVar1 & bVar8;
  bVar12 = *pbVar1;
  if (*pbVar1 == 0) {
    *(undefined2 *)(iVar15 + 0x8c2) = unaff_ES;
    if (-1 < (char)bVar12) {
      puVar24[-1] = 0xa91;
      uVar7 = FUN_10a1_0031();
      puVar24[-1] = CONCAT11((char)(uVar7 >> 8),*(undefined1 *)(ulong)((uVar7 & 0xff) + 0x47));
      puVar24[-2] = 0xa9b;
      FUN_10a1_0031();
      bVar12 = (byte)puVar24[-1];
      *(byte *)0x50 = bVar12;
      *(byte *)0x4f = bVar12;
      uVar27 = 0x28;
      if ((1 < bVar12) && (uVar27 = 0x50, bVar12 == 7)) {
        uVar27 = 0x50;
        *(undefined2 *)0x56 = 0xc0b;
      }
      *(undefined1 *)0x5ce = uVar27;
      puVar24[-1] = 0xabc;
      FUN_10a1_041a();
      puVar24[-1] = unaff_ES;
      uRam00000510 = unaff_ES;
      *(undefined2 *)0x5ae = uRam00000000;
      *(undefined2 *)0x5b0 = uRam00000002;
      *(undefined2 *)0x5b2 = uRam00000010;
      *(undefined2 *)0x5b4 = uRam00000012;
      uRam00000000 = 0xfd3;
      uRam00000002 = 0x10a1;
      uRam00000010 = 0xfdb;
      uRam00000012 = 0x10a1;
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
      uRam00000090 = 0x356;
      uRam00000092 = 0x10a1;
      uRam0000006c = 0x24d;
      uRam0000006e = 0x10a1;
      uRam00000070 = 0x32f;
      uRam00000072 = 0x10a1;
      uRam000003c0 = uRam00000020;
      uRam000003c2 = uRam00000022;
      uVar14 = puVar24[-1];
      piVar17 = (int *)0x5b6;
      *(undefined2 *)0x45 = 0x5b6;
      *(undefined2 *)0x5ba = 4;
      iVar9 = 0x5c2;
      *(undefined2 *)0x5b8 = 0x5c2;
      puVar24[-1] = 0xb74;
      FUN_10a1_077f();
      *piVar17 = iVar9 + 4;
      puVar24[-1] = 0x10a1;
      puVar24[-2] = 0xb7e;
      FUN_10a1_078b();
      return;
    }
    if ((char)(bVar8 + (char)((uint)iVar13 >> 8)) < '\0') {
      puVar24[-1] = 0x10a1;
      puVar24[-2] = 0xa58;
      FUN_10a1_02dc();
      uVar14 = ((undefined2 *)0x6)[1];
      pcVar4 = (code *)*(undefined2 *)0x6;
      puVar24[-1] = 0x10a1;
      puVar23 = puVar24 + -2;
      puVar24[-2] = 0xa5c;
      (*pcVar4)();
      *(undefined2 *)((int)puVar23 + -2) = 0xa5f;
      FUN_10a1_07d7();
      goto code_r0x00010a5f;
    }
  }
  else {
    puVar26 = (undefined1 *)*puVar24;
    puVar25 = (undefined2 *)puVar24[1];
    iVar9 = puVar24[2];
    pcVar16 = (char *)puVar24[4];
    uVar11 = puVar24[5];
    uVar10 = puVar24[6];
    uVar6 = puVar24[7];
    puVar23 = puVar24 + 8;
    uVar27 = in(uVar11);
    *puVar26 = uVar27;
    pbVar1 = puVar26 + 1;
    bVar12 = (byte)((uint)uVar10 >> 8);
    *pbVar1 = *pbVar1 & bVar12;
    (pcVar16 + (int)puVar25)[0x72] = (pcVar16 + (int)puVar25)[0x72] & (byte)uVar11;
    out(*puVar25,uVar11);
    uVar14 = in(uVar11);
    *(undefined2 *)(puVar26 + 1) = uVar14;
    pbVar1 = (byte *)(pcVar16 + (int)(puVar25 + 1) + 0x72);
    *pbVar1 = *pbVar1 & (byte)uVar11;
    out(puVar25[1],uVar11);
    if ((char)*pbVar1 < '\0') {
      out(puVar25[2],uVar11);
      (pcVar16 + (int)(puVar26 + 3))[0x42] = (pcVar16 + (int)(puVar26 + 3))[0x42] & (byte)uVar10;
      puVar24[7] = iVar9 + -1;
      puVar24[6] = puVar25 + 3;
      puVar24[5] = puVar26 + 3;
      pcVar5 = (code *)swi(0x10);
      (*pcVar5)();
      return;
    }
    *pcVar16 = (char)uVar6 + bVar12;
code_r0x00010a5f:
    uVar14 = 0;
    puVar24 = puVar23;
  }
  uVar27 = (undefined1)uVar14;
  *(undefined1 *)0xa = uVar27;
  *(undefined1 *)0xb = uVar27;
  *(undefined1 *)0x40 = uVar27;
  *(undefined1 *)0x88 = uVar27;
  *(undefined1 *)0x89 = uVar27;
  *(undefined1 *)0x8a = uVar27;
  *(undefined1 *)0x8e = uVar27;
  *(undefined1 *)0x8f = 3;
  *(undefined2 *)((int)puVar24 + -2) = 0xa7e;
  FUN_10a1_28e4();
  *(undefined1 *)0x8d = 4;
  *(undefined1 *)0x8b = 4;
code_r0x00010a86:
  *(undefined1 *)0x8c = 0x78;
  return;
}



// WARNING: Instruction at (ram,0x00010a88) overlaps instruction at (ram,0x00010a86)
// 
// WARNING: Removing unreachable block (ram,0x00010aad)

void __cdecl16near FUN_1000_0300(void)

{
  char *pcVar1;
  byte *pbVar2;
  uint *puVar3;
  int iVar4;
  code *pcVar5;
  byte bVar6;
  byte bVar7;
  int iVar8;
  undefined2 uVar9;
  int iVar10;
  int *piVar11;
  int unaff_BP;
  undefined2 unaff_ES;
  int iVar12;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 in_FS;
  undefined1 in_CF;
  undefined1 uVar13;
  undefined1 uVar14;
  undefined1 in_ZF;
  undefined1 uVar15;
  char *pcVar16;
  char cVar17;
  uint uVar18;
  int iVar19;
  uint uVar20;
  
  iVar12 = 0x1000;
  do {
    FUN_10a1_1210();
    iVar19 = iVar12;
    FUN_10a1_16b4();
    iVar12 = 0x10a1;
    FUN_10a1_146c();
  } while ((bool)in_CF || (bool)in_ZF);
  FUN_10a1_18f5();
  FUN_10a1_1904();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22c3();
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    if (!(bool)in_CF && !(bool)in_ZF) break;
    FUN_10a1_1210();
  }
  FUN_10a1_078b();
  FUN_10a1_0a5b();
  FUN_10a1_0822();
  uVar20 = 0x10a1;
  FUN_10a1_1983();
  FUN_10a1_1ee4();
  iVar12 = 0x10a1;
  FUN_10a1_1d5c(0x10a1,uVar20,iVar19);
  uVar20 = 0x10a1;
  FUN_10a1_1983();
  FUN_10a1_1ee4();
  iVar19 = 0x10a1;
  FUN_10a1_1d5c(0x10a1,uVar20,iVar12);
  uVar18 = 0x10a1;
  FUN_10a1_1983();
  FUN_10a1_1ee4();
  iVar12 = 0x10a1;
  FUN_10a1_1d5c(0x10a1,uVar18,iVar19);
  uVar13 = 0;
  uVar15 = 1;
  uVar20 = 0x10a1;
  FUN_10a1_1983();
  FUN_10a1_1ee4();
  pcVar16 = (char *)0x10a1;
  FUN_10a1_1d5c(0x10a1,uVar20,iVar12);
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_16b7();
  FUN_10a1_16ce();
  do {
    FUN_10a1_16b4();
    FUN_10a1_19fc();
    if ((bool)uVar13) {
      FUN_10a1_146c();
      uVar14 = 1;
      if ((bool)uVar13) break;
    }
    else {
      FUN_10a1_146c();
      uVar14 = uVar13;
      if (!(bool)uVar13 && !(bool)uVar15) break;
    }
    FUN_10a1_2435();
    FUN_10a1_18f5();
    uVar13 = 0;
    uVar15 = 1;
    FUN_10a1_18fb();
    FUN_10a1_1210();
  } while( true );
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    if (!(bool)uVar14 && !(bool)uVar15) break;
    FUN_10a1_2435();
    FUN_10a1_18f5();
    uVar14 = 0;
    uVar15 = 1;
    FUN_10a1_18fb();
    FUN_10a1_1210();
  }
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    if (!(bool)uVar14 && !(bool)uVar15) break;
    FUN_10a1_1210();
  }
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_2086();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    if (!(bool)uVar14 && !(bool)uVar15) break;
    FUN_10a1_1210();
  }
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    if (!(bool)uVar14 && !(bool)uVar15) break;
    FUN_10a1_2435();
    FUN_10a1_18f5();
    uVar14 = 0;
    uVar15 = 1;
    FUN_10a1_18fb();
    FUN_10a1_1210();
  }
  FUN_10a1_16b7();
  FUN_10a1_16ce();
  do {
    FUN_10a1_16b4();
    FUN_10a1_19fc();
    if ((bool)uVar14) {
      FUN_10a1_146c();
      uVar13 = 1;
      if ((bool)uVar14) break;
    }
    else {
      FUN_10a1_146c();
      uVar13 = uVar14;
      if (!(bool)uVar14 && !(bool)uVar15) break;
    }
    FUN_10a1_2435();
    FUN_10a1_18f5();
    uVar14 = 0;
    uVar15 = 1;
    FUN_10a1_18fb();
    FUN_10a1_1210();
  } while( true );
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    if (!(bool)uVar13 && !(bool)uVar15) break;
    FUN_10a1_2435();
    FUN_10a1_18f5();
    uVar13 = 0;
    uVar15 = 1;
    FUN_10a1_18fb();
    FUN_10a1_1210();
  }
  FUN_10a1_0822();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    if (!(bool)uVar13 && !(bool)uVar15) break;
    FUN_10a1_2637();
    FUN_10a1_22d7();
    FUN_10a1_1210();
  }
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    if (!(bool)uVar13 && !(bool)uVar15) break;
    FUN_10a1_1210();
  }
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    if (!(bool)uVar13 && !(bool)uVar15) break;
    FUN_10a1_2637();
    FUN_10a1_22d7();
    FUN_10a1_1210();
  }
  FUN_10a1_0808();
  FUN_10a1_0822();
  FUN_10a1_18f5();
  FUN_10a1_193d();
  uVar13 = 0;
  uVar15 = 1;
  FUN_10a1_1983();
  FUN_10a1_1ee4();
  FUN_10a1_1983();
  FUN_10a1_1ee4();
  FUN_10a1_1ee4();
  FUN_10a1_18f5();
  iVar8 = 0x82;
  iVar19 = 3;
  FUN_10a1_18fb();
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    if (!(bool)uVar13 && !(bool)uVar15) break;
    FUN_10a1_2435();
    uVar13 = 0xff9f < (uint)(iVar8 / 0x50);
    uVar15 = iVar8 / 0x50 == 0xffa0;
    iVar19 = 3;
    FUN_10a1_1983();
    FUN_10a1_1210();
  }
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  FUN_10a1_2637();
  FUN_10a1_22d7();
  FUN_10a1_0bce();
  FUN_10a1_0be8();
  uVar9 = 0xd5e;
  FUN_10a1_1b5b();
  bVar7 = (char)uVar9 + *(char *)(unaff_BP + 0x2504);
  *(byte *)(unaff_BP + 0x25cb) = *(byte *)(unaff_BP + 0x25cb) | bVar7;
  *(byte *)(unaff_BP + 0x1d2e) = *(byte *)(unaff_BP + 0x1d2e) | bVar7;
  pbVar2 = (byte *)(CONCAT11((char)((uint)uVar9 >> 8),bVar7) + 0x8c2);
  uVar13 = 0;
  *pbVar2 = *pbVar2 | (byte)*(undefined2 *)0x7410;
  uVar15 = *pbVar2 == 0;
  FUN_10a1_1757();
  FUN_10a1_146c();
  if ((bool)uVar15) {
    FUN_10a1_1757();
  }
  FUN_10a1_146c();
  if ((bool)uVar15) {
    FUN_10a1_111b();
  }
  FUN_10a1_1757();
  FUN_10a1_1ee4();
  FUN_10a1_1ee4();
  thunk_FUN_10a1_162c();
  FUN_10a1_1bdd();
  FUN_10a1_1bdd();
  FUN_10a1_1ee4();
  iVar8 = 0x1e;
  FUN_10a1_18f5();
  FUN_10a1_2435();
  iVar10 = 0x78;
  FUN_10a1_18fb();
  FUN_10a1_16ce();
  while( true ) {
    FUN_10a1_16b4();
    FUN_10a1_146c();
    cVar17 = (char)uVar18;
    if (!(bool)uVar13 && !(bool)uVar15) break;
    iVar8 = iVar10;
    FUN_10a1_2435();
    iVar10 = iVar8;
    FUN_10a1_2435();
    FUN_10a1_1983();
    FUN_10a1_1210();
  }
  uVar9 = FUN_10a1_1112();
  pbVar2 = (byte *)0x92b;
  bVar7 = *pbVar2;
  bVar6 = (byte)iVar8;
  *pbVar2 = *pbVar2 + bVar6;
  puVar3 = (uint *)0x116e;
  iVar4 = 2 - (*puVar3 & 3);
  *puVar3 = *puVar3 + (uint)(0 < iVar4) * iVar4;
  if (!CARRY1(bVar7,bVar6)) {
    pcVar1 = (char *)(unaff_BP + iVar19 + 0x94d);
    *pcVar1 = *pcVar1 + (char)((uint)uVar9 >> 8);
    goto code_r0x00010a86;
  }
  pbVar2 = (byte *)0x1161;
  *pbVar2 = *pbVar2 & bVar6;
  bVar7 = *pbVar2;
  if (*pbVar2 == 0) {
    *(undefined2 *)(iVar10 + 0x8c2) = unaff_ES;
    if (-1 < (char)bVar7) {
      uVar20 = FUN_10a1_0031();
      bVar7 = *(byte *)(ulong)((uVar20 & 0xff) + 0x47);
      FUN_10a1_0031();
      *(byte *)0x50 = bVar7;
      *(byte *)0x4f = bVar7;
      uVar13 = 0x28;
      if ((1 < bVar7) && (uVar13 = 0x50, bVar7 == 7)) {
        uVar13 = 0x50;
        *(undefined2 *)0x56 = 0xc0b;
      }
      *(undefined1 *)0x5ce = uVar13;
      FUN_10a1_041a();
      uRam00000510 = unaff_DS;
      *(undefined2 *)0x5ae = uRam00000000;
      *(undefined2 *)0x5b0 = uRam00000002;
      *(undefined2 *)0x5b2 = uRam00000010;
      *(undefined2 *)0x5b4 = uRam00000012;
      uRam00000000 = 0xfd3;
      uRam00000002 = 0x10a1;
      uRam00000010 = 0xfdb;
      uRam00000012 = 0x10a1;
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
      uRam00000090 = 0x356;
      uRam00000092 = 0x10a1;
      uRam0000006c = 0x24d;
      uRam0000006e = 0x10a1;
      uRam00000070 = 0x32f;
      uRam00000072 = 0x10a1;
      uRam000003c0 = uRam00000020;
      uRam000003c2 = uRam00000022;
      piVar11 = (int *)0x5b6;
      *(undefined2 *)0x45 = 0x5b6;
      *(undefined2 *)0x5ba = 4;
      iVar12 = 0x5c2;
      *(undefined2 *)0x5b8 = 0x5c2;
      FUN_10a1_077f();
      *piVar11 = iVar12 + 4;
      FUN_10a1_078b();
      return;
    }
    if ((char)(bVar6 + (char)((uint)iVar8 >> 8)) < '\0') {
      FUN_10a1_02dc();
      (*(code *)*(undefined2 *)0x6)(0x10a1);
      FUN_10a1_07d7();
      goto code_r0x00010a5f;
    }
  }
  else {
    uVar13 = in(uVar20);
    *(undefined1 *)0xa0e = uVar13;
    bVar7 = (byte)((uint)iVar12 >> 8);
    *(byte *)0xa0f = *(byte *)0xa0f & bVar7;
    pcVar16[0x1113] = pcVar16[0x1113] & (byte)uVar20;
    out(*(undefined2 *)0x10a1,uVar20);
    uVar9 = in(uVar20);
    *(undefined2 *)0xa0f = uVar9;
    pbVar2 = (byte *)(pcVar16 + 0x1115);
    *pbVar2 = *pbVar2 & (byte)uVar20;
    out(*(undefined2 *)0x10a3,uVar20);
    if ((char)*pbVar2 < '\0') {
      out(*(undefined2 *)0x10a5,uVar20);
      pcVar16[0xa53] = pcVar16[0xa53] & (byte)iVar12;
      pcVar5 = (code *)swi(0x10);
      (*pcVar5)();
      return;
    }
    *pcVar16 = cVar17 + bVar7;
code_r0x00010a5f:
    uVar9 = 0;
  }
  uVar13 = (undefined1)uVar9;
  *(undefined1 *)0xa = uVar13;
  *(undefined1 *)0xb = uVar13;
  *(undefined1 *)0x40 = uVar13;
  *(undefined1 *)0x88 = uVar13;
  *(undefined1 *)0x89 = uVar13;
  *(undefined1 *)0x8a = uVar13;
  *(undefined1 *)0x8e = uVar13;
  *(undefined1 *)0x8f = 3;
  FUN_10a1_28e4();
  *(undefined1 *)0x8d = 4;
  *(undefined1 *)0x8b = 4;
code_r0x00010a86:
  *(undefined1 *)0x8c = 0x78;
  return;
}



void __cdecl16near FUN_10a1_0031(void)

{
  code *pcVar1;
  
  pcVar1 = (code *)swi(0x10);
  (*pcVar1)();
  return;
}



void FUN_10a1_003c(undefined2 param_1,undefined1 param_2)

{
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  *(undefined2 *)0xe = in_BX;
  FUN_10a1_0ebc(param_2);
  return;
}



void FUN_10a1_0043(void)

{
  undefined2 unaff_DS;
  
  FUN_10a1_02dc();
  (*(code *)*(undefined2 *)0x6)(0x10a1);
  FUN_10a1_07d7();
  *(undefined1 *)0xa = 0;
  *(undefined1 *)0xb = 0;
  *(undefined1 *)0x40 = 0;
  *(undefined1 *)0x88 = 0;
  *(undefined1 *)0x89 = 0;
  *(undefined1 *)0x8a = 0;
  *(undefined1 *)0x8e = 0;
  *(undefined1 *)0x8f = 3;
  FUN_10a1_28e4();
  *(undefined1 *)0x8d = 4;
  *(undefined1 *)0x8b = 4;
  *(undefined1 *)0x8c = 0x78;
  return;
}



void __cdecl16near FUN_10a1_007c(void)

{
  byte bVar1;
  uint uVar2;
  undefined1 uVar3;
  int iVar4;
  int *piVar5;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  uVar2 = FUN_10a1_0031();
  bVar1 = *(byte *)(ulong)((uVar2 & 0xff) + 0x47);
  FUN_10a1_0031();
  *(byte *)0x50 = bVar1;
  *(byte *)0x4f = bVar1;
  uVar3 = 0x28;
  if ((1 < bVar1) && (uVar3 = 0x50, bVar1 == 7)) {
    *(undefined2 *)0x56 = 0xc0b;
  }
  *(undefined1 *)0x5ce = uVar3;
  FUN_10a1_041a();
  uRam00000510 = unaff_DS;
  *(undefined2 *)0x5ae = uRam00000000;
  *(undefined2 *)0x5b0 = uRam00000002;
  *(undefined2 *)0x5b2 = uRam00000010;
  *(undefined2 *)0x5b4 = uRam00000012;
  uRam00000000 = 0xfd3;
  uRam00000002 = 0x10a1;
  uRam00000010 = 0xfdb;
  uRam00000012 = 0x10a1;
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
  uRam00000090 = 0x356;
  uRam00000092 = 0x10a1;
  uRam0000006c = 0x24d;
  uRam0000006e = 0x10a1;
  uRam00000070 = 0x32f;
  uRam00000072 = 0x10a1;
  uRam000003c0 = uRam00000020;
  uRam000003c2 = uRam00000022;
  piVar5 = (int *)0x5b6;
  *(undefined2 *)0x45 = 0x5b6;
  *(undefined2 *)0x5ba = 4;
  iVar4 = 0x5c2;
  *(undefined2 *)0x5b8 = 0x5c2;
  FUN_10a1_077f();
  *piVar5 = iVar4 + 4;
  FUN_10a1_078b();
  return;
}



void FUN_10a1_017d(void)

{
  undefined2 unaff_DS;
  
  FUN_10a1_018c();
                    // WARNING: Could not recover jumptable at 0x00010b97. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)(ulong)*(uint *)0xc)();
  return;
}



void FUN_10a1_0182(void)

{
  undefined2 unaff_DS;
  
  FUN_10a1_018c();
                    // WARNING: Could not recover jumptable at 0x00010b97. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)(ulong)*(uint *)0xc)();
  return;
}



void FUN_10a1_018b(void)

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
  FUN_10a1_08f7();
  uVar3 = *(undefined2 *)0x4f;
  cVar1 = (char)uVar3;
  *(char *)0x50 = cVar1;
  if ((bVar4) || ((char)((uint)uVar3 >> 8) != cVar1)) {
    FUN_10a1_0031();
    FUN_10a1_0376();
  }
  uRam00000501 = in_stack_00000000;
  FUN_10a1_02dc();
  uVar3 = 0x706;
  if (*(char *)0x50 == '\a') {
    uVar3 = 0xc0b;
  }
  *(undefined2 *)0x56 = uVar3;
  FUN_10a1_0415();
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
  uRam00000000 = *(undefined2 *)0x5ae;
  uRam00000002 = *(undefined2 *)0x5b0;
  uRam00000010 = *(undefined2 *)0x5b2;
  uRam00000012 = *(undefined2 *)0x5b4;
  return;
}



void __cdecl16near FUN_10a1_018c(void)

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
  FUN_10a1_08f7();
  uVar3 = *(undefined2 *)0x4f;
  cVar1 = (char)uVar3;
  *(char *)0x50 = cVar1;
  if ((bVar4) || (((in_CF & 1) == 0 && ((char)((uint)uVar3 >> 8) != cVar1)))) {
    FUN_10a1_0031();
    FUN_10a1_0376();
  }
  uRam00000501 = in_stack_00000000;
  FUN_10a1_02dc();
  uVar3 = 0x706;
  if (*(char *)0x50 == '\a') {
    uVar3 = 0xc0b;
  }
  *(undefined2 *)0x56 = uVar3;
  FUN_10a1_0415();
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
  uRam00000000 = *(undefined2 *)0x5ae;
  uRam00000002 = *(undefined2 *)0x5b0;
  uRam00000010 = *(undefined2 *)0x5b2;
  uRam00000012 = *(undefined2 *)0x5b4;
  return;
}



undefined1 __cdecl16near FUN_10a1_026c(void)

{
  undefined1 uVar1;
  undefined2 unaff_DS;
  
  LOCK();
  uVar1 = *(undefined1 *)0x10;
  *(undefined1 *)0x10 = 0;
  UNLOCK();
  return uVar1;
}



// WARNING: Removing unreachable block (ram,0x00010cf2)
// WARNING: Removing unreachable block (ram,0x00010cfb)
// WARNING: Removing unreachable block (ram,0x00010d07)
// WARNING: Removing unreachable block (ram,0x00010d0e)
// WARNING: Removing unreachable block (ram,0x00010d3b)

uint __cdecl16far FUN_10a1_0275(void)

{
  int *piVar1;
  byte *pbVar2;
  code *pcVar3;
  undefined2 uVar4;
  uint uVar5;
  uint in_stack_00000010;
  
  FUN_10a1_382c();
  uVar4 = uRam00000510;
  if (*(int *)0x43 != 0) {
    piVar1 = (int *)0x43;
    *piVar1 = *piVar1 + -1;
    if (*piVar1 == 0) {
      FUN_10a1_02b9();
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



undefined2 __cdecl16far FUN_10a1_02b9(void)

{
  byte bVar1;
  undefined2 in_AX;
  undefined2 uVar2;
  undefined1 uVar3;
  undefined2 in_CX;
  undefined2 unaff_DS;
  
  if (*(int *)(*(int *)0x45 + 6) != 0) {
    uVar2 = FUN_10a1_0748();
    out(0x42,(char)uVar2);
    uVar3 = (undefined1)((uint)uVar2 >> 8);
    out(0x42,uVar3);
    *(undefined2 *)0x43 = in_CX;
    *(undefined1 *)0x41 = 0;
    return CONCAT11(uVar3,uVar3);
  }
  if (*(char *)0x41 == '\0') {
    uVar2 = 0x5b6;
    if (*(int *)0x45 != 0x5b6) {
      FUN_10a1_3710();
      *(undefined2 *)0x45 = uVar2;
    }
    in_AX = FUN_10a1_077f();
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



void __cdecl16far FUN_10a1_02dc(void)

{
  byte bVar1;
  undefined2 uVar2;
  undefined2 unaff_DS;
  
  *(undefined1 *)0x41 = 0;
  if (*(char *)0x41 == '\0') {
    uVar2 = 0x5b6;
    if (*(int *)0x45 != 0x5b6) {
      FUN_10a1_3710();
      *(undefined2 *)0x45 = uVar2;
    }
    FUN_10a1_077f();
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



void FUN_10a1_036f(void)

{
  return;
}



void __cdecl16near FUN_10a1_0375(void)

{
  return;
}



void FUN_10a1_0376(void)

{
  FUN_10a1_037f();
  return;
}



void FUN_10a1_037b(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x53 = *(undefined2 *)0x53;
  FUN_10a1_0387();
  return;
}



void __cdecl16near FUN_10a1_037f(void)

{
  undefined2 in_DX;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x53 = in_DX;
  FUN_10a1_0387();
  return;
}



undefined2 __cdecl16near FUN_10a1_0387(void)

{
  undefined2 in_AX;
  
  FUN_10a1_0391();
  return in_AX;
}



void __cdecl16near FUN_10a1_0391(void)

{
  FUN_10a1_0031();
  return;
}



void __cdecl16near FUN_10a1_039f(void)

{
  FUN_10a1_03bb();
  FUN_10a1_0031();
  FUN_10a1_03da();
  return;
}



undefined1 __cdecl16near FUN_10a1_03bb(void)

{
  FUN_10a1_03d5();
  return 1;
}



void __cdecl16near FUN_10a1_03d5(void)

{
  long lVar1;
  uint uVar2;
  uint uVar3;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  uVar2 = FUN_10a1_0403();
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



void __cdecl16near FUN_10a1_03da(void)

{
  long lVar1;
  uint uVar2;
  uint uVar3;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  uVar2 = FUN_10a1_0403();
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



undefined2 __cdecl16near FUN_10a1_0403(void)

{
  undefined2 in_AX;
  
  return in_AX;
}



undefined2 __cdecl16near FUN_10a1_0415(void)

{
  undefined2 in_stack_00000000;
  
  FUN_10a1_037b();
  FUN_10a1_0031();
  return in_stack_00000000;
}



undefined2 __cdecl16near FUN_10a1_041a(void)

{
  undefined2 in_stack_00000000;
  
  FUN_10a1_037b();
  FUN_10a1_0031();
  return in_stack_00000000;
}



undefined2 __cdecl16near FUN_10a1_043e(void)

{
  undefined2 uVar1;
  undefined2 uVar2;
  undefined1 in_ZF;
  
  uVar2 = FUN_10a1_0403();
  uVar1 = uRam0000007c;
  if (!(bool)in_ZF) {
    uRam0000007c = 0x58;
    FUN_10a1_0031();
  }
  uRam0000007c = uVar1;
  return uVar2;
}



void FUN_10a1_0496(void)

{
  undefined1 in_CL;
  byte in_CH;
  int in_BX;
  int unaff_SI;
  int unaff_DI;
  undefined2 unaff_DS;
  
  if (in_CH <= (byte)in_BX) {
    *(undefined2 *)0x68 = 0;
    FUN_10a1_0fe3();
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



void __cdecl16near FUN_10a1_04a5(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x68 = 0;
  return;
}



undefined2 __cdecl16far FUN_10a1_04af(void)

{
  undefined2 uVar1;
  undefined2 in_CX;
  int in_BX;
  int unaff_SI;
  int unaff_DI;
  undefined2 unaff_DS;
  undefined2 in_stack_0000000a;
  
  *(undefined1 *)(in_BX + unaff_DI) = *(undefined1 *)(in_BX + unaff_SI);
  if ((byte)in_BX < (byte)((uint)in_CX >> 8)) {
    *(int *)0x68 = *(int *)0x68 + 1;
    return in_stack_0000000a;
  }
  *(undefined2 *)0x68 = 0;
  uVar1 = FUN_10a1_0fe3();
  return uVar1;
}



void __cdecl16near FUN_10a1_04cb(void)

{
  code *pcVar1;
  undefined2 unaff_DS;
  
  if ((*(char *)0x10 == '\0') && (*(int *)0x12 == 0)) {
    pcVar1 = (code *)swi(0x16);
    (*pcVar1)();
  }
  return;
}



uint __cdecl16near FUN_10a1_04e4(void)

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
    uVar3 = FUN_10a1_04cb();
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



undefined4 __cdecl16near FUN_10a1_054e(void)

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
    FUN_10a1_0629();
    goto LAB_10a1_05a2;
  }
  if (cVar1 == '\x1d') {
    if ((1 < (byte)((uint)uVar2 >> 8)) || ((char)uVar2 != '\x01')) {
      FUN_10a1_037f();
      goto LAB_10a1_05a2;
    }
  }
  else {
    if (cVar1 == '\x1c') {
LAB_10a1_0573:
      bVar3 = (char)((uint)uVar2 >> 8) + 1;
      uVar2 = CONCAT11(bVar3,(char)uVar2);
      if (bVar3 <= *(byte *)0x5ce) goto LAB_10a1_059f;
    }
    else if ((cVar1 != '\r') && (cVar1 != '\n')) {
      if (cVar1 == '\f') {
        FUN_10a1_078b();
        goto LAB_10a1_05a2;
      }
      FUN_10a1_05ce();
      uVar2 = extraout_DX;
      goto LAB_10a1_0573;
    }
    if ((0x17 < (byte)uVar2) && (FUN_10a1_039f(), 1 < *(byte *)0x768)) {
      *(char *)0x768 = *(char *)0x768 + -1;
      *(char *)0x76a = *(char *)0x76a + -1;
    }
  }
LAB_10a1_059f:
  FUN_10a1_037f();
LAB_10a1_05a2:
  return CONCAT22(in_DX,in_AX);
}



void __cdecl16near FUN_10a1_05ce(void)

{
  FUN_10a1_037b();
  FUN_10a1_0031();
  return;
}



// WARNING: Removing unreachable block (ram,0x00011075)

uint __cdecl16near FUN_10a1_0629(void)

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
  
  FUN_10a1_1736();
  uVar4 = 800;
  FUN_10a1_06fe();
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
    FUN_10a1_026c();
    if (!bVar8) {
      uVar4 = FUN_10a1_0275();
      return uVar4;
    }
    bVar8 = true;
  } while (iVar6 == *(int *)(iVar7 + 6));
  FUN_10a1_076b();
  FUN_10a1_076b();
  FUN_10a1_076b();
  uVar2 = FUN_10a1_076b();
  if ((*(char *)0x40 == '\0') || (*(int *)0x43 == 0)) {
    uRam00000020 = 0x283;
    uRam00000022 = 0x10a1;
    out(0x40,0);
    out(0x40,8);
    if (*(char *)0x41 == '\0') {
      out(0x43,0xb6);
      bVar1 = in(0x61);
      out(0x61,bVar1 | 3);
    }
    uVar2 = FUN_10a1_0748();
    out(0x42,(char)uVar2);
    uVar3 = (undefined1)((uint)uVar2 >> 8);
    uVar2 = CONCAT11(uVar3,uVar3);
    out(0x42,uVar3);
    *(undefined2 *)0x43 = uVar5;
    *(undefined1 *)0x41 = 0;
  }
  return uVar2;
}



uint __cdecl16near FUN_10a1_066b(void)

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
  
  FUN_10a1_06fe();
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
    FUN_10a1_026c();
    if (!bVar8) {
      uVar2 = FUN_10a1_0275();
      return uVar2;
    }
    bVar8 = true;
  } while (iVar6 == *(int *)(iVar7 + 6));
  FUN_10a1_076b();
  FUN_10a1_076b();
  FUN_10a1_076b();
  uVar2 = FUN_10a1_076b();
  if ((*(char *)0x40 == '\0') || (*(int *)0x43 == 0)) {
    uRam00000020 = 0x283;
    uRam00000022 = 0x10a1;
    out(0x40,0);
    out(0x40,8);
    if (*(char *)0x41 == '\0') {
      out(0x43,0xb6);
      bVar1 = in(0x61);
      out(0x61,bVar1 | 3);
    }
    uVar3 = FUN_10a1_0748();
    out(0x42,(char)uVar3);
    uVar4 = (undefined1)((uint)uVar3 >> 8);
    uVar2 = CONCAT11(uVar4,uVar4);
    out(0x42,uVar4);
    *(undefined2 *)0x43 = uVar5;
    *(undefined1 *)0x41 = 0;
  }
  return uVar2;
}



void __cdecl16near FUN_10a1_06fe(void)

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
  else if (*(int *)0x45 == 0x5b6) {
    FUN_10a1_36d0();
    *(undefined2 *)0x45 = unaff_SI;
    unaff_SI[2] = 0x400;
    piVar1 = unaff_SI + 6;
    unaff_SI[1] = (int)piVar1;
    FUN_10a1_077f();
    *unaff_SI = (int)(piVar1 + 0x200);
  }
  return;
}



undefined2 FUN_10a1_0748(void)

{
  undefined1 uVar1;
  undefined1 uVar2;
  undefined2 *in_BX;
  undefined1 *puVar3;
  undefined2 unaff_DS;
  
  FUN_10a1_0757();
  FUN_10a1_0757();
  uVar2 = FUN_10a1_0757();
  uVar1 = *(undefined1 *)in_BX[4];
  puVar3 = (undefined1 *)in_BX[4] + 1;
  if (puVar3 == (undefined1 *)*in_BX) {
    puVar3 = (undefined1 *)in_BX[1];
  }
  in_BX[4] = puVar3;
  in_BX[3] = in_BX[3] + -1;
  return CONCAT11(uVar2,uVar1);
}



undefined1 __cdecl16near FUN_10a1_0757(void)

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



void __cdecl16near FUN_10a1_076b(void)

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



void __cdecl16near FUN_10a1_077f(void)

{
  undefined2 in_CX;
  int in_BX;
  undefined2 unaff_DS;
  
  *(undefined2 *)(in_BX + 8) = in_CX;
  *(undefined2 *)(in_BX + 10) = in_CX;
  *(undefined2 *)(in_BX + 6) = 0;
  return;
}



undefined2 __cdecl16far FUN_10a1_078b(void)

{
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  
  *(BADSPACEBASE **)0x5e6 = register0x00000010;
  FUN_10a1_03d5();
  FUN_10a1_0031();
  FUN_10a1_07d7();
  FUN_10a1_098c();
  FUN_10a1_0376();
  FUN_10a1_03da();
  return in_stack_00000000;
}



undefined2 __cdecl16far FUN_10a1_07b3(void)

{
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  
  *(undefined2 *)0x51 = 0;
  FUN_10a1_0031();
  FUN_10a1_07d7();
  FUN_10a1_098c();
  FUN_10a1_0376();
  FUN_10a1_03da();
  return in_stack_00000000;
}



void __cdecl16near FUN_10a1_07d7(void)

{
  byte bVar1;
  undefined2 unaff_DS;
  
  bVar1 = *(byte *)0x50;
  *(undefined2 *)0x5c8 = 100;
  if (bVar1 == 6) {
    *(undefined1 *)0x87 = 1;
    *(undefined2 *)0x5c6 = 0x140;
    return;
  }
  if ((bVar1 < 6) && (3 < bVar1)) {
    *(undefined1 *)0x87 = 2;
    *(undefined2 *)0x5c6 = 0xa0;
    return;
  }
  *(undefined1 *)0x87 = 0;
  return;
}



undefined2 __cdecl16far FUN_10a1_0808(void)

{
  undefined2 uVar1;
  undefined2 in_AX;
  undefined2 in_CX;
  byte bVar2;
  undefined1 uVar3;
  int in_BX;
  int unaff_DI;
  undefined2 unaff_DS;
  
  bVar2 = (byte)((uint)in_CX >> 8);
  uVar3 = (undefined1)in_BX;
  FUN_10a1_08d1();
  *(undefined1 *)(in_BX + unaff_DI) = uVar3;
  if ((byte)in_BX < bVar2) {
    *(int *)0x68 = *(int *)0x68 + 1;
    return in_AX;
  }
  *(undefined2 *)0x68 = 0;
  uVar1 = FUN_10a1_0fe3();
  return uVar1;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 __cdecl16far FUN_10a1_0822(void)

{
  undefined2 uVar1;
  undefined2 in_CX;
  int iVar2;
  byte bVar3;
  byte bVar4;
  int in_BX;
  int iVar5;
  byte *unaff_SI;
  byte *unaff_DI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar6;
  undefined1 in_ZF;
  undefined2 in_stack_00000000;
  
  *(BADSPACEBASE **)0x5e6 = register0x00000010;
  bVar3 = (byte)((uint)in_CX >> 8);
  bVar4 = (byte)in_BX;
  FUN_10a1_08d1();
  if ((bool)in_ZF) {
    FUN_10a1_0496();
    bVar6 = unaff_SI[in_BX] < 0x20;
    while (bVar6) {
      in_BX = in_BX + 1;
      if (bVar3 <= (byte)in_BX) {
        bVar4 = *unaff_SI;
        *unaff_DI = bVar4;
        bVar3 = unaff_SI[1];
        unaff_DI[1] = bVar3;
        unaff_DI[2] = unaff_SI[2];
        bVar3 = (bVar3 & 7) << 4;
        if ((bVar4 & 0x10) != 0) {
          bVar3 = bVar3 | 0x80;
        }
        bVar3 = bVar3 | bVar4 & 0xf;
        *(byte *)0x81 = bVar3;
        *(byte *)0x82 = bVar3;
        FUN_10a1_0031();
        return in_stack_00000000;
      }
      bVar6 = unaff_SI[in_BX] < 0x10;
    }
  }
  else if (*(char *)0x50 != '\x06') {
    unaff_DI[in_BX] = bVar4;
    iVar5 = in_BX + 1;
    iVar2 = iVar5 * 0x100;
    FUN_10a1_04a5();
    do {
      bVar4 = unaff_SI[iVar5];
      bVar3 = (byte)((uint)iVar2 >> 8);
      unaff_DI[iVar5] = bVar4;
      iVar2 = CONCAT11(bVar3,bVar4);
      FUN_10a1_0031();
      iVar5 = iVar5 + 1;
    } while ((byte)iVar5 < bVar3);
    *(undefined1 *)0x82 = 0;
    return in_stack_00000000;
  }
  *(undefined2 *)0x68 = 0;
  *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
  FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
  uVar1 = (*(code *)*(undefined2 *)0x5e4)();
  return uVar1;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_08d1(void)

{
  undefined2 in_BX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if ((char)((uint)in_BX >> 8) == '\0') {
    FUN_10a1_0403();
    return;
  }
  *(undefined2 *)0x68 = 0;
  *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
  FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x5e4)();
  return;
}



void __cdecl16near FUN_10a1_08d5(void)

{
  FUN_10a1_0403();
  return;
}



undefined4 __cdecl16near FUN_10a1_08ec(void)

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
      uVar4 = FUN_10a1_098c();
    }
    return uVar4;
  }
  FUN_10a1_1736();
  piVar3 = (int *)0x16;
  cVar1 = '\n';
  do {
    FUN_10a1_37f5();
    FUN_10a1_0943();
    FUN_10a1_37f5();
    for (iVar2 = *piVar3; iVar2 != 0; iVar2 = iVar2 + -1) {
      FUN_10a1_37f5();
    }
    uVar4 = FUN_10a1_37f5();
    piVar3 = piVar3 + 2;
    cVar1 = cVar1 + -1;
  } while (cVar1 != '\0');
  return uVar4;
}



void __cdecl16far FUN_10a1_08f7(void)

{
  char cVar1;
  undefined2 unaff_DS;
  
  cVar1 = *(char *)0x11;
  *(undefined1 *)0x11 = 0;
  if (cVar1 != '\0') {
    FUN_10a1_098c();
  }
  return;
}



undefined4 FUN_10a1_0943(void)

{
  undefined4 uVar1;
  
  FUN_10a1_37f5();
  uVar1 = FUN_10a1_37f5();
  return uVar1;
}



undefined4 __cdecl16near FUN_10a1_098c(void)

{
  byte bVar1;
  char cVar2;
  undefined2 in_CX;
  uint uVar3;
  uint uVar4;
  uint *puVar5;
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  
  FUN_10a1_0031();
  if (*(char *)0x11 == '\0') {
    FUN_10a1_0031();
  }
  else {
    FUN_10a1_0403();
    puVar5 = (uint *)0x16;
    bVar1 = 0x31;
    cVar2 = '\x05';
    if (*(char *)0x5ce != '(') {
      bVar1 = 0x31;
      cVar2 = '\n';
    }
    do {
      FUN_10a1_0a2b();
      uVar3 = *puVar5;
      uVar4 = uVar3;
      if (5 < uVar3) {
        uVar3 = 6;
        uVar4 = uVar3;
      }
      for (; uVar3 != 0; uVar3 = uVar3 - 1) {
        FUN_10a1_0a25();
      }
      uVar3 = (uint)(byte)(7 - (char)uVar4);
      do {
        FUN_10a1_0a2b();
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
  FUN_10a1_037b();
  return CONCAT22(in_CX,in_stack_00000000);
}



void FUN_10a1_0a25(void)

{
  FUN_10a1_0031();
  FUN_10a1_0031();
  return;
}



void __cdecl16near FUN_10a1_0a2b(void)

{
  FUN_10a1_0031();
  FUN_10a1_0031();
  return;
}



undefined2 __cdecl16far FUN_10a1_0a41(void)

{
  undefined2 uVar1;
  undefined2 in_AX;
  undefined2 in_CX;
  byte bVar2;
  undefined1 uVar3;
  int in_BX;
  int unaff_DI;
  undefined2 unaff_DS;
  
  bVar2 = (byte)((uint)in_CX >> 8);
  uVar3 = (undefined1)in_BX;
  FUN_10a1_0b25();
  *(undefined1 *)(in_BX + unaff_DI) = uVar3;
  if ((byte)in_BX < bVar2) {
    *(int *)0x68 = *(int *)0x68 + 1;
    return in_AX;
  }
  *(undefined2 *)0x68 = 0;
  uVar1 = FUN_10a1_0fe3();
  return uVar1;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 __cdecl16far FUN_10a1_0a5b(void)

{
  char cVar1;
  byte extraout_AH;
  char cVar3;
  undefined2 uVar2;
  char cVar4;
  char cVar5;
  int iVar6;
  byte bVar7;
  undefined2 *unaff_SI;
  undefined2 *unaff_DI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar8;
  undefined2 in_stack_00000000;
  
  *(BADSPACEBASE **)0x5e6 = register0x00000010;
  FUN_10a1_0b25();
  FUN_10a1_0496();
  iVar6 = unaff_SI[1];
  if (extraout_AH < 3) {
    iVar6 = CONCAT11((char)iVar6,(char)iVar6);
  }
  cVar3 = *(char *)0x5ce;
  cVar4 = (char)*unaff_SI;
  cVar5 = (char)((uint)*unaff_SI >> 8);
  if (cVar4 == '\0') {
    bVar7 = (byte)((uint)iVar6 >> 8);
    if (((7 < bVar7) || (7 < (byte)iVar6)) || ((cVar3 == 'P' && ((3 < bVar7 || (3 < (byte)iVar6)))))
       ) {
LAB_10a1_0ab5:
      *(undefined2 *)0x68 = 0;
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      uVar2 = (*(code *)*(undefined2 *)0x5e4)();
      return uVar2;
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
LAB_10a1_0ae1:
    *unaff_DI = *unaff_SI;
    unaff_DI[1] = unaff_SI[1];
    *(char *)0x5ce = cVar3;
    uVar2 = *(undefined2 *)0x50;
    *(char *)0x50 = cVar1;
    *(int *)0x51 = iVar6;
    bVar8 = cVar1 == (char)uVar2;
    if (bVar8) goto LAB_10a1_0b1a;
    *(undefined2 *)0x7e = 7;
    *(undefined2 *)0x80 = 0x700;
    *(undefined1 *)0x82 = 7;
    uVar2 = FUN_10a1_0403();
    if (!bVar8) {
      *(undefined1 *)0x82 = (char)uVar2;
    }
  }
  else {
    if (iVar6 != 0) goto LAB_10a1_0ab5;
    if (*(char *)0x50 != '\a') {
      cVar1 = '\x06';
      cVar3 = 'P';
      if (cVar4 != '\x02') {
        cVar1 = '\x05';
        cVar3 = '(';
        if (cVar4 != '\x01') goto LAB_10a1_0ab5;
        if (cVar5 == '\0') {
          cVar1 = '\x04';
          cVar3 = '(';
        }
      }
      goto LAB_10a1_0ae1;
    }
  }
  FUN_10a1_07b3();
LAB_10a1_0b1a:
  FUN_10a1_0031();
  return in_stack_00000000;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void __cdecl16near FUN_10a1_0b25(void)

{
  undefined2 in_BX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if ((char)((uint)in_BX >> 8) == '\0') {
    return;
  }
  *(undefined2 *)0x68 = 0;
  *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
  FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x5e4)();
  return;
}



void __cdecl16near FUN_10a1_0b29(void)

{
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 __cdecl16near FUN_10a1_0b93(void)

{
  byte bVar1;
  undefined2 in_AX;
  undefined2 uVar2;
  char cVar3;
  undefined2 in_BX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  cVar3 = (char)in_BX;
  if ((char)((uint)in_BX >> 8) != '\0') {
LAB_10a1_0feb_1:
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    uVar2 = (*(code *)*(undefined2 *)0x5e4)();
    return uVar2;
  }
  if (cVar3 != *(char *)0x5ce) {
    bVar1 = *(byte *)0x50;
    if ((cVar3 != 'P') && (cVar3 != '(')) goto LAB_10a1_0feb_1;
    if (bVar1 != 7) {
      *(char *)0x5ce = cVar3;
      *(byte *)0x50 = bVar1 ^ 2;
      *(undefined2 *)0x51 = 0;
      FUN_10a1_07b3();
    }
  }
  return in_AX;
}



undefined2 __cdecl16far FUN_10a1_0bce(void)

{
  undefined2 uVar1;
  undefined2 in_CX;
  byte bVar2;
  undefined1 uVar3;
  int in_BX;
  int unaff_DI;
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  
  bVar2 = (byte)((uint)in_CX >> 8);
  uVar3 = (undefined1)in_BX;
  FUN_10a1_0c63();
  *(undefined1 *)(in_BX + unaff_DI) = uVar3;
  if ((byte)in_BX < bVar2) {
    *(int *)0x68 = *(int *)0x68 + 1;
    return in_stack_00000000;
  }
  *(undefined2 *)0x68 = 0;
  uVar1 = FUN_10a1_0fe3();
  return uVar1;
}



void FUN_10a1_0bdc(void)

{
  FUN_10a1_0c67();
  FUN_10a1_04af();
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 __cdecl16far FUN_10a1_0be8(void)

{
  char cVar1;
  byte extraout_AH;
  undefined2 uVar2;
  byte bVar3;
  byte bVar4;
  int in_BX;
  int unaff_SI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 in_stack_00000002;
  
  *(BADSPACEBASE **)0x5e6 = register0x00000010;
  FUN_10a1_0c63();
  FUN_10a1_0496();
  bVar3 = (byte)*(undefined2 *)(in_BX + unaff_SI);
  bVar4 = (byte)((uint)*(undefined2 *)(in_BX + unaff_SI) >> 8);
  if ((((bVar3 != 0) && (bVar3 < 0x1a)) && ((*(char *)0x11 == '\0' || (bVar3 < 0x19)))) &&
     ((bVar4 != 0 && (bVar4 <= *(byte *)0x5ce)))) {
    cVar1 = *(char *)(in_BX + 2 + unaff_SI);
    uVar2 = *(undefined2 *)(in_BX + 3 + unaff_SI);
    bVar3 = (byte)uVar2;
    if (bVar3 < 0x20) {
      if ((2 < extraout_AH) && (extraout_AH < 4)) {
        uVar2 = CONCAT11(bVar3,bVar3);
      }
      if ((byte)((uint)uVar2 >> 8) < 0x20) {
        *(char *)0x55 = cVar1;
        *(undefined2 *)0x56 = uVar2;
        if (1 < extraout_AH) {
          if (cVar1 == '\0') {
            FUN_10a1_041a();
          }
          else {
            FUN_10a1_0415();
          }
        }
        FUN_10a1_037f();
        return in_stack_00000002;
      }
    }
  }
  *(undefined2 *)0x68 = 0;
  *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
  FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
  uVar2 = (*(code *)*(undefined2 *)0x5e4)();
  return uVar2;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void FUN_10a1_0c63(void)

{
  undefined2 in_BX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if ((char)((uint)in_BX >> 8) == '\0') {
    return;
  }
  *(undefined2 *)0x68 = 0;
  *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
  FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x5e4)();
  return;
}



void __cdecl16near FUN_10a1_0c67(void)

{
  return;
}



void __cdecl16far FUN_10a1_0ebc(undefined1 param_1)

{
  int in_AX;
  undefined2 in_CX;
  undefined2 unaff_BP;
  undefined2 unaff_DS;
  int in_stack_00000000;
  undefined2 in_stack_00000002;
  
  *(int *)0x5d6 = in_AX;
  *(int *)0x5d2 = in_AX + 0x81;
  *(undefined2 *)0x5d4 = in_CX;
  *(undefined2 *)0x5d8 = unaff_BP;
  *(undefined1 **)0x5d0 = &param_1;
  *(undefined2 *)0x5ea = in_stack_00000002;
  *(int *)0x5e8 = in_stack_00000000 + -0x1f;
  *(undefined2 *)0x5e4 = 0x10b9;
  *(undefined2 *)0x5e2 = 0;
  *(undefined2 *)0x5e0 = 0;
  FUN_10a1_0f72();
  FUN_10a1_007c();
  FUN_10a1_32d7();
  *(undefined2 *)0x90 = unaff_DS;
  return;
}



void __cdecl16far FUN_10a1_0efd(void)

{
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x90 = in_BX;
  return;
}



void __cdecl16far FUN_10a1_0f72(void)

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
  
  uVar3 = FUN_10a1_0fc4();
  puVar4 = (undefined1 *)
           CONCAT11((byte)((uint)uVar3 >> 8) | *(byte *)((int)unaff_BP + unaff_DI + 0x5da),
                    (char)uVar3);
  FUN_10a1_0fc4();
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
  *(undefined2 *)0x5e0 = 0;
  FUN_10a1_0f98();
  FUN_10a1_30fe();
  *(undefined2 *)0x90 = unaff_DS;
  return;
}



void __cdecl16near FUN_10a1_0f98(void)

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
  
  uVar4 = FUN_10a1_0fc4();
  bVar3 = (char)uVar4 + '-' + in_CF;
  cVar8 = '\0';
  unaff_SI[in_BX] = unaff_SI[in_BX] | bVar3;
  *(undefined2 *)0x5de = CONCAT11((char)((uint)uVar4 >> 8),bVar3);
  iVar5 = FUN_10a1_0fc4();
  *unaff_SI = *unaff_SI + in_DL + *(char *)(in_BX + 0x1ae8) + cVar8;
  for (iVar5 = iVar5 - (int)unaff_DI; iVar5 != 0; iVar5 = iVar5 + -1) {
    puVar1 = unaff_DI;
    unaff_DI = unaff_DI + 1;
    *puVar1 = 0;
  }
  puVar6 = (undefined1 *)0x5ee;
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



undefined2 __cdecl16near FUN_10a1_0fc4(void)

{
  undefined2 unaff_DS;
  char *in_stack_00000000;
  
  return *(undefined2 *)((int)*(undefined4 *)0x5e8 + (int)*in_stack_00000000);
}



// WARNING (jumptable): Stack frame is not setup normally: Input value of stackpointer is not used
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void FUN_10a1_0fe3(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
  FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x5e4)();
  return;
}



void FUN_10a1_1112(void)

{
  undefined2 unaff_DS;
  
  if (*(char *)0x5ff != '\0') {
    FUN_10a1_1178();
    FUN_10a1_112a();
  }
  FUN_10a1_37e1();
  FUN_10a1_338d();
  FUN_10a1_32e9();
  FUN_10a1_0182();
  return;
}



void FUN_10a1_111b(void)

{
  FUN_10a1_37e1();
  FUN_10a1_338d();
  FUN_10a1_32e9();
  FUN_10a1_0182();
  return;
}



void FUN_10a1_112a(void)

{
  uint uVar1;
  byte in_CH;
  undefined2 uVar2;
  undefined1 *unaff_SI;
  undefined2 unaff_DS;
  
  uVar1 = FUN_10a1_0fc4();
  unaff_SI[0x19] = 0;
  uVar2 = (undefined2)((ulong)uVar1 * (ulong)*(uint *)0x6920 >> 0x10);
  out(*unaff_SI,uVar2);
  unaff_SI[0x6a] = unaff_SI[0x6a] & in_CH;
  out(unaff_SI[1],uVar2);
  FUN_10a1_119e();
  FUN_10a1_3664();
  FUN_10a1_37e1();
  return;
}



void FUN_10a1_1178(void)

{
  byte *pbVar1;
  byte in_BL;
  byte *pbVar2;
  
  FUN_10a1_37e1();
  pbVar2 = (byte *)0xc74;
  while ((*pbVar2 != 0xff && (pbVar1 = pbVar2, pbVar2 = pbVar2 + 1, in_BL != *pbVar1))) {
    do {
      pbVar1 = pbVar2;
      pbVar2 = pbVar2 + 1;
    } while (*pbVar1 < 0x81);
  }
  FUN_10a1_381e();
  return;
}



// WARNING: Control flow encountered bad instruction data

void FUN_10a1_119e(void)

{
  FUN_10a1_0fc4();
                    // WARNING: Bad instruction - Truncating control flow here
  halt_baddata();
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_11fb(void)

{
  ulong uVar1;
  char cVar2;
  uint uVar3;
  uint uVar4;
  uint uVar5;
  byte bVar6;
  char cVar7;
  byte bVar8;
  uint uVar9;
  uint uVar10;
  uint uVar11;
  uint uVar12;
  uint uVar13;
  int unaff_SI;
  uint uVar14;
  uint uVar15;
  byte *unaff_DI;
  uint uVar16;
  uint uVar17;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar18;
  
  FUN_10a1_1736();
  uVar3 = *(uint *)(unaff_DI + 2) ^ 0x80;
  uVar17 = (uint)*unaff_DI << 8;
  uVar10 = *(uint *)(unaff_DI + 1) | 0x8000;
  uVar15 = *(uint *)(unaff_SI + 2);
  uVar16 = *(uint *)(unaff_SI + -1) & 0xff00;
  uVar14 = *(uint *)(unaff_SI + 1) | 0x8000;
  bVar6 = (byte)(uVar15 >> 8);
  uVar11 = uVar17;
  uVar13 = uVar10;
  if (bVar6 == 0) goto LAB_10a1_1320;
  bVar8 = (byte)(*(uint *)(unaff_DI + 2) >> 8);
  uVar4 = CONCAT11(bVar8,(char)uVar3);
  uVar3 = uVar15;
  uVar11 = uVar16;
  uVar13 = uVar14;
  if (bVar8 == 0) goto LAB_10a1_1320;
  uVar5 = uVar4;
  uVar9 = uVar17;
  uVar12 = uVar10;
  if (bVar6 < bVar8) {
    uVar5 = uVar15;
    uVar3 = uVar4;
    uVar9 = uVar16;
    uVar12 = uVar14;
    uVar13 = uVar10;
    uVar11 = uVar17;
  }
  cVar7 = (char)(uVar3 >> 8);
  bVar6 = -((char)(uVar5 >> 8) - cVar7);
  if (0x18 < bVar6) goto LAB_10a1_1320;
  cVar2 = (char)(((uint)((char)uVar5 < '\0') << 8 | uVar3 & 0xff) >> 1);
  uVar15 = (uint)bVar6;
  if (uVar15 != 0) {
    if ((char)bVar6 < '\x0e') {
LAB_10a1_126d:
      bVar6 = (byte)uVar15;
      if ('\x05' < (char)bVar6) {
        if ((char)uVar9 != '\0') {
          uVar9 = (uint)(byte)((byte)(uVar9 >> 8) | 1) << 8;
        }
        uVar9 = CONCAT11((char)uVar12,(char)(uVar9 >> 8));
        uVar12 = uVar12 >> 8;
        bVar8 = bVar6 - 8;
        uVar15 = (uint)bVar8;
        if (bVar6 < 8 || bVar8 == 0) {
          if (bVar8 == 0) goto LAB_10a1_12a9;
          goto LAB_10a1_1288;
        }
      }
      if ((uVar9 & 0x3f) != 0) {
        uVar9 = uVar9 | 0x20;
      }
      do {
        uVar3 = uVar12 & 1;
        uVar12 = uVar12 >> 1;
        uVar9 = (uint)(CONCAT12(uVar3 != 0,uVar9) >> 1);
        uVar15 = uVar15 - 1;
      } while (uVar15 != 0);
    }
    else {
      bVar18 = uVar9 != 0;
      uVar9 = uVar12;
      if (bVar18) {
        uVar9 = uVar12 | 1;
      }
      uVar12 = 0;
      uVar15 = (uint)(byte)(bVar6 - 0x10);
      if (0xf < bVar6) {
        if ((byte)(bVar6 - 0x10) == 0) goto LAB_10a1_12a9;
        goto LAB_10a1_126d;
      }
LAB_10a1_1288:
      do {
        bVar18 = (int)uVar9 < 0;
        uVar9 = uVar9 << 1;
        uVar12 = uVar12 << 1 | (uint)bVar18;
        bVar6 = (char)uVar15 + 1;
        uVar15 = (uint)bVar6;
      } while (bVar6 != 0);
    }
  }
LAB_10a1_12a9:
  if ((uVar9 & 0x3f) != 0) {
    uVar9 = uVar9 | 0x20;
  }
  bVar6 = cVar2 << 1;
  uVar3 = CONCAT11(cVar7,bVar6);
  if (cVar2 < '\0' == (char)bVar6 < '\0') {
    uVar10 = uVar9 + uVar11;
    uVar11 = (uint)CARRY2(uVar9,uVar11);
    uVar17 = uVar12 + uVar13;
    uVar14 = uVar17 + uVar11;
    uVar15 = uVar14;
    if (CARRY2(uVar12,uVar13) || CARRY2(uVar17,uVar11)) {
      uVar15 = (uint)(CONCAT12(CARRY2(uVar12,uVar13) || CARRY2(uVar17,uVar11),uVar14) >> 1);
      uVar10 = (uint)(CONCAT12((uVar14 & 1) != 0,uVar10) >> 1);
      uVar3 = CONCAT11(cVar7 + '\x01',bVar6);
      if ((char)(cVar7 + '\x01') == '\0') goto LAB_10a1_0fee_1;
    }
  }
  else {
    uVar17 = uVar11 - uVar9;
    uVar15 = (uVar13 - uVar12) - (uint)(uVar11 < uVar9);
    if (uVar13 < uVar12 || uVar13 - uVar12 < (uint)(uVar11 < uVar9)) {
      bVar18 = uVar17 == 0;
      uVar17 = -uVar17;
      uVar15 = ~uVar15 + (uint)bVar18;
      uVar3 = CONCAT11(cVar7,~bVar6);
    }
    uVar10 = uVar17;
    if ((uVar15 == 0) &&
       ((bVar6 = (byte)(uVar3 >> 8), cVar7 = bVar6 - 0x10, uVar3 = CONCAT11(cVar7,(char)uVar3),
        bVar6 < 0x10 || cVar7 == '\0' || (uVar10 = 0, uVar15 = uVar17, uVar17 == 0)))) {
LAB_10a1_1337:
      *(undefined1 *)0xad = 0;
      return;
    }
    if ((char)(uVar15 >> 8) == '\0') {
      bVar6 = (byte)(uVar3 >> 8);
      cVar7 = bVar6 - 8;
      uVar3 = CONCAT11(cVar7,(char)uVar3);
      if (bVar6 < 8 || cVar7 == '\0') goto LAB_10a1_1337;
      uVar11 = uVar10 >> 8;
      uVar10 = uVar10 << 8;
      uVar15 = CONCAT11((char)uVar15,(char)uVar11);
    }
    if (-1 < (int)uVar15) {
      do {
        cVar7 = (char)(uVar3 >> 8) + -1;
        uVar3 = CONCAT11(cVar7,(char)uVar3);
        if (cVar7 == '\0') goto LAB_10a1_1337;
        bVar18 = (int)uVar10 < 0;
        uVar10 = uVar10 << 1;
        uVar1 = (ulong)CONCAT12(bVar18,uVar15) << 1;
        uVar15 = (uint)uVar1 | (uint)bVar18;
      } while (((uVar1 & 0x10000) != 0) == (int)uVar15 < 0);
    }
  }
  bVar6 = (byte)(uVar10 >> 8);
  if ((0x80 < (byte)uVar10) ||
     ((uVar11 = uVar10, uVar13 = uVar15, 0x7f < (byte)uVar10 && ((uVar10 & 0x100) != 0)))) {
    uVar11 = (uint)(byte)(bVar6 + 1) << 8;
    uVar17 = (uint)(0xfe < bVar6);
    uVar13 = uVar15 + uVar17;
    if ((CARRY2(uVar15,uVar17)) &&
       (cVar7 = (char)(uVar3 >> 8) + '\x01', uVar3 = CONCAT11(cVar7,(char)uVar3), cVar7 == '\0')) {
LAB_10a1_0fee_1:
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      (*(code *)*(undefined2 *)0x5e4)();
      return;
    }
  }
LAB_10a1_1320:
  *(undefined2 *)0xac =
       CONCAT11((char)((uVar3 & 0xff80) >> 8),(byte)(uVar3 & 0xff80) | (byte)(uVar13 >> 8) & 0x7f);
  *(undefined2 *)0xaa = CONCAT11((char)uVar13,(char)(uVar11 >> 8));
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_1210(void)

{
  ulong uVar1;
  char cVar2;
  uint uVar3;
  byte bVar5;
  uint uVar4;
  char cVar6;
  byte bVar7;
  uint uVar8;
  uint uVar9;
  uint uVar10;
  uint uVar11;
  uint uVar12;
  uint uVar13;
  int unaff_SI;
  uint uVar14;
  uint uVar15;
  byte *unaff_DI;
  uint uVar16;
  uint uVar17;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar18;
  
  FUN_10a1_1736();
  uVar15 = *(uint *)(unaff_DI + 2);
  uVar9 = (uint)*unaff_DI << 8;
  uVar12 = *(uint *)(unaff_DI + 1) | 0x8000;
  uVar17 = *(uint *)(unaff_SI + 2);
  uVar16 = *(uint *)(unaff_SI + -1) & 0xff00;
  uVar14 = *(uint *)(unaff_SI + 1) | 0x8000;
  bVar5 = (byte)(uVar17 >> 8);
  uVar4 = uVar15;
  uVar10 = uVar9;
  uVar13 = uVar12;
  if ((bVar5 == 0) ||
     (bVar7 = (byte)(uVar15 >> 8), uVar4 = uVar17, uVar10 = uVar16, uVar13 = uVar14, bVar7 == 0))
  goto LAB_10a1_1320;
  uVar3 = uVar15;
  uVar8 = uVar9;
  uVar11 = uVar12;
  if (bVar5 < bVar7) {
    uVar3 = uVar17;
    uVar4 = uVar15;
    uVar8 = uVar16;
    uVar11 = uVar14;
    uVar13 = uVar12;
    uVar10 = uVar9;
  }
  cVar6 = (char)(uVar4 >> 8);
  bVar5 = -((char)(uVar3 >> 8) - cVar6);
  if (0x18 < bVar5) goto LAB_10a1_1320;
  cVar2 = (char)(((uint)((char)uVar3 < '\0') << 8 | uVar4 & 0xff) >> 1);
  uVar15 = (uint)bVar5;
  if (uVar15 != 0) {
    if ((char)bVar5 < '\x0e') {
LAB_10a1_126d:
      bVar5 = (byte)uVar15;
      if ('\x05' < (char)bVar5) {
        if ((char)uVar8 != '\0') {
          uVar8 = (uint)(byte)((byte)(uVar8 >> 8) | 1) << 8;
        }
        uVar8 = CONCAT11((char)uVar11,(char)(uVar8 >> 8));
        uVar11 = uVar11 >> 8;
        bVar7 = bVar5 - 8;
        uVar15 = (uint)bVar7;
        if (bVar5 < 8 || bVar7 == 0) {
          if (bVar7 == 0) goto LAB_10a1_12a9;
          goto LAB_10a1_1288;
        }
      }
      if ((uVar8 & 0x3f) != 0) {
        uVar8 = uVar8 | 0x20;
      }
      do {
        uVar17 = uVar11 & 1;
        uVar11 = uVar11 >> 1;
        uVar8 = (uint)(CONCAT12(uVar17 != 0,uVar8) >> 1);
        uVar15 = uVar15 - 1;
      } while (uVar15 != 0);
    }
    else {
      bVar18 = uVar8 != 0;
      uVar8 = uVar11;
      if (bVar18) {
        uVar8 = uVar11 | 1;
      }
      uVar11 = 0;
      uVar15 = (uint)(byte)(bVar5 - 0x10);
      if (0xf < bVar5) {
        if ((byte)(bVar5 - 0x10) == 0) goto LAB_10a1_12a9;
        goto LAB_10a1_126d;
      }
LAB_10a1_1288:
      do {
        bVar18 = (int)uVar8 < 0;
        uVar8 = uVar8 << 1;
        uVar11 = uVar11 << 1 | (uint)bVar18;
        bVar5 = (char)uVar15 + 1;
        uVar15 = (uint)bVar5;
      } while (bVar5 != 0);
    }
  }
LAB_10a1_12a9:
  if ((uVar8 & 0x3f) != 0) {
    uVar8 = uVar8 | 0x20;
  }
  bVar5 = cVar2 << 1;
  uVar4 = CONCAT11(cVar6,bVar5);
  if (cVar2 < '\0' == (char)bVar5 < '\0') {
    uVar9 = uVar8 + uVar10;
    uVar17 = (uint)CARRY2(uVar8,uVar10);
    uVar10 = uVar11 + uVar13;
    uVar12 = uVar10 + uVar17;
    uVar15 = uVar12;
    if (CARRY2(uVar11,uVar13) || CARRY2(uVar10,uVar17)) {
      uVar15 = (uint)(CONCAT12(CARRY2(uVar11,uVar13) || CARRY2(uVar10,uVar17),uVar12) >> 1);
      uVar9 = (uint)(CONCAT12((uVar12 & 1) != 0,uVar9) >> 1);
      uVar4 = CONCAT11(cVar6 + '\x01',bVar5);
      if ((char)(cVar6 + '\x01') == '\0') goto LAB_10a1_0fee_1;
    }
  }
  else {
    uVar17 = uVar10 - uVar8;
    uVar15 = (uVar13 - uVar11) - (uint)(uVar10 < uVar8);
    if (uVar13 < uVar11 || uVar13 - uVar11 < (uint)(uVar10 < uVar8)) {
      bVar18 = uVar17 == 0;
      uVar17 = -uVar17;
      uVar15 = ~uVar15 + (uint)bVar18;
      uVar4 = CONCAT11(cVar6,~bVar5);
    }
    uVar9 = uVar17;
    if ((uVar15 == 0) &&
       ((bVar5 = (byte)(uVar4 >> 8), cVar6 = bVar5 - 0x10, uVar4 = CONCAT11(cVar6,(char)uVar4),
        bVar5 < 0x10 || cVar6 == '\0' || (uVar9 = 0, uVar15 = uVar17, uVar17 == 0)))) {
LAB_10a1_1337:
      *(undefined1 *)0xad = 0;
      return;
    }
    if ((char)(uVar15 >> 8) == '\0') {
      bVar5 = (byte)(uVar4 >> 8);
      cVar6 = bVar5 - 8;
      uVar4 = CONCAT11(cVar6,(char)uVar4);
      if (bVar5 < 8 || cVar6 == '\0') goto LAB_10a1_1337;
      uVar17 = uVar9 >> 8;
      uVar9 = uVar9 << 8;
      uVar15 = CONCAT11((char)uVar15,(char)uVar17);
    }
    if (-1 < (int)uVar15) {
      do {
        cVar6 = (char)(uVar4 >> 8) + -1;
        uVar4 = CONCAT11(cVar6,(char)uVar4);
        if (cVar6 == '\0') goto LAB_10a1_1337;
        bVar18 = (int)uVar9 < 0;
        uVar9 = uVar9 << 1;
        uVar1 = (ulong)CONCAT12(bVar18,uVar15) << 1;
        uVar15 = (uint)uVar1 | (uint)bVar18;
      } while (((uVar1 & 0x10000) != 0) == (int)uVar15 < 0);
    }
  }
  bVar5 = (byte)(uVar9 >> 8);
  if ((0x80 < (byte)uVar9) ||
     ((uVar10 = uVar9, uVar13 = uVar15, 0x7f < (byte)uVar9 && ((uVar9 & 0x100) != 0)))) {
    uVar10 = (uint)(byte)(bVar5 + 1) << 8;
    uVar17 = (uint)(0xfe < bVar5);
    uVar13 = uVar15 + uVar17;
    if ((CARRY2(uVar15,uVar17)) &&
       (cVar6 = (char)(uVar4 >> 8) + '\x01', uVar4 = CONCAT11(cVar6,(char)uVar4), cVar6 == '\0')) {
LAB_10a1_0fee_1:
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      (*(code *)*(undefined2 *)0x5e4)();
      return;
    }
  }
LAB_10a1_1320:
  *(undefined2 *)0xac =
       CONCAT11((char)((uVar4 & 0xff80) >> 8),(byte)(uVar4 & 0xff80) | (byte)(uVar13 >> 8) & 0x7f);
  *(undefined2 *)0xaa = CONCAT11((char)uVar13,(char)(uVar10 >> 8));
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void __cdecl16near FUN_10a1_12da(void)

{
  uint uVar1;
  ulong uVar2;
  uint in_AX;
  byte bVar4;
  char cVar3;
  uint in_DX;
  uint uVar5;
  uint in_BX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar6;
  
  uVar5 = in_DX;
  if ((in_BX == 0) &&
     ((bVar4 = (byte)(in_AX >> 8), cVar3 = bVar4 - 0x10, in_AX = CONCAT11(cVar3,(char)in_AX),
      bVar4 < 0x10 || cVar3 == '\0' || (uVar5 = 0, in_BX = in_DX, in_DX == 0)))) {
LAB_10a1_1337:
    *(undefined1 *)0xad = 0;
    return;
  }
  if ((char)(in_BX >> 8) == '\0') {
    bVar4 = (byte)(in_AX >> 8);
    cVar3 = bVar4 - 8;
    in_AX = CONCAT11(cVar3,(char)in_AX);
    if (bVar4 < 8 || cVar3 == '\0') goto LAB_10a1_1337;
    uVar1 = uVar5 >> 8;
    uVar5 = uVar5 << 8;
    in_BX = CONCAT11((char)in_BX,(char)uVar1);
  }
  if (-1 < (int)in_BX) {
    do {
      cVar3 = (char)(in_AX >> 8) + -1;
      in_AX = CONCAT11(cVar3,(char)in_AX);
      if (cVar3 == '\0') goto LAB_10a1_1337;
      bVar6 = (int)uVar5 < 0;
      uVar5 = uVar5 << 1;
      uVar2 = (ulong)CONCAT12(bVar6,in_BX) << 1;
      in_BX = (uint)uVar2 | (uint)bVar6;
    } while (((uVar2 & 0x10000) != 0) == (int)in_BX < 0);
  }
  bVar4 = (byte)(uVar5 >> 8);
  if ((0x80 < (byte)uVar5) || ((0x7f < (byte)uVar5 && ((uVar5 & 0x100) != 0)))) {
    uVar5 = (uint)(byte)(bVar4 + 1) << 8;
    uVar1 = (uint)(0xfe < bVar4);
    bVar6 = CARRY2(in_BX,uVar1);
    in_BX = in_BX + uVar1;
    if ((bVar6) &&
       (cVar3 = (char)(in_AX >> 8) + '\x01', in_AX = CONCAT11(cVar3,(char)in_AX), cVar3 == '\0')) {
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      (*(code *)*(undefined2 *)0x5e4)();
      return;
    }
  }
  *(undefined2 *)0xac =
       CONCAT11((char)((in_AX & 0xff80) >> 8),(byte)(in_AX & 0xff80) | (byte)(in_BX >> 8) & 0x7f);
  *(undefined2 *)0xaa = CONCAT11((char)in_BX,(char)(uVar5 >> 8));
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void __cdecl16near FUN_10a1_1308(void)

{
  bool bVar1;
  uint in_AX;
  char cVar2;
  byte in_DL;
  byte in_DH;
  uint in_BX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar3;
  
  if ((0x80 < in_DL) || ((0x7f < in_DL && ((in_DH & 1) != 0)))) {
    bVar3 = 0xfe < in_DH;
    in_DH = in_DH + 1;
    bVar1 = CARRY2(in_BX,(uint)bVar3);
    in_BX = in_BX + bVar3;
    if ((bVar1) &&
       (cVar2 = (char)(in_AX >> 8) + '\x01', in_AX = CONCAT11(cVar2,(char)in_AX), cVar2 == '\0')) {
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      (*(code *)*(undefined2 *)0x5e4)();
      return;
    }
  }
  *(undefined2 *)0xac =
       CONCAT11((char)((in_AX & 0xff80) >> 8),(byte)(in_AX & 0xff80) | (byte)(in_BX >> 8) & 0x7f);
  *(undefined2 *)0xaa = CONCAT11((char)in_BX,in_DH);
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_134b(void)

{
  undefined2 uVar1;
  bool bVar2;
  byte bVar3;
  uint uVar4;
  char cVar6;
  char cVar7;
  int iVar5;
  char cVar8;
  byte bVar10;
  uint uVar9;
  int iVar11;
  uint uVar12;
  int unaff_SI;
  int unaff_DI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  iVar11 = *(int *)(unaff_SI + 2);
  cVar6 = (char)((uint)iVar11 >> 8);
  bVar3 = (byte)iVar11;
  if (cVar6 != '\0') {
    uVar1 = *(undefined2 *)(unaff_DI + 2);
    cVar8 = (char)((uint)uVar1 >> 8);
    if (cVar8 != '\0') {
      cVar6 = cVar6 + '\x7f';
      cVar8 = cVar8 + -0x80;
      cVar7 = cVar6 + cVar8;
      if (SCARRY1(cVar6,cVar8)) {
        if (cVar7 < '\0') goto LAB_10a1_0fee_1;
      }
      else {
        cVar6 = cVar7 + -0x80;
        iVar5 = FUN_10a1_138a();
        if (iVar5 < 0) {
          if (cVar6 != -1) {
            FUN_10a1_1308();
            return;
          }
LAB_10a1_0fee_1:
          *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
          FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
          (*(code *)*(undefined2 *)0x5e4)();
          return;
        }
        uVar9 = iVar11 << 1;
        uVar12 = iVar5 << 1 | (uint)(iVar11 < 0);
        if (cVar6 != '\0') {
          bVar10 = (byte)(uVar9 >> 8);
          if ((0x80 < (byte)uVar9) || ((0x7f < (byte)uVar9 && ((uVar9 & 0x100) != 0)))) {
            uVar9 = (uint)(byte)(bVar10 + 1) << 8;
            uVar4 = (uint)(0xfe < bVar10);
            bVar2 = CARRY2(uVar12,uVar4);
            uVar12 = uVar12 + uVar4;
            if ((bVar2) && (cVar6 = cVar7 + -0x7f, cVar6 == '\0')) goto LAB_10a1_0fee_1;
          }
          uVar4 = CONCAT11(cVar6,bVar3 ^ (byte)uVar1) & 0xff80;
          *(undefined2 *)0xac =
               CONCAT11((char)(uVar4 >> 8),(byte)uVar4 | (byte)(uVar12 >> 8) & 0x7f);
          *(undefined2 *)0xaa = CONCAT11((char)uVar12,(char)(uVar9 >> 8));
          return;
        }
      }
    }
  }
  *(undefined1 *)0xad = 0;
  return;
}



int __cdecl16near FUN_10a1_138a(void)

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



// WARNING: Instruction at (ram,0x00011a08) overlaps instruction at (ram,0x00011a07)
// 
// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack
// WARNING: Removing unreachable block (ram,0x00011d7a)

void __cdecl16near FUN_10a1_13cb(void)

{
  undefined2 uVar1;
  undefined2 uVar2;
  bool bVar3;
  char cVar5;
  char cVar6;
  uint uVar4;
  char cVar7;
  byte bVar9;
  uint uVar8;
  uint uVar10;
  uint unaff_SI;
  int unaff_DI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  char cStack_1;
  
  uVar1 = *(undefined2 *)(unaff_DI + 2);
  uVar2 = *(undefined2 *)(unaff_SI + 2);
  cVar7 = (char)((uint)uVar1 >> 8);
  if (cVar7 == '\0') goto LAB_10a1_0fee_1;
  cVar5 = (char)((uint)uVar2 >> 8);
  if (cVar5 == '\0') {
LAB_10a1_1337:
    *(undefined1 *)0xad = 0;
    return;
  }
  cVar5 = cVar5 + -0x80;
  cVar7 = cVar7 + -0x80;
  cVar6 = cVar5 - cVar7;
  if (SBORROW1(cVar5,cVar7)) {
    if (-1 < cVar6) goto LAB_10a1_1337;
  }
  else {
    uVar8 = (*(uint *)(unaff_SI + 1) | 0x8000) >> 1;
    FUN_10a1_141f();
    uVar4 = FUN_10a1_141b();
    uVar10 = unaff_SI;
    if (uVar4 != 0 || uVar8 != 0) {
      uVar10 = unaff_SI | 1;
    }
    cStack_1 = cVar6 + -0x80;
    if (-1 < (int)unaff_SI) {
      uVar4 = uVar10 << 1;
      uVar10 = unaff_SI << 1 | (uint)((int)uVar10 < 0);
      if (cStack_1 != '\0') {
        bVar9 = (byte)(uVar4 >> 8);
        if ((0x80 < (byte)uVar4) || ((0x7f < (byte)uVar4 && ((uVar4 & 0x100) != 0)))) {
          uVar4 = (uint)(byte)(bVar9 + 1) << 8;
          uVar8 = (uint)(0xfe < bVar9);
          bVar3 = CARRY2(uVar10,uVar8);
          uVar10 = uVar10 + uVar8;
          if ((bVar3) && (cStack_1 = cVar6 + -0x7f, cStack_1 == '\0')) goto LAB_10a1_0fee_1;
        }
        uVar8 = CONCAT11(cStack_1,(byte)uVar2 ^ (byte)uVar1) & 0xff80;
        *(undefined2 *)0xac = CONCAT11((char)(uVar8 >> 8),(byte)uVar8 | (byte)(uVar10 >> 8) & 0x7f);
        *(undefined2 *)0xaa = CONCAT11((char)uVar10,(char)(uVar4 >> 8));
        return;
      }
      goto LAB_10a1_1337;
    }
    if (cStack_1 != -1) {
      FUN_10a1_1308();
      return;
    }
  }
LAB_10a1_0fee_1:
  *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
  FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x5e4)();
  return;
}



uint __cdecl16near FUN_10a1_141b(void)

{
  uint uVar1;
  uint uVar2;
  long lVar3;
  int in_AX;
  int iVar4;
  uint uVar5;
  uint in_CX;
  uint in_DX;
  uint uVar6;
  uint uVar7;
  uint in_BX;
  uint uVar8;
  bool bVar9;
  bool bVar10;
  
  if (in_DX < in_BX) {
    uVar6 = (uint)(CONCAT22(in_DX,in_AX) % (ulong)in_BX);
    if (in_CX == 0) {
      return 0;
    }
    lVar3 = (CONCAT22(in_DX,in_AX) / (ulong)in_BX & 0xffff) * (ulong)in_CX;
    uVar7 = (uint)((ulong)lVar3 >> 0x10);
    iVar4 = (int)lVar3;
    uVar5 = -iVar4;
    uVar1 = (uint)(iVar4 != 0);
    uVar2 = uVar6 - uVar7;
    uVar8 = uVar2 - uVar1;
    if (uVar7 <= uVar6 && uVar1 <= uVar2) {
      return uVar5;
    }
  }
  else {
    uVar8 = in_DX + (in_AX - in_CX);
    uVar5 = in_CX;
    if (CARRY2(in_DX,in_AX - in_CX)) {
      return in_CX;
    }
  }
  do {
    bVar9 = CARRY2(uVar5,in_CX);
    uVar5 = uVar5 + in_CX;
    bVar10 = CARRY2(uVar8,in_BX);
    uVar6 = uVar8 + in_BX;
    uVar8 = uVar6 + bVar9;
  } while (!bVar10 && !CARRY2(uVar6,(uint)bVar9));
  return uVar5;
}



uint __cdecl16near FUN_10a1_141f(void)

{
  uint uVar1;
  uint uVar2;
  long lVar3;
  undefined2 in_AX;
  uint uVar4;
  int iVar5;
  uint in_CX;
  undefined2 in_DX;
  uint uVar6;
  uint uVar7;
  uint in_BX;
  uint uVar8;
  bool bVar9;
  bool bVar10;
  
  uVar6 = (uint)(CONCAT22(in_DX,in_AX) % (ulong)in_BX);
  uVar4 = 0;
  if (in_CX != 0) {
    lVar3 = (CONCAT22(in_DX,in_AX) / (ulong)in_BX & 0xffff) * (ulong)in_CX;
    uVar7 = (uint)((ulong)lVar3 >> 0x10);
    iVar5 = (int)lVar3;
    uVar4 = -iVar5;
    uVar1 = (uint)(iVar5 != 0);
    uVar2 = uVar6 - uVar7;
    uVar8 = uVar2 - uVar1;
    if (uVar6 < uVar7 || uVar2 < uVar1) {
      do {
        bVar9 = CARRY2(uVar4,in_CX);
        uVar4 = uVar4 + in_CX;
        bVar10 = CARRY2(uVar8,in_BX);
        uVar6 = uVar8 + in_BX;
        uVar8 = uVar6 + bVar9;
      } while (!bVar10 && !CARRY2(uVar6,(uint)bVar9));
    }
  }
  return uVar4;
}



uint FUN_10a1_146c(void)

{
  uint *puVar1;
  uint *puVar2;
  uint uVar3;
  byte bVar4;
  char cVar6;
  uint uVar5;
  int iVar7;
  int unaff_SI;
  uint *puVar8;
  uint *puVar9;
  int unaff_DI;
  uint *puVar10;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  FUN_10a1_1736();
  iVar7 = 2;
  puVar8 = (uint *)(unaff_SI + 2);
  puVar10 = (uint *)(unaff_DI + 2);
  uVar5 = *puVar8;
  bVar4 = (byte)uVar5;
  cVar6 = (char)(uVar5 >> 8);
  if ((char)(*puVar10 >> 8) == '\0') {
    if (cVar6 != '\0') {
      uVar5 = CONCAT11(cVar6,(char)((uVar5 & 0xff) << 1));
    }
  }
  else {
    if (cVar6 == '\0') {
      return uVar5;
    }
    uVar3 = (uVar5 & 0xff) << 1;
    uVar5 = CONCAT11(cVar6,(char)uVar3);
    if (-1 < (char)((byte)*puVar10 ^ bVar4)) {
      puVar9 = puVar8;
      if ((uVar3 & 0x100) != 0) {
        puVar9 = puVar10;
        puVar10 = puVar8;
      }
      do {
        if (iVar7 == 0) {
          return uVar5;
        }
        iVar7 = iVar7 + -1;
        puVar2 = puVar10;
        puVar1 = puVar9;
        puVar9 = puVar9 + -1;
        puVar10 = puVar10 + -1;
      } while (*puVar1 == *puVar2);
      return uVar5;
    }
  }
  return uVar5;
}



uint __cdecl16near FUN_10a1_146f(void)

{
  uint *puVar1;
  uint *puVar2;
  uint uVar3;
  byte bVar4;
  char cVar6;
  uint uVar5;
  int iVar7;
  int unaff_SI;
  uint *puVar8;
  uint *puVar9;
  int unaff_DI;
  uint *puVar10;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  iVar7 = 2;
  puVar8 = (uint *)(unaff_SI + 2);
  puVar10 = (uint *)(unaff_DI + 2);
  uVar5 = *puVar8;
  bVar4 = (byte)uVar5;
  cVar6 = (char)(uVar5 >> 8);
  if ((char)(*puVar10 >> 8) == '\0') {
    if (cVar6 != '\0') {
      uVar5 = CONCAT11(cVar6,(char)((uVar5 & 0xff) << 1));
    }
  }
  else {
    if (cVar6 == '\0') {
      return uVar5;
    }
    uVar3 = (uVar5 & 0xff) << 1;
    uVar5 = CONCAT11(cVar6,(char)uVar3);
    if (-1 < (char)((byte)*puVar10 ^ bVar4)) {
      puVar9 = puVar8;
      if ((uVar3 & 0x100) != 0) {
        puVar9 = puVar10;
        puVar10 = puVar8;
      }
      do {
        if (iVar7 == 0) {
          return uVar5;
        }
        iVar7 = iVar7 + -1;
        puVar2 = puVar10;
        puVar1 = puVar9;
        puVar9 = puVar9 + -1;
        puVar10 = puVar10 + -1;
      } while (*puVar1 == *puVar2);
      return uVar5;
    }
  }
  return uVar5;
}



void __cdecl16far thunk_FUN_10a1_162c(void)

{
  FUN_10a1_162c();
  return;
}



void __cdecl16far FUN_10a1_162c(void)

{
  undefined2 in_DX;
  undefined2 *extraout_DX;
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  *(BADSPACEBASE **)0x5e6 = register0x00000010;
  FUN_10a1_2fd5();
  *extraout_DX = in_DX;
  *(undefined2 *)((int)extraout_DX + 1) = in_BX;
  return;
}



// WARNING: Unable to track spacebase fully for stack

void FUN_10a1_165e(undefined2 param_1)

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
  FUN_10a1_003c(*(undefined2 *)(puVar6 + -2),*puVar6);
  return;
}



void __cdecl16far FUN_10a1_169a(undefined1 param_1)

{
  undefined2 unaff_DS;
  
  *(undefined1 *)0xb0 = 5;
  *(undefined1 **)0xae = &param_1;
  return;
}



void FUN_10a1_16b4(void)

{
  undefined2 *unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  *unaff_DI = *(undefined2 *)0xaa;
  unaff_DI[1] = *(undefined2 *)0xac;
  return;
}



void __cdecl16far FUN_10a1_16b7(void)

{
  undefined2 *unaff_SI;
  undefined2 *unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  *unaff_DI = *unaff_SI;
  unaff_DI[1] = unaff_SI[1];
  return;
}



void __cdecl16far FUN_10a1_16ce(void)

{
  undefined2 *unaff_SI;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  *(undefined2 *)0xaa = *unaff_SI;
  *(undefined2 *)0xac = unaff_SI[1];
  return;
}



void FUN_10a1_1716(void)

{
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  
  *(undefined2 *)0x606 = in_stack_00000000;
                    // WARNING: Could not recover jumptable at 0x00012142. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x606)();
  return;
}



undefined2 __cdecl16far FUN_10a1_1736(void)

{
  undefined2 unaff_DI;
  undefined2 unaff_DS;
  undefined2 in_stack_00000000;
  undefined1 auStack_7ffe [32762];
  
  *(undefined2 *)0x606 = in_stack_00000000;
  *(int *)0x5e6 = (int)register0x00000010 + 2;
  (*(code *)*(undefined2 *)0x606)();
  return unaff_DI;
}



// WARNING: Instruction at (ram,0x00011a29) overlaps instruction at (ram,0x00011a28)
// 
// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

int __cdecl16far FUN_10a1_1757(void)

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
  
  *(BADSPACEBASE **)0x5e6 = register0x00000010;
  FUN_10a1_30e6();
  FUN_10a1_3055();
  pcVar3 = (code *)swi(0x21);
  cVar4 = (*pcVar3)();
  if ((cVar4 == '\0') && (*(char *)0x88b != ' ')) {
    if (*(char *)0x893 == ' ') {
      *(undefined2 *)0x893 = 0x5845;
      *(undefined1 *)0x895 = 0x45;
    }
    pcVar3 = (code *)swi(0x21);
    cVar4 = (*pcVar3)();
    if (cVar4 == '\0') {
      *(undefined2 *)0x8ab = 0;
      *(undefined2 *)0x8ad = 0;
      *(undefined2 *)0x898 = 1;
      pcVar3 = (code *)swi(0x21);
      (*pcVar3)();
      pcVar3 = (code *)swi(0x21);
      (*pcVar3)();
      uVar5 = *(int *)0x878 + 0x1fU & 0xffe0;
      *(uint *)0x8ab = uVar5;
      *(undefined2 *)0x898 = 0x10;
      iVar6 = *(int *)0x2;
      iStack000c = *(int *)0xe + 0x10;
      iVar7 = ((*(int *)0x874 + -1) * 0x20 - uVar5) + (*(int *)0x872 + 0xfU >> 4);
      *(int *)0x874 = iVar7;
      if (iVar7 + iStack000c + 0x20U <= iVar6 - 0x10U) {
        uStack000a = 0x2210;
        FUN_10a1_338d();
        uStack000a = 0x2213;
        FUN_10a1_37e1();
        uStack000a = 0x2216;
        FUN_10a1_32e9();
        uStack000a = 0x2219;
        FUN_10a1_018b();
        puVar8 = (undefined2 *)0x1837;
        puVar9 = (undefined2 *)0x0;
        for (iVar6 = 0x58; iVar6 != 0; iVar6 = iVar6 + -1) {
          puVar2 = puVar9;
          puVar9 = puVar9 + 1;
          puVar1 = puVar8;
          puVar8 = puVar8 + 1;
          *puVar2 = *puVar1;
        }
        puVar8 = (undefined2 *)0x870;
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
  *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
  FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
  iVar6 = (*(code *)*(undefined2 *)0x5e4)();
  return iVar6;
}



void FUN_10a1_18f5(void)

{
  FUN_10a1_1736();
  FUN_10a1_373c();
  return;
}



void FUN_10a1_18fb(void)

{
  FUN_10a1_1736();
  FUN_10a1_376f();
  FUN_10a1_2c0e();
  return;
}



void FUN_10a1_1904(void)

{
  undefined2 uVar1;
  undefined2 in_CX;
  undefined2 extraout_DX;
  undefined2 unaff_DS;
  
  FUN_10a1_1736();
  FUN_10a1_376f();
  uVar1 = *(undefined2 *)0x5ca;
  FUN_10a1_2c0e();
  *(undefined2 *)0x5ca = in_CX;
  FUN_10a1_2c0e();
  *(undefined2 *)0x5cc = extraout_DX;
  *(undefined2 *)0x5ca = in_CX;
  FUN_10a1_2c0e();
  *(undefined2 *)0x5ca = uVar1;
  FUN_10a1_2c0e();
  return;
}



void __cdecl16near FUN_10a1_193d(void)

{
  undefined1 uVar1;
  undefined2 uVar2;
  int iVar3;
  undefined2 unaff_DS;
  
  FUN_10a1_1736();
  FUN_10a1_376f();
  iVar3 = FUN_10a1_3759();
  *(int *)0x608 = iVar3 + 1;
  iVar3 = FUN_10a1_3764();
  iVar3 = iVar3 + 1;
  FUN_10a1_2897();
  do {
    uVar2 = *(undefined2 *)0x763;
    uVar1 = *(undefined1 *)0x761;
    FUN_10a1_294b();
    *(undefined1 *)0x761 = uVar1;
    *(undefined2 *)0x763 = uVar2;
    FUN_10a1_281a();
    iVar3 = iVar3 + -1;
  } while (iVar3 != 0);
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_1983(void)

{
  int in_CX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar1;
  
  FUN_10a1_1736();
  bVar1 = in_CX != -1;
  FUN_10a1_28e4();
  if (bVar1) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  FUN_10a1_373c();
  if (bVar1) {
    FUN_10a1_2897();
    FUN_10a1_287b();
  }
  return;
}



undefined2 __cdecl16far FUN_10a1_19fc(void)

{
  undefined2 in_AX;
  
  return in_AX;
}



undefined2 __cdecl16far FUN_10a1_1b5b(void)

{
  undefined2 uVar1;
  undefined2 in_BX;
  undefined2 unaff_ES;
  undefined4 uVar2;
  undefined1 *in_stack_00000000;
  undefined2 in_stack_00000002;
  
  *(undefined1 *)0x60e = *in_stack_00000000;
  *(undefined2 *)0x60c = in_BX;
  *(undefined2 *)0x5f8 = 0;
  *(undefined2 *)0x5e4 = 0x1cf9;
  *(undefined2 *)0x610 = 0x1ba6;
  FUN_10a1_3838();
  if ((*(byte *)0x60e & 2) == 0) {
    FUN_10a1_3313();
    FUN_10a1_3313();
  }
  uVar1 = FUN_10a1_2cc2();
  if ((*(byte *)0x60e & 1) == 0) {
    uVar2 = FUN_10a1_379a();
    uVar1 = (undefined2)uVar2;
  }
  return uVar1;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16far FUN_10a1_1bdd(void)

{
  int *in_AX;
  int *in_BX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(BADSPACEBASE **)0x5e6 = register0x00000010;
  if (SCARRY2(*in_AX,*in_BX)) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  FUN_10a1_2fd5();
  FUN_10a1_1c03();
  FUN_10a1_1c03();
  return;
}



void FUN_10a1_1c03(void)

{
  undefined2 *puVar1;
  undefined2 *puVar2;
  uint uVar3;
  uint uVar4;
  uint *unaff_SI;
  undefined2 *puVar5;
  undefined2 *unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  uVar3 = *unaff_SI;
  puVar5 = (undefined2 *)unaff_SI[1];
  for (uVar4 = uVar3 >> 1; uVar4 != 0; uVar4 = uVar4 - 1) {
    puVar2 = unaff_DI;
    unaff_DI = unaff_DI + 1;
    puVar1 = puVar5;
    puVar5 = puVar5 + 1;
    *puVar2 = *puVar1;
  }
  if ((uVar3 & 1) != 0) {
    *(undefined1 *)unaff_DI = *(undefined1 *)puVar5;
  }
  FUN_10a1_3055();
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_1d5c(undefined2 param_1,uint param_2,int param_3)

{
  uint *puVar1;
  char cVar2;
  int iVar3;
  uint uVar4;
  uint in_CX;
  int in_BX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 in_CF;
  undefined1 uVar5;
  bool bVar6;
  undefined1 uVar7;
  
  FUN_10a1_1736();
  FUN_10a1_376f();
  FUN_10a1_2b0f();
  if ((bool)in_CF) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  FUN_10a1_2897();
  puVar1 = (uint *)*(undefined2 *)0x770;
  uVar4 = *puVar1;
  if (uVar4 < 0x1000) {
    FUN_10a1_2f45(param_1,param_2,param_3);
    puVar1 = (uint *)*(undefined2 *)0x770;
    uVar4 = *puVar1;
  }
  puVar1 = puVar1 + 1;
  *(int *)0x72f = uVar4 - 1;
  *(int *)0x72b = (int)puVar1;
  *(int *)0x729 = (int)puVar1;
  iVar3 = (int)puVar1 + (uVar4 - 6);
  bVar6 = iVar3 == 0;
  *(int *)0x72d = iVar3;
  *(undefined2 *)0x727 = 0;
  FUN_10a1_1ed1();
  if (!bVar6) {
    FUN_10a1_1eb2();
    FUN_10a1_1e78();
    uVar4 = 0xc0;
    while( true ) {
      cVar2 = (char)uVar4;
      *(char *)0x724 = cVar2;
      uVar5 = 0;
      uVar7 = cVar2 == '\0';
      if ((bool)uVar7) break;
      if (cVar2 < '\0') {
        FUN_10a1_27ee();
      }
      else {
        FUN_10a1_280f();
      }
      if ((!(bool)uVar5) && (FUN_10a1_1ed1(), !(bool)uVar7)) {
        cVar2 = FUN_10a1_1eb2();
        if ((cVar2 != '\0') && (1 < in_BX)) {
          FUN_10a1_1e78();
        }
        if (*(char *)0x725 != '\0' || *(char *)0x726 != '\0') {
          FUN_10a1_1e78();
        }
        *(undefined2 *)0x763 = *(undefined2 *)0x765;
        *(undefined1 *)0x761 = *(undefined1 *)0x762;
        while( true ) {
          iVar3 = *(uint *)0x722 - *(uint *)0x720;
          bVar6 = iVar3 == 0;
          if (bVar6) break;
          if (*(uint *)0x722 < *(uint *)0x720) {
            if (iVar3 != -1 && 0 < -iVar3) {
              in_CX = -iVar3 - 1;
              do {
                FUN_10a1_2844();
                in_CX = in_CX - 1;
              } while (in_CX != 0);
              FUN_10a1_1e78();
            }
            break;
          }
          cVar2 = FUN_10a1_1ed1();
          if (bVar6) break;
          if (cVar2 != '\0') {
            in_BX = *(int *)0x765;
            in_CX = (uint)*(byte *)0x762;
            FUN_10a1_1e80();
          }
        }
      }
      uVar4 = FUN_10a1_1e52();
      *(int *)0x763 = in_BX;
      *(undefined1 *)0x761 = (char)in_CX;
    }
  }
  return;
}



void __cdecl16near FUN_10a1_1de9(void)

{
  char cVar1;
  uint uVar2;
  int iVar3;
  uint in_CX;
  int in_BX;
  undefined2 unaff_DS;
  undefined1 uVar4;
  undefined1 uVar5;
  bool bVar6;
  
  do {
    FUN_10a1_1e78();
    do {
      if (*(char *)0x725 != '\0' || *(char *)0x726 != '\0') {
        FUN_10a1_1e78();
      }
      *(undefined2 *)0x763 = *(undefined2 *)0x765;
      *(undefined1 *)0x761 = *(undefined1 *)0x762;
      while( true ) {
        iVar3 = *(uint *)0x722 - *(uint *)0x720;
        bVar6 = iVar3 == 0;
        if (bVar6) break;
        if (*(uint *)0x722 < *(uint *)0x720) {
          if (iVar3 != -1 && 0 < -iVar3) {
            in_CX = -iVar3 - 1;
            do {
              FUN_10a1_2844();
              in_CX = in_CX - 1;
            } while (in_CX != 0);
            FUN_10a1_1e78();
          }
          break;
        }
        cVar1 = FUN_10a1_1ed1();
        if (bVar6) break;
        if (cVar1 != '\0') {
          in_BX = *(int *)0x765;
          in_CX = (uint)*(byte *)0x762;
          FUN_10a1_1e80();
        }
      }
      do {
        uVar2 = FUN_10a1_1e52();
        *(int *)0x763 = in_BX;
        *(undefined1 *)0x761 = (char)in_CX;
        cVar1 = (char)uVar2;
        *(char *)0x724 = cVar1;
        uVar4 = 0;
        uVar5 = cVar1 == '\0';
        if ((bool)uVar5) {
          return;
        }
        if (cVar1 < '\0') {
          FUN_10a1_27ee();
        }
        else {
          FUN_10a1_280f();
        }
      } while (((bool)uVar4) || (FUN_10a1_1ed1(), (bool)uVar5));
      cVar1 = FUN_10a1_1eb2();
    } while ((cVar1 == '\0') || (in_BX < 2));
  } while( true );
}



uint __cdecl16near FUN_10a1_1e52(void)

{
  uint *puVar1;
  uint in_AX;
  uint uVar2;
  undefined2 in_DX;
  uint uVar3;
  undefined2 unaff_DS;
  
  uVar2 = in_AX & 0xff00;
  puVar1 = (uint *)0x727;
  uVar3 = *puVar1;
  *puVar1 = *puVar1 - 6;
  if (5 < uVar3) {
    uVar3 = *(int *)0x729 + 6;
    uVar2 = CONCAT11((char)((uint)in_DX >> 8),(char)((uint)*(undefined2 *)(*(int *)0x729 + 2) >> 8))
    ;
    if (*(uint *)0x72d <= uVar3) {
      uVar3 = *(int *)0x770 + 2;
    }
    *(uint *)0x729 = uVar3;
  }
  return uVar2;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void FUN_10a1_1e78(void)

{
  undefined1 uVar1;
  undefined2 uVar2;
  undefined2 *puVar3;
  undefined1 in_AL;
  undefined2 in_DX;
  undefined2 *puVar4;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  uVar2 = *(undefined2 *)0x763;
  uVar1 = *(undefined1 *)0x761;
  if (*(uint *)0x72f <= *(int *)0x727 + 6U) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  *(uint *)0x727 = *(int *)0x727 + 6U;
  puVar3 = (undefined2 *)*(undefined2 *)0x72b;
  *puVar3 = uVar2;
  puVar3[1] = CONCAT11(in_AL,uVar1);
  puVar4 = puVar3 + 3;
  puVar3[2] = in_DX;
  if ((undefined2 *)*(undefined2 *)0x72d <= puVar4) {
    puVar4 = (undefined2 *)(*(int *)0x770 + 2);
  }
  *(uint *)0x72b = (uint)puVar4;
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void __cdecl16near FUN_10a1_1e80(void)

{
  undefined2 *puVar1;
  undefined1 in_AL;
  undefined1 in_CL;
  undefined2 in_DX;
  undefined2 in_BX;
  undefined2 *puVar2;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if (*(uint *)0x72f <= *(int *)0x727 + 6U) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  *(uint *)0x727 = *(int *)0x727 + 6U;
  puVar1 = (undefined2 *)*(int *)0x72b;
  *puVar1 = in_BX;
  puVar1[1] = CONCAT11(in_AL,in_CL);
  puVar2 = puVar1 + 3;
  puVar1[2] = in_DX;
  if ((undefined2 *)*(uint *)0x72d <= puVar2) {
    puVar2 = (undefined2 *)(*(int *)0x770 + 2);
  }
  *(uint *)0x72b = (uint)puVar2;
  return;
}



void __cdecl16near FUN_10a1_1eb2(void)

{
  undefined1 uVar1;
  undefined2 uVar2;
  undefined1 in_CL;
  undefined2 unaff_DS;
  
  LOCK();
  uVar2 = *(undefined2 *)0x765;
  *(undefined2 *)0x765 = *(undefined2 *)0x763;
  UNLOCK();
  *(undefined2 *)0x763 = uVar2;
  LOCK();
  uVar1 = *(undefined1 *)0x762;
  *(undefined1 *)0x762 = *(undefined1 *)0x761;
  UNLOCK();
  *(undefined1 *)0x761 = uVar1;
  FUN_10a1_2ba3();
  *(undefined1 *)0x725 = in_CL;
  return;
}



void __cdecl16near FUN_10a1_1ed1(void)

{
  undefined1 in_CL;
  undefined2 extraout_DX;
  undefined2 in_BX;
  undefined2 unaff_DS;
  
  FUN_10a1_2bc9();
  *(undefined2 *)0x720 = in_BX;
  *(undefined2 *)0x722 = extraout_DX;
  *(undefined1 *)0x726 = in_CL;
  return;
}



void FUN_10a1_1ee4(void)

{
  undefined2 unaff_DS;
  
  *(BADSPACEBASE **)0x5e6 = register0x00000010;
  *(undefined1 *)0x88 = 0;
  FUN_10a1_268c();
  return;
}



void __cdecl16near FUN_10a1_2086(void)

{
  byte bVar1;
  byte bVar2;
  uint uVar3;
  undefined2 uVar4;
  undefined2 in_CX;
  undefined2 in_DX;
  int iVar5;
  undefined2 in_BX;
  uint uVar6;
  uint uVar7;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  FUN_10a1_1736();
  *(undefined2 *)0x5c6 = in_BX;
  *(undefined2 *)0x5c8 = in_DX;
  FUN_10a1_376f();
  FUN_10a1_23ed();
  FUN_10a1_134b();
  FUN_10a1_2484();
  *(undefined2 *)0x742 = in_CX;
  uVar6 = 0;
  if ((*(byte *)0x74a & 1) != 0) {
    FUN_10a1_21a5();
  }
  uVar7 = 0xffff;
  if ((*(byte *)0x74a & 2) != 0) {
    FUN_10a1_21a5();
  }
  uVar3 = uVar6;
  if (uVar7 < uVar6) {
    bVar2 = *(byte *)0x74a | 0x20;
    bVar1 = *(byte *)0x74a & 0x18;
    if ((bVar1 != 0) && (bVar1 != 0x18)) {
      bVar2 = bVar2 ^ 0x18;
    }
    *(byte *)0x74a = bVar2;
    uVar3 = uVar7;
    uVar7 = uVar6;
  }
  *(uint *)0x736 = uVar3;
  *(uint *)0x732 = uVar7;
  if ((*(byte *)0x74a & 4) == 0) {
    FUN_10a1_2938();
  }
  else {
    *(undefined2 *)0xaa = *(undefined2 *)0x73a;
    *(undefined2 *)0xac = *(undefined2 *)0x73c;
    if (0x80 < *(byte *)0xad) {
      *(byte *)0x74a = *(byte *)0x74a | 0x40;
      FUN_10a1_13cb();
    }
    *(char *)0xad = *(char *)0xad + '\b';
    FUN_10a1_2484();
  }
  *(uint *)0x73a = uVar7;
  uVar6 = 0x2142;
  uVar3 = 0;
  do {
    if ((uVar3 & 1) == 0) {
      *(int *)0x740 = (int)(uVar3 + 1) >> 1;
      FUN_10a1_2284();
      *(uint *)0x744 = uVar7;
      uVar4 = FUN_10a1_2284();
      *(undefined2 *)0x746 = uVar4;
      *(undefined2 *)0x73e = 0;
      FUN_10a1_21fd();
      iVar5 = *(int *)0x742;
      *(int *)0x73e = iVar5;
      *(int *)0x740 = iVar5 - *(int *)0x740;
      *(int *)0x744 = -*(int *)0x744;
      FUN_10a1_21fd();
      if (uVar6 <= uVar3) {
        *(undefined2 *)0x748 = 0;
        *(undefined1 *)0x74a = 0;
        return;
      }
    }
    uVar3 = uVar3 + 1;
    iVar5 = *(int *)0x748 + uVar3 * 2 + -1;
    if (-1 < iVar5) {
      iVar5 = iVar5 - (uVar6 * 2 + -1);
      uVar6 = uVar6 - 1;
    }
    *(int *)0x748 = iVar5;
  } while( true );
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_21a5(void)

{
  byte *pbVar1;
  byte in_AL;
  undefined2 *unaff_SI;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 uVar2;
  undefined1 uVar3;
  
  *(undefined2 *)0xaa = *unaff_SI;
  *(undefined2 *)0xac = unaff_SI[1];
  if (*(char *)0xad != '\0') {
    uVar3 = (*(byte *)0xac & 0x80) == 0;
    if (!(bool)uVar3) {
      *(byte *)0x74a = *(byte *)0x74a | in_AL;
      pbVar1 = (byte *)0xac;
      *pbVar1 = *pbVar1 ^ 0x80;
      uVar3 = *pbVar1 == 0;
    }
    uVar2 = 0;
    FUN_10a1_134b();
    FUN_10a1_146f();
    if (!(bool)uVar2 && !(bool)uVar3) {
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      (*(code *)*(undefined2 *)0x5e4)();
      return;
    }
    *(undefined2 *)0x846 = *(undefined2 *)0xaa;
    *(undefined2 *)0x848 = *(undefined2 *)0xac;
    FUN_10a1_23ed();
    FUN_10a1_134b();
    FUN_10a1_2484();
  }
  return;
}



void __cdecl16near FUN_10a1_21fd(void)

{
  int iVar1;
  byte bVar2;
  int iVar3;
  uint uVar4;
  int unaff_BP;
  int unaff_DI;
  undefined2 unaff_DS;
  bool bVar5;
  
  iVar3 = 4;
  do {
    iVar1 = *(int *)0x73e;
    *(int *)0x73e = *(int *)0x742 * 2 + iVar1;
    uVar4 = *(int *)0x740 + iVar1;
    if (uVar4 == *(uint *)0x736) {
      if ((*(byte *)0x74a & 8) == 0) goto LAB_10a1_225f;
      bVar2 = 0xf7;
LAB_10a1_224d:
      bVar5 = false;
      *(byte *)0x74a = *(byte *)0x74a & bVar2;
      FUN_10a1_2901();
      if (bVar5) {
        FUN_10a1_2c0e();
      }
    }
    else {
      if (uVar4 < *(uint *)0x736) {
LAB_10a1_2233:
        if ((*(byte *)0x74a & 0x20) == 0) goto LAB_10a1_2270;
      }
      else if (uVar4 == *(uint *)0x732) {
        if ((*(byte *)0x74a & 0x10) != 0) {
          bVar2 = 0xef;
          goto LAB_10a1_224d;
        }
      }
      else {
        if (*(uint *)0x732 <= uVar4) goto LAB_10a1_2233;
        if ((*(byte *)0x74a & 0x20) != 0) goto LAB_10a1_2270;
      }
LAB_10a1_225f:
      bVar5 = false;
      FUN_10a1_2901();
      if (bVar5) {
        FUN_10a1_2897();
        FUN_10a1_287b();
      }
    }
LAB_10a1_2270:
    iVar3 = iVar3 + -1;
    if (iVar3 == 0) {
      return;
    }
    LOCK();
    iVar1 = *(int *)0x744;
    *(int *)0x744 = unaff_BP;
    UNLOCK();
    unaff_BP = -iVar1;
    LOCK();
    iVar1 = *(int *)0x746;
    *(int *)0x746 = unaff_DI;
    UNLOCK();
    unaff_DI = -iVar1;
  } while( true );
}



void __cdecl16near FUN_10a1_2284(void)

{
  return;
}



int FUN_10a1_22c3(void)

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
  
  FUN_10a1_22dc();
  FUN_10a1_22dc();
  iVar5 = FUN_10a1_22dc();
  *(byte *)(unaff_BP + unaff_SI) = *(byte *)(unaff_BP + unaff_SI) | (byte)iVar5;
  FUN_10a1_22dc();
  FUN_10a1_22dc();
  *(undefined2 *)0x83c = in_stack_00000000;
  FUN_10a1_1736();
  uVar2 = *(undefined2 *)*(undefined2 *)0x83c;
  *(undefined2 *)0x83c = uVar2;
  cVar4 = (char)uVar2;
  if (cVar4 == '\x03') {
    if (*(char *)0x74d != '\0') goto LAB_10a1_2334;
    if (*(char *)0x74c == '\0') {
      uStack0002 = 0x2d5f;
      FUN_10a1_23a1();
      uStack0002 = 0x2d62;
      FUN_10a1_3838();
      uStack0002 = 0x2d65;
      iVar5 = FUN_10a1_3055();
      goto LAB_10a1_2327;
    }
    uStack0002 = 0x2d6c;
    FUN_10a1_3313();
    uStack0002 = 0x2d6f;
    FUN_10a1_3838();
    uStack0002 = 0x2d72;
    FUN_10a1_3055();
    uStack0002 = 0x2d77;
    uVar9 = FUN_10a1_3313();
    uVar6 = (undefined1)((ulong)uVar9 >> 8);
LAB_10a1_2372:
    iVar5 = CONCAT11(uVar6,0x2c);
    if (*(char *)0x83d != '\x01') goto LAB_10a1_2327;
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
    if (*(char *)0x74d != '\0') {
LAB_10a1_2334:
      uStack0002 = 0x2d48;
      iVar5 = (*(code *)*(undefined2 *)0x74e)();
      goto LAB_10a1_2327;
    }
    uStack0002 = 0x2d22;
    FUN_10a1_3b5c();
    if (*(char *)0x74c != '\0') {
      uStack0002 = 0x2d82;
      FUN_10a1_23cb();
      uVar6 = extraout_AH;
      goto LAB_10a1_2372;
    }
    uStack0002 = 0x2d2f;
    FUN_10a1_23a1();
    uStack0002 = 0x2d32;
    FUN_10a1_23cb();
  }
  uStack0002 = 0x2d37;
  uVar9 = FUN_10a1_3313();
  iVar5 = (int)uVar9;
LAB_10a1_2327:
  if (*(byte *)0x83d == 0) {
    uStack0002 = 0x2d90;
    FUN_10a1_3324();
    uStack0002 = 0x2da3;
    uVar7 = FUN_10a1_23a1();
    iVar5 = uVar7 - 0xe;
    if (uVar7 < 0xe || iVar5 == 0) {
      return iVar5;
    }
    do {
      uStack0002 = 0x2dae;
      uVar9 = FUN_10a1_3313();
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
    return (int)uVar9;
  }
  if (*(byte *)0x83d < 2) {
    return iVar5;
  }
  uVar9 = FUN_10a1_379a();
  return (int)uVar9;
}



int FUN_10a1_22d7(void)

{
  undefined2 *puVar1;
  undefined2 uVar2;
  undefined2 *puVar3;
  char cVar4;
  undefined1 uVar6;
  undefined1 extraout_AH;
  int iVar5;
  uint uVar7;
  undefined2 *in_BX;
  undefined2 *puVar8;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined4 uVar9;
  undefined2 in_stack_00000000;
  undefined2 uStack0002;
  
  FUN_10a1_22dc();
  *(undefined2 *)0x83c = in_stack_00000000;
  FUN_10a1_1736();
  uVar2 = *(undefined2 *)*(undefined2 *)0x83c;
  *(undefined2 *)0x83c = uVar2;
  cVar4 = (char)uVar2;
  if (cVar4 == '\x03') {
    if (*(char *)0x74d != '\0') goto LAB_10a1_2334;
    if (*(char *)0x74c == '\0') {
      uStack0002 = 0x2d5f;
      FUN_10a1_23a1();
      uStack0002 = 0x2d62;
      FUN_10a1_3838();
      uStack0002 = 0x2d65;
      iVar5 = FUN_10a1_3055();
      goto LAB_10a1_2327;
    }
    uStack0002 = 0x2d6c;
    FUN_10a1_3313();
    uStack0002 = 0x2d6f;
    FUN_10a1_3838();
    uStack0002 = 0x2d72;
    FUN_10a1_3055();
    uStack0002 = 0x2d77;
    uVar9 = FUN_10a1_3313();
    uVar6 = (undefined1)((ulong)uVar9 >> 8);
LAB_10a1_2372:
    iVar5 = CONCAT11(uVar6,0x2c);
    if (*(char *)0x83d != '\x01') goto LAB_10a1_2327;
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
    if (*(char *)0x74d != '\0') {
LAB_10a1_2334:
      uStack0002 = 0x2d48;
      iVar5 = (*(code *)*(undefined2 *)0x74e)();
      goto LAB_10a1_2327;
    }
    uStack0002 = 0x2d22;
    FUN_10a1_3b5c();
    if (*(char *)0x74c != '\0') {
      uStack0002 = 0x2d82;
      FUN_10a1_23cb();
      uVar6 = extraout_AH;
      goto LAB_10a1_2372;
    }
    uStack0002 = 0x2d2f;
    FUN_10a1_23a1();
    uStack0002 = 0x2d32;
    FUN_10a1_23cb();
  }
  uStack0002 = 0x2d37;
  uVar9 = FUN_10a1_3313();
  iVar5 = (int)uVar9;
LAB_10a1_2327:
  if (*(byte *)0x83d == 0) {
    uStack0002 = 0x2d90;
    FUN_10a1_3324();
    uStack0002 = 0x2da3;
    uVar7 = FUN_10a1_23a1();
    iVar5 = uVar7 - 0xe;
    if (uVar7 < 0xe || iVar5 == 0) {
      return iVar5;
    }
    do {
      uStack0002 = 0x2dae;
      uVar9 = FUN_10a1_3313();
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
    return (int)uVar9;
  }
  if (*(byte *)0x83d < 2) {
    return iVar5;
  }
  uVar9 = FUN_10a1_379a();
  return (int)uVar9;
}



int __cdecl16near FUN_10a1_22dc(void)

{
  undefined2 *puVar1;
  undefined2 uVar2;
  undefined2 *puVar3;
  char cVar4;
  undefined1 uVar6;
  undefined1 extraout_AH;
  int iVar5;
  uint uVar7;
  undefined2 *in_BX;
  undefined2 *puVar8;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined4 uVar9;
  undefined2 in_stack_00000000;
  undefined2 uStack0002;
  
  *(undefined2 *)0x83c = in_stack_00000000;
  FUN_10a1_1736();
  uVar2 = *(undefined2 *)*(undefined2 *)0x83c;
  *(undefined2 *)0x83c = uVar2;
  cVar4 = (char)uVar2;
  if (cVar4 == '\x03') {
    if (*(char *)0x74d != '\0') goto LAB_10a1_2334;
    if (*(char *)0x74c == '\0') {
      uStack0002 = 0x2d5f;
      FUN_10a1_23a1();
      uStack0002 = 0x2d62;
      FUN_10a1_3838();
      uStack0002 = 0x2d65;
      iVar5 = FUN_10a1_3055();
      goto LAB_10a1_2327;
    }
    uStack0002 = 0x2d6c;
    FUN_10a1_3313();
    uStack0002 = 0x2d6f;
    FUN_10a1_3838();
    uStack0002 = 0x2d72;
    FUN_10a1_3055();
    uStack0002 = 0x2d77;
    uVar9 = FUN_10a1_3313();
    uVar6 = (undefined1)((ulong)uVar9 >> 8);
LAB_10a1_2372:
    iVar5 = CONCAT11(uVar6,0x2c);
    if (*(char *)0x83d != '\x01') goto LAB_10a1_2327;
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
    if (*(char *)0x74d != '\0') {
LAB_10a1_2334:
      uStack0002 = 0x2d48;
      iVar5 = (*(code *)*(undefined2 *)0x74e)();
      goto LAB_10a1_2327;
    }
    uStack0002 = 0x2d22;
    FUN_10a1_3b5c();
    if (*(char *)0x74c != '\0') {
      uStack0002 = 0x2d82;
      FUN_10a1_23cb();
      uVar6 = extraout_AH;
      goto LAB_10a1_2372;
    }
    uStack0002 = 0x2d2f;
    FUN_10a1_23a1();
    uStack0002 = 0x2d32;
    FUN_10a1_23cb();
  }
  uStack0002 = 0x2d37;
  uVar9 = FUN_10a1_3313();
  iVar5 = (int)uVar9;
LAB_10a1_2327:
  if (*(byte *)0x83d == 0) {
    uStack0002 = 0x2d90;
    FUN_10a1_3324();
    uStack0002 = 0x2da3;
    uVar7 = FUN_10a1_23a1();
    iVar5 = uVar7 - 0xe;
    if (uVar7 < 0xe || iVar5 == 0) {
      return iVar5;
    }
    do {
      uStack0002 = 0x2dae;
      uVar9 = FUN_10a1_3313();
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
    return (int)uVar9;
  }
  if (*(byte *)0x83d < 2) {
    return iVar5;
  }
  uVar9 = FUN_10a1_379a();
  return (int)uVar9;
}



undefined2 __cdecl16near FUN_10a1_23a1(void)

{
  undefined2 in_AX;
  byte extraout_AH;
  byte extraout_AH_00;
  char extraout_AH_01;
  byte bVar1;
  
  FUN_10a1_3335();
  if (extraout_AH != 0xff) {
    if ((char)((uint)in_AX >> 8) == '\0') {
      bVar1 = extraout_AH;
      FUN_10a1_3324();
      if ((extraout_AH_00 <= bVar1) && ((byte)in_AX <= (byte)(bVar1 - extraout_AH_00))) {
        return in_AX;
      }
    }
    FUN_10a1_3324();
    if (extraout_AH_01 != '\0') {
      FUN_10a1_379a();
    }
    in_AX = 0;
  }
  return in_AX;
}



void __cdecl16near FUN_10a1_23cb(void)

{
  char *pcVar1;
  char *unaff_SI;
  undefined2 unaff_DS;
  
  while (pcVar1 = unaff_SI, unaff_SI = unaff_SI + 1, *pcVar1 != '\0') {
    FUN_10a1_3313();
  }
  return;
}



void __cdecl16far FUN_10a1_23e0(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0xa6 = 0;
  *(undefined2 *)0xa8 = 0;
  return;
}



void FUN_10a1_23ed(void)

{
  FUN_10a1_12da();
  FUN_10a1_23e0();
  return;
}



undefined2 __cdecl16far FUN_10a1_240f(void)

{
  undefined2 in_AX;
  
  FUN_10a1_1308();
  return in_AX;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 FUN_10a1_2435(void)

{
  uint uVar1;
  uint uVar2;
  byte bVar3;
  undefined2 uVar4;
  undefined2 in_AX;
  byte bVar5;
  byte bVar6;
  undefined1 uVar7;
  uint uVar8;
  uint uVar9;
  uint *unaff_SI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(BADSPACEBASE **)0x5e6 = register0x00000010;
  uVar1 = unaff_SI[1];
  uVar2 = *unaff_SI;
  uVar8 = 0;
  bVar5 = (byte)(uVar1 >> 8);
  bVar3 = (byte)uVar1;
  if (bVar5 != 0) {
    if (bVar5 < 0x80) {
      if (((char)bVar3 < '\0') && (*(char *)0xb0 == '\x04')) {
        uVar8 = 0xffff;
      }
    }
    else {
      uVar7 = (undefined1)(uVar2 >> 8);
      bVar6 = 0x10 - (bVar5 + 0x80);
      if (0x10 < (byte)(bVar5 + 0x80)) {
LAB_10a1_0fee_1:
        *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
        FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
        uVar4 = (*(code *)*(undefined2 *)0x5e4)();
        return uVar4;
      }
      if (bVar6 == 0) {
        if ((CONCAT11(bVar3,uVar7) != -0x8000) ||
           ((uVar8 = 0x8000, (char)uVar2 != '\0' &&
            ((*(char *)0xb0 == '\x04' || ((uVar2 & 0x80) != 0)))))) goto LAB_10a1_0fee_1;
      }
      else {
        uVar9 = CONCAT11(bVar3,uVar7) | 0x8000;
        if (*(byte *)0xb0 == 4) {
          if ((char)bVar3 < '\0') {
            uVar8 = ~(uVar9 - ((char)uVar2 == '\0') >> (bVar6 & 0x1f));
          }
          else {
            uVar8 = uVar9 >> (bVar6 & 0x1f);
          }
        }
        else {
          bVar6 = bVar6 & 0x1f;
          uVar2 = (uint)(byte)((bVar6 == 0) * (*(byte *)0xb0 < 4) |
                              (bVar6 != 0) * ((uVar9 >> bVar6 - 1 & 1) != 0));
          uVar8 = (uVar9 >> bVar6) + uVar2;
          if (SCARRY2(uVar9 >> bVar6,uVar2)) {
            if (-1 < (int)(uVar1 << 8)) goto LAB_10a1_0fee_1;
          }
          else {
            if ((int)(uVar1 << 8) < 0) {
              uVar8 = -uVar8;
            }
            if ((int)((uint)(byte)(~bVar3 & (byte)(uVar8 >> 8)) << 8) < 0) goto LAB_10a1_0fee_1;
          }
        }
      }
    }
  }
  *(uint *)0xaa = uVar8;
  return in_AX;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 __cdecl16far FUN_10a1_2439(void)

{
  uint uVar1;
  uint uVar2;
  byte bVar3;
  undefined2 uVar4;
  undefined2 in_AX;
  byte bVar5;
  byte bVar6;
  undefined1 uVar7;
  uint uVar8;
  uint uVar9;
  uint *unaff_SI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  uVar1 = unaff_SI[1];
  uVar2 = *unaff_SI;
  uVar8 = 0;
  bVar5 = (byte)(uVar1 >> 8);
  bVar3 = (byte)uVar1;
  if (bVar5 != 0) {
    if (bVar5 < 0x80) {
      if (((char)bVar3 < '\0') && (*(char *)0xb0 == '\x04')) {
        uVar8 = 0xffff;
      }
    }
    else {
      uVar7 = (undefined1)(uVar2 >> 8);
      bVar6 = 0x10 - (bVar5 + 0x80);
      if (0x10 < (byte)(bVar5 + 0x80)) {
LAB_10a1_0fee_1:
        *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
        FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
        uVar4 = (*(code *)*(undefined2 *)0x5e4)();
        return uVar4;
      }
      if (bVar6 == 0) {
        if ((CONCAT11(bVar3,uVar7) != -0x8000) ||
           ((uVar8 = 0x8000, (char)uVar2 != '\0' &&
            ((*(char *)0xb0 == '\x04' || ((uVar2 & 0x80) != 0)))))) goto LAB_10a1_0fee_1;
      }
      else {
        uVar9 = CONCAT11(bVar3,uVar7) | 0x8000;
        if (*(byte *)0xb0 == 4) {
          if ((char)bVar3 < '\0') {
            uVar8 = ~(uVar9 - ((char)uVar2 == '\0') >> (bVar6 & 0x1f));
          }
          else {
            uVar8 = uVar9 >> (bVar6 & 0x1f);
          }
        }
        else {
          bVar6 = bVar6 & 0x1f;
          uVar2 = (uint)(byte)((bVar6 == 0) * (*(byte *)0xb0 < 4) |
                              (bVar6 != 0) * ((uVar9 >> bVar6 - 1 & 1) != 0));
          uVar8 = (uVar9 >> bVar6) + uVar2;
          if (SCARRY2(uVar9 >> bVar6,uVar2)) {
            if (-1 < (int)(uVar1 << 8)) goto LAB_10a1_0fee_1;
          }
          else {
            if ((int)(uVar1 << 8) < 0) {
              uVar8 = -uVar8;
            }
            if ((int)((uint)(byte)(~bVar3 & (byte)(uVar8 >> 8)) << 8) < 0) goto LAB_10a1_0fee_1;
          }
        }
      }
    }
  }
  *(uint *)0xaa = uVar8;
  return in_AX;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 __cdecl16far FUN_10a1_2446(void)

{
  uint uVar1;
  byte bVar2;
  undefined2 uVar3;
  undefined2 in_AX;
  int iVar4;
  byte bVar5;
  byte bVar6;
  uint in_CX;
  undefined1 uVar7;
  uint uVar8;
  uint uVar9;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  iVar4 = FUN_10a1_252b();
  uVar8 = 0;
  bVar5 = (byte)((uint)iVar4 >> 8);
  bVar2 = (byte)iVar4;
  if (bVar5 != 0) {
    if (bVar5 < 0x80) {
      if (((char)bVar2 < '\0') && (*(char *)0xb0 == '\x04')) {
        uVar8 = 0xffff;
      }
    }
    else {
      uVar7 = (undefined1)(in_CX >> 8);
      bVar6 = 0x10 - (bVar5 + 0x80);
      if (0x10 < (byte)(bVar5 + 0x80)) {
LAB_10a1_0fee_1:
        *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
        FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
        uVar3 = (*(code *)*(undefined2 *)0x5e4)();
        return uVar3;
      }
      if (bVar6 == 0) {
        if ((CONCAT11(bVar2,uVar7) != -0x8000) ||
           ((uVar8 = 0x8000, (char)in_CX != '\0' &&
            ((*(char *)0xb0 == '\x04' || ((in_CX & 0x80) != 0)))))) goto LAB_10a1_0fee_1;
      }
      else {
        uVar9 = CONCAT11(bVar2,uVar7) | 0x8000;
        if (*(byte *)0xb0 == 4) {
          if ((char)bVar2 < '\0') {
            uVar8 = ~(uVar9 - ((char)in_CX == '\0') >> (bVar6 & 0x1f));
          }
          else {
            uVar8 = uVar9 >> (bVar6 & 0x1f);
          }
        }
        else {
          bVar6 = bVar6 & 0x1f;
          uVar1 = (uint)(byte)((bVar6 == 0) * (*(byte *)0xb0 < 4) |
                              (bVar6 != 0) * ((uVar9 >> bVar6 - 1 & 1) != 0));
          uVar8 = (uVar9 >> bVar6) + uVar1;
          if (SCARRY2(uVar9 >> bVar6,uVar1)) {
            if (-1 < iVar4 << 8) goto LAB_10a1_0fee_1;
          }
          else {
            if (iVar4 << 8 < 0) {
              uVar8 = -uVar8;
            }
            if ((int)((uint)(byte)(~bVar2 & (byte)(uVar8 >> 8)) << 8) < 0) goto LAB_10a1_0fee_1;
          }
        }
      }
    }
  }
  *(uint *)0xaa = uVar8;
  return in_AX;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 FUN_10a1_2480(void)

{
  int iVar1;
  uint uVar2;
  byte bVar3;
  undefined2 uVar4;
  undefined2 in_AX;
  byte bVar5;
  byte bVar6;
  undefined1 uVar7;
  uint uVar8;
  uint uVar9;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(BADSPACEBASE **)0x5e6 = register0x00000010;
  iVar1 = *(int *)0xac;
  uVar2 = *(uint *)0xaa;
  uVar8 = 0;
  bVar5 = (byte)((uint)iVar1 >> 8);
  bVar3 = (byte)iVar1;
  if (bVar5 != 0) {
    if (bVar5 < 0x80) {
      if (((char)bVar3 < '\0') && (*(char *)0xb0 == '\x04')) {
        uVar8 = 0xffff;
      }
    }
    else {
      uVar7 = (undefined1)(uVar2 >> 8);
      bVar6 = 0x10 - (bVar5 + 0x80);
      if (0x10 < (byte)(bVar5 + 0x80)) {
LAB_10a1_0fee_1:
        *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
        FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
        uVar4 = (*(code *)*(undefined2 *)0x5e4)();
        return uVar4;
      }
      if (bVar6 == 0) {
        if ((CONCAT11(bVar3,uVar7) != -0x8000) ||
           ((uVar8 = 0x8000, (char)uVar2 != '\0' &&
            ((*(char *)0xb0 == '\x04' || ((uVar2 & 0x80) != 0)))))) goto LAB_10a1_0fee_1;
      }
      else {
        uVar9 = CONCAT11(bVar3,uVar7) | 0x8000;
        if (*(byte *)0xb0 == 4) {
          if ((char)bVar3 < '\0') {
            uVar8 = ~(uVar9 - ((char)uVar2 == '\0') >> (bVar6 & 0x1f));
          }
          else {
            uVar8 = uVar9 >> (bVar6 & 0x1f);
          }
        }
        else {
          bVar6 = bVar6 & 0x1f;
          uVar2 = (uint)(byte)((bVar6 == 0) * (*(byte *)0xb0 < 4) |
                              (bVar6 != 0) * ((uVar9 >> bVar6 - 1 & 1) != 0));
          uVar8 = (uVar9 >> bVar6) + uVar2;
          if (SCARRY2(uVar9 >> bVar6,uVar2)) {
            if (-1 < iVar1 << 8) goto LAB_10a1_0fee_1;
          }
          else {
            if (iVar1 << 8 < 0) {
              uVar8 = -uVar8;
            }
            if ((int)((uint)(byte)(~bVar3 & (byte)(uVar8 >> 8)) << 8) < 0) goto LAB_10a1_0fee_1;
          }
        }
      }
    }
  }
  *(uint *)0xaa = uVar8;
  return in_AX;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 __cdecl16far FUN_10a1_2484(void)

{
  int iVar1;
  uint uVar2;
  byte bVar3;
  undefined2 uVar4;
  undefined2 in_AX;
  byte bVar5;
  byte bVar6;
  undefined1 uVar7;
  uint uVar8;
  uint uVar9;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  iVar1 = *(int *)0xac;
  uVar2 = *(uint *)0xaa;
  uVar8 = 0;
  bVar5 = (byte)((uint)iVar1 >> 8);
  bVar3 = (byte)iVar1;
  if (bVar5 != 0) {
    if (bVar5 < 0x80) {
      if (((char)bVar3 < '\0') && (*(char *)0xb0 == '\x04')) {
        uVar8 = 0xffff;
      }
    }
    else {
      uVar7 = (undefined1)(uVar2 >> 8);
      bVar6 = 0x10 - (bVar5 + 0x80);
      if (0x10 < (byte)(bVar5 + 0x80)) {
LAB_10a1_0fee_1:
        *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
        FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
        uVar4 = (*(code *)*(undefined2 *)0x5e4)();
        return uVar4;
      }
      if (bVar6 == 0) {
        if ((CONCAT11(bVar3,uVar7) != -0x8000) ||
           ((uVar8 = 0x8000, (char)uVar2 != '\0' &&
            ((*(char *)0xb0 == '\x04' || ((uVar2 & 0x80) != 0)))))) goto LAB_10a1_0fee_1;
      }
      else {
        uVar9 = CONCAT11(bVar3,uVar7) | 0x8000;
        if (*(byte *)0xb0 == 4) {
          if ((char)bVar3 < '\0') {
            uVar8 = ~(uVar9 - ((char)uVar2 == '\0') >> (bVar6 & 0x1f));
          }
          else {
            uVar8 = uVar9 >> (bVar6 & 0x1f);
          }
        }
        else {
          bVar6 = bVar6 & 0x1f;
          uVar2 = (uint)(byte)((bVar6 == 0) * (*(byte *)0xb0 < 4) |
                              (bVar6 != 0) * ((uVar9 >> bVar6 - 1 & 1) != 0));
          uVar8 = (uVar9 >> bVar6) + uVar2;
          if (SCARRY2(uVar9 >> bVar6,uVar2)) {
            if (-1 < iVar1 << 8) goto LAB_10a1_0fee_1;
          }
          else {
            if (iVar1 << 8 < 0) {
              uVar8 = -uVar8;
            }
            if ((int)((uint)(byte)(~bVar3 & (byte)(uVar8 >> 8)) << 8) < 0) goto LAB_10a1_0fee_1;
          }
        }
      }
    }
  }
  *(uint *)0xaa = uVar8;
  return in_AX;
}



undefined2 __cdecl16near FUN_10a1_252b(void)

{
  int unaff_SI;
  undefined2 unaff_DS;
  
  return *(undefined2 *)(unaff_SI + 6);
}



undefined4 __cdecl16near FUN_10a1_25c0(void)

{
  byte in_AL;
  byte extraout_AH;
  byte bVar1;
  char extraout_AH_00;
  char cVar2;
  undefined2 extraout_DX;
  undefined2 unaff_DS;
  undefined4 uVar3;
  
  if (in_AL != 0xd) {
    if (in_AL == 8) {
      FUN_10a1_036f();
      FUN_10a1_0375();
      goto LAB_10a1_2612;
    }
    if (in_AL == 9) {
      do {
        FUN_10a1_3313();
        FUN_10a1_036f();
        bVar1 = extraout_AH;
        if (extraout_AH == 0xff) break;
        bVar1 = 0;
      } while ((extraout_AH & 7) != 0);
      return CONCAT22(extraout_DX,CONCAT11(bVar1,9));
    }
    if (in_AL < 0x20) goto LAB_10a1_2612;
    FUN_10a1_036f();
    cVar2 = extraout_AH_00;
    if ((*(char *)0x5ce != -1) && (extraout_AH_00 == *(char *)0x5ce)) {
      uVar3 = FUN_10a1_379a();
      cVar2 = (char)((ulong)uVar3 >> 8);
    }
    if (cVar2 == -1) goto LAB_10a1_2612;
  }
  FUN_10a1_0375();
LAB_10a1_2612:
  uVar3 = FUN_10a1_054e();
  return uVar3;
}



void thunk_FUN_10a1_036f(void)

{
  FUN_10a1_036f();
  return;
}



void __cdecl16near FUN_10a1_2618(void)

{
  return;
}



void __cdecl16far FUN_10a1_2621(void)

{
  FUN_10a1_0b93();
  return;
}



void __cdecl16far FUN_10a1_2637(void)

{
  undefined2 unaff_DS;
  
  *(undefined1 *)0x74c = 0;
  *(undefined2 *)0x5f8 = 0;
  *(undefined1 *)0x74d = 0;
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined2 __cdecl16far FUN_10a1_268c(void)

{
  byte bVar1;
  char cVar2;
  undefined2 in_AX;
  undefined2 uVar3;
  undefined2 in_CX;
  undefined2 *in_BX;
  byte *pbVar4;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 uVar5;
  bool bVar6;
  int iStackY_12;
  undefined2 uVar7;
  undefined2 uVar8;
  
  *(undefined2 *)0x750 = in_AX;
  uVar8 = 0;
  uVar7 = 0;
  uVar3 = *in_BX;
  iStackY_12 = in_BX[1];
  do {
    *(undefined2 *)0x752 = uVar3;
    *(int *)0x754 = iStackY_12;
    bVar6 = iStackY_12 == 0;
    if (bVar6) {
      FUN_10a1_3055();
      return in_CX;
    }
    iStackY_12 = 0x30cb;
    cVar2 = FUN_10a1_270e();
  } while (bVar6);
  pbVar4 = (byte *)*(undefined2 *)0x750;
  while( true ) {
    if ((byte)(*pbVar4 * '\x02') == '\0') {
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      uVar3 = (*(code *)*(undefined2 *)0x5e4)();
      return uVar3;
    }
    if ((byte)(cVar2 * '\x02') == (byte)(*pbVar4 * '\x02')) break;
    pbVar4 = pbVar4 + 3;
  }
  bVar1 = *pbVar4;
  if (CARRY1(bVar1,bVar1)) {
    uVar5 = 0;
    bVar6 = (bVar1 & 0x7f) == 0;
    FUN_10a1_270e();
    if (!bVar6) {
      FUN_10a1_2786();
      if ((bool)uVar5) {
        FUN_10a1_2743();
      }
      else {
        FUN_10a1_2734();
      }
    }
  }
                    // WARNING: Could not recover jumptable at 0x00013114. Too many branches
                    // WARNING: Treating indirect jump as call
  uVar3 = (**(code **)(pbVar4 + 1))(uVar7,uVar8);
  return uVar3;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_2708(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  FUN_10a1_270e();
  if ((bool)in_ZF) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  return;
}



void __cdecl16near FUN_10a1_270e(void)

{
  char cVar1;
  undefined2 unaff_DS;
  
  do {
    if (*(int *)0x752 == 0) {
      return;
    }
    *(int *)0x752 = *(int *)0x752 + -1;
    cVar1 = *(char *)*(undefined2 *)0x754;
    *(int *)0x754 = *(int *)0x754 + 1;
  } while ((cVar1 == ' ') || (cVar1 == ';'));
  return;
}



void __cdecl16near FUN_10a1_2734(void)

{
  undefined2 unaff_DS;
  
  *(int *)0x752 = *(int *)0x752 + 1;
  *(int *)0x754 = *(int *)0x754 + -1;
  return;
}



// WARNING: Instruction at (ram,0x00011a0b) overlaps instruction at (ram,0x00011a0a)
// 
// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void FUN_10a1_2740(void)

{
  undefined2 uVar1;
  char cVar2;
  byte bVar3;
  uint uVar4;
  char extraout_AH;
  int iVar5;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar6;
  ulong uVar7;
  
  do {
    uVar4 = FUN_10a1_2708();
    cVar2 = (char)uVar4;
    if (cVar2 == '=') {
      FUN_10a1_278e();
      if (extraout_AH == '\x02') {
        return;
      }
      uVar1 = *(undefined2 *)0xaa;
      if (extraout_AH == '\x04') {
        FUN_10a1_2439();
      }
      else {
        if (extraout_AH != '\b') goto LAB_10a1_0feb_1;
        FUN_10a1_2446();
      }
      *(undefined2 *)0xaa = uVar1;
      return;
    }
  } while (cVar2 == '+');
  if (cVar2 == '-') {
    FUN_10a1_2740();
    return;
  }
  uVar7 = (ulong)uVar4;
  iVar5 = 5;
  while( true ) {
    bVar3 = (byte)uVar7;
    if (bVar3 == 0x2c) break;
    if (bVar3 == 0x3b) {
      return;
    }
    if ((0x39 < bVar3) || (bVar3 < 0x30)) break;
    bVar6 = (int)(uVar7 >> 0x10) * 10 + (uint)(byte)(bVar3 - 0x30) == 0;
    uVar7 = FUN_10a1_270e();
    if (bVar6) {
      return;
    }
    iVar5 = iVar5 + -1;
    if (iVar5 == 0) {
LAB_10a1_0feb_1:
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      (*(code *)*(undefined2 *)0x5e4)();
      return;
    }
  }
  *(int *)0x752 = *(int *)0x752 + 1;
  *(int *)0x754 = *(int *)0x754 + -1;
  return;
}



// WARNING: Instruction at (ram,0x00011a0b) overlaps instruction at (ram,0x00011a0a)
// 
// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_2743(void)

{
  undefined2 uVar1;
  char cVar2;
  byte bVar3;
  uint in_AX;
  char extraout_AH;
  int iVar4;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar5;
  ulong uVar6;
  
  while (cVar2 = (char)in_AX, cVar2 != '=') {
    if (cVar2 != '+') {
      if (cVar2 == '-') {
        FUN_10a1_2740();
        return;
      }
      uVar6 = (ulong)in_AX;
      iVar4 = 5;
      goto LAB_10a1_275b;
    }
    in_AX = FUN_10a1_2708();
  }
  FUN_10a1_278e();
  if (extraout_AH == '\x02') {
    return;
  }
  uVar1 = *(undefined2 *)0xaa;
  if (extraout_AH == '\x04') {
    FUN_10a1_2439();
  }
  else {
    if (extraout_AH != '\b') goto LAB_10a1_0feb_1;
    FUN_10a1_2446();
  }
  *(undefined2 *)0xaa = uVar1;
  return;
  while( true ) {
    if (bVar3 == 0x3b) {
      return;
    }
    if ((0x39 < bVar3) || (bVar3 < 0x30)) goto FUN_10a1_2734;
    bVar5 = (int)(uVar6 >> 0x10) * 10 + (uint)(byte)(bVar3 - 0x30) == 0;
    uVar6 = FUN_10a1_270e();
    if (bVar5) {
      return;
    }
    iVar4 = iVar4 + -1;
    if (iVar4 == 0) break;
LAB_10a1_275b:
    bVar3 = (byte)uVar6;
    if (bVar3 == 0x2c) {
FUN_10a1_2734:
      *(int *)0x752 = *(int *)0x752 + 1;
      *(int *)0x754 = *(int *)0x754 + -1;
      return;
    }
  }
LAB_10a1_0feb_1:
  *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
  FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x5e4)();
  return;
}



void __cdecl16near FUN_10a1_2786(void)

{
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void __cdecl16near FUN_10a1_278e(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if (*(uint *)0x752 < 3) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  *(int *)0x754 = *(int *)0x754 + 3;
  *(int *)0x752 = *(int *)0x752 + -3;
  return;
}



void __cdecl16near FUN_10a1_27ee(void)

{
  uint uVar1;
  byte bVar2;
  undefined2 unaff_DS;
  
  uVar1 = *(uint *)0x763;
  if (0x4f < uVar1) {
    bVar2 = (byte)(uVar1 >> 8);
    if (0x1f < bVar2) {
      *(undefined2 *)0x763 = CONCAT11(bVar2 - 0x20,(char)uVar1);
      return;
    }
    *(int *)0x763 = uVar1 + 0x1fb0;
  }
  return;
}



void __cdecl16near FUN_10a1_280f(void)

{
  uint uVar1;
  byte bVar2;
  undefined2 unaff_DS;
  
  uVar1 = *(uint *)0x763;
  if (uVar1 < 0x3ef0) {
    bVar2 = (byte)(uVar1 >> 8);
    if (0x1f < bVar2) {
      *(int *)0x763 = uVar1 + 0xe050;
      return;
    }
    *(undefined2 *)0x763 = CONCAT11(bVar2 + 0x20,(char)uVar1);
  }
  return;
}



void __cdecl16near FUN_10a1_281a(void)

{
  int iVar1;
  byte bVar2;
  undefined2 unaff_DS;
  
  iVar1 = *(int *)0x763;
  bVar2 = (byte)((uint)iVar1 >> 8);
  if (bVar2 < 0x20) {
    *(undefined2 *)0x763 = CONCAT11(bVar2 + 0x20,(char)iVar1);
    return;
  }
  *(int *)0x763 = iVar1 + -0x1fb0;
  return;
}



void __cdecl16near FUN_10a1_2844(void)

{
  byte *pbVar1;
  byte bVar2;
  bool bVar3;
  byte bVar4;
  undefined2 unaff_DS;
  char in_CF;
  
  bVar2 = *(byte *)0x87;
  pbVar1 = (byte *)0x761;
  bVar4 = bVar2 & 7;
  *pbVar1 = *pbVar1 << bVar4 | *pbVar1 >> 8 - bVar4;
  bVar3 = (bVar2 & 0x1f) == 0;
  if ((bool)(bVar3 * in_CF | !bVar3 * ((*pbVar1 & 1) != 0))) {
    *(int *)0x763 = *(int *)0x763 + -1;
    return;
  }
  return;
}



void __cdecl16near FUN_10a1_2858(void)

{
  byte bVar1;
  byte bVar2;
  byte bVar3;
  byte bVar4;
  undefined2 unaff_DS;
  char cVar5;
  
  cVar5 = '\0';
  bVar4 = *(byte *)0x761;
  bVar3 = *(byte *)*(undefined2 *)0x763 & *(byte *)0x761;
  while( true ) {
    bVar1 = *(byte *)0x87 & 0x1f;
    if ((bool)((bVar1 == 0) * cVar5 | (bVar1 != 0) * ((bVar4 >> bVar1 - 1 & 1) != 0))) break;
    bVar2 = *(byte *)0x87 & 0x1f;
    cVar5 = (bVar2 != 0) * ((bVar3 >> bVar2 - 1 & 1) != 0);
    bVar4 = bVar4 >> bVar1;
    bVar3 = bVar3 >> bVar2;
  }
  return;
}



void __cdecl16near FUN_10a1_287b(void)

{
  byte *pbVar1;
  undefined2 unaff_DS;
  
  pbVar1 = (byte *)*(undefined2 *)0x763;
  *pbVar1 = *pbVar1 ^ (*(byte *)*(undefined2 *)0x763 ^ *(byte *)0x756) & *(byte *)0x761;
  return;
}



void __cdecl16near FUN_10a1_2897(void)

{
  uint in_CX;
  uint in_DX;
  int iVar1;
  undefined2 unaff_DS;
  
  iVar1 = (in_DX >> 1) * 0x50;
  if ((in_DX & 1) != 0) {
    iVar1 = iVar1 + 0x2000;
  }
  *(int *)0x763 = iVar1;
  if ((*(byte *)0x87 & 1) == 0) {
    *(byte *)0x761 = 0xc0 >> ((byte)in_CX & 3) * '\x02';
    *(int *)0x763 = *(int *)0x763 + (in_CX >> 2);
    return;
  }
  *(byte *)0x761 = 0x80 >> ((byte)in_CX & 7);
  *(int *)0x763 = *(int *)0x763 + (in_CX >> 3);
  return;
}



void __cdecl16near FUN_10a1_28e4(void)

{
  byte in_AL;
  undefined2 unaff_DS;
  
  if (in_AL < 4) {
    if ((*(byte *)0x87 & 1) != 0) {
      *(char *)0x756 = -(in_AL & 1);
      return;
    }
    *(char *)0x756 = in_AL * 'U';
  }
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void __cdecl16near FUN_10a1_2901(void)

{
  uint in_DX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if (*(char *)0x87 == '\0') {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  if ((int)in_DX < 0) {
    return;
  }
  if (in_DX < 200) {
    return;
  }
  return;
}



void __cdecl16near FUN_10a1_2938(void)

{
  return;
}



void __cdecl16near FUN_10a1_294b(void)

{
  undefined1 uVar1;
  undefined1 *puVar2;
  byte bVar3;
  bool bVar4;
  byte bVar5;
  byte bVar6;
  byte bVar8;
  uint uVar7;
  uint uVar9;
  uint in_BX;
  undefined1 *puVar10;
  undefined2 unaff_DS;
  
  do {
    if (in_BX == 0) {
      return;
    }
    bVar8 = *(byte *)*(undefined2 *)0x763;
    bVar6 = *(byte *)0x761;
    bVar5 = ~bVar6;
    bVar3 = *(byte *)0x87;
    uVar9 = in_BX;
    do {
      bVar8 = bVar8 & bVar5 | bVar6 & *(byte *)0x756;
      uVar9 = uVar9 - 1;
      if (uVar9 == 0) {
        *(byte *)*(undefined2 *)0x763 = bVar8;
        *(byte *)0x761 = bVar6;
        return;
      }
      bVar5 = bVar5 >> (bVar3 & 7) | bVar5 << 8 - (bVar3 & 7);
      bVar6 = bVar6 >> (bVar3 & 7) | bVar6 << 8 - (bVar3 & 7);
      bVar4 = (bVar3 & 0x1f) == 0;
    } while (!(bool)(bVar4 * ((bVar3 & 0x1f) != 0) * ((char)bVar5 < '\0') |
                    !bVar4 * ((char)bVar6 < '\0')));
    *(byte *)*(undefined2 *)0x763 = bVar8;
    *(int *)0x763 = *(int *)0x763 + 1;
    *(byte *)0x761 = bVar6;
    uVar7 = uVar9 >> 2;
    if ((*(byte *)0x87 & 1) == 0) {
      in_BX = uVar9 & 3;
    }
    else {
      in_BX = uVar9 & 7;
      uVar7 = uVar9 >> 3;
    }
    if (uVar7 != 0) {
      uVar1 = *(undefined1 *)0x756;
      puVar10 = (undefined1 *)*(undefined2 *)0x763;
      for (; uVar7 != 0; uVar7 = uVar7 - 1) {
        puVar2 = puVar10;
        puVar10 = puVar10 + 1;
        *puVar2 = uVar1;
      }
      *(undefined2 *)0x763 = puVar10;
    }
  } while( true );
}



void __cdecl16near FUN_10a1_2b0f(void)

{
  undefined1 uVar1;
  undefined1 uVar2;
  undefined2 unaff_DS;
  
  uVar2 = *(undefined1 *)0x756;
  uVar1 = FUN_10a1_28e4();
  *(undefined1 *)0x757 = uVar1;
  *(undefined1 *)0x756 = uVar2;
  return;
}



byte __cdecl16near FUN_10a1_2b24(void)

{
  byte bVar1;
  byte in_CH;
  byte in_DL;
  byte in_DH;
  byte in_BH;
  
  bVar1 = 0;
  if (((in_BH ^ in_DL) & in_CH) != 0) {
    bVar1 = (in_BH ^ in_DH) & in_CH;
  }
  return bVar1;
}



void __cdecl16near FUN_10a1_2b38(void)

{
  bool bVar1;
  byte bVar2;
  byte in_CH;
  undefined1 in_BH;
  undefined1 *unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  char in_CF;
  
  bVar2 = *(byte *)0x87 & 7;
  bVar1 = (*(byte *)0x87 & 0x1f) == 0;
  if ((bool)(bVar1 * in_CF | !bVar1 * (((in_CH << bVar2 | in_CH >> 8 - bVar2) & 1) != 0))) {
    *unaff_DI = in_BH;
    FUN_10a1_2b5c();
    return;
  }
  return;
}



void __cdecl16near FUN_10a1_2b4d(void)

{
  char cVar1;
  byte bVar2;
  undefined2 in_CX;
  byte bVar3;
  undefined2 in_BX;
  undefined1 *unaff_DI;
  undefined1 *puVar4;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  char in_CF;
  bool bVar5;
  bool bVar6;
  
  bVar3 = (byte)((uint)in_CX >> 8);
  bVar2 = *(byte *)0x87 & 7;
  bVar6 = (*(byte *)0x87 & 0x1f) == 0;
  if ((bool)(bVar6 * in_CF |
            !bVar6 * ((int)((uint)(byte)(bVar3 >> bVar2 | bVar3 << 8 - bVar2) << 8) < 0))) {
    *unaff_DI = (char)((uint)in_BX >> 8);
    puVar4 = unaff_DI + 1;
    if (((uint)puVar4 & 0xf) == 0) {
      bVar2 = (byte)((uint)puVar4 >> 8);
      cVar1 = ((byte)((uint)puVar4 >> 4) & 0xf) + (bVar2 & 0xf) + (bVar2 >> 4 & 1);
      bVar2 = cVar1 + 5;
      bVar6 = bVar2 == 0x19;
      if (0x18 < bVar2) {
        bVar2 = cVar1 - 0x14;
        bVar6 = bVar2 == 0;
      }
      do {
        if (bVar6) {
          return;
        }
        bVar5 = 4 < bVar2;
        bVar2 = bVar2 - 5;
        bVar6 = bVar2 == 0;
      } while (bVar5);
    }
  }
  return;
}



void __cdecl16near FUN_10a1_2b5c(void)

{
  char cVar1;
  byte bVar2;
  uint unaff_DI;
  bool bVar3;
  bool bVar4;
  
  if ((unaff_DI & 0xf) == 0) {
    bVar2 = (byte)(unaff_DI >> 8);
    cVar1 = ((byte)(unaff_DI >> 4) & 0xf) + (bVar2 & 0xf) + (bVar2 >> 4 & 1);
    bVar2 = cVar1 + 5;
    bVar4 = bVar2 == 0x19;
    if (0x18 < bVar2) {
      bVar2 = cVar1 - 0x14;
      bVar4 = bVar2 == 0;
    }
    do {
      if (bVar4) {
        return;
      }
      bVar3 = 4 < bVar2;
      bVar2 = bVar2 - 5;
      bVar4 = bVar2 == 0;
    } while (bVar3);
  }
  return;
}



void __cdecl16near FUN_10a1_2b88(void)

{
  return;
}



void __cdecl16near FUN_10a1_2ba3(void)

{
  undefined1 in_CH;
  undefined2 in_BX;
  undefined1 uVar1;
  undefined1 *unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined1 in_CF;
  undefined1 uVar2;
  
  FUN_10a1_2b88();
  do {
    uVar2 = in_CF;
    FUN_10a1_2b38();
    uVar1 = (undefined1)((uint)in_BX >> 8);
    if ((bool)uVar2) break;
    FUN_10a1_2b24();
    uVar1 = (undefined1)((uint)in_BX >> 8);
    in_CF = 1;
  } while ((bool)uVar2);
  FUN_10a1_2b4d();
  *unaff_DI = uVar1;
  *(undefined2 *)0x763 = unaff_DI;
  *(undefined1 *)0x761 = in_CH;
  return;
}



void __cdecl16near FUN_10a1_2bc9(void)

{
  undefined1 in_CH;
  int in_DX;
  undefined2 in_BX;
  undefined1 uVar1;
  undefined1 *unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined1 in_CF;
  undefined1 uVar2;
  
  FUN_10a1_2b88();
  do {
    FUN_10a1_2b24();
    uVar1 = (undefined1)((uint)in_BX >> 8);
    if ((bool)in_CF) {
      *(undefined2 *)0x765 = unaff_DI;
      *(undefined1 *)0x762 = in_CH;
      uVar2 = 0;
      goto LAB_10a1_2bf3;
    }
    in_DX = in_DX + -1;
    if (in_DX == 0) break;
    FUN_10a1_2b4d();
    uVar1 = (undefined1)((uint)in_BX >> 8);
  } while (!(bool)in_CF);
  goto LAB_10a1_2c04;
  while( true ) {
    FUN_10a1_2b24();
    uVar1 = (undefined1)((uint)in_BX >> 8);
    if (!(bool)uVar2) break;
LAB_10a1_2bf3:
    FUN_10a1_2b4d();
    uVar1 = (undefined1)((uint)in_BX >> 8);
    if ((bool)uVar2) {
      FUN_10a1_2b38();
      break;
    }
  }
  *(undefined2 *)0x763 = unaff_DI;
  *(undefined1 *)0x761 = in_CH;
LAB_10a1_2c04:
  *unaff_DI = uVar1;
  return;
}



void __cdecl16near FUN_10a1_2c0e(void)

{
  byte *pbVar1;
  uint uVar2;
  uint uVar3;
  uint uVar4;
  int iVar5;
  int iVar6;
  int extraout_DX;
  code *pcVar7;
  code *pcVar8;
  code *pcVar9;
  undefined2 unaff_DS;
  undefined1 in_CF;
  
  uVar2 = FUN_10a1_3759();
  pcVar7 = (code *)0x2830;
  if ((bool)in_CF) {
    pcVar7 = (code *)0x2844;
  }
  uVar3 = FUN_10a1_3764();
  pcVar9 = (code *)0x281a;
  if ((bool)in_CF) {
    pcVar9 = (code *)0x27f9;
  }
  uVar4 = uVar3;
  pcVar8 = pcVar7;
  if (uVar2 <= uVar3) {
    uVar4 = uVar2;
    uVar2 = uVar3;
    pcVar8 = pcVar9;
    pcVar9 = pcVar7;
  }
  *(undefined2 *)0x75d = pcVar9;
  FUN_10a1_2897();
  iVar6 = (int)uVar2 >> 1;
  iVar5 = uVar2 + 1;
  do {
    pbVar1 = (byte *)*(undefined2 *)0x763;
    *pbVar1 = *pbVar1 ^ (*(byte *)*(undefined2 *)0x763 ^ *(byte *)0x756) & *(byte *)0x761;
    if (uVar2 <= iVar6 + uVar4) {
      (*(code *)*(undefined2 *)0x75d)();
    }
    (*pcVar8)();
    iVar5 = iVar5 + -1;
    iVar6 = extraout_DX;
  } while (iVar5 != 0);
  return;
}



void __cdecl16near FUN_10a1_2cc2(void)

{
  char *pcVar1;
  char cVar2;
  undefined2 uVar3;
  int iVar4;
  char *pcVar5;
  undefined2 unaff_DS;
  bool bVar6;
  undefined2 uStack_2;
  
  *(undefined2 *)0x768 = *(undefined2 *)0x53;
  *(undefined1 *)0x61c = 0xff;
  *(undefined2 *)0x76c = *(undefined2 *)0x768;
  *(undefined1 *)0x61d = 0;
  uStack_2 = 0x2cda;
  *(undefined2 **)0x76e = &uStack_2;
  FUN_10a1_043e();
  FUN_10a1_0415();
  FUN_10a1_04e4();
  FUN_10a1_041a();
  uVar3 = FUN_10a1_043e();
  cVar2 = (char)uVar3;
  bVar6 = cVar2 == '\0';
  if (bVar6) {
    cVar2 = FUN_10a1_2e93();
    if (bVar6) {
      FUN_10a1_066b();
      FUN_10a1_066b();
      return;
    }
  }
  iVar4 = 0x11;
  pcVar1 = (char *)0x2c71;
  do {
    pcVar5 = pcVar1;
    if (cVar2 == *pcVar5) goto LAB_10a1_2d0e;
    iVar4 = iVar4 + -1;
    pcVar1 = pcVar5 + 3;
  } while (iVar4 != 0);
  pcVar5 = pcVar5 + 2;
LAB_10a1_2d0e:
  if (10 < (byte)iVar4) {
    *(undefined1 *)0xd8 = (char)((uint)iVar4 >> 8);
  }
                    // WARNING: Could not recover jumptable at 0x00013727. Too many branches
                    // WARNING: Treating indirect jump as call
  (**(code **)(pcVar5 + 1))();
  return;
}



char __cdecl16near FUN_10a1_2e93(void)

{
  char in_AH;
  char cVar1;
  char *pcVar2;
  
  pcVar2 = (char *)0x2ca6;
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

uint __cdecl16near FUN_10a1_2eb0(void)

{
  char *pcVar1;
  byte bVar2;
  uint *puVar3;
  undefined2 uVar4;
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
  pcVar1 = (char *)0x7b0;
  *pcVar1 = *pcVar1 + '\x01';
  if (*pcVar1 == '\0') {
    *(undefined1 *)0x7b0 = 0xff;
  }
LAB_10a1_2ec0:
  puVar8 = (uint *)*(undefined2 *)0x770;
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
      bVar2 = *(byte *)0x7b0;
      *(byte *)0x7b0 = 0;
      UNLOCK();
      if (5 < bVar2) {
        puVar8 = (uint *)*(undefined2 *)0x5d4;
        *(undefined2 *)0x770 = puVar8;
        piVar5 = piVar6;
        goto LAB_10a1_2f1a;
      }
      FUN_10a1_2f45(unaff_SI,in_AX,in_stack_00000000);
      puVar7 = (uint *)*(undefined2 *)0x770;
      if ((int *)*puVar7 < piVar6) {
        *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
        FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
        uVar4 = (*(code *)*(undefined2 *)0x5e4)();
        return uVar4;
      }
    }
    piVar5 = (int *)((int)piVar5 - 1);
    if (piVar6 <= piVar5) {
      *(undefined2 *)0x770 = (int *)((int)puVar8 + (int)piVar6);
      if ((int)piVar5 - (int)piVar6 != 0) {
        *(int *)((int)puVar8 + (int)piVar6) = ((int)piVar5 - (int)piVar6) + -1;
      }
      return in_AX;
    }
  } while( true );
LAB_10a1_2f1a:
  puVar7 = (uint *)CONCAT11((char)((uint)piVar5 >> 8),0xff);
  while( true ) {
    puVar3 = puVar8 + 1;
    piVar5 = (int *)*puVar8;
    if (piVar5 == (int *)0xffff) goto LAB_10a1_2ec0;
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
  goto LAB_10a1_2f1a;
}



// WARNING: Removing unreachable block (ram,0x00013a15)
// WARNING: Removing unreachable block (ram,0x00013a64)
// WARNING: Removing unreachable block (ram,0x00013a1d)

undefined2 __cdecl16near FUN_10a1_2f45(undefined2 param_1,uint param_2,int param_3)

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
  puVar8 = (uint *)*(undefined2 *)0x5d4;
  puVar10 = (uint *)CONCAT22((int)((ulong)in_EDI >> 0x10),puVar8);
LAB_10a1_2f52:
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
        *(undefined2 *)0x770 = puVar9;
        return in_AX;
      }
      if (((uint)piVar4 & 1) != 0) goto LAB_10a1_2f52;
      puVar2 = puVar9 + 1;
      uVar6 = (undefined2)((ulong)puVar10 >> 0x10);
      puVar10 = (uint *)CONCAT22(uVar6,puVar2);
      *puVar9 = (uint)piVar4;
      iVar3 = *piVar4;
      if (puVar8 != (uint *)piVar4[1]) {
        FUN_10a1_2fa9((undefined1 *)in_EDI,unaff_SI,in_BX,in_AX,in_stack_00000000,param_1,param_2,
                      param_3);
        uVar11 = FUN_10a1_382c();
        *(byte *)((int)puVar7 + 0x77) = *(byte *)((int)puVar7 + 0x77) & (byte)((ulong)uVar11 >> 8);
        out((char)*puVar8,(int)((ulong)uVar11 >> 0x10));
        *(byte *)(puVar10 + 0x17) = (byte)puVar10[0x17] & (byte)uVar11;
        FUN_10a1_37e1();
        uVar6 = FUN_10a1_017d();
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
// WARNING: Removing unreachable block (ram,0x000139ee)
// WARNING: Removing unreachable block (ram,0x000139f0)
// WARNING: Removing unreachable block (ram,0x00011a11)

ulong __cdecl16near
FUN_10a1_2fa9(undefined1 *param_1,undefined2 *param_2,int param_3,undefined2 param_4,int param_5,
             undefined2 *param_6,uint param_7,int param_8)

{
  uint *puVar1;
  undefined2 *puVar2;
  char *pcVar3;
  undefined1 uVar4;
  undefined2 *puVar5;
  char cVar6;
  int iVar7;
  int in_CX;
  uint uVar8;
  undefined2 uVar9;
  char *in_BX;
  int iVar10;
  undefined1 *unaff_SI;
  undefined2 *puVar11;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 in_CF;
  bool bVar12;
  undefined4 uVar13;
  long lVar14;
  
  FUN_10a1_37e1();
  uVar13 = FUN_10a1_382c();
  uVar9 = (undefined2)((ulong)uVar13 >> 0x10);
  iVar7 = (int)uVar13;
  out(*unaff_SI,uVar9);
  if (in_CX == 1) {
    uVar8 = 0;
    do {
      if (uVar8 == 0) break;
      uVar8 = uVar8 - 1;
      pcVar3 = in_BX;
      in_BX = in_BX + 1;
    } while (*pcVar3 != '\0');
    iVar7 = ~uVar8 - 1;
  }
  else if (!(bool)in_CF) {
    uVar4 = in(param_6);
    *param_1 = uVar4;
    param_1[0x73] = param_1[0x73] & (byte)param_8;
    iVar7 = param_8 + -0x5320;
    lVar14 = ZEXT24(param_1 + 1) << 0x10;
    if (iVar7 != 0) {
      lVar14 = (long)*(int *)(param_3 + 0x67) * 0x5320;
      if ((int)lVar14 == lVar14) {
        puVar1 = (uint *)(param_1 + 0x21);
        iVar10 = 2 - (*puVar1 & 3);
        *puVar1 = *puVar1 + (uint)(0 < iVar10) * iVar10;
        iVar10 = param_5 + 1;
        out(*param_2,param_6);
        if (iVar10 == 0) {
          do {
                    // WARNING: Do nothing block with infinite loop
          } while( true );
        }
        cVar6 = (char)((uint)iVar10 >> 8) * '\x02';
        bVar12 = cVar6 == '\0';
        uVar8 = CONCAT11(cVar6,(char)iVar10);
        while( true ) {
          if (!bVar12) {
            iVar7 = FUN_10a1_305a();
          }
          if (0x7af < uVar8 + 4) break;
          bVar12 = *(int *)(uVar8 + 6) == -1;
          uVar8 = uVar8 + 4;
        }
        return CONCAT22(param_6,iVar7);
      }
      lVar14 = FUN_10a1_2fd5();
      param_7 = param_7 + 1;
      param_6 = param_2;
    }
    puVar11 = (undefined2 *)((ulong)lVar14 >> 0x10);
    for (uVar8 = param_7 >> 1; uVar8 != 0; uVar8 = uVar8 - 1) {
      puVar5 = puVar11;
      puVar11 = puVar11 + 1;
      puVar2 = param_2;
      param_2 = param_2 + 1;
      *puVar5 = *puVar2;
    }
    return CONCAT22(param_6,(int)lVar14);
  }
  return CONCAT22(uVar9,iVar7);
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_2fd5(void)

{
  int *piVar1;
  int in_BX;
  int iVar2;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if (in_BX == 0) {
    return;
  }
  if (*(int *)0x772 == 0) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  iVar2 = in_BX;
  FUN_10a1_2eb0();
  piVar1 = (int *)*(int *)0x772;
  *(int *)0x772 = *piVar1;
  *piVar1 = in_BX;
  *(int *)(iVar2 + -2) = (int)piVar1;
  piVar1[1] = iVar2;
  return;
}



void FUN_10a1_3026(void)

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
  
  FUN_10a1_2fd5();
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



void FUN_10a1_303d(void)

{
  uint uVar1;
  undefined2 unaff_DS;
  
  uVar1 = 0x774;
  do {
    if (*(int *)(uVar1 + 2) != -1) {
      FUN_10a1_305a();
    }
    uVar1 = uVar1 + 4;
  } while (uVar1 < 0x7b0);
  return;
}



undefined2 __cdecl16near FUN_10a1_3055(void)

{
  undefined2 uVar1;
  undefined2 uVar2;
  undefined2 *in_BX;
  undefined2 unaff_DS;
  undefined1 in_CF;
  
  uVar1 = func_0x00013a17();
  if ((bool)in_CF) {
    uVar2 = FUN_10a1_30ba();
    LOCK();
    uVar1 = *(undefined2 *)0x772;
    *(undefined2 *)0x772 = in_BX;
    UNLOCK();
    *in_BX = uVar1;
    in_BX[1] = 0xffff;
    return uVar2;
  }
  return uVar1;
}



undefined2 __cdecl16near FUN_10a1_305a(void)

{
  undefined2 uVar1;
  undefined2 uVar2;
  undefined2 *in_BX;
  undefined2 unaff_DS;
  
  uVar2 = FUN_10a1_30ba();
  LOCK();
  uVar1 = *(undefined2 *)0x772;
  *(undefined2 *)0x772 = in_BX;
  UNLOCK();
  *in_BX = uVar1;
  in_BX[1] = 0xffff;
  return uVar2;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined4 __cdecl16near FUN_10a1_306d(uint param_1,int param_2)

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
  
  uVar2 = FUN_10a1_2f45(in_stack_00000000,param_1,param_2);
  uVar4 = in_BX + 1U & 0xfffe;
  puVar1 = (uint *)*(int *)0x770;
  uVar3 = *puVar1 - uVar4;
  if (*puVar1 < uVar4) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    uVar5 = (*(code *)*(undefined2 *)0x5e4)();
    return uVar5;
  }
  *puVar1 = uVar3;
  *(undefined2 *)((int)puVar1 + uVar3 + 1) = 0xffff;
  *(int *)0x5d6 = (int)puVar1 + uVar3 + 2;
  return CONCAT22(in_DX,uVar2);
}



undefined4 __cdecl16near FUN_10a1_3095(void)

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
  FUN_10a1_2fd5();
  puVar5 = (undefined2 *)(in_CX + *(int *)(in_BX + 2));
  FUN_10a1_3055();
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



undefined1 * __cdecl16near FUN_10a1_30ba(void)

{
  int *piVar1;
  uint uVar2;
  undefined1 *in_AX;
  undefined2 uVar3;
  int *in_BX;
  undefined2 unaff_DS;
  undefined2 *in_stack_00000000;
  int in_stack_00000002;
  undefined2 in_stack_00000004;
  int in_stack_00000006;
  undefined2 in_stack_00000008;
  uint in_stack_0000000a;
  int in_stack_0000000c;
  
  uVar2 = in_BX[1];
  if ((uVar2 < *(uint *)0x5d4) || (*(uint *)0x5d6 < uVar2)) {
    return in_AX;
  }
  LOCK();
  piVar1 = (int *)*(uint *)(uVar2 - 2);
  *(uint *)(uVar2 - 2) = *in_BX + 1U | 1;
  UNLOCK();
  if (piVar1 == in_BX) {
    return in_AX;
  }
  FUN_10a1_2fa9(in_AX,in_stack_00000000,in_stack_00000002,in_stack_00000004,in_stack_00000006,
                in_stack_00000008,in_stack_0000000a,in_stack_0000000c);
  FUN_10a1_37e1();
  uVar3 = FUN_10a1_017d();
  return (undefined1 *)uVar3;
}



undefined4 __cdecl16near FUN_10a1_30e6(void)

{
  undefined2 in_DX;
  int in_BX;
  undefined2 unaff_DS;
  undefined4 uVar1;
  
  uVar1 = FUN_10a1_3095();
  *(undefined1 *)(*(int *)(in_BX + 2) + (int)((ulong)uVar1 >> 0x10) + -1) = 0;
  return CONCAT22(in_DX,(int)uVar1);
}



void __cdecl16near FUN_10a1_30fe(void)

{
  int *piVar1;
  int iVar2;
  int iVar3;
  int *piVar4;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  piVar1 = (int *)*(int *)0x5d4;
  *(int *)0x770 = (int)piVar1;
  iVar2 = (*(int *)0x5d6 + 1U & 0xfffe) - (int)piVar1;
  *piVar1 = iVar2 + -3;
  *(undefined2 *)((int)piVar1 + iVar2 + -2) = 0xffff;
  iVar3 = 0xf;
  *(undefined2 *)0x772 = 0x774;
  iVar2 = 0x778;
  piVar1 = (int *)0x774;
  do {
    piVar4 = piVar1;
    *piVar4 = iVar2;
    piVar4[1] = -1;
    iVar2 = iVar2 + 4;
    iVar3 = iVar3 + -1;
    piVar1 = piVar4 + 2;
  } while (iVar3 != 0);
  *piVar4 = 0;
  *(undefined1 *)0x7b0 = 0;
  return;
}



undefined2 __cdecl16far FUN_10a1_31f2(void)

{
  undefined2 in_stack_00000000;
  
  FUN_10a1_3346();
  return in_stack_00000000;
}



void __cdecl16far FUN_10a1_3205(void)

{
  undefined1 in_ZF;
  
  FUN_10a1_36b2();
  if ((bool)in_ZF) {
    return;
  }
  FUN_10a1_31f2();
  return;
}



void __cdecl16near FUN_10a1_32d7(void)

{
  int iVar1;
  
  iVar1 = 0x10;
  do {
    (*(code *)*(undefined2 *)(iVar1 + 0x3178))();
    iVar1 = iVar1 + -2;
  } while (iVar1 != 0);
  return;
}



void __cdecl16near FUN_10a1_32e9(void)

{
  int iVar1;
  
  iVar1 = 0x10;
  do {
    (*(code *)*(undefined2 *)(iVar1 + 0x3188))();
    iVar1 = iVar1 + -2;
  } while (iVar1 != 0);
  return;
}



void __cdecl16near FUN_10a1_32fd(void)

{
  FUN_10a1_3356();
  return;
}



undefined4 FUN_10a1_3313(void)

{
  undefined2 unaff_DS;
  undefined4 uVar1;
  
  if (*(int *)0x5f8 == 0) {
    uVar1 = FUN_10a1_25c0();
    return uVar1;
  }
  uVar1 = FUN_10a1_32fd();
  return uVar1;
}



void FUN_10a1_3324(void)

{
  undefined2 unaff_DS;
  
  if (*(int *)0x5f8 == 0) {
    thunk_FUN_10a1_036f();
    return;
  }
  FUN_10a1_32fd();
  return;
}



void FUN_10a1_3335(void)

{
  undefined2 unaff_DS;
  
  if (*(int *)0x5f8 == 0) {
    FUN_10a1_2618();
    return;
  }
  FUN_10a1_32fd();
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_3346(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 in_ZF;
  
  FUN_10a1_36b2();
  if ((bool)in_ZF) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  FUN_10a1_3356();
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_3356(void)

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
  iVar1 = *(int *)(cVar2 * 2 + 0x3168);
  if (iVar1 == 0) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  *(undefined2 *)0x7b2 = *(undefined2 *)(iVar1 + (char)((uint)in_AX >> 8));
  (*(code *)*(undefined2 *)0x7b2)();
  return;
}



void __cdecl16near FUN_10a1_338d(void)

{
  undefined2 unaff_DS;
  
  while (*(int *)0x5e2 != 0) {
    FUN_10a1_3205();
  }
  return;
}



void __cdecl16near FUN_10a1_3503(void)

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
  
  if (*(byte *)0x83c < 4) {
    uVar9 = 0x20;
    if (*(int *)0xaa != 0) {
      if (*(int *)0xaa < 0) {
        uVar9 = 0x2d;
      }
      *(undefined1 *)0x804 = uVar9;
      FUN_10a1_3637();
      FUN_10a1_35ab();
      return;
    }
  }
  else {
    iVar11 = 0x99;
    if (*(byte *)0x83c != 4) {
      iVar11 = 0xb9;
    }
    bVar5 = *(byte *)0xad;
    if (bVar5 != 0) {
      iVar11 = iVar11 - (uint)bVar5;
      uVar9 = 0x20;
      if ((*(byte *)0xac & 0x80) != 0) {
        uVar9 = 0x2d;
      }
      *(undefined1 *)0x804 = uVar9;
      bVar5 = *(char *)(*(char *)(iVar11 + 0x19e) * 8 + 0x34f) + bVar5;
      if (*(char *)0x83c == '\x04') {
        FUN_10a1_138a();
        uVar6 = bVar5 & 7;
        if ((bVar5 & 7) != 0) {
          do {
            uVar6 = uVar6 - 1;
          } while (uVar6 != 0);
        }
        pbVar15 = (byte *)0x828;
      }
      else {
        FUN_10a1_3fb5();
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
        pbVar15 = (byte *)0x828;
        puVar14 = (uint *)0xe0;
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
      FUN_10a1_3637();
      FUN_10a1_3647();
      pcVar16 = (char *)0x828;
      pbVar15 = pbVar15 + -0x828;
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
  *(undefined1 *)0x804 = 0x20;
  *(undefined1 *)0x828 = 0x30;
  return;
}



void __cdecl16near FUN_10a1_35ab(void)

{
  char *pcVar1;
  int iVar2;
  int unaff_DI;
  char *pcVar3;
  undefined2 unaff_ES;
  
  pcVar3 = (char *)0x828;
  iVar2 = unaff_DI + -0x828;
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



void FUN_10a1_3637(void)

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



void __cdecl16near FUN_10a1_3647(void)

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



undefined4 __cdecl16near FUN_10a1_3664(void)

{
  int in_CX;
  undefined4 uVar1;
  
  FUN_10a1_3637();
  FUN_10a1_35ab();
  do {
    uVar1 = FUN_10a1_37f5();
    in_CX = in_CX + -1;
  } while (in_CX != 0);
  return uVar1;
}



void __cdecl16near FUN_10a1_3674(void)

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
        if (bVar2 < 0x3a) goto LAB_10a1_369e;
      }
      in_CX = 1;
      bVar2 = 0x31;
LAB_10a1_369e:
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



void __cdecl16near FUN_10a1_36b2(void)

{
  char in_BL;
  char in_BH;
  char *pcVar1;
  undefined2 unaff_DS;
  
  if (in_BH == '\0') {
    pcVar1 = (char *)0x5e4;
    do {
      pcVar1 = *(char **)(pcVar1 + -2);
      if (pcVar1 == (char *)0x0) {
        return;
      }
    } while (pcVar1[-5] != in_BL);
    if (*pcVar1 == '\0') {
      FUN_10a1_3713();
    }
  }
  return;
}



undefined4 __cdecl16near FUN_10a1_36d0(void)

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
  
  puVar5 = (undefined2 *)0x5e2;
  do {
    puVar4 = puVar5;
    puVar5 = (undefined2 *)puVar4[-1];
    if (puVar5 == (undefined2 *)0x0) {
      iVar3 = in_BX + 6;
      FUN_10a1_306d(in_BX,unaff_DI);
      puVar5 = (undefined2 *)(iVar3 + 6);
      *(uint *)(iVar3 + 2) = in_BX;
      goto LAB_10a1_36ff;
    }
  } while ((uint)puVar5[-2] < in_BX);
  puVar4[-1] = puVar5[-1];
  in_BX = puVar5[-2];
LAB_10a1_36ff:
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



void __cdecl16near FUN_10a1_3710(void)

{
  undefined2 uVar1;
  int unaff_SI;
  undefined2 unaff_DS;
  
  uVar1 = *(undefined2 *)0x5e0;
  *(int *)0x5e0 = unaff_SI;
  *(undefined2 *)(unaff_SI + -2) = uVar1;
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_3713(void)

{
  int iVar1;
  undefined2 uVar2;
  int unaff_SI;
  int iVar3;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  iVar1 = 0x5e4;
  do {
    iVar3 = iVar1;
    iVar1 = *(int *)(iVar3 + -2);
    if (iVar1 == 0) {
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      (*(code *)*(undefined2 *)0x5e4)();
      return;
    }
  } while (iVar1 != unaff_SI);
  *(undefined2 *)(iVar3 + -2) = *(undefined2 *)(unaff_SI + -2);
  uVar2 = *(undefined2 *)0x5e0;
  *(int *)0x5e0 = unaff_SI;
  *(undefined2 *)(unaff_SI + -2) = uVar2;
  return;
}



void FUN_10a1_373c(void)

{
  int iVar1;
  int in_DX;
  int in_BX;
  undefined2 unaff_DS;
  
  iVar1 = *(int *)0x840;
  *(int *)0x5c6 = in_BX + *(int *)0x83e;
  *(int *)0x5c8 = in_DX + iVar1;
  *(undefined2 *)0x83e = 0;
  *(undefined2 *)0x840 = 0;
  FUN_10a1_2901();
  return;
}



int __cdecl16near FUN_10a1_3759(void)

{
  int iVar1;
  uint in_CX;
  undefined2 unaff_DS;
  
  iVar1 = in_CX - *(uint *)0x5ca;
  if (in_CX < *(uint *)0x5ca) {
    iVar1 = -iVar1;
  }
  return iVar1;
}



int __cdecl16near FUN_10a1_3764(void)

{
  int iVar1;
  uint in_DX;
  undefined2 unaff_DS;
  
  iVar1 = in_DX - *(uint *)0x5cc;
  if (in_DX < *(uint *)0x5cc) {
    iVar1 = -iVar1;
  }
  return iVar1;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void FUN_10a1_376f(void)

{
  int in_CX;
  undefined2 uVar1;
  undefined2 extraout_DX;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar2;
  
  bVar2 = in_CX != -1;
  FUN_10a1_28e4();
  if (bVar2) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  uVar1 = *(undefined2 *)0x5c6;
  FUN_10a1_2901();
  *(undefined2 *)0x5ca = uVar1;
  *(undefined2 *)0x5cc = extraout_DX;
  FUN_10a1_373c();
  return;
}



undefined4 __cdecl16near FUN_10a1_379a(void)

{
  char *pcVar1;
  undefined2 in_AX;
  undefined2 uVar2;
  int iVar3;
  undefined2 unaff_DS;
  undefined4 uVar4;
  
  pcVar1 = (char *)*(undefined2 *)0x5f8;
  if ((pcVar1 == (char *)0x0) || ((pcVar1[0x2e] & 0x80U) != 0)) {
    uVar4 = FUN_10a1_3313();
    uVar2 = (undefined2)((ulong)uVar4 >> 0x10);
  }
  else {
    if ((*pcVar1 == '\x04') && (*(char *)0x74c != '\0')) {
      for (iVar3 = (*(int *)(pcVar1 + 0xb3) - *(int *)(pcVar1 + 0xba)) + -2; iVar3 != 0;
          iVar3 = iVar3 + -1) {
        FUN_10a1_3313();
      }
    }
    FUN_10a1_3313();
    uVar4 = FUN_10a1_3313();
    uVar2 = (undefined2)((ulong)uVar4 >> 0x10);
  }
  return CONCAT22(uVar2,in_AX);
}



undefined2 __cdecl16near FUN_10a1_37e1(void)

{
  undefined2 uVar1;
  undefined2 in_AX;
  undefined2 unaff_DS;
  
  uVar1 = *(undefined2 *)0x5f8;
  *(undefined2 *)0x5f8 = 0;
  FUN_10a1_379a();
  *(undefined2 *)0x5f8 = uVar1;
  return in_AX;
}



undefined4 __cdecl16near FUN_10a1_37f5(void)

{
  undefined2 uVar1;
  undefined2 unaff_DS;
  undefined4 uVar2;
  
  uVar1 = *(undefined2 *)0x5f8;
  *(undefined2 *)0x5f8 = 0;
  uVar2 = FUN_10a1_3313();
  *(undefined2 *)0x5f8 = uVar1;
  return uVar2;
}



undefined4 __cdecl16near thunk_FUN_10a1_37f5(void)

{
  undefined4 uVar1;
  
  uVar1 = FUN_10a1_37f5();
  return uVar1;
}



void __cdecl16near FUN_10a1_381e(void)

{
  byte *pbVar1;
  byte bVar2;
  byte *unaff_SI;
  
  do {
    pbVar1 = unaff_SI;
    unaff_SI = unaff_SI + 1;
    bVar2 = *pbVar1;
    FUN_10a1_37f5();
  } while ((bVar2 & 0x80) == 0);
  return;
}



void FUN_10a1_382c(void)

{
  code *in_stack_00000000;
  
  FUN_10a1_381e();
                    // WARNING: Could not recover jumptable at 0x00014246. Too many branches
                    // WARNING: Treating indirect jump as call
  (*in_stack_00000000)();
  return;
}



undefined4 __cdecl16near FUN_10a1_3838(void)

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
    uVar2 = FUN_10a1_3313();
    iVar1 = iVar1 + -1;
  } while (iVar1 != 0);
  return uVar2;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_38e3(uint param_1)

{
  byte *pbVar1;
  byte bVar2;
  byte bVar3;
  char cVar4;
  int iVar5;
  uint uVar6;
  int in_CX;
  uint uVar7;
  byte *unaff_SI;
  byte *pbVar8;
  int iVar9;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar10;
  uint in_stack_00000000;
  
  if (*(char *)0x83c == '\x03') {
    bVar3 = FUN_10a1_3ac8();
    if (bVar3 != 0x22) {
      bVar3 = 0x2c;
      unaff_SI = unaff_SI + -1;
    }
    iVar9 = 0;
    do {
      pbVar8 = unaff_SI;
      iVar5 = iVar9;
      unaff_SI = pbVar8 + 1;
      if (*pbVar8 == bVar3) goto LAB_10a1_387c;
      iVar9 = iVar5 + -1;
    } while (iVar9 != 0 && *pbVar8 != 0);
    if (bVar3 != 0x2c) {
      unaff_SI = pbVar8;
    }
LAB_10a1_387c:
    iVar5 = -iVar5;
    if (bVar3 == 0x2c) {
      pbVar8 = unaff_SI + -2;
      bVar10 = true;
      do {
        if (iVar5 == 0) break;
        iVar5 = iVar5 + -1;
        pbVar1 = pbVar8;
        pbVar8 = pbVar8 + -1;
        bVar10 = *pbVar1 == 0x20;
      } while (bVar10);
      if (!bVar10) {
        iVar5 = iVar5 + 1;
      }
    }
    FUN_10a1_3026();
    *(int *)0xaa = iVar5;
    return;
  }
  uVar7 = 0;
  *(undefined2 *)0x842 = 0;
  *(undefined1 *)0x83d = 4;
  *(undefined1 *)0x844 = 0;
  bVar3 = FUN_10a1_3ac8();
  if (bVar3 == 0x26) {
    bVar3 = FUN_10a1_3ac8();
    uVar6 = 0xf04;
    if ((bVar3 != 0x48) && (uVar6 = 0x703, bVar3 != 0x4f)) goto LAB_10a1_38b2;
    while( true ) {
      bVar3 = FUN_10a1_3ac8();
LAB_10a1_38b2:
      bVar2 = bVar3 - 0x30;
      if ((bVar3 < 0x30) ||
         (((9 < bVar2 && (bVar2 = bVar3 - 0x37, bVar2 < 10)) || ((byte)(uVar6 >> 8) < bVar2)))) {
        in_CX = 0;
        goto LAB_10a1_390c;
      }
      if (((uVar7 & 0xe000) != 0) ||
         (bVar3 = (byte)uVar6 & 0x1f, iVar9 = uVar7 << bVar3,
         (bool)(((uVar6 & 0x1f) != 0) * ((int)(uVar7 << bVar3 - 1) < 0)))) break;
      uVar7 = CONCAT11((char)((uint)iVar9 >> 8),(byte)iVar9 | bVar2);
    }
    goto LAB_10a1_0fee_1;
  }
  FUN_10a1_39ff();
  FUN_10a1_3a27();
LAB_10a1_390c:
  bVar3 = (byte)((uint)*(undefined2 *)0x83c >> 8);
  if (bVar3 < 5) {
    if (bVar3 < (byte)*(undefined2 *)0x83c) {
      *(undefined1 *)0x83d = 8;
      goto LAB_10a1_392c;
    }
    FUN_10a1_12da();
  }
  else {
LAB_10a1_392c:
    FUN_10a1_3dd6();
  }
  bVar10 = (in_stack_00000000 & 0x400) != 0;
  bVar3 = FUN_10a1_3ac8();
  if (((bVar3 != 0x25) && (bVar3 != 0x23)) &&
     ((bVar3 != 0x21 && ((bVar3 == 0x44 || (bVar3 == 0x45)))))) {
    FUN_10a1_39ff();
    iVar9 = 0;
    *(undefined1 *)0x844 = 1;
    *(undefined2 *)0x842 = 0;
    FUN_10a1_3a10();
    bVar10 = (param_1 & 0x400) != 0;
    if ((param_1 & 0x40) != 0) {
      iVar9 = -iVar9;
    }
    in_CX = in_CX + iVar9;
  }
  if (in_CX != 0) {
    if (0x26 < in_CX) {
LAB_10a1_0fee_1:
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      (*(code *)*(undefined2 *)0x5e4)();
      return;
    }
    if (in_CX < -0x37) {
      *(undefined2 *)0xaa = 0;
      *(undefined1 *)0xad = 0;
      return;
    }
    iVar9 = in_CX;
    if (in_CX < 0) {
      iVar9 = -in_CX;
    }
    if (0x26 < iVar9) {
      *(char *)0xad = *(char *)0xad + -0x80;
    }
    iVar9 = iVar9 * 8;
    if (*(char *)0x83d == '\b') {
      if (in_CX < 0) {
        FUN_10a1_3ec0();
      }
      else {
        FUN_10a1_3e72();
      }
    }
    else {
      if (0x7fff < *(uint *)(iVar9 + 0x34a)) {
        *(undefined2 *)0xa6 = *(undefined2 *)(iVar9 + 0x34c);
        *(undefined2 *)((uint)bVar10 * -4 + 0xa8) =
             *(undefined2 *)(iVar9 + 0x34e + (uint)bVar10 * -4);
        *(int *)0xa6 = *(int *)0xa6 + 1;
      }
      if (in_CX < 0) {
        FUN_10a1_13cb();
      }
      else {
        FUN_10a1_134b();
      }
    }
  }
  cVar4 = (char)*(undefined2 *)0x83c;
  if (cVar4 == (char)((uint)*(undefined2 *)0x83c >> 8)) {
    return;
  }
  if (cVar4 == '\x02') {
    FUN_10a1_2484();
    return;
  }
  FUN_10a1_240f();
  return;
}



void __cdecl16near FUN_10a1_39ea(void)

{
  FUN_10a1_240f();
  return;
}



void __cdecl16near FUN_10a1_39ff(void)

{
  FUN_10a1_3ac8();
  return;
}



void FUN_10a1_3a10(void)

{
  byte bVar1;
  undefined1 extraout_AH;
  uint in_BX;
  
code_r0x00014420:
  bVar1 = FUN_10a1_3a9c();
  if (in_BX < 0xccd) goto code_r0x00014429;
  goto LAB_10a1_3a0d;
code_r0x00014429:
  in_BX = CONCAT11(extraout_AH,bVar1) + in_BX * 10;
  if ((int)in_BX < 0) {
LAB_10a1_3a0d:
    in_BX = 0x7fff;
  }
  goto code_r0x00014420;
}



void FUN_10a1_3a27(void)

{
  ulong uVar1;
  ulong uVar2;
  byte bVar3;
  undefined1 extraout_AH;
  uint uVar4;
  undefined1 extraout_AH_00;
  uint in_DX;
  uint uVar5;
  int iVar6;
  uint uVar7;
  uint uVar8;
  uint in_BX;
  uint uVar9;
  uint unaff_BP;
  uint uVar10;
  uint uVar11;
  undefined2 unaff_DS;
  bool bVar12;
  bool bVar13;
  
  do {
    bVar3 = FUN_10a1_3a9c();
    uVar5 = in_DX * 2;
    uVar9 = in_BX << 1 | (uint)((int)in_DX < 0);
    uVar4 = CONCAT11(extraout_AH,bVar3) + uVar5;
    iVar6 = in_DX << 2;
    uVar7 = in_DX * 8;
    in_DX = uVar7 + uVar4;
    in_BX = ((uVar9 << 1 | (uint)((int)uVar5 < 0)) << 1 | (uint)(iVar6 < 0)) +
            uVar9 + CARRY2(CONCAT11(extraout_AH,bVar3),uVar5) + (uint)CARRY2(uVar7,uVar4);
  } while ((char)(in_BX >> 8) == '\0');
  *(undefined1 *)0x83d = 8;
  uVar4 = 0;
  do {
    bVar3 = FUN_10a1_3a9c();
    uVar1 = (ulong)CONCAT12((int)in_DX < 0,in_BX) << 1;
    bVar13 = (uVar1 & 0x10000) != 0;
    uVar2 = (ulong)CONCAT12(bVar13,unaff_BP) << 1;
    uVar7 = (uint)((uVar1 & 0xffff | (ulong)((int)in_DX < 0)) << 1) | (uint)((int)(in_DX << 1) < 0);
    uVar10 = (uint)((uVar2 & 0xffff | (ulong)bVar13) << 1) | (uint)((uVar1 & 0x8000) != 0);
    uVar5 = (uint)CARRY2(in_DX * 4,in_DX);
    uVar9 = uVar7 + in_BX;
    uVar7 = (uint)(CARRY2(uVar7,in_BX) || CARRY2(uVar9,uVar5));
    bVar12 = CARRY2(uVar10,unaff_BP);
    uVar10 = uVar10 + unaff_BP;
    bVar13 = (int)(in_DX * 5) < 0;
    uVar8 = in_DX * 10;
    uVar1 = (ulong)CONCAT12(bVar13,uVar9 + uVar5) << 1;
    uVar9 = (uint)uVar1 | (uint)bVar13;
    bVar13 = (uVar1 & 0x10000) != 0;
    uVar1 = (ulong)CONCAT12(bVar13,uVar10 + uVar7) << 1;
    uVar11 = (uint)uVar1 | (uint)bVar13;
    in_DX = uVar8 + CONCAT11(extraout_AH_00,bVar3);
    uVar5 = (uint)CARRY2(uVar8,CONCAT11(extraout_AH_00,bVar3));
    in_BX = uVar9 + uVar5;
    uVar5 = (uint)CARRY2(uVar9,uVar5);
    unaff_BP = uVar11 + uVar5;
    uVar4 = ((((uVar4 << 1 | (uint)((uVar2 & 0x10000) != 0)) << 1 | (uint)((uVar2 & 0x8000) != 0)) +
              uVar4 + (uint)(bVar12 || CARRY2(uVar10,uVar7))) * 2 | (uint)((uVar1 & 0x10000) != 0))
            + (uint)CARRY2(uVar11,uVar5);
  } while (uVar4 < 0x1999);
  *(int *)0x842 = *(int *)0x842 + 1;
  do {
    FUN_10a1_3a9c();
  } while( true );
}



byte __cdecl16near FUN_10a1_3a9c(void)

{
  byte bVar1;
  byte bVar2;
  undefined2 unaff_DS;
  
  while( true ) {
    bVar1 = FUN_10a1_3ac8();
    bVar2 = bVar1 - 0x30;
    if ((0x2f < bVar1) && (bVar2 < 10)) {
      return bVar2;
    }
    if ((bVar2 != 0xfe) || (*(char *)0x844 != '\0')) break;
    *(undefined1 *)0x844 = 1;
    *(int *)0x842 = *(int *)0x842 + -1;
  }
  return bVar2;
}



byte __cdecl16near FUN_10a1_3ac8(void)

{
  byte *pbVar1;
  byte bVar2;
  byte *unaff_SI;
  undefined2 unaff_DS;
  
  do {
    do {
      pbVar1 = unaff_SI;
      unaff_SI = unaff_SI + 1;
      bVar2 = *pbVar1;
    } while (bVar2 == 0x20);
  } while ((bVar2 == 9) || (bVar2 == 10));
  if ((0x60 < bVar2) && (bVar2 < 0x7b)) {
    bVar2 = bVar2 & 0x5f;
  }
  return bVar2;
}



void __cdecl16near FUN_10a1_3aee(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0xac = 0x8100;
  return;
}



int * FUN_10a1_3b42(void)

{
  undefined1 *puVar1;
  undefined2 *puVar2;
  int *piVar3;
  undefined2 *puVar4;
  char cVar5;
  int *piVar6;
  int iVar7;
  int in_CX;
  uint uVar8;
  byte extraout_DL;
  byte bVar9;
  undefined2 *in_BX;
  undefined2 uVar10;
  undefined1 *unaff_SI;
  int *unaff_DI;
  undefined2 *puVar11;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  cVar5 = *(char *)0x83c;
  if (cVar5 != '\x02') {
    puVar11 = (undefined2 *)(0xae - cVar5);
    for (uVar8 = (uint)(int)cVar5 >> 1; uVar8 != 0; uVar8 = uVar8 - 1) {
      puVar4 = puVar11;
      puVar11 = puVar11 + 1;
      puVar2 = in_BX;
      in_BX = in_BX + 1;
      *puVar4 = *puVar2;
    }
    piVar6 = FUN_10a1_3b5c();
    return piVar6;
  }
  *(undefined2 *)0xaa = in_BX;
  FUN_10a1_3503();
  uVar10 = 0xf907;
  if (4 < *(byte *)0x83c) {
    uVar10 = 0xf010;
  }
  FUN_10a1_3674();
  if (((char)extraout_DL < (char)((uint)uVar10 >> 8)) ||
     (cVar5 = extraout_DL + (char)in_CX, (char)uVar10 < cVar5)) {
    piVar6 = (int *)((int)unaff_DI + 1);
    *(undefined1 *)unaff_DI = *unaff_SI;
    in_CX = in_CX + -1;
    bVar9 = extraout_DL;
    if (in_CX != 0) {
      piVar3 = piVar6;
      piVar6 = unaff_DI + 1;
      *(undefined1 *)piVar3 = 0x2e;
      bVar9 = extraout_DL + (char)in_CX;
      for (; unaff_SI = unaff_SI + 1, in_CX != 0; in_CX = in_CX + -1) {
        piVar3 = piVar6;
        piVar6 = (int *)((int)piVar6 + 1);
        *(undefined1 *)piVar3 = *unaff_SI;
      }
    }
    iVar7 = 0x2b45;
    if ((char)bVar9 < '\0') {
      bVar9 = -bVar9;
      iVar7 = 0x2d45;
    }
    if (*(char *)0x83c == '\b') {
      iVar7 = iVar7 + -1;
    }
    *piVar6 = iVar7;
    unaff_DI = piVar6 + 2;
    piVar6[1] = CONCAT11(bVar9 % 10,bVar9 / 10) | 0x3030;
  }
  else {
    iVar7 = (int)cVar5;
    if (iVar7 < 1) {
      iVar7 = -iVar7;
    }
    else {
      do {
        piVar3 = unaff_DI;
        unaff_DI = (int *)((int)unaff_DI + 1);
        puVar1 = unaff_SI;
        unaff_SI = unaff_SI + 1;
        *(undefined1 *)piVar3 = *puVar1;
        in_CX = in_CX + -1;
        iVar7 = iVar7 + -1;
      } while (iVar7 != 0 && in_CX != 0);
      for (; iVar7 != 0; iVar7 = iVar7 + -1) {
        piVar3 = unaff_DI;
        unaff_DI = (int *)((int)unaff_DI + 1);
        *(undefined1 *)piVar3 = 0x30;
      }
      iVar7 = 0;
      if (in_CX == 0) goto LAB_10a1_3b99;
    }
    *(undefined1 *)unaff_DI = 0x2e;
    for (; unaff_DI = (int *)((int)unaff_DI + 1), iVar7 != 0; iVar7 = iVar7 + -1) {
      *(undefined1 *)unaff_DI = 0x30;
    }
    for (; in_CX != 0; in_CX = in_CX + -1) {
      piVar3 = unaff_DI;
      unaff_DI = (int *)((int)unaff_DI + 1);
      puVar1 = unaff_SI;
      unaff_SI = unaff_SI + 1;
      *(undefined1 *)piVar3 = *puVar1;
    }
  }
LAB_10a1_3b99:
  *(undefined1 *)unaff_DI = 0;
  return unaff_DI + -0x402;
}



int * __cdecl16near FUN_10a1_3b5c(void)

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
  
  FUN_10a1_3503();
  uVar6 = 0xf907;
  if (4 < *(byte *)0x83c) {
    uVar6 = 0xf010;
  }
  FUN_10a1_3674();
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
    if (*(char *)0x83c == '\b') {
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
      if (in_CX == 0) goto LAB_10a1_3b99;
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
LAB_10a1_3b99:
  *(undefined1 *)unaff_DI = 0;
  return unaff_DI + -0x402;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void __cdecl16near FUN_10a1_3dd6(void)

{
  uint uVar1;
  ulong uVar2;
  uint in_AX;
  byte bVar3;
  char cVar4;
  uint in_CX;
  uint in_DX;
  uint in_BX;
  uint uVar5;
  int iVar6;
  uint unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar7;
  
  iVar6 = 4;
  while( true ) {
    uVar5 = in_BX;
    in_BX = in_CX;
    bVar3 = (byte)(in_AX >> 8);
    if (unaff_DI != 0) break;
    in_AX = CONCAT11(bVar3 - 0x10,(char)in_AX);
    if ((bVar3 < 0x10 || (byte)(bVar3 - 0x10) == '\0') || (iVar6 = iVar6 + -1, iVar6 == 0))
    goto LAB_10a1_3e5e;
    in_CX = in_DX;
    in_DX = 0;
    unaff_DI = uVar5;
  }
  uVar1 = unaff_DI & 0xff00;
  if ((unaff_DI & 0xff00) == 0) {
    in_AX = CONCAT11(bVar3 - 8,(char)in_AX);
    if (bVar3 < 8 || (byte)(bVar3 - 8) == '\0') {
LAB_10a1_3e5e:
      *(undefined1 *)0xad = 0;
      return;
    }
    uVar1 = uVar5 >> 8;
    uVar5 = CONCAT11((char)uVar5,(char)(in_BX >> 8));
    in_BX = CONCAT11((char)in_BX,(char)(in_DX >> 8));
    in_DX = in_DX << 8;
    unaff_DI = CONCAT11((char)unaff_DI,(char)uVar1);
    uVar1 = unaff_DI;
  }
  if (-1 < (int)uVar1) {
    do {
      cVar4 = (char)(in_AX >> 8) + -1;
      in_AX = CONCAT11(cVar4,(char)in_AX);
      if (cVar4 == '\0') goto LAB_10a1_3e5e;
      bVar7 = (int)in_DX < 0;
      in_DX = in_DX << 1;
      uVar2 = (ulong)CONCAT12(bVar7,in_BX) << 1;
      in_BX = (uint)uVar2 | (uint)bVar7;
      bVar7 = (uVar2 & 0x10000) != 0;
      uVar2 = (ulong)CONCAT12(bVar7,uVar5) << 1;
      uVar5 = (uint)uVar2 | (uint)bVar7;
      bVar7 = (uVar2 & 0x10000) != 0;
      uVar2 = (ulong)CONCAT12(bVar7,unaff_DI) << 1;
      unaff_DI = (uint)uVar2 | (uint)bVar7;
    } while (((uVar2 & 0x10000) != 0) == (int)unaff_DI < 0);
  }
  bVar3 = (byte)(in_DX >> 8);
  if ((0x80 < (byte)in_DX) || ((0x7f < (byte)in_DX && ((in_DX & 0x100) != 0)))) {
    in_DX = (uint)(byte)(bVar3 + 1) << 8;
    uVar1 = (uint)(0xfe < bVar3);
    bVar7 = CARRY2(in_BX,uVar1);
    in_BX = in_BX + uVar1;
    uVar1 = (uint)bVar7;
    bVar7 = CARRY2(uVar5,uVar1);
    uVar5 = uVar5 + uVar1;
    uVar1 = (uint)bVar7;
    bVar7 = CARRY2(unaff_DI,uVar1);
    unaff_DI = unaff_DI + uVar1;
    if ((bVar7) &&
       (cVar4 = (char)(in_AX >> 8) + '\x01', in_AX = CONCAT11(cVar4,(char)in_AX), cVar4 == '\0')) {
      *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
      FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
      (*(code *)*(undefined2 *)0x5e4)();
      return;
    }
  }
  *(undefined2 *)0xac =
       CONCAT11((char)((in_AX & 0xff80) >> 8),
                (byte)(in_AX & 0xff80) | (byte)((unaff_DI & 0x7fff) >> 8));
  *(undefined1 *)0xab = (char)(unaff_DI & 0x7fff);
  *(undefined1 *)0xa6 = (char)(in_DX >> 8);
  *(uint *)0xa7 = in_BX;
  *(uint *)0xa9 = uVar5;
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_3e72(void)

{
  undefined2 uVar1;
  ulong uVar2;
  uint uVar3;
  char cVar4;
  char cVar5;
  byte bVar6;
  char cVar8;
  uint uVar7;
  byte bVar10;
  uint extraout_DX;
  uint uVar9;
  uint in_BX;
  int unaff_SI;
  uint unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar11;
  
  uVar1 = *(undefined2 *)(unaff_SI + 6);
  cVar4 = (char)((uint)uVar1 >> 8);
  if (cVar4 != '\0') {
    cVar8 = (char)((uint)*(undefined2 *)(unaff_DI + 6) >> 8);
    bVar6 = (byte)*(undefined2 *)(unaff_DI + 6);
    if (cVar8 != '\0') {
      cVar4 = cVar4 + '\x7f';
      cVar8 = cVar8 + -0x80;
      uVar7 = CONCAT11(cVar8,bVar6);
      cVar5 = cVar4 + cVar8;
      if (!SCARRY1(cVar4,cVar8)) {
        cVar4 = cVar5 + -0x80;
        bVar11 = cVar4 == '\0';
        FUN_10a1_3fb5();
        uVar9 = extraout_DX;
        if (!bVar11) {
          uVar9 = extraout_DX | 1;
        }
        if ((int)unaff_DI < 0) {
          cVar4 = cVar5 + -0x7f;
          if (cVar4 == '\0') goto LAB_10a1_0fee_1;
        }
        else {
          bVar11 = (int)uVar9 < 0;
          uVar9 = uVar9 << 1;
          uVar2 = (ulong)CONCAT12(bVar11,uVar7) << 1;
          uVar7 = (uint)uVar2 | (uint)bVar11;
          bVar11 = (uVar2 & 0x10000) != 0;
          uVar2 = (ulong)CONCAT12(bVar11,in_BX) << 1;
          in_BX = (uint)uVar2 | (uint)bVar11;
          unaff_DI = unaff_DI << 1 | (uint)((uVar2 & 0x10000) != 0);
          if (cVar4 == '\0') goto LAB_10a1_3e5e;
        }
        bVar10 = (byte)(uVar9 >> 8);
        if ((0x80 < (byte)uVar9) || ((0x7f < (byte)uVar9 && ((uVar9 & 0x100) != 0)))) {
          uVar9 = (uint)(byte)(bVar10 + 1) << 8;
          uVar3 = (uint)(0xfe < bVar10);
          bVar11 = CARRY2(uVar7,uVar3);
          uVar7 = uVar7 + uVar3;
          uVar3 = (uint)bVar11;
          bVar11 = CARRY2(in_BX,uVar3);
          in_BX = in_BX + uVar3;
          uVar3 = (uint)bVar11;
          bVar11 = CARRY2(unaff_DI,uVar3);
          unaff_DI = unaff_DI + uVar3;
          if ((bVar11) && (cVar4 = cVar4 + '\x01', cVar4 == '\0')) goto LAB_10a1_0fee_1;
        }
        uVar3 = CONCAT11(cVar4,(byte)uVar1 ^ bVar6) & 0xff80;
        *(undefined2 *)0xac =
             CONCAT11((char)(uVar3 >> 8),(byte)uVar3 | (byte)((unaff_DI & 0x7fff) >> 8));
        *(undefined1 *)0xab = (char)(unaff_DI & 0x7fff);
        *(undefined1 *)0xa6 = (char)(uVar9 >> 8);
        *(uint *)0xa7 = uVar7;
        *(uint *)0xa9 = in_BX;
        return;
      }
      if (cVar5 < '\0') {
LAB_10a1_0fee_1:
        *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
        FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
        (*(code *)*(undefined2 *)0x5e4)();
        return;
      }
    }
  }
LAB_10a1_3e5e:
  *(undefined1 *)0xad = 0;
  return;
}



// WARNING: Instruction at (ram,0x00011a08) overlaps instruction at (ram,0x00011a07)
// 
// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack
// WARNING: Removing unreachable block (ram,0x0001489c)
// WARNING: Removing unreachable block (ram,0x000148a5)
// WARNING: Removing unreachable block (ram,0x000148bb)

void __cdecl16near FUN_10a1_3ec0(void)

{
  undefined2 uVar1;
  undefined2 uVar2;
  uint uVar3;
  char cVar4;
  char cVar5;
  int iVar6;
  char cVar7;
  byte bVar9;
  uint uVar8;
  int iVar10;
  byte *unaff_SI;
  undefined1 *unaff_DI;
  int iVar11;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined4 uVar12;
  char cStack_1;
  
  uVar1 = *(undefined2 *)(unaff_SI + 6);
  uVar2 = *(undefined2 *)(unaff_DI + 6);
  cVar4 = (char)((uint)uVar1 >> 8);
  cVar7 = (char)((uint)uVar2 >> 8);
  if (cVar7 == '\0') {
LAB_10a1_0fee_1:
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  if (cVar4 != '\0') {
    cVar4 = cVar4 + -0x80;
    cVar7 = cVar7 + -0x80;
    cVar5 = cVar4 - cVar7;
    if (SBORROW1(cVar4,cVar7)) {
      if (cVar5 < '\0') goto LAB_10a1_0fee_1;
    }
    else {
      bVar9 = *unaff_SI;
      uVar8 = *(uint *)(unaff_SI + 1);
      uVar3 = *(uint *)(unaff_SI + 3);
      *(undefined2 *)0xac = *(undefined2 *)(unaff_DI + 5);
      *(undefined2 *)0xaa = *(undefined2 *)(unaff_DI + 3);
      *(undefined2 *)0xa8 = *(undefined2 *)(unaff_DI + 1);
      iVar11 = 0xa6;
      *(undefined1 *)0xa7 = *unaff_DI;
      *(undefined1 *)0xa6 = 0;
      *(byte *)0xad = *(byte *)0xad | 0x80;
      iVar10 = (int)(CONCAT12((uVar3 & 1) != 0,uVar8) >> 1);
      iVar6 = (int)(((ulong)((uVar8 & 1) != 0) << 0x10 | (ulong)bVar9 << 8) >> 1);
      FUN_10a1_3f31();
      FUN_10a1_3f31();
      FUN_10a1_3f31();
      uVar12 = FUN_10a1_3f31();
      if ((((int)uVar12 != 0 || iVar10 != 0) || iVar6 != 0) || (int)((ulong)uVar12 >> 0x10) != 0) {
        iVar11 = 0xa7;
      }
      cStack_1 = cVar5 + -0x80;
      uVar8 = iVar11 << 1;
      if (cStack_1 != '\0') {
        iVar11 = 0x14c;
        iVar10 = 0x14c;
        iVar6 = 0x14c;
        bVar9 = (byte)(uVar8 >> 8);
        if ((0x80 < (byte)uVar8) || ((0x7f < (byte)uVar8 && ((uVar8 & 0x100) != 0)))) {
          uVar8 = (uint)(byte)(bVar9 + 1) << 8;
          uVar3 = (uint)(0xfe < bVar9);
          iVar6 = uVar3 + 0x14c;
          uVar3 = (uint)(0xfeb3 < uVar3);
          iVar10 = uVar3 + 0x14c;
          uVar3 = (uint)(0xfeb3 < uVar3);
          iVar11 = uVar3 + 0x14c;
          if ((0xfeb3 < uVar3) && (cStack_1 = cVar5 + -0x7f, cStack_1 == '\0'))
          goto LAB_10a1_0fee_1;
        }
        uVar3 = CONCAT11(cStack_1,(byte)uVar1 ^ (byte)uVar2) & 0xff80;
        *(undefined2 *)0xac = CONCAT11((char)(uVar3 >> 8),(byte)uVar3 | (byte)((uint)iVar11 >> 8));
        *(undefined1 *)0xab = (char)iVar11;
        *(undefined1 *)0xa6 = (char)(uVar8 >> 8);
        *(int *)0xa7 = iVar6;
        *(int *)0xa9 = iVar10;
        return;
      }
    }
  }
  *(undefined1 *)0xad = 0;
  return;
}



void __cdecl16near FUN_10a1_3f31(void)

{
  ulong uVar1;
  ulong uVar2;
  ulong uVar3;
  long lVar4;
  uint in_AX;
  uint uVar5;
  uint in_CX;
  uint in_DX;
  uint uVar6;
  uint uVar7;
  uint in_BX;
  uint uVar8;
  uint uVar9;
  undefined2 unaff_DS;
  bool bVar10;
  
  uVar9 = *(uint *)0xac;
  if (in_DX < uVar9) {
    if ((in_DX != 0) || (bVar10 = uVar9 < in_AX, uVar7 = 0, uVar9 <= in_AX)) {
      uVar1 = CONCAT22(in_DX,in_AX) / (ulong)uVar9;
      uVar6 = (uint)(CONCAT22(in_DX,in_AX) % (ulong)uVar9);
      uVar9 = *(uint *)0xa6;
      uVar2 = (ulong)uVar9;
      if (uVar9 != 0) {
        uVar2 = (ulong)uVar9 * (uVar1 & 0xffff);
      }
      uVar9 = (uint)(uVar2 >> 0x10);
      uVar3 = (ulong)uVar9;
      if (*(uint *)0xa8 != 0) {
        uVar3 = (ulong)*(uint *)0xa8 * (uVar1 & 0xffff) + (ulong)uVar9;
      }
      uVar7 = (uint)(uVar3 >> 0x10);
      uVar9 = *(uint *)0xaa;
      lVar4 = CONCAT22(uVar9,uVar7);
      if (uVar9 != 0) {
        lVar4 = (ulong)uVar9 * (uVar1 & 0xffff) + (ulong)uVar7;
      }
      uVar8 = (uint)((ulong)lVar4 >> 0x10);
      uVar7 = -(int)uVar2;
      uVar9 = (uint)((int)uVar2 != 0);
      bVar10 = in_CX < (uint)uVar3;
      uVar5 = in_CX - (uint)uVar3;
      in_CX = uVar5 - uVar9;
      uVar9 = (uint)(bVar10 || uVar5 < uVar9);
      bVar10 = in_BX < (uint)lVar4;
      uVar5 = in_BX - (uint)lVar4;
      in_BX = uVar5 - uVar9;
      uVar9 = (uint)(bVar10 || uVar5 < uVar9);
      uVar5 = uVar6 - uVar8;
      bVar10 = uVar6 < uVar8 || uVar5 < uVar9;
      in_AX = uVar5 - uVar9;
    }
  }
  else {
    uVar6 = in_CX - *(uint *)0xa6;
    uVar9 = (uint)(in_CX < *(uint *)0xa6);
    uVar7 = in_BX - *(uint *)0xa8;
    uVar8 = uVar7 - uVar9;
    uVar5 = (in_AX - *(int *)0xaa) - (uint)(in_BX < *(uint *)0xa8 || uVar7 < uVar9);
    in_CX = uVar6 + *(uint *)0xa8;
    uVar9 = (uint)CARRY2(uVar6,*(uint *)0xa8);
    uVar7 = uVar8 + *(uint *)0xaa;
    in_BX = uVar7 + uVar9;
    uVar9 = (uint)(CARRY2(uVar8,*(uint *)0xaa) || CARRY2(uVar7,uVar9));
    uVar6 = uVar5 + in_DX;
    in_AX = uVar6 + uVar9;
    uVar7 = *(uint *)0xa6;
    bVar10 = !CARRY2(uVar5,in_DX) && !CARRY2(uVar6,uVar9);
  }
  if (bVar10) {
    do {
      bVar10 = CARRY2(uVar7,*(uint *)0xa6);
      uVar7 = uVar7 + *(uint *)0xa6;
      uVar9 = (uint)bVar10;
      bVar10 = CARRY2(in_CX,*(uint *)0xa8);
      uVar6 = in_CX + *(uint *)0xa8;
      in_CX = uVar6 + uVar9;
      uVar9 = (uint)(bVar10 || CARRY2(uVar6,uVar9));
      bVar10 = CARRY2(in_BX,*(uint *)0xaa);
      uVar6 = in_BX + *(uint *)0xaa;
      in_BX = uVar6 + uVar9;
      uVar9 = (uint)(bVar10 || CARRY2(uVar6,uVar9));
      bVar10 = CARRY2(in_AX,*(uint *)0xac);
      uVar6 = in_AX + *(uint *)0xac;
      in_AX = uVar6 + uVar9;
    } while (!bVar10 && !CARRY2(uVar6,uVar9));
  }
  return;
}



void __cdecl16near FUN_10a1_3fb5(void)

{
  int unaff_SI;
  int unaff_DI;
  undefined2 unaff_DS;
  
  *(uint *)0x85e = (uint)(*(byte *)(unaff_SI + 6) | 0x80);
  *(uint *)0x860 = (uint)(*(byte *)(unaff_DI + 6) | 0x80);
  return;
}



char __cdecl16near FUN_10a1_41b4(void)

{
  char cVar1;
  char cVar2;
  int in_BX;
  char *unaff_SI;
  undefined2 unaff_DS;
  undefined1 uVar3;
  bool bVar4;
  
  if (*unaff_SI == '\x04') {
    FUN_10a1_41f5();
    return unaff_SI[in_BX + 0xbb];
  }
  if (unaff_SI[0x2a] != '\0') {
    cVar2 = unaff_SI[0x29];
    cVar1 = unaff_SI[0x2a];
    unaff_SI[0x2a] = unaff_SI[0x2a] + -1;
    return unaff_SI[(byte)(cVar2 - cVar1) + 0x33];
  }
  uVar3 = 0;
  bVar4 = unaff_SI[0x29] == '\0';
  if ((bVar4) || (FUN_10a1_4432(), bVar4)) {
    return '\x1a';
  }
  cVar2 = FUN_10a1_41b4();
  if ((bool)uVar3) {
    return cVar2;
  }
  if (cVar2 == '\x1a') {
    unaff_SI[0x29] = '\0';
    unaff_SI[0x2a] = '\0';
    return '\x1a';
  }
  return cVar2;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Stack frame is not setup normally: Input value of stackpointer is not used

void __cdecl16near FUN_10a1_41f5(void)

{
  int unaff_SI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if (*(int *)(unaff_SI + 0xba) == *(int *)(unaff_SI + 0xb3)) {
    *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
    FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
    (*(code *)*(undefined2 *)0x5e4)();
    return;
  }
  *(int *)(unaff_SI + 0xba) = *(int *)(unaff_SI + 0xba) + 1;
  return;
}



void __cdecl16near FUN_10a1_4332(void)

{
  int *piVar1;
  int iVar2;
  int unaff_SI;
  undefined2 unaff_DS;
  
  piVar1 = (int *)(unaff_SI + 0x22);
  iVar2 = *piVar1;
  *piVar1 = *piVar1 + -1;
  if (iVar2 == 0) {
    *(int *)(unaff_SI + 0x24) = *(int *)(unaff_SI + 0x24) + -1;
  }
  return;
}



undefined1 __cdecl16near FUN_10a1_4432(void)

{
  undefined2 *puVar1;
  undefined1 uVar2;
  int iVar3;
  int unaff_SI;
  undefined2 *puVar4;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  undefined4 uVar5;
  
  *(int *)(unaff_SI + 0x27) = *(int *)(unaff_SI + 0x27) + 1;
  puVar4 = (undefined2 *)(unaff_SI + 0x33);
  for (iVar3 = 0x40; iVar3 != 0; iVar3 = iVar3 + -1) {
    puVar1 = puVar4;
    puVar4 = puVar4 + 1;
    *puVar1 = 0;
  }
  FUN_10a1_448a();
  uVar5 = FUN_10a1_4496();
  uVar2 = 0;
  if ((char)uVar5 == '\0') {
    uVar2 = 0x80;
  }
  *(undefined1 *)(unaff_SI + 0x29) = uVar2;
  *(undefined1 *)(unaff_SI + 0x2a) = uVar2;
  return uVar2;
}



// WARNING: Instruction at (ram,0x00011a44) overlaps instruction at (ram,0x00011a43)
// 
// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

void __cdecl16near FUN_10a1_445c(void)

{
  code *pcVar1;
  char cVar2;
  undefined1 *unaff_SI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined4 uVar3;
  
  unaff_SI[0x29] = 0;
  FUN_10a1_448a();
  uVar3 = FUN_10a1_4496();
  cVar2 = (char)uVar3;
  if ((cVar2 != -1) && (cVar2 != '\x01')) {
    if (cVar2 != '\x02') {
      *(int *)(unaff_SI + 0x27) = *(int *)(unaff_SI + 0x27) + 1;
      return;
    }
    *unaff_SI = 0;
    pcVar1 = (code *)swi(0x21);
    (*pcVar1)();
  }
  *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
  FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
  (*(code *)*(undefined2 *)0x5e4)();
  return;
}



void __cdecl16near FUN_10a1_448a(void)

{
  code *pcVar1;
  
  pcVar1 = (code *)swi(0x21);
  (*pcVar1)();
  return;
}



// WARNING (jumptable): Unable to track spacebase fully for stack
// WARNING: Unable to track spacebase fully for stack

undefined4 __cdecl16near FUN_10a1_4496(void)

{
  int *piVar1;
  code *pcVar2;
  char cVar3;
  int iVar4;
  byte bVar5;
  int unaff_SI;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined4 uVar6;
  undefined2 in_stack_00000000;
  
  pcVar2 = (code *)swi(0x21);
  iVar4 = (*pcVar2)();
  piVar1 = (int *)(unaff_SI + 0x22);
  *piVar1 = *piVar1 + 1;
  if (*piVar1 == 0) {
    *(int *)(unaff_SI + 0x24) = *(int *)(unaff_SI + 0x24) + 1;
  }
  bVar5 = (byte)((uint)iVar4 >> 8);
  cVar3 = (char)iVar4;
  if (bVar5 == 0x22) {
    if (cVar3 != '\0') {
      if (cVar3 == '\x05') {
        *(undefined2 *)(*(int *)0x5e6 + -2) = 0x1ac5;
        FUN_10a1_303d();
                    // WARNING: Could not recover jumptable at 0x00011ac5. Too many branches
                    // WARNING: Treating indirect jump as call
        uVar6 = (*(code *)*(undefined2 *)0x5e4)();
        return uVar6;
      }
      iVar4 = 0x2201;
      if (cVar3 != '\x03') {
        iVar4 = 0x2202;
      }
    }
  }
  else if (cVar3 == '\x03') {
    iVar4 = (uint)bVar5 << 8;
  }
  return CONCAT22(in_stack_00000000,iVar4);
}



void FUN_1586_0000(undefined2 param_1)

{
  undefined2 *puVar1;
  undefined2 *puVar2;
  int iVar3;
  undefined2 *puVar4;
  undefined2 *puVar5;
  
  puVar4 = (undefined2 *)0x0;
  puVar5 = (undefined2 *)0x0;
  for (iVar3 = 0x428; iVar3 != 0; iVar3 = iVar3 + -1) {
    puVar2 = puVar5;
    puVar5 = puVar5 + 1;
    puVar1 = puVar4;
    puVar4 = puVar4 + 1;
    *puVar2 = *puVar1;
  }
  FUN_10a1_165e(param_1);
  return;
}



void __cdecl16near FUN_1619_0118(void)

{
  int unaff_SI;
  int unaff_DI;
  undefined2 unaff_ES;
  undefined2 unaff_DS;
  
  FUN_1619_01df();
  FUN_1619_01df();
  FUN_1619_01df();
  FUN_1619_01df();
  FUN_1619_01df();
  FUN_1619_01df();
  FUN_1619_01df();
  FUN_1619_01df();
  FUN_1619_01df();
  FUN_1619_0197();
  FUN_1619_01ae();
  *(undefined1 *)(unaff_DI + 2) = *(undefined1 *)(unaff_SI + 2);
  return;
}



undefined2 __cdecl16near FUN_1619_016a(void)

{
  undefined1 uVar1;
  int *unaff_BP;
  undefined2 unaff_SS;
  
  out(0xc,0x46);
  out(0xb,0x46);
  out(4,0);
  out(4,(char)((uint)(*unaff_BP << 4) >> 8));
  out(0x81,(byte)((uint)*unaff_BP >> 0xc));
  out(5,(char)(DAT_1000_0004 + -1));
  uVar1 = (undefined1)((uint)(DAT_1000_0004 + -1) >> 8);
  out(5,uVar1);
  out(10,2);
  return CONCAT11(uVar1,2);
}



void __cdecl16near FUN_1619_0197(void)

{
  int iVar1;
  char cVar2;
  byte *unaff_DI;
  undefined2 unaff_DS;
  
  cVar2 = '\x02';
  iVar1 = 0;
  do {
    if ((*unaff_DI & 0x80) != 0) break;
    iVar1 = iVar1 + -1;
  } while ((iVar1 != 0) || (cVar2 = cVar2 + -1, cVar2 != '\0'));
  *unaff_DI = *unaff_DI & 0x7f;
  return;
}



void __cdecl16near FUN_1619_01ae(void)

{
  byte bVar1;
  undefined1 uVar2;
  int iVar3;
  byte bVar4;
  int unaff_DI;
  undefined1 *puVar5;
  undefined2 unaff_DS;
  
  puVar5 = (undefined1 *)(unaff_DI + 4);
  bVar4 = 7;
  iVar3 = 0;
  do {
    bVar1 = in(0x3f4);
    if ((bVar1 & 0x80) != 0) {
      bVar1 = in(0x3f4);
      bVar1 = bVar1 & 0x40;
      while( true ) {
        if (bVar1 == 0) {
          return;
        }
        uVar2 = in(0x3f5);
        *puVar5 = uVar2;
        puVar5 = puVar5 + 1;
        iVar3 = 10;
        do {
          iVar3 = iVar3 + -1;
        } while (iVar3 != 0);
        bVar1 = in(0x3f4);
        if ((bVar1 & 0x10) == 0) break;
        bVar4 = bVar4 - 1;
        bVar1 = bVar4;
      }
      return;
    }
    iVar3 = iVar3 + -1;
  } while (iVar3 != 0);
  return;
}



void __cdecl16near FUN_1619_01df(void)

{
  byte bVar1;
  undefined1 in_AH;
  int iVar2;
  
  iVar2 = 0;
  do {
    bVar1 = in(0x3f4);
    if ((bVar1 & 0x40) == 0) {
      iVar2 = 0;
      do {
        bVar1 = in(0x3f4);
        if ((bVar1 & 0x80) != 0) {
          out(0x3f5,in_AH);
          return;
        }
        iVar2 = iVar2 + -1;
      } while (iVar2 != 0);
      return;
    }
    iVar2 = iVar2 + -1;
  } while (iVar2 != 0);
  return;
}


