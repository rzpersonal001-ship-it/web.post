import { Post } from '@prisma/client';

export interface WhatsAppDestinationConfig {
  destinationType: 'single' | 'group';
  destinationIdentifier: string;
  phoneNumberId: string;
}

/**
 * Sends a message with media using the WhatsApp Cloud API.
 * This function is designed to be a swappable implementation.
 *
 * @param post The post content to send.
 * @param config The destination and authentication configuration.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function sendTextWithMedia(
  post: Post,
  config: WhatsAppDestinationConfig
): Promise<{ success: boolean; error?: string }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('WhatsApp Access Token is not configured in environment variables.');
    return {
      success: false,
      error: 'WhatsApp Access Token is not configured.',
    };
  }

  const apiUrl = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;

  const messagePayload = {
    messaging_product: 'whatsapp',
    to: config.destinationIdentifier,
    type: post.mediaType.toLowerCase(),
    [post.mediaType.toLowerCase()]: {
      link: post.mediaUrl,
      caption: post.caption,
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', responseData);
      return {
        success: false,
        error: responseData.error?.message || 'Unknown error from WhatsApp API.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
