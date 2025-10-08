# Run Express

To install dependencies:

```bash
bun install
```

To run:

```bash
bun dev
```

# Jika ingin setup manual Express + Typescript

1. Buat folder
2. Inisialisasi awalnya adalah:
```bash 
   bun init -y
```
3. Install express
```bash
    bun a express
```
4. Install typescript, @type/express, ts-node, dan tsx di devDependencies
```bash
    bun a -D typescript @types/express ts-node tsx
```
5. Tambahkan kode berikut ke dalam `tsconfig.json`:
```json
{
    "compilerOptions": {  },
    "include": ["src"]
}
```
6. Lalu tambahkan kode berikut di `package.json`:
```json
  { 
  "scripts": {
    "build": "tsc --build",
    "dev": "nodemon --ext ts --watch src --exec bunx tsx src/app.ts"
  }
}
```
7. Yang trakhir tinggal buat folder `src` dan masukkan `app.ts` didalamnya dan akhirnya stuktur foldernya seperti ini:
```text
   express-ts/ 
   ├── node_modules/ 
   ├── src/ 
   │ ├── app.ts
   ├── .gitignore
   ├── bun.lockb   
   ├── package.json
   ├── README.md   
   ├── tsconfig.json

```

