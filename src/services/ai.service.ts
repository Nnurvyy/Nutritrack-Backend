import { AppEnv } from "../types";

export class AIService {
  private env: AppEnv["Bindings"];

  constructor(env: AppEnv["Bindings"]) {
    this.env = env;
  }

  /**
   * 1. Groq Chat Completion with fallback models
   */
  async fetchGroqNutrition(query: string): Promise<any> {
    const apiKey = this.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured on the server.");
    }

    const fallbackModels = [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'llama3-8b-8192',
      'llama3-70b-8192',
    ];

    const systemPrompt =
      "Kamu adalah REST API Database Gizi. Pengguna akan memberikan nama makanan atau minuman. Tugasmu adalah mengembalikan estimasi kandungan nutrisi untuk 1 PORSI MAKAN WAJAR (bukan selalu 100 gram, sesuaikan dengan porsi nyata saat dihidangkan, misal 1 piring nasi goreng = 250 gram, 1 mangkok bakso = 300 gram). Tentukan juga kategorinya (pilih salah satu: 'Makanan Pokok', 'Lauk', 'Sayuran', 'Buah', 'Minuman', 'Snack', 'Lainnya'). DILARANG KERAS memberikan kalimat pembuka, penutup, atau penjelasan. DILARANG menggunakan markdown backticks. KEMBALIKAN HANYA BENTUK JSON VALID dengan struktur persis seperti ini: {\"nama_makanan\": \"String\", \"kategori\": \"String\", \"kalori\": Integer, \"protein\": Integer, \"karbohidrat\": Integer, \"lemak\": Integer, \"porsi_gram\": Integer}";

    for (const model of fallbackModels) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            temperature: 0.1,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query },
            ],
          }),
        });

        if (response.status === 200) {
          const data: any = await response.json();
          const content = data.choices[0].message.content.trim();
          
          // Remove potential markdown fences
          const cleanJsonStr = content
            .replace(/^```json\s*/i, '')
            .replace(/```$/, '')
            .trim();
            
          return JSON.parse(cleanJsonStr);
        } else if (response.status === 429 || response.status === 500) {
          console.warn(`Groq Model ${model} failed with status ${response.status}. Trying next fallback model...`);
          continue;
        } else {
          const errorText = await response.text();
          console.error(`Groq API Error (${model}): ${response.status} - ${errorText}`);
          continue;
        }
      } catch (err) {
        console.error(`Exception with Groq model ${model}:`, err);
        continue;
      }
    }

    throw new Error('Gagal mendapatkan data nutrisi dari semua fallback models Groq.');
  }

  /**
   * 2. Gemini Generative AI Content with fallback models
   */
  async analyzeGeminiImage(base64Image: string, mimeType: string): Promise<any> {
    const apiKey = this.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }

    const geminiModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3-flash',
      'gemini-2.5-flash',
    ];

    const prompt = 
      "Kamu adalah AI Ahli Gizi Forensik. Tugasmu adalah membedah gambar makanan/minuman yang diberikan menjadi komponen-komponen penyusunnya (ingredients) secara spesifik HANYA berdasarkan ukuran dan porsi nyata yang terlihat di gambar.\n\n" +
      "ATURAN LOGIKA:\n" +
      "1. Identifikasi setiap komponen makanan yang ada di gambar (misal: nasi putih, ayam goreng, timun, sambal).\n" +
      "2. Estimasikan berat (gram) dan kandungan gizi (kalori, protein, karbohidrat, lemak) untuk MASING-MASING komponen tersebut sesuai porsi yang terlihat.\n" +
      "3. Hitung TOTAL keseluruhan (berat dan gizi) dari semua komponen.\n" +
      "4. Tentukan NAMA MAKANAN UTAMA menggunakan format '[Komponen Dominan 1] dengan [Komponen Dominan 2]'. Jika hanya ada 1 komponen, gunakan nama komponen itu saja. Komponen 'Dominan' ditentukan dari penyumbang kalori/protein paling besar. Contoh: 'Ayam Goreng dengan Nasi Putih'.\n" +
      "5. Tentukan KATEGORI utama hidangan tersebut. HANYA boleh memilih satu dari: 'makanan pokok', 'lauk', 'sayuran', 'buah', 'minuman', 'snack', 'lainnya'.\n\n" +
      "KEMBALIKAN HANYA BENTUK JSON VALID dengan struktur eksak seperti ini:\n" +
      "{\n" +
      "  \"name\": \"String (Nama gabungan dominan)\",\n" +
      "  \"category\": \"String (Dari pilihan enum)\",\n" +
      "  \"total_calories\": Double,\n" +
      "  \"total_protein\": Double,\n" +
      "  \"total_carbs\": Double,\n" +
      "  \"total_fat\": Double,\n" +
      "  \"total_weight_grams\": Double,\n" +
      "  \"ingredients\": [\n" +
      "    {\n" +
      "      \"name\": \"String\",\n" +
      "      \"calories\": Double,\n" +
      "      \"protein\": Double,\n" +
      "      \"carbs\": Double,\n" +
      "      \"fat\": Double,\n" +
      "      \"weight_grams\": Double\n" +
      "    }\n" +
      "  ]\n" +
      "}";

    for (const model of geminiModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Image
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.0,
              responseMimeType: "application/json"
            }
          }),
        });

        if (response.status === 200) {
          const data: any = await response.json();
          const candidates = data.candidates || [];
          if (candidates.length > 0) {
            const content = candidates[0].content.parts[0].text;
            const cleanJsonStr = content
              .replace(/^```json\s*/i, '')
              .replace(/```$/, '')
              .trim();
            return JSON.parse(cleanJsonStr);
          }
        } else if (response.status === 429 || response.status === 500) {
          console.warn(`Gemini Model ${model} failed with status ${response.status}. Trying next fallback...`);
          continue;
        } else {
          const errorText = await response.text();
          console.error(`Gemini API Error (${model}): ${response.status} - ${errorText}`);
          continue;
        }
      } catch (err) {
        console.error(`Exception with Gemini model ${model}:`, err);
        continue;
      }
    }

    throw new Error('Gagal mendapatkan analisis gambar dari semua fallback models Gemini.');
  }

  /**
   * 3. Cloudinary Upload
   */
  async uploadToCloudinary(file: any, folder?: string): Promise<any> {
    const cloudName = this.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = this.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration (CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET) is missing on the server.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    return {
      url: data.url,
      secure_url: data.secure_url,
      public_id: data.public_id,
    };
  }
}
