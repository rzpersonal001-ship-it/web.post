import axios from 'axios';
import prisma from '../src/lib/db';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  details?: any;
}

const healthChecks: HealthStatus[] = [];

async function checkDatabase(): Promise<HealthStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const postCount = await prisma.post.count();
    const scheduleCount = await prisma.schedule.count();
    const jobCount = await prisma.scheduledJob.count();
    
    return {
      service: 'PostgreSQL Database',
      status: 'healthy',
      message: 'Database connection successful',
      details: {
        posts: postCount,
        schedules: scheduleCount,
        jobs: jobCount,
      },
    };
  } catch (error: any) {
    return {
      service: 'PostgreSQL Database',
      status: 'unhealthy',
      message: `Database connection failed: ${error.message}`,
    };
  }
}

async function checkWebServer(): Promise<HealthStatus> {
  try {
    const response = await axios.get('http://localhost:3000/api/dashboard/overview', {
      timeout: 5000,
    });
    
    if (response.status === 200) {
      return {
        service: 'Next.js Web Server',
        status: 'healthy',
        message: 'Web server responding',
        details: {
          url: 'http://localhost:3000',
          responseTime: `${response.headers['x-response-time'] || 'N/A'}`,
        },
      };
    }
    
    return {
      service: 'Next.js Web Server',
      status: 'warning',
      message: `Unexpected status code: ${response.status}`,
    };
  } catch (error: any) {
    return {
      service: 'Next.js Web Server',
      status: 'unhealthy',
      message: `Web server not responding: ${error.message}`,
    };
  }
}

async function checkWhatsAppConfig(): Promise<HealthStatus> {
  try {
    const config = await prisma.whatsAppConfig.findFirst();
    const hasToken = !!process.env.WHATSAPP_ACCESS_TOKEN;
    const hasPhoneId = !!process.env.WHATSAPP_PHONE_NUMBER_ID;
    const hasDestination = !!process.env.WHATSAPP_DEFAULT_DESTINATION_IDENTIFIER;
    
    if (hasToken && hasPhoneId && hasDestination) {
      return {
        service: 'WhatsApp Configuration',
        status: 'healthy',
        message: 'WhatsApp credentials configured',
        details: {
          hasConfig: !!config,
          hasToken,
          hasPhoneId,
          hasDestination,
        },
      };
    }
    
    return {
      service: 'WhatsApp Configuration',
      status: 'warning',
      message: 'WhatsApp credentials not fully configured',
      details: {
        hasConfig: !!config,
        hasToken,
        hasPhoneId,
        hasDestination,
      },
    };
  } catch (error: any) {
    return {
      service: 'WhatsApp Configuration',
      status: 'unhealthy',
      message: `Failed to check WhatsApp config: ${error.message}`,
    };
  }
}

async function checkEnvironment(): Promise<HealthStatus> {
  const requiredVars = [
    'DATABASE_URL',
    'NODE_ENV',
    'APP_TIMEZONE',
  ];
  
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length === 0) {
    return {
      service: 'Environment Variables',
      status: 'healthy',
      message: 'All required environment variables set',
      details: {
        nodeEnv: process.env.NODE_ENV,
        timezone: process.env.APP_TIMEZONE,
      },
    };
  }
  
  return {
    service: 'Environment Variables',
    status: 'unhealthy',
    message: `Missing environment variables: ${missingVars.join(', ')}`,
  };
}

async function checkScheduler(): Promise<HealthStatus> {
  try {
    const pendingJobs = await prisma.scheduledJob.count({
      where: { status: 'PENDING' },
    });
    
    const recentJobs = await prisma.scheduledJob.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });
    
    return {
      service: 'Scheduler',
      status: 'healthy',
      message: 'Scheduler operational',
      details: {
        pendingJobs,
        jobsLast24h: recentJobs,
        schedulerEnabled: process.env.SCHEDULER_ENABLED === 'true',
        interval: process.env.SCHEDULER_INTERVAL || '60000',
      },
    };
  } catch (error: any) {
    return {
      service: 'Scheduler',
      status: 'unhealthy',
      message: `Scheduler check failed: ${error.message}`,
    };
  }
}

function printHealthStatus(status: HealthStatus) {
  const icon = status.status === 'healthy' ? '✅' : status.status === 'warning' ? '⚠️' : '❌';
  console.log(`\n${icon} ${status.service}`);
  console.log(`   Status: ${status.status.toUpperCase()}`);
  console.log(`   Message: ${status.message}`);
  
  if (status.details) {
    console.log('   Details:');
    Object.entries(status.details).forEach(([key, value]) => {
      console.log(`     - ${key}: ${value}`);
    });
  }
}

async function runHealthCheck() {
  console.log('\n🏥 WA Scheduler - Health Check');
  console.log('='.repeat(60));
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));
  
  // Run all health checks
  healthChecks.push(await checkEnvironment());
  healthChecks.push(await checkDatabase());
  healthChecks.push(await checkWebServer());
  healthChecks.push(await checkWhatsAppConfig());
  healthChecks.push(await checkScheduler());
  
  // Print results
  healthChecks.forEach(printHealthStatus);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Health Check Summary:\n');
  
  const healthy = healthChecks.filter(c => c.status === 'healthy').length;
  const warning = healthChecks.filter(c => c.status === 'warning').length;
  const unhealthy = healthChecks.filter(c => c.status === 'unhealthy').length;
  const total = healthChecks.length;
  
  console.log(`Total Services: ${total}`);
  console.log(`✅ Healthy: ${healthy}`);
  console.log(`⚠️  Warning: ${warning}`);
  console.log(`❌ Unhealthy: ${unhealthy}`);
  
  const healthScore = ((healthy + warning * 0.5) / total * 100).toFixed(1);
  console.log(`\n🎯 Overall Health Score: ${healthScore}%`);
  
  if (unhealthy === 0 && warning === 0) {
    console.log('\n🎉 All systems operational!\n');
  } else if (unhealthy === 0) {
    console.log('\n⚠️  System operational with warnings.\n');
  } else {
    console.log('\n❌ System has critical issues that need attention.\n');
  }
  
  await prisma.$disconnect();
  
  return unhealthy === 0;
}

// Run health check
runHealthCheck()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
