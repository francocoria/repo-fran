"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { Button, Input, Label, Card, CardContent, PetAvatar } from "@pet-app/ui";
import { createAnimal, uploadAnimalPhoto } from "../../actions";
import { PawPattern } from "@/components/ui/paw-pattern";
import { Confetti } from "@/components/ui/confetti";
import {
  ArrowRight,
  Bell,
  Bird,
  Camera,
  Cat,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Dog,
  MessageCircle,
  PawPrint,
  QrCode,
  Rabbit,
  Scale,
  Sparkles,
  AlertTriangle,
  X,
  Plus,
  Loader2,
  Download,
  Copy,
  type LucideIcon,
} from "lucide-react";

type SpeciesKey = "dog" | "cat" | "rabbit" | "bird" | "other";
type Sex = "male" | "female";
type Chip = "yes" | "no" | "later";

const PET_TYPES: {
  key: SpeciesKey;
  icon: LucideIcon;
  from: string;
  to: string;
  gradient: string;
}[] = [
  { key: "dog", icon: Dog, from: "#8b5cf6", to: "#ec4899", gradient: "from-[#8b5cf6] to-[#ec4899]" },
  { key: "cat", icon: Cat, from: "#06b6d4", to: "#8b5cf6", gradient: "from-[#06b6d4] to-[#8b5cf6]" },
  { key: "rabbit", icon: Rabbit, from: "#a78bfa", to: "#f472b6", gradient: "from-[#a78bfa] to-[#f472b6]" },
  { key: "bird", icon: Bird, from: "#f59e0b", to: "#ec4899", gradient: "from-[#f59e0b] to-[#ec4899]" },
  { key: "other", icon: PawPrint, from: "#64748b", to: "#a78bfa", gradient: "from-[#64748b] to-[#a78bfa]" },
];

const COMMON_BREEDS: Record<string, string[]> = {
  dog: ["Mestizo", "Labrador", "Caniche", "Bulldog Francés", "Border Collie", "Golden", "Pitbull", "Galgo", "Husky", "Beagle"],
  cat: ["Mestizo", "Siamés", "Persa", "Maine Coon", "Bengalí", "Británico", "Ragdoll", "Esfinge"],
  rabbit: ["Holland Lop", "Belier", "Cabeza de león", "Mini Rex", "Toy"],
  bird: ["Canario", "Periquito", "Cacatúa", "Loro", "Agapornis"],
  other: [],
};

const COLORS_HINT = [
  "Negro",
  "Blanco",
  "Marrón",
  "Atigrado",
  "Tricolor",
  "Negro y blanco",
];

const TOTAL_STEPS = 7; // pasos 2..8

