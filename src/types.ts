export interface AppEnv {
  Bindings: {
    GROQ_API_KEY: string;
    GEMINI_API_KEY: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_UPLOAD_PRESET: string;
    APP_SECRET_TOKEN: string;
    MIDTRANS_SERVER_KEY: string;
    MIDTRANS_CLIENT_KEY: string;
  };
}
