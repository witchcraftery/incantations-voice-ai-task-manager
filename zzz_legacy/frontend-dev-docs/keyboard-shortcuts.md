# ⌨️ Voice Chat Keyboard Shortcuts

## 🎯 **Available Shortcuts**

### **Voice Control**
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac) | **Toggle Recording** | Start/stop voice recording |
| `Space` (hold) | **Push-to-Talk** | Hold to record, release to auto-send |
| `Escape` | **Stop Recording** | Immediately stop active recording |

### **Smart Behavior**
• **Input Field Detection** - Shortcuts are disabled when typing in text fields
• **Visual Feedback** - Button tooltips show active shortcuts
• **Cross-Platform** - Works on Windows, Mac, and Linux
• **Accessibility** - Screen reader compatible

### **Usage Patterns**

#### **Quick Toggle Mode:**
1. `Ctrl+Shift+V` → Start recording
2. Speak your message
3. Wait 2.5s → Auto-send
4. `Ctrl+Shift+V` → Stop when done

#### **Push-to-Talk Mode:**
1. Hold `Space` → Start recording  
2. Speak while holding
3. Release `Space` → Immediate auto-send
4. Perfect for quick commands!

#### **Emergency Stop:**
- `Escape` → Instantly stop recording
- Useful if you start talking in a meeting by accident

### **Pro Tips:**
• **Hands-free flow**: Start with `Ctrl+Shift+V`, let auto-send handle the rest
• **Quick bursts**: Use `Space` for rapid-fire task additions
• **Presentation safe**: `Escape` for immediate silence
• **Multitasking**: Keep hands on keyboard while voice-managing tasks

### **Implementation Notes:**
- Shortcuts respect user preferences (voice must be enabled)
- No conflicts with browser shortcuts
- Graceful fallback if voice not supported
- Works across all app tabs and views

## 🚀 **This makes voice task management lightning fast!**

### **Example Workflow:**
```
User: Ctrl+Shift+V
System: [Mic active - red pulse]
User: "I need to review the Johnson proposal"
System: [2.5s later - auto-send to AI]
AI: "Added 'Review Johnson proposal' to your tasks..."
User: Space (hold) "Make it high priority" (release)
System: [Immediate auto-send]
AI: "Updated to high priority. Anything else?"
User: Escape
System: [Recording stopped - ready for next session]
```

**Result**: Keyboard-driven voice task management that feels like magic! ✨
