import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// For simplicity, we assume a single configuration row (e.g., id=1 or the first one found)
async function getActiveConfig() {
  let config = await prisma.whatsAppConfig.findFirst();
  // If no config exists, create a default one
  if (!config) {
    config = await prisma.whatsAppConfig.create({
      data: {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        destinationType: 'GROUP',
        destinationIdentifier: process.env.WHATSAPP_DEFAULT_DESTINATION_IDENTIFIER || '',
        timezone: process.env.APP_TIMEZONE || 'Asia/Pontianak',
      },
    });
  }
  return config;
}

export async function GET() {
  try {
    const config = await getActiveConfig();
    // IMPORTANT: Do NOT return the access token, even if it were stored here.
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const activeConfig = await getActiveConfig();

    const updatedConfig = await prisma.whatsAppConfig.update({
      where: { id: activeConfig.id },
      data: {
        phoneNumberId: body.phoneNumberId,
        destinationType: body.destinationType,
        destinationIdentifier: body.destinationIdentifier,
        timezone: body.timezone,
        defaultDailyTime: body.defaultDailyTime,
      },
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating WhatsApp config:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
