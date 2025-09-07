import { GoogleGenAI } from "@google/genai";

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
}

export interface EditImageOptions {
  imageUrl: string;
  editPrompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  error?: string;
  prompt: string;
  aspectRatio: string;
}

export async function generateImage({
  prompt,
  aspectRatio = "1:1",
}: GenerateImageOptions): Promise<ImageGenerationResult> {
  try {
    const model = genai.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });

    const enhancedPrompt = `Create a high-quality image with ${aspectRatio} aspect ratio. ${prompt}`;
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();
    
    // For now, return a placeholder since gemini-1.5-flash doesn't support image generation
    // We'll need to use a different approach or wait for the correct model
    return {
      success: false,
      error: "Image generation model not available. Please configure gemini-2.5-flash-image-preview model.",
      prompt: enhancedPrompt,
      aspectRatio,
    };
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate image",
      prompt,
      aspectRatio,
    };
  }
}

export async function generatePromptSuggestions(userRequest: string): Promise<string[]> {
  try {
    const model = genai.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });

    const prompt = `Generate 3 optimized image generation prompts based on this request: "${userRequest}"
    
    Create 3 unique approaches:
    1. One photorealistic/professional with detailed lighting and composition
    2. One artistic/creative with specific visual style and mood  
    3. One minimalist/modern with clean composition and aesthetic
    
    Each prompt should:
    - Start with image type and primary subject
    - Include specific visual characteristics and details
    - Define lighting, mood, and composition
    - Use narrative description rather than keyword lists
    
    Return only the 3 prompts, one per line, no numbering or extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const suggestions = text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 3);
    
    return suggestions.length > 0 ? suggestions : [userRequest];
  } catch (error) {
    console.error("Error generating prompt suggestions:", error);
    return [userRequest];
  }
}

export async function editImage({
  imageUrl,
  editPrompt,
  aspectRatio = "1:1",
}: EditImageOptions): Promise<ImageGenerationResult> {
  try {
    // For now, return a placeholder since we need the correct model configuration
    return {
      success: false,
      error: "Image editing model not available. Please configure gemini-2.5-flash-image-preview model.",
      prompt: editPrompt,
      aspectRatio,
    };
  } catch (error) {
    console.error("Error editing image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit image",
      prompt: editPrompt,
      aspectRatio,
    };
  }
}