import prisma from '../src/lib/db';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function setupWhatsAppConfig() {
  console.log('\n' + '='.repeat(70));
  console.log('⚙️  Setting up WhatsApp Configuration');
  console.log('='.repeat(70) + '\n');

  try {
    // Check if config exists
    const existingConfig = await prisma.whatsAppConfig.findFirst();

    const configData = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '0895339581136',
      destinationType: 'SINGLE' as const,
      destinationIdentifier: '0895339581136', // Nomor tujuan
      timezone: process.env.APP_TIMEZONE || 'Asia/Pontianak',
      defaultDailyTime: '09:00',
    };

    if (existingConfig) {
      // Update existing config
      await prisma.whatsAppConfig.update({
        where: { id: existingConfig.id },
        data: configData,
      });
      console.log('✅ WhatsApp config updated successfully!\n');
    } else {
      // Create new config
      await prisma.whatsAppConfig.create({
        data: configData,
      });
      console.log('✅ WhatsApp config created successfully!\n');
    }

    console.log('📋 Configuration:');
    console.log('   Phone Number ID:', configData.phoneNumberId);
    console.log('   Destination:', configData.destinationIdentifier);
    console.log('   Type:', configData.destinationType);
    console.log('   Timezone:', configData.timezone);
    console.log('\n' + '='.repeat(70) + '\n');

    await prisma.$disconnect();
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

setupWhatsAppConfig();
