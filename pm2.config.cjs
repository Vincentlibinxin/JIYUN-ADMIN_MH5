module.exports = {
  apps: [
    {
      name: 'mh5-web',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview --host 127.0.0.1 --port 3102 --strictPort',
      env: {
        NODE_ENV: 'production',
      },
      cwd: 'C:/Users/Administrator/集运系统/JIYUN-ADMIN_MH5',
    },
  ],
};
