# 📦 Deployment & Setup Guide

## 🚀 **Quick Start**

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/witchcraftery/incantations-voice-ai-task-manager.git

# Navigate to the app directory
cd incantations-voice-ai-task-manager/voice-ai-task-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Production Build**
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 **Configuration**

### **Environment Variables**
Create a `.env.local` file in the project root:
```env
# Optional: Default OpenRouter API key
VITE_OPENROUTER_API_KEY=your_api_key_here

# Optional: Kokoro TTS server URL
VITE_KOKORO_URL=http://localhost:8880
```

### **Browser Compatibility**
- **Chrome**: ✅ Full support (recommended)
- **Firefox**: ✅ Full support
- **Safari**: ✅ Limited voice features
- **Edge**: ✅ Full support
- **Mobile**: ✅ Touch-optimized interface

### **Required Permissions**
- **Microphone**: For voice input
- **Notifications**: For smart alerts
- **Local Storage**: For data persistence

## 🌐 **Hosting Options**

### **Recommended: Vercel (Free)**
1. **Connect GitHub**: Link your repository to Vercel
2. **Auto-Deploy**: Automatic deployments on git push
3. **Custom Domain**: Optional custom domain support
4. **Settings**: No special configuration needed

### **Alternative: Netlify**
1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**: Add in Netlify dashboard

### **Self-Hosted**
1. **Build**: Run `npm run build`
2. **Static Files**: Serve `dist` folder with any web server
3. **HTTPS Required**: For microphone and notification permissions

## 🎙️ **Kokoro Voice Setup (Optional)**

### **Local Kokoro Server**
```bash
# Download and run Kokoro TTS server
# Follow instructions in /setup-kokoro.sh

# Default URL: http://localhost:8880
# Available voices: af_aoede, af_jadzia, hf_alpha
```

### **Docker Setup**
```bash
# Pull Kokoro container
docker pull kokoroai/kokoro:latest

# Run with port mapping
docker run -p 8880:8880 kokoroai/kokoro:latest
```

## 📱 **Mobile Optimization**

### **PWA Features**
- **Offline Support**: Core functionality works offline
- **App-like Experience**: Can be added to home screen
- **Responsive Design**: Optimized for all screen sizes

### **Touch Gestures**
- **Swipe Navigation**: Swipe between chat and tasks
- **Touch Voice**: Tap and hold for voice input
- **Quick Actions**: Swipe tasks for quick complete/delete

## 🔍 **SEO & Accessibility**

### **SEO Optimized**
- **Meta Tags**: Proper title, description, keywords
- **Open Graph**: Social media preview cards
- **Structured Data**: Task management schema markup

### **Accessibility Features**
- **Screen Reader**: Full screen reader support
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast**: Dark theme with proper contrast ratios
- **Voice Control**: Hands-free operation capability

## 📊 **Analytics & Monitoring**

### **Built-in Analytics**
- **Task Completion Rates**: Local analytics in settings
- **Usage Patterns**: Voice vs text input tracking
- **Performance Metrics**: AI response times, accuracy

### **Optional: External Analytics**
Add to `index.html` for production analytics:
```html
<!-- Google Analytics (optional) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

## 🛡️ **Security Considerations**

### **Data Protection**
- **Local Storage Only**: No server-side data storage
- **API Key Security**: Keys stored locally only
- **HTTPS Required**: Secure transmission for APIs

### **Privacy Features**
- **No Tracking**: No analytics unless explicitly added
- **Data Export**: Users can export all their data
- **Data Clearing**: Complete data deletion available

## 🚀 **Performance Optimization**

### **Build Optimizations**
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and CSS optimization

### **Runtime Performance**
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Service Worker**: Caching for offline performance

## 🐛 **Debugging & Development**

### **Development Tools**
- **React DevTools**: Component inspection
- **Redux DevTools**: State management debugging
- **Browser Console**: Detailed error logging

### **Common Issues**
- **Voice Not Working**: Check microphone permissions
- **Notifications Blocked**: Enable in browser settings  
- **AI Not Responding**: Check OpenRouter API key and connection
- **Theme Not Switching**: Clear localStorage and refresh

## 📈 **Scaling Considerations**

### **Current Limitations**
- **Local Storage**: ~5-10MB limit per domain
- **Browser Memory**: Large conversation histories may slow down
- **API Rate Limits**: OpenRouter model-specific limits

### **Future Enhancements**
- **IndexedDB**: For larger data storage
- **Service Worker**: Background task processing
- **WebRTC**: Real-time collaboration features

## 🔄 **Updates & Maintenance**

### **Automatic Updates**
- **Git-based Deployment**: Pull latest changes and redeploy
- **Version Checking**: App checks for updates automatically
- **Migration Scripts**: Automatic data migration for updates

### **Backup & Recovery**
- **Export Data**: Settings → General → Export Data
- **Import Data**: Settings → General → Import Data
- **Reset App**: Clear all data and start fresh
