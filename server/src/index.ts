import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload';
import composeRouter from './routes/compose';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/upload', uploadRouter);
app.use('/api/compose', composeRouter);

app.use('/outputs', express.static(path.join(__dirname, '..', 'outputs')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is UP',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Global error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log('🚀 Video Composer Backend Started');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📁 Static files: /outputs and /uploads`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log('✅ Ready to accept uploads!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();