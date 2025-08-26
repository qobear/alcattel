import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Health check endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic health info
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'unknown',
        memory: 'unknown',
        disk: 'unknown'
      }
    };

    // Database connectivity check
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = 'healthy';
    } catch (error) {
      health.checks.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    health.checks.memory = 'healthy';
    if (memoryUsageMB.heapUsed > 500) { // 500MB threshold
      health.checks.memory = 'warning';
    }
    if (memoryUsageMB.heapUsed > 800) { // 800MB threshold
      health.checks.memory = 'unhealthy';
      health.status = 'degraded';
    }

    // Response time check
    const responseTime = Date.now() - startTime;
    health.checks.responseTime = responseTime;
    
    if (responseTime > 1000) { // 1 second threshold
      health.status = 'degraded';
    }

    // Determine overall status
    const unhealthyChecks = Object.values(health.checks).filter(check => check === 'unhealthy').length;
    const warningChecks = Object.values(health.checks).filter(check => check === 'warning').length;

    if (unhealthyChecks > 0) {
      health.status = 'unhealthy';
    } else if (warningChecks > 0 && health.status !== 'degraded') {
      health.status = 'warning';
    }

    // Set appropriate HTTP status code
    let statusCode = 200;
    if (health.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    } else if (health.status === 'degraded') {
      statusCode = 200; // OK but degraded
    }

    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: Date.now() - startTime
    }, { status: 503 });
  }
}

// HEAD - Simple ping endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
