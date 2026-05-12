"use client";

import { Button } from "@pet-app/ui";
import { MessageCircle, Share2, Copy, Check, Download } from "lucide-react";
import { useCopyFeedback } from "@/lib/use-copy-feedback";

interface ShareButtonsClientProps {
  animalName: string;
  slug: string;
}

export function ShareButtonsClient({
  animalName,
  slug,
}: ShareButtonsClientProps) {
  const { copied, copy } = useCopyFeedback();

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/lost/${slug}`
      : `/lost/${slug}`;

  const message = `🚨 SE PERDIÓ ${animalName.toUpperCase()} 🚨\n\nAyudanos a encontrarla. Toda la info acá:\n${url}\n\nPor favor compartí 🙏`;

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: `🚨 Se perdió ${animalName}`,
          text: message,
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      await copy(url);
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        asChild
        size="sm"
        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
      >
        <a href={whatsappShare} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="gap-1.5"
      >
        <Share2 className="h-3.5 w-3.5" />
        Compartir
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => copy(url)}
        className="gap-1.5"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copiado
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copiar link
          </>
        )}
      </Button>
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <a
          href={`/lost/${slug}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download className="h-3.5 w-3.5" />
          PDF para imprimir
        </a>
      </Button>
    </div>
  );
}
