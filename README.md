# AI Canvas Studio

A powerful, Figma-inspired canvas application for AI-powered image generation, editing, and composition using Google's Gemini 2.5 Flash Image Preview model.

## 📹 Demo

<video width="100%" controls>
  <source src="https://pub-cbe205950fc9484ea5f32f03f1cc2f73.r2.dev/AI%20Canvas%20Studio.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

[View Demo Video](https://pub-cbe205950fc9484ea5f32f03f1cc2f73.r2.dev/AI%20Canvas%20Studio.mp4)

## 🎨 Features

### Core Functionality
- **AI Image Generation** - Create images from text prompts using Gemini's latest image model
- **Multi-Image Composition** - Combine and edit up to 3 images simultaneously with AI
- **Smart Image Editing** - Transform existing images with natural language instructions
- **Image Upscaling** - Enhance image resolution 2x or 4x using fal.ai's ESRGAN models
- **Canvas Workspace** - Drag, resize, and arrange images on an infinite canvas
- **Paste & Upload** - Quick image import via paste (Cmd/Ctrl+V) with automatic cloud upload

### User Interface
- **Minimalist Toolbar** - Clean, icon-based controls for essential actions
- **Modal Workflows** - Focused, step-by-step interfaces for each operation
- **Real-time Preview** - See your images before adding them to the canvas
- **Multi-select Support** - Select multiple images for batch operations
- **Responsive Design** - Works seamlessly across different screen sizes

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Canvas**: ReactFlow for node-based canvas management
- **AI Models**: 
  - Google Gemini 2.5 Flash Image Preview (generation/editing)
  - fal.ai ESRGAN models (upscaling)
- **Storage**: Cloudflare R2 for image hosting
- **Package Manager**: Bun

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/ancs21/ai-canvas-studio.git
cd ai-canvas-studio

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
```

## 🔑 Environment Variables

Create a `.env.local` file with the following:

```env
# Google AI
GOOGLE_API_KEY=your_google_api_key

# Cloudflare R2
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_ACCOUNT_ID=your_r2_account_id
R2_BUCKET_NAME=your_bucket_name
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_PUBLIC_DOMAIN=https://your-public-domain.com

# fal.ai (for upscaling)
FAL_KEY=your_fal_api_key
```

## 🏃‍♂️ Development

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

## 📱 Usage

### Generate an Image
1. Click the ✨ (Sparkles) button in the toolbar
2. Enter your prompt describing the image you want
3. Click "Generate Image"
4. The generated image appears on your canvas

### Edit Images
1. Select one or more images on the canvas (up to 3)
2. Click the ✏️ (Edit) button
3. Describe how you want to modify or combine the images
4. Click "Edit Image" to apply transformations

### Upscale Images
1. Select a single image
2. Click the 🔍 (Maximize) button
3. Choose scale factor (2x or 4x) and model type
4. Click "Upscale Image"

### Download Images
1. Select one or more images
2. Click the 📥 (Download) button
3. Single images download directly
4. Multiple images download as a ZIP file

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API endpoints
│   │   ├── generate-image/
│   │   ├── edit-image/
│   │   ├── upscale-image/
│   │   ├── upload/
│   │   └── download-*/
│   └── page.tsx           # Main page
├── components/
│   ├── canvas/            # Canvas components
│   │   ├── CanvasEditor.tsx
│   │   └── ToolbarControls.tsx
│   ├── modals/            # Modal dialogs
│   │   ├── ImageGenerationModal.tsx
│   │   ├── ImageEditModal.tsx
│   │   └── ImageUpscaleModal.tsx
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities
│   ├── r2-client.ts      # R2 storage client
│   ├── download-utils.ts # Download helpers
│   └── utils.ts          # General utilities
└── contexts/              # React contexts
    └── CanvasContext.tsx
```

## 🎯 Key Features Explained

### Multi-Image Composition
The edit feature supports combining multiple images with natural language instructions. For example:
- "Put the person from image 1 on the background of image 2"
- "Blend all three images into a collage"
- "Apply the art style of image 1 to image 2"

### Smart Canvas Management
- Images maintain their aspect ratios when added to canvas
- Automatic positioning at viewport center
- Responsive resizing with aspect ratio preservation
- Visual feedback for selected and shared nodes

### Server-Side Image Processing
- All AI operations happen server-side for better performance
- CORS-free image downloads via API proxying
- Automatic image optimization and format conversion

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Google Gemini team for the powerful image generation API
- fal.ai for high-quality upscaling models
- Vercel and Next.js team for the amazing framework
- shadcn for the beautiful UI components