export default function NewAnimalPage() {
  const router = useRouter();
  const t = useTranslations("petWizard");
  const tNew = useTranslations("animalNew");

  const [step, setStep] = useState(1);
  const [species, setSpecies] = useState<SpeciesKey | null>(null);
  const [customSpecies, setCustomSpecies] = useState("");
  const [name, setName] = useState("");
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [sex, setSex] = useState<Sex | null>(null);
  const [birth, setBirth] = useState("");
  const [birthDateApprox, setBirthDateApprox] = useState(false);
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");
  const [color, setColor] = useState("");
  const [hasChip, setHasChip] = useState<Chip | null>(null);
  const [chipId, setChipId] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; token: string } | null>(
    null,
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(1, s - 1));

  function resetForAnother() {
    setSpecies(null);
    setCustomSpecies("");
    setName("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setSex(null);
    setBirth("");
    setBirthDateApprox(false);
    setBreed("");
    setWeight("");
    setColor("");
    setHasChip(null);
    setChipId("");
    setCreated(null);
    setQrCodeDataUrl(null);
    setError(null);
    setStep(2);
  }

  const handleFileSelect = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError("La foto es demasiado grande (máx 20 MB).");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  };

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("species", species || "other");

    let finalBreed = breed.trim();
    if (species === "other" && customSpecies.trim()) {
      finalBreed = finalBreed
        ? `${customSpecies.trim()} · ${finalBreed}`
        : customSpecies.trim();
    }
    formData.append("breed", finalBreed);
    formData.append("sex", sex || "unknown");
    formData.append("birthDate", birth.trim());
    formData.append("birthDateApprox", birthDateApprox ? "true" : "false");
    formData.append("color", color.trim());
    formData.append("microchip", hasChip === "yes" ? chipId.trim() : "");
    formData.append("weightKg", weight.trim());

    try {
      const result = await createAnimal(formData);
      if (result.success && result.animalId) {
        const animalId = result.animalId;
        const urlToken = result.urlToken;

        // Subir foto si se seleccionó
        if (photoFile) {
          const uploadFormData = new FormData();
          uploadFormData.append("photo", photoFile);
          const uploadResult = await uploadAnimalPhoto(animalId, uploadFormData);
          if (!uploadResult.success) {
            console.error("Failed to upload photo:", uploadResult.error);
          }
        }

        // Generar QR
        const scanUrl = `${window.location.origin}/vet/scan?token=${urlToken}`;
        const qrUrl = await QRCode.toDataURL(scanUrl, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
          color: {
            dark: "#0c0a09",
            light: "#ffffff",
          },
        });

        setQrCodeDataUrl(qrUrl);
        setCreated({ id: animalId, token: urlToken || "" });
        setStep(9);
      } else {
        setError(result.error ?? t("createError"));
      }
    } catch (e: any) {
      console.error("Animal create error:", e);
      setError(t("createError"));
    } finally {
      setCreating(false);
    }
  }

  const showHeader = step >= 2 && step <= 8;

  // Compartir datos por Whatsapp
  const shareText = created
    ? t("doneShareMessage", {
        name,
        url: `${window.location.origin}/lost`,
      })
    : "";
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = async () => {
    if (!created) return;
    const scanUrl = `${window.location.origin}/vet/scan?token=${created.token}`;
    try {
      await navigator.clipboard.writeText(scanUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-xl px-4 py-8">
      {step === 9 && <Confetti active />}

      {/* Glow ambient blobs */}
      <div className="pointer-events-none absolute -top-12 -left-12 size-64 rounded-full bg-violet-600/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 size-64 rounded-full bg-cyan-500/5 blur-3xl" />

      {showHeader && (
        <div className="mb-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all hover:bg-secondary/80"
              aria-label="Back"
            >
              <ChevronLeft className="size-5" />
            </button>

            {/* Progress indicator */}
            <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            {[4, 6, 7].includes(step) ? (
              <button
                type="button"
                onClick={next}
                className="text-sm font-semibold text-muted-foreground transition-all hover:text-foreground"
              >
                {step === 4 ? t("later") : t("skip")}
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>
          <div className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("stepOf", { step: step - 1, total: TOTAL_STEPS })}
          </div>
        </div>
      )}

      <Card className="relative overflow-hidden border border-border/80 bg-card/95 shadow-xl backdrop-blur-sm rounded-3xl">
        <CardContent className="p-6 md:p-8">
          
          {/* ─── STEP 1 — Bienvenida ─────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col text-center space-y-6">
              <div className="relative flex items-center justify-center h-48 w-60 mb-2 mx-auto">
                <PawPattern width={240} height={180} color="#7c3aed" opacity={0.06} />
                <div className="flex items-center gap-2.5 relative z-10">
                  <div className="-rotate-12 transform transition-all hover:rotate-0 duration-300">
                    <PetAvatar name="L" species="dog" size={78} radius={20} />
                  </div>
                  <div className="-translate-y-2.5 transform scale-110 transition-all hover:scale-100 duration-300">
                    <PetAvatar name="P" species="cat" size={98} radius={26} />
                  </div>
                  <div className="rotate-12 transform transition-all hover:rotate-0 duration-300">
                    <PetAvatar name="M" species="rabbit" size={70} radius={18} />
                  </div>
                </div>
              </div>

              <div className="mx-auto flex items-center gap-1.5 rounded-full bg-violet-600/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[1.5px] text-primary">
                <Sparkles className="size-3.5 text-violet-600" />
                {t("welcomeEyebrow")}
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
                {t("welcomeTitle1")}{" "}
                <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                  {t("welcomeTitle2")}
                </span>
              </h1>

              <p className="text-sm leading-relaxed text-muted-foreground max-w-sm mx-auto">
                {t("welcomeSubtitle")}
              </p>

              <div className="my-6 space-y-4 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-violet-600/10 text-violet-600">
                    <QrCode className="size-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground leading-normal">
                    {t("feat1")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                    <Bell className="size-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground leading-normal">
                    {t("feat2")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                    <AlertTriangle className="size-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground leading-normal">
                    {t("feat3")}
                  </p>
                </div>
              </div>

              <Button
                onClick={next}
                size="lg"
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-2xl shadow-lg shadow-violet-600/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 group"
              >
                {t("start")}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}

          {/* ─── STEP 2 — Tipo de Mascota ─────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {t("typeTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("typeSubtitle")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mt-4">
                {PET_TYPES.map((type) => {
                  const Icon = type.icon;
                  const selected = species === type.key;
                  return (
                    <div
                      key={type.key}
                      onClick={() => {
                        setSpecies(type.key);
                        setError(null);
                      }}
                      className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                        selected
                          ? "border-violet-600 bg-violet-600/5 text-violet-600 scale-[1.02] shadow-md"
                          : "border-border bg-card text-muted-foreground hover:border-violet-600/50 hover:bg-secondary/50"
                      }`}
                    >
                      <div
                        className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${type.gradient} text-white shadow-md`}
                      >
                        <Icon className="size-7" />
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {tNew(`species${type.key.charAt(0).toUpperCase() + type.key.slice(1)}`)}
                      </span>
                      {selected && (
                        <div className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-violet-600 text-white">
                          <Check className="size-3" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {species === "other" && (
                <div className="space-y-1.5 pt-2 animate-in fade-in duration-300">
                  <Label htmlFor="customSpecies" className="text-xs font-semibold">
                    {tNew("specifySpecies")}
                  </Label>
                  <Input
                    id="customSpecies"
                    placeholder={tNew("specifySpeciesPlaceholder")}
                    value={customSpecies}
                    onChange={(e) => setCustomSpecies(e.target.value)}
                    maxLength={50}
                    className="h-12 rounded-xl focus:border-violet-600"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {tNew("specifySpeciesHint")}
                  </p>
                </div>
              )}

              <Button
                disabled={!species}
                onClick={next}
                size="lg"
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 group mt-4"
              >
                {t("next")}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}

          {/* ─── STEP 3 — Nombre ─────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {t("nameTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("nameSubtitle")}
                </p>
              </div>

              <div className="flex flex-col items-center space-y-6 pt-4">
                <PetAvatar
                  name={name || "?"}
                  species={species ?? "other"}
                  size={120}
                  radius={32}
                />
                
                <div className="w-full space-y-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    autoFocus
                    className="w-full text-center text-xl font-bold h-14 rounded-2xl border-2 border-border focus-visible:ring-violet-600 focus:border-violet-600"
                  />
                  <p className="text-center text-[11px] text-muted-foreground">
                    {t("nameChangeLater")}
                  </p>
                </div>
              </div>

              <Button
                disabled={name.trim().length < 2}
                onClick={next}
                size="lg"
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {t("next")}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}

          {/* ─── STEP 4 — Foto ───────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {t("photoTitlePre")} {name || t("photoFallbackName")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("photoSubtitle")}
                </p>
              </div>

              <div className="flex flex-col items-center space-y-6 pt-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className={`relative flex flex-col items-center justify-center w-52 h-52 rounded-3xl cursor-pointer overflow-hidden border-2 border-dashed transition-all ${
                    isDragging
                      ? "border-violet-600 bg-violet-600/5"
                      : "border-violet-300 hover:border-violet-600 bg-card hover:bg-secondary/10"
                  }`}
                >
                  {photoPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center space-y-2 text-center p-4">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg">
                        <Camera className="size-6" />
                      </div>
                      <span className="text-sm font-bold text-foreground mt-2">
                        {t("photoTapUpload")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("photoOrTake")}
                      </span>
                    </div>
                  )}
                </div>

                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-full px-4 py-2 hover:bg-secondary transition-all"
                  >
                    {t("photoChange")}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />

                {!photoPreview && (
                  <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl max-w-sm">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-normal">
                      {t("photoHint")}
                    </p>
                  </div>
                )}
              </div>

              {error && <div className="text-center text-sm text-destructive">{error}</div>}

              <Button
                onClick={next}
                size="lg"
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 group"
              >
                {photoPreview ? t("next") : t("photoSkip")}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}

          {/* ─── STEP 5 — Sexo y Edad ────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {t("dataTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("dataSubtitle")}
                </p>
              </div>

              <div className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">
                    {t("sexLabel")}
                  </Label>
                  <div className="flex gap-3">
                    {[
                      { key: "male", label: t("sexMale"), icon: "♂", color: "border-blue-500 text-blue-600 bg-blue-500/5 hover:bg-blue-500/10" },
                      { key: "female", label: t("sexFemale"), icon: "♀", color: "border-pink-500 text-pink-600 bg-pink-500/5 hover:bg-pink-500/10" },
                    ].map((item) => {
                      const selected = sex === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setSex(item.key as Sex)}
                          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            selected
                              ? item.color + " scale-[1.02] shadow-sm font-bold"
                              : "border-border bg-card text-muted-foreground hover:bg-secondary/50 font-medium"
                          }`}
                        >
                          <span className="text-3xl leading-none mb-1">{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">
                    {t("birthLabel")} {t("birthApprox")}
                  </Label>
                  <Input
                    type="date"
                    value={birth}
                    onChange={(e) => setBirth(e.target.value)}
                    className="h-12 rounded-xl focus:border-violet-600"
                  />

                  {/* Preset Shortcuts */}
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {[
                      { label: t("agePuppy"), months: 2 },
                      { label: t("age1y"), months: 12 },
                      { label: t("age3y"), months: 36 },
                      { label: t("ageAdult"), months: 84 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() - preset.months);
                          setBirth(d.toISOString().slice(0, 10));
                          setBirthDateApprox(true);
                        }}
                        className="text-xs font-semibold px-3 py-1.5 border border-border rounded-full hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="birthDateApprox"
                      checked={birthDateApprox}
                      onChange={(e) => setBirthDateApprox(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-violet-600 size-4 cursor-pointer"
                    />
                    <Label
                      htmlFor="birthDateApprox"
                      className="text-xs font-semibold text-muted-foreground cursor-pointer"
                    >
                      {tNew("birthDateApprox")}
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                disabled={!sex}
                onClick={next}
                size="lg"
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {t("next")}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}

          {/* ─── STEP 6 — Raza ───────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {t("breedTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("breedSubtitle")}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <Input
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder={t("breedPlaceholder")}
                  className="h-12 rounded-xl focus:border-violet-600"
                />

                {(COMMON_BREEDS[species ?? "other"] ?? []).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("breedCommon")}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(COMMON_BREEDS[species ?? "other"] ?? []).map((b) => {
                        const selected = breed === b;
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBreed(b)}
                            className={`text-xs font-semibold px-3.5 py-2 border rounded-full transition-all ${
                              selected
                                ? "border-violet-600 bg-violet-600 text-white"
                                : "border-border bg-card text-foreground hover:bg-secondary"
                            }`}
                          >
                            {b}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={next}
                size="lg"
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 group"
              >
                {t("next")}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}

          {/* ─── STEP 7 — Físico ─────────────────────────────── */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {t("physicalTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("physicalSubtitle")}
                </p>
              </div>

              <div className="space-y-5 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">
                    {t("weightLabel")}
                  </Label>
                  <div className="relative flex items-center">
                    <Scale className="absolute left-3.5 size-5 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="4.0"
                      className="h-12 pl-11 pr-10 rounded-xl focus:border-violet-600 font-semibold"
                    />
                    <span className="absolute right-3.5 font-mono text-sm text-muted-foreground">
                      kg
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">
                    {t("colorLabel")}
                  </Label>
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder={t("colorPlaceholder")}
                    className="h-12 rounded-xl focus:border-violet-600"
                  />
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {COLORS_HINT.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="text-xs font-semibold px-3 py-1.5 border border-border rounded-full hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={next}
                size="lg"
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 group"
              >
                {t("next")}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}

          {/* ─── STEP 8 — Microchip ──────────────────────────── */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {t("chipTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("chipSubtitle")}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  { key: "yes", label: t("chipYes"), icon: CheckCircle2, color: "text-violet-600 bg-violet-600/10" },
                  { key: "no", label: t("chipNo"), icon: X, color: "text-rose-500 bg-rose-500/10" },
                  { key: "later", label: t("chipLater"), icon: Clock, color: "text-amber-500 bg-amber-500/10" },
                ].map((item) => {
                  const selected = hasChip === item.key;
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.key}
                      onClick={() => setHasChip(item.key as Chip)}
                      className={`flex items-center gap-3.5 rounded-2xl border-2 p-3.5 cursor-pointer transition-all ${
                        selected
                          ? "border-violet-600 bg-violet-600/5"
                          : "border-border bg-card text-muted-foreground hover:border-violet-600/50 hover:bg-secondary/50"
                      }`}
                    >
                      <div
                        className={`flex size-9 items-center justify-center rounded-xl ${
                          selected ? "bg-violet-600 text-white" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        <ItemIcon className="size-5" />
                      </div>
                      <span className="flex-1 text-sm font-bold text-foreground">
                        {item.label}
                      </span>
                      {selected && <Check className="size-5 text-violet-600" />}
                    </div>
                  );
                })}

                {hasChip === "yes" && (
                  <div className="space-y-1.5 pt-2 animate-in fade-in duration-300">
                    <Label htmlFor="chipId" className="text-xs font-bold text-muted-foreground">
                      {t("chipNumberLabel")}
                    </Label>
                    <Input
                      id="chipId"
                      placeholder={t("chipPlaceholder")}
                      value={chipId}
                      onChange={(e) => setChipId(e.target.value.toUpperCase())}
                      className="h-12 rounded-xl focus:border-violet-600 font-mono text-sm"
                    />
                  </div>
                )}
              </div>

              {error && <div className="text-center text-sm text-destructive">{error}</div>}

              <Button
                disabled={!hasChip || creating}
                onClick={handleCreate}
                size="lg"
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {creating ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    {t("creating")}
                  </>
                ) : (
                  <>
                    {t("next")}
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ─── STEP 9 — ¡Listo! + QR ───────────────────────── */}
          {step === 9 && created && (
            <div className="flex flex-col text-center space-y-6">
              <div className="flex flex-col items-center pt-2">
                <PetAvatar
                  name={name}
                  species={species ?? "other"}
                  photoUrl={photoPreview}
                  size={84}
                  radius={24}
                />
                <span className="mt-3.5 text-xs font-bold uppercase tracking-[2px] text-violet-600">
                  {t("doneEyebrow")}
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground mt-1">
                  {t("doneTitle", { name })}
                </h1>
                <p className="text-xs text-muted-foreground mt-1 leading-normal max-w-xs">
                  {t("doneShowQr")}
                </p>
              </div>

              <div className="flex justify-center my-3">
                <div className="rounded-3xl border border-border bg-white p-4 shadow-xl shadow-black/5 hover:scale-[1.02] transition-transform duration-300">
                  {qrCodeDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code"
                      className="size-48"
                    />
                  ) : (
                    <div className="flex size-48 items-center justify-center">
                      <Loader2 className="size-7 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-2 max-w-sm mx-auto w-full">
                {/* Whatsapp Share Button */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-13 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#25d366] text-white font-bold text-sm shadow-md hover:bg-[#20ba5a] transition-all"
                >
                  <MessageCircle className="size-5 fill-white" />
                  {t("doneSendVet")}
                </a>

                {/* Copy Link Button */}
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="h-13 w-full rounded-2xl font-bold flex items-center justify-center gap-2 border-2"
                >
                  {isCopied ? (
                    <>
                      <Check className="size-4 text-emerald-600" strokeWidth={3} />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>Copiar link del Vet</span>
                    </>
                  )}
                </Button>

                {/* See Profile Button */}
                <Button
                  onClick={() => router.push(`/app/animals/${created.id}`)}
                  variant="outline"
                  className="h-13 w-full rounded-2xl font-bold border-2 flex items-center justify-center gap-2"
                >
                  <PawPrint className="size-4" />
                  {t("doneSeeProfile", { name })}
                </Button>

                {/* Reset button */}
                <button
                  type="button"
                  onClick={resetForAnother}
                  className="w-full text-xs font-bold text-muted-foreground hover:text-foreground py-2 transition-all"
                >
                  + {t("doneAddAnother")}
                </button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
