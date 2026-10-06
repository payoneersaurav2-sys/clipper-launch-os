import { sendWelcomeEmail, sendOnboardingEmail } from './api/email-service.ts';
import 'dotenv/config';

async function run() {
  console.log('Testing Resend Integration...');
  try {
    const res1 = await sendWelcomeEmail('test@creator-os.online', 'Test User');
    console.log('Welcome Email Result:', res1);

    const res2 = await sendOnboardingEmail('test@creator-os.online', 'Test User');
    console.log('Onboarding Email Result:', res2);

  } catch (err) {
    console.error('Test Failed:', err);
  }
}

run();
