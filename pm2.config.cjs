module.exports = {
  apps: [
    {
      name: 'mh5-frontend',
      script: 'node_modules/vite/bin/vite.js',
      cwd: 'C:/Users/Administrator/集运系统/JIYUN-ADMIN_MH5',
    },
    {
      name: 'admin-api',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: '--tsconfig server/tsconfig.json server/index.ts',
      cwd: 'C:/Users/Administrator/集运系统/ADMIN',
    },
  ],
};
