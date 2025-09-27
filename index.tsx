import { GoogleGenAI, Modality } from "@google/genai";
import { setAnchorHref } from 'safevalues/dom';

// State management
interface AppState {
  originalImage: {
    base64: string;
    mimeType: string;
  } | null;
  isLoading: boolean;
}

const state: AppState = {
  originalImage: null,
  isLoading: false,
};

// DOM Elements
const imageUpload = document.getElementById("image-upload") as HTMLInputElement;
const originalImageEl = document.getElementById("original-image") as HTMLImageElement;
const uploadLabel = document.querySelector(".upload-label") as HTMLLabelElement;
const generateBtn = document.getElementById("generate-btn") as HTMLButtonElement;
const outputImageEl = document.getElementById("output-image") as HTMLImageElement;
const loader = document.getElementById("loader") as HTMLDivElement;
const placeholder = document.getElementById("placeholder") as HTMLDivElement;
const downloadBtn = document.getElementById("download-btn") as HTMLAnchorElement;

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Event Listeners
imageUpload.addEventListener("change", handleImageUpload);
generateBtn.addEventListener("click", handleGenerateClick);

/**
 * Handles the file upload event.
 */
function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = (e.target?.result as string).split(",")[1];
    state.originalImage = { base64, mimeType: file.type };

    originalImageEl.src = e.target?.result as string;
    originalImageEl.classList.add('active');
    uploadLabel.style.display = 'none';
    generateBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

/**
 * Handles the click event for the generate button.
 */
async function handleGenerateClick() {
  if (!state.originalImage) {
    alert("Please upload an image first.");
    return;
  }

  setLoading(true);

  try {
    const { base64, mimeType } = state.originalImage;
    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: "Apply a moody, sensual, and dramatic style to this photograph, while preserving the original skin tone of the subject. The lighting should be reminiscent of a professional studio, creating a vibrant and intense feel. Enhance the richness of the colors without altering the skin's natural hue. The background should be a simple, dark, neutral-toned surface. The overall effect should be alluring and high-end, not gray and washed out.",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let foundImage = false;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        outputImageEl.src = imageUrl;
        outputImageEl.classList.add('active');
        setAnchorHref(downloadBtn, imageUrl);
        downloadBtn.style.display = 'inline-flex';
        foundImage = true;
        break; // Stop after finding the first image
      }
    }
    if (!foundImage) {
        throw new Error("The model did not return an image. Please try again.");
    }

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    alert(`Failed to generate image: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
}


/**
 * Updates the UI based on the loading state.
 * @param {boolean} isLoading - Whether the application is in a loading state.
 */
function setLoading(isLoading: boolean) {
  state.isLoading = isLoading;
  generateBtn.disabled = isLoading;
  loader.style.display = isLoading ? "flex" : "none";
  if(isLoading) {
    placeholder.style.display = "none";
    outputImageEl.classList.remove('active');
  }
}

export { };