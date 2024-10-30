export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  return {
    nodeEnv,
    isProduction,
    port: parseInt(process.env.PORT, 10) || 3000,
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    dataDir: process.env.DATA_DIR || 'data'
  };
};
