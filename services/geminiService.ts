import { GoogleGenAI, GenerateVideosOperation, FunctionDeclaration } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL, GEMINI_VIDEO_MODEL, PROMPT_ENHANCER_SYSTEM_PROMPT } from '../constants';
import { History, GroundingSource, PromptEnhancerMode } from "../types";

let ai: GoogleGenAI | null = null;

// Lazily initialize the AI instance to prevent app crash on load
// if the environment isn't configured.
export const getAiInstance = (): GoogleGenAI => {
    if (!ai) {
        // This check prevents a ReferenceError in browser environments where `process` is not defined.
        const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

        if (!apiKey) {
            console.error("API_KEY environment variable is not configured.");
            throw new Error("System configuration error: API Key is missing.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

interface StreamChunk {
  text: string;
  sources?: GroundingSource[];
  functionCalls?: any[];
}

// Helper function to convert a file to a Gemini Part for image data
const fileToGenerativePart = async (file: File): Promise<any> => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      mimeType: file.type,
      data: base64EncodedData,
    },
  };
};

export async function enhancePrompt(prompt: string, mode: PromptEnhancerMode): Promise<string> {
  if (mode === 'off' || !prompt) return prompt;

  try {
    const aiInstance = getAiInstance();
    const systemInstruction = PROMPT_ENHANCER_SYSTEM_PROMPT(mode);

    const response = await aiInstance.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.3, // Lower temperature for more deterministic enhancement
      },
    });

    const enhancedText = response.text.trim();
    return enhancedText || prompt;
  } catch (error) {
    console.error("Error in enhancePrompt:", error);
    // On failure, return the original prompt to not break the flow.
    return prompt;
  }
}

const isTextBasedMimeType = (fileType: string): boolean => {
    const textLikeTypes = [
        'application/json',
        'application/javascript',
        'application/xml',
        'application/x-sh',
        'image/svg+xml',
    ];
    return fileType.startsWith('text/') || textLikeTypes.includes(fileType) || fileType.endsWith('+xml');
};


export async function* getStreamingChatResponse(
  prompt: string | null,
  systemInstruction: string,
  history: any[], // Use any[] for flexibility with function calling history
  useSearch: boolean,
  files: File[] = [],
  tools: FunctionDeclaration[] = [],
  contentsOverride?: any[]
): AsyncGenerator<StreamChunk> {
  try {
    const aiInstance = getAiInstance();
    
    let contents: any[];

    if (contentsOverride) {
        contents = contentsOverride;
    } else {
        let userPrompt = prompt;
        const imageParts = [];
        
        const supportedImageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];

        for (const file of files) {
            const fileType = file.type || '';

            if (supportedImageTypes.includes(fileType)) {
                imageParts.push(await fileToGenerativePart(file));
            } else if (isTextBasedMimeType(fileType)) {
                try {
                    const textContent = await file.text();
                    userPrompt += `\n\n--- Attached File: ${file.name} ---\n${textContent}\n--- End of File ---`;
                } catch (e) {
                    console.warn(`Error reading text-based file ${file.name}`, e);
                    userPrompt += `\n\n[Attached file: ${file.name} (${fileType}). Could not read file content.]`;
                }
            } else {
                // Catch-all for unsupported types, including application/octet-stream, pdf, videos, etc.
                userPrompt += `\n\n[Attached file: ${file.name} (${fileType || 'unknown type'}, ${Math.round(file.size / 1024)} KB). This file type is not supported for direct processing. Acknowledge the file and explain that you can only analyze it based on its name and type.]`;
            }
        }

        const userParts: any[] = imageParts;
        if (userPrompt) {
            userParts.unshift({ text: userPrompt });
        }
        contents = [...history, { role: 'user', parts: userParts }];
    }


    const config: any = {
        systemInstruction: systemInstruction,
    };
    
    let activeTools: any[] = [];
    if (useSearch) {
        activeTools.push({googleSearch: {}});
    }
    if (tools.length > 0) {
        activeTools.push({functionDeclarations: tools});
    }
    if(activeTools.length > 0) {
        config.tools = activeTools;
    }

    const response = await aiInstance.models.generateContentStream({
        model: GEMINI_TEXT_MODEL,
        contents: contents,
        config: config,
    });

    for await (const chunk of response) {
      const text = chunk.text;
      const functionCalls = chunk.functionCalls;
      const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
      
      let sources: GroundingSource[] | undefined;
      if (groundingMetadata?.groundingChunks) {
        sources = groundingMetadata.groundingChunks
          .map((c: any) => (c.web ? { uri: c.web.uri, title: c.web.title } : null))
          .filter((s: any): s is GroundingSource => s !== null && s.uri && s.title);
      }
      
      if (text || (sources && sources.length > 0) || functionCalls) {
         yield { text: text || '', sources, functionCalls };
      }
    }
  } catch (error) {
    console.error("Error in getStreamingChatResponse:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Failed to get streaming response from Gemini API.");
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const aiInstance = getAiInstance();
    const response = await aiInstance.models.generateImages({
      model: GEMINI_IMAGE_MODEL,
      prompt: `A high-resolution, cinematic, professional photograph of: ${prompt}`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("Image generation failed, no images returned.");
    }
  } catch (error) {
    console.error("Error in generateImage:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate image with Gemini API.");
  }
}

export async function generateVideo(prompt: string, onProgress: (message: string) => void): Promise<string> {
  try {
    const aiInstance = getAiInstance();
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
    if (!apiKey) {
      throw new Error("System configuration error: API Key is missing for video download.");
    }
    
    onProgress("Video genesis protocol initiated. Weaving reality...");
    let operation: GenerateVideosOperation = await aiInstance.models.generateVideos({
      model: GEMINI_VIDEO_MODEL,
      prompt: `A cinematic, high-definition, professional video of: ${prompt}`,
      config: {
        numberOfVideos: 1,
      },
    });
    
    onProgress("Video generation in progress... this may take several minutes.");
    while (!operation.done) {
      // Wait for 10 seconds before checking the status again.
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await aiInstance.operations.getVideosOperation({ operation: operation });
      const rawProgress = operation.metadata?.progressPercentage;
      const progressPercentage = typeof rawProgress === 'number' ? rawProgress : 0;
      onProgress(`Transmuting reality stream... ${Math.round(progressPercentage)}% complete.`);
    }

    onProgress("Finalizing video stream...");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation completed, but no download link was returned.");
    }

    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
  } catch (error) {
    console.error("Error in generateVideo:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate video with Gemini API.");
  }
}
