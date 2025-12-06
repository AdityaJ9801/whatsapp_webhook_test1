// Import required modules
const express = require('express');
const axios = require('axios');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Configuration
const port = process.env.PORT ;
const verifyToken = process.env.VERIFY_TOKEN ;
const accessToken = process.env.ACCESS_TOKEN ';
const whatsappApiUrl = 'https://graph.facebook.com/v22.0/926283987231472/messages';

// Function to send WhatsApp message
async function sendWhatsAppMessage(to, messageText) {
  try {
    const response = await axios.post(
      whatsappApiUrl,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: messageText
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Message sent successfully to:', to);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
    throw error;
  }
}

// Chatbot logic - generates responses based on user input
function generateBotResponse(userMessage) {
  const message = userMessage.toLowerCase().trim();
  
  // Greeting responses
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return `👋 Hello! Welcome to our service!

How can I assist you today? Feel free to ask about:
• Products & Services
• Pricing
• Support
• Business Hours`;
  }
  
  // Help requests
  if (message.includes('help')) {
    return `🤖 I'm here to help! I can assist you with:

📦 Product Information
💰 Pricing & Plans
🕐 Business Hours
📞 Customer Support
❓ General Inquiries

Just type your question!`;
  }
  
  // Goodbye messages
  if (message.includes('bye') || message.includes('goodbye')) {
    return `👋 Goodbye! Thanks for chatting with us!

Feel free to message anytime. Have a wonderful day! 😊`;
  }
  
  // Pricing inquiries
  if (message.includes('price') || message.includes('cost') || message.includes('pricing')) {
    return `💰 Pricing Information:

I'd be happy to help with pricing details! 

Could you please specify:
• Which product/service?
• Monthly or annual plan?
• Any specific features you're interested in?`;
  }
  
  // Business hours
  if (message.includes('hours') || message.includes('time') || message.includes('open')) {
    return `🕐 Business Hours:

We're available 24/7! 🎉

Our automated support is always here, and our human team responds:
📅 Monday - Friday: 9 AM - 6 PM
📅 Saturday: 10 AM - 4 PM
📅 Sunday: Closed

How can I help you right now?`;
  }
  
  // Product inquiries
  if (message.includes('product') || message.includes('service')) {
    return `📦 Our Products & Services:

We offer:
✅ Premium Solutions
✅ Custom Services
✅ 24/7 Support
✅ Flexible Plans

What specific product are you interested in? I can provide detailed information!`;
  }
  
  // Thank you
  if (message.includes('thank')) {
    return `😊 You're very welcome!

Is there anything else I can help you with today?

Feel free to ask any questions!`;
  }
  
  // Default response
  return `Thanks for your message! 🙂

I received: "${userMessage}"

I can help you with:
• 📦 Product Information
• 💰 Pricing
• 🕐 Business Hours
• 📞 Support

What would you like to know more about?`;
}

// Route for GET requests (Webhook verification)
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  
  console.log('🔍 Webhook verification attempt');
  console.log('Mode:', mode);
  console.log('Token received:', token);
  console.log('Expected token:', verifyToken);
  
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    console.log('❌ WEBHOOK VERIFICATION FAILED');
    res.status(403).end();
  }
});

// Route for POST requests (Receive messages)
app.post('/', async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📨 Webhook received at ${timestamp}`);
  console.log('='.repeat(60));
  console.log(JSON.stringify(req.body, null, 2));
  console.log('='.repeat(60));
  
  try {
    const body = req.body;
    
    // Check if it's a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      
      for (const entry of entries) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          if (change.field === 'messages') {
            const value = change.value;
            const messages = value.messages || [];
            
            for (const message of messages) {
              // Only process text messages
              if (message.type === 'text') {
                const fromNumber = message.from;
                const messageBody = message.text.body;
                const messageId = message.id;
                
                console.log('\n📩 NEW MESSAGE RECEIVED:');
                console.log(`   From: ${fromNumber}`);
                console.log(`   Message: ${messageBody}`);
                console.log(`   ID: ${messageId}`);
                
                // Generate bot response
                const botResponse = generateBotResponse(messageBody);
                
                console.log('\n🤖 BOT RESPONSE:');
                console.log(`   ${botResponse.split('\n')[0]}...`);
                
                // Send response back to user
                await sendWhatsAppMessage(fromNumber, botResponse);
                
                console.log('✅ Response sent successfully!\n');
              }
            }
          }
        }
      }
    }
    
    res.status(200).end();
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).end();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: '✅ running',
    service: 'WhatsApp Chatbot',
    version: '1.0',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to simulate incoming messages (for testing)
app.post('/simulate-message', (req, res) => {
  const { message, from } = req.body;
  const testMessage = message || 'Hello';
  const testFrom = from || '918830757864';
  
  console.log('\n🧪 SIMULATION MODE:');
  console.log(`   From: ${testFrom}`);
  console.log(`   Message: ${testMessage}`);
  
  const botResponse = generateBotResponse(testMessage);
  
  console.log('\n🤖 SIMULATED BOT RESPONSE:');
  console.log(`   ${botResponse}`);
  
  res.json({
    success: true,
    simulation: true,
    input: {
      from: testFrom,
      message: testMessage
    },
    output: {
      bot_response: botResponse
    },
    note: 'This is a simulation. In production, the bot will send this response via WhatsApp.'
  });
});

// Start the server
app.listen(port, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 WhatsApp Chatbot Server Started');
  console.log('='.repeat(60));
  console.log(`🌐 Port: ${port}`);
  console.log(`🔑 Verify Token: ${verifyToken}`);
  console.log(`🔐 Access Token: ${accessToken ? 'Set ✅' : 'Not Set ❌'}`);
  console.log(`📱 Phone ID: 926283987231472`);
  console.log('='.repeat(60));
  console.log(`\n✅ Server is listening on port ${port}`);
  console.log(`📍 Webhook URL: http://localhost:${port}/`);
  console.log(`📍 Health Check: http://localhost:${port}/health\n`);
});
