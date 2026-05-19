import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Alert } from "react-native";
import { supabase } from "./supabase";

const BUCKET = "animal-photos";
const OUTPUT_SIZE = 1024;

export type PickedPhoto = {
  uri: string;
  width: number;
  height: number;
};

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Pide permiso + abre el picker con crop nativo (square 1:1).
 * Retorna la URI de la foto YA recortada, o null si el usuario canceló.
 */
export async function pickAnimalPhoto(): Promise<PickedPhoto | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Sin permiso",
      "Necesitamos acceso a tu galería para que puedas elegir la foto. Cambialo en Ajustes → PetApp → Fotos.",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true, // crop nativo
    aspect: [1, 1],
    quality: 0.9,
  });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

/**
 * Toma una foto con la cámara (con crop 1:1).
 */
export async function takeAnimalPhoto(): Promise<PickedPhoto | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Sin permiso",
      "Necesitamos acceso a la cámara. Cambialo en Ajustes → PetApp → Cámara.",
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

/**
 * Toma la foto recortada y la redimensiona/comprime a 1024x1024 JPEG q=0.85
 * antes de subir. Reduce ~5MB a ~150KB.
 */
async function compressForUpload(uri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: OUTPUT_SIZE, height: OUTPUT_SIZE } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  return manipulated.uri;
}

/**
 * Upload de la foto a Supabase Storage + update animal.photo_url.
 * Devuelve la public URL para que el caller actualice el estado local.
 */
export async function uploadAnimalPhoto(
  animalId: string,
  photoUri: string,
): Promise<UploadResult> {
  try {
    // 1) Comprimir y redimensionar a 1024x1024 JPEG
    const compressedUri = await compressForUpload(photoUri);

    // 2) Convertir URI a ArrayBuffer
    const response = await fetch(compressedUri);
    const arrayBuffer = await response.arrayBuffer();

    // 3) Subir a Supabase Storage
    const fileName = `${animalId}_${Date.now()}.jpg`;
    const path = `animals/${animalId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("[photo-upload] storage error:", uploadError);
      return {
        success: false,
        error: `No pudimos subir la foto: ${uploadError.message}`,
      };
    }

    // 4) Public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // 5) Update animal.photo_url
    const { error: updateError } = await supabase
      .from("animals")
      .update({ photo_url: publicUrl })
      .eq("id", animalId);

    if (updateError) {
      console.error("[photo-upload] db update error:", updateError);
      return {
        success: false,
        error: "Foto subida pero no pudimos actualizar la mascota.",
      };
    }

    return { success: true, publicUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[photo-upload] failed:", msg, err);
    return { success: false, error: `Algo falló: ${msg}` };
  }
}